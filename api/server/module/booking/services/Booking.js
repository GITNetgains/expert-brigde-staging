const moment = require('moment');
const enrollQ = require('../../webinar/queue');
const date = require('../../date');

exports.canBookFree = async userId => {
  try {
    const maxFreeSlotToBook = await DB.Config.findOne({ key: 'maxFreeSlotToBook' });
    const maxFreeSlotToBookValue = maxFreeSlotToBook.value;
    const count = await DB.Appointment.count({
      userId,
      isFree: true,
      status: { $ne: 'canceled' }
    });

    return count < maxFreeSlotToBookValue;
  } catch (e) {
    throw e;
  }
};

exports.canBookFreeWithTutor = async options => {
  try {
    const count = await DB.Appointment.count({
      userId: options.userId,
      tutorId: options.tutorId,
      isFree: true,
      status: { $ne: 'canceled' },
      targetType: 'subject'
    });

    return count === 0;
  } catch (e) {
    throw e;
  }
};

exports.create = async options => {
  try {
    if (moment(options.startTime).isBefore(moment())) {
      throw new Error('Cannot book with start time in the past');
    }

    if (moment(options.startTime).isAfter(options.toTime)) {
      throw new Error('Start time cannot be over to time');
    }

    const subject = await DB.MySubject.findOne({ _id: options.targetId });
    if (!subject) {
      throw new Error('Subject not found');
    }

    const tutor = await DB.User.findOne({ _id: options.tutorId });
    if (!tutor) {
      throw new Error('Tutor not found');
    }

    const user = await DB.User.findOne({ _id: options.userId });
    if (!user) {
      throw new Error('User not found');
    }

    const availableTimeValid = await Service.AvailableTime.isValid({
      tutorId: options.tutorId,
      startTime: options.startTime,
      toTime: options.toTime,
      type: options.targetType
    });
    if (!availableTimeValid) {
      throw new Error('Tutor is not available on this time');
    }

    const canAddAppoiment = await Service.Appointment.canAdd({
      tutorId: options.tutorId,
      startTime: options.startTime,
      toTime: options.toTime
    });
    if (!canAddAppoiment) {
      throw new Error('There is a booking in this time');
    }
    // do check for free booking
    if (options.isFree && !options.couponCode) {
      // check if user can book more free trial class
      const canBookFree = await this.canBookFree(options.userId);
      if (!canBookFree) {
        throw new Error('You have taken for the maximum number of free trial classes');
      }
      // check if user have free booking with this tutor or not
      const canBookFreeWithTutor = await this.canBookFreeWithTutor(options);
      if (!canBookFreeWithTutor) {
        throw new Error('You have taken a free trial class of this tutor before');
      }
    }

    const appointment = new DB.Appointment(
      Object.assign(options, {
        description: `${user.name} booking slot of ${subject.name} with ${tutor.name}`,
        subjectId: subject._id,
        categoryId: subject.myCategoryId,
        status: 'canceled',
        tutorInfo: {
          name: tutor.name,
          username: tutor.username
        },
        userInfo: {
          name: user.name,
          username: user.username
        }
      })
    );
    appointment.paid = options.isFree || false;
    const bookingDurationHours = moment(options.toTime).diff(moment(options.startTime), 'minutes') / 60;
    const hourlyRate = subject.price || tutor.price1On1Class;
    const proRatedPrice = Math.round(hourlyRate * bookingDurationHours * 100) / 100;

    const data = {
      appointmentId: appointment._id,
      name: `Book appointment with ${tutor.name}`,
      description: `${user.name} booking slot of ${subject.name} with ${tutor.name}`,
      price: proRatedPrice,
      redirectSuccessUrl: options.redirectSuccessUrl,
      cancelUrl: options.cancelUrl,
      userId: options.userId,
      targetType: options.targetType,
      target: subject,
      tutorId: tutor._id,
      couponCode: options.couponCode,
      type: 'booking'
    };

    if (!options.couponId) {
      options.couponId = null;
    }

    if (appointment.paid) {
      const transaction = new DB.Transaction({
        tutorId: tutor._id,
        userId: user._id,
        targetId: subject._id,
        description: `${user.name} booking slot of ${subject.name} with ${tutor.name}`,
        targetType: options.targetType,
        type: 'booking',
        price: 0,
        paid: true,
        status: 'completed'
      });

      await transaction.save();
      appointment.transactionId = transaction._id;
      await appointment.save();
      await enrollQ.createAppointmentSolo(appointment._id);
      return transaction;
    }
    await appointment.save();

    return Service.Payment.createOrderByRazorpay({
  appointmentId: appointment._id,
  userId: options.userId,
  tutorId: tutor._id,
  targetType: options.targetType,
  target: subject,
  price: proRatedPrice,
  name: `Book appointment with ${tutor.name}`,
  description: `${user.name} booking slot of ${subject.name} with ${tutor.name}`,
  redirectSuccessUrl: options.redirectSuccessUrl,
  cancelUrl: options.cancelUrl,
  couponCode: options.couponCode,
  type: 'booking'
});

  } catch (e) {
    throw e;
  }
};

exports.checkOverlapSlot = async options => {
  try {
    const query = {
      userId: options.userId,
      status: { $in: ['booked', 'pending'] },
      $or: [
        {
          startTime: {
            $gt: moment(options.startTime).toDate(),
            $lt: moment(options.toTime).toDate()
          }
        },
        {
          toTime: {
            $gt: moment(options.startTime).toDate(),
            $lt: moment(options.toTime).toDate()
          }
        },
        {
          startTime: {
            $gte: moment(options.startTime).toDate()
          },
          toTime: {
            $lte: moment(options.toTime).toDate()
          }
        }
      ]
    };
    if (options.excludeAppointmentId) {
      query._id = { $ne: options.excludeAppointmentId };
    }
    const count = await DB.Appointment.count(query);
    return count > 0;
  } catch (e) {
    throw e;
  }
};

exports.checkout = async (
  user,
  data = {
    times: []
  }
) => {
  try {
    const tutor = await DB.User.findOne({ _id: data.tutorId });
    if (!tutor) {
      throw new Error('Tutor not found');
    }

    if (!data.times.length) {
      throw new Error('No products found');
    }

    const createdAppointments = [];
    const createdTransactions = [];
    let totalPrice = 0;
    for (const time of data.times) {
      const subject = await DB.MySubject.findOne({ _id: time.targetId });

      const canAddAppoiment = await Service.Appointment.canAdd({
        tutorId: data.tutorId,
        startTime: time.startTime,
        toTime: time.toTime
      });

      const valid = await Service.AvailableTime.isValid({
        tutorId: data.tutorId,
        startTime: time.startTime,
        toTime: time.toTime,
        type: data.targetType
      });

      if (valid && canAddAppoiment && subject) {
        const checkoutDurationHours = (moment(time.toTime).diff(moment(time.startTime), 'minutes')) / 60;
        let itemPrice = Math.round((subject.price || tutor.price1On1Class) * checkoutDurationHours * 100) / 100;
        let discountPrice = 0;
        let discountAmount = 0;
        let discountValue = 0;
        let couponInfo = {};
        let usedCoupon = false;
        let couponCode = '';
        if (time.couponCode) {
          const appliedCoupon = await Service.Coupon.getValidCoupon(user._id, {
            code: time.couponCode,
            tutorId: data.tutorId,
            targetType: data.targetType,
            targetId: time.targetId
          });

          if (appliedCoupon) {
            const dataDiscount = await Service.Coupon.calculate({
              price: itemPrice,
              couponId: appliedCoupon
            });
            totalPrice += dataDiscount.discountPrice;
            itemPrice = dataDiscount.discountPrice;
            discountPrice = dataDiscount.discountPrice;
            discountAmount = dataDiscount.discountAmount;
            discountValue = appliedCoupon.value;
            couponInfo = {
              couponCode: appliedCoupon.code,
              couponId: appliedCoupon._id,
              discountAmount: dataDiscount.discountAmount,
              discountPrice: dataDiscount.discountPrice,
              discountValue,
              type: appliedCoupon.type
            };
            usedCoupon = true;
            couponCode = appliedCoupon.code;
          }
        } else {
          totalPrice += itemPrice;
        }

        const appointment = new DB.Appointment(
          Object.assign(time, {
            description: `${user.name} booking slot of ${subject.name} with ${tutor.name}`,
            subjectId: subject._id,
            categoryId: subject.myCategoryId,
            status: itemPrice <= 0 ? 'booked' : 'created',
            paid: itemPrice <= 0,
            isFree: itemPrice <= 0,
            targetType: data.targetType,
            tutorId: data.tutorId,
            userId: user._id
          })
        );

        const childrenTransaction = new DB.Transaction({
          tutorId: data.tutorId,
          userId: user._id,
          targetId: appointment.subjectId,
          description: appointment.description,
          targetType: data.targetType,
          originalPrice: Math.round((subject.price || tutor.price1On1Class) * checkoutDurationHours * 100) / 100,
          type: 'booking',
          paymentGateway: 'razorpay',
          price: itemPrice,
          discountPrice,
          discountAmount,
          couponInfo,
          usedCoupon,
          couponCode,
          status: itemPrice <= 0 ? 'completed' : 'pending',
          paid: itemPrice <= 0
        });

        await childrenTransaction.save();
        appointment.transactionId = childrenTransaction._id;
        await appointment.save();
        createdAppointments.push(appointment);
        createdTransactions.push(childrenTransaction);
      }
    }

    if (createdAppointments.length > 0) {
      if (totalPrice > 0) {
        const paymentData = {
          name: `Book appointment with ${tutor.name}`,
          description: `${user.name} booking ${createdAppointments.length} ${createdAppointments.length === 1 ? 'slot' : 'slots'} with ${tutor.name}`,
          price: totalPrice,
          redirectSuccessUrl: data.redirectSuccessUrl,
          cancelUrl: data.cancelUrl,
          userId: user._id,
          targetType: data.targetType,
          target: { isFree: false },
          tutorId: tutor._id,
          type: 'booking-multiple'
        };
        const payment = await Service.Payment.createOrderByRazorpay(paymentData);
        if (payment && payment.transactionId) {
          for (const t of createdTransactions) {
            t.parentTransactionId = payment.transactionId;
            await t.save();
          }
          return {
            total: createdAppointments.length,
            transactionId: payment.transactionId,
            razorpayOrderId: payment.razorpayOrderId,
            amount: payment.amount
          };
        }
      }

      return { total: createdAppointments.length };
    }
    return { total: 0 };
  } catch (error) {
    console.log(error);
  }
};
