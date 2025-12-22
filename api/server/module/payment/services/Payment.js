const url = require('url');
const enrollQ = require('../../webinar/queue');

exports.createPaymentIntentByStripe = async options => {
  try {
    // let price = options.price;
    let priceForPayment = options.price;
    if ((options.targetType === 'course' || options.targetType === 'webinar') && options.target.isFree) {
      priceForPayment = 0;
    }
    const transaction = new DB.Transaction({
      tutorId: options.tutorId,
      userId: options.userId,
      targetId: options.target._id,
      description: options.description,
      targetType: options.targetType,
      originalPrice: options.price,
      emailRecipient: options.emailRecipient || '',
      type: options.type,
      paymentGateway: 'stripe'
    });

    if (options.couponCode) {
      const appliedCoupon = await Service.Coupon.getValidCoupon(options.userId, {
        code: options.couponCode,
        tutorId: options.tutorId,
        targetType: options.targetType,
        targetId: options.targetType === 'subject' ? options.tutorId : options.target._id
      });
      if (appliedCoupon) {
        const dataDiscount = await Service.Coupon.calculate({
          price: options.price,
          couponId: appliedCoupon
        });
        transaction.discountPrice = dataDiscount.discountPrice < 0 ? 0 : dataDiscount.discountPrice;
        transaction.discountAmount = dataDiscount.discountAmount > options.price ? options.price : dataDiscount.discountAmount;
        transaction.discountValue = appliedCoupon.value;
        transaction.couponInfo = {
          couponCode: appliedCoupon.code,
          couponId: appliedCoupon._id,
          discountAmount: dataDiscount.discountAmount > options.price ? options.price : dataDiscount.discountAmount,
          discountPrice: dataDiscount.discountPrice < 0 ? 0 : dataDiscount.discountPrice,
          discountValue: appliedCoupon.value,
          type: appliedCoupon.type
        };
        transaction.couponCode = appliedCoupon.code;
        transaction.usedCoupon = true;
        priceForPayment = dataDiscount.discountPrice;
      } else {
        throw new Error('You used this coupon code!');
      }
    }
    transaction.price = priceForPayment < 0 ? 0 : priceForPayment;
    if (options.appointmentId) {
      await DB.Appointment.update(
        { _id: options.appointmentId },
        {
          $set: { transactionId: transaction._id }
        }
      );
    }
    if (priceForPayment <= 0) {
      await transaction.save();
      return this.updatePayment(transaction);
    }
    if (process.env.PAYMENT_MODE !== 'test') {
      const paymentData = await Service.Stripe.createPaymentIntent(Object.assign(transaction, { description: options.description, priceForPayment }));
      transaction.stripeClientSecret = paymentData && paymentData.client_secret ? paymentData.client_secret : '';
    } else {
      transaction.paymentMode = 'test';
      await transaction.save();
      return this.updatePayment(transaction);
    }
    await transaction.save();
    return transaction;
  } catch (e) {
    throw e;
  }
};

exports.updatePayment = async transactionId => {
  try {
    const transaction = transactionId instanceof DB.Transaction ? transactionId : await DB.Transaction.findOne({ _id: transactionId });
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    const paymentInfo = transaction.paymentInfo;
    if (process.env.PAYMENT_SERVICE === 'paydunya') {
      const paymentChecking = await Service.Paydunya.checking(transaction.paymentToken);
      transaction.paymentInfo = paymentChecking;
      transaction.status = paymentChecking.status;
    } else if (process.env.PAYMENT_SERVICE === 'stripe') {
      transaction.status =
        (paymentInfo && paymentInfo.paid) ||
        (transaction.usedCoupon && transaction.discountPrice <= 0) ||
        transaction.price <= 0 ||
        process.env.PAYMENT_MODE === 'test'
          ? 'completed'
          : 'failed';
    }

    transaction.paid = transaction.status === 'completed' ? true : false;
    await transaction.save();

    // update booking info
    if (transaction.status === 'completed') {
      const user = await DB.User.findOne({ _id: transaction.userId });
      const tutor = await DB.User.findOne({ _id: transaction.tutorId });
      let commissionRate = process.env.COMMISSION_RATE;
      const config = await DB.Config.findOne({
        key: 'commissionRate'
      });
      if (config) {
        commissionRate = config.value;
      }
      if (commissionRate > 1) {
        if (commissionRate > 100) {
          commissionRate = 100;
        }
        commissionRate = commissionRate / 100;
      }
      const price = transaction.price;
      const commission = price * (tutor.commissionRate ? tutor.commissionRate : commissionRate);
      const balance = price - commission;

      await DB.Transaction.update(
        { _id: transaction._id },
        {
          $set: {
            price,
            commission,
            balance
          }
        }
      );

      const { targetType, targetId, type, emailRecipient } = transaction;

      const target =
        targetType === 'webinar'
          ? await DB.Webinar.findOne({ _id: targetId })
          : targetType === 'course'
          ? await DB.Course.findOne({ _id: targetId })
          : await DB.MyTopic.findOne({ _id: targetId });

      if (!target) {
        throw new Error('Target not found');
      }

      if (targetType === 'subject') {
        const appointment = await DB.Appointment.findOne({ transactionId: transaction._id });
        await enrollQ.createAppointmentSolo(appointment._id);
      } else if (targetType === 'webinar' && type === 'booking') {
        await enrollQ.createWebinarAppointment(transaction);
      } else if (targetType === 'course' && type === 'booking') {
        await enrollQ.createMyCourse(transaction);
      }

      if (type === 'gift') {
        await Service.Mailer.send('send-gift', emailRecipient, {
          subject: `${user.name} gave you a gift`,
          user: user.getPublicProfile(),
          tutor: tutor.getPublicProfile(),
          transaction: transaction.toObject(),
          webinar: (target && target.toObject()) || null,
          course: (target && target.toObject()) || null,
          signupLink: url.resolve(process.env.userWebUrl, '/auth/signup'),
          appName: process.env.APP_NAME,
          subject_replace_fields: {
            userName: user.name
          }
        });
        if (targetType === 'webinar') {
          await enrollQ.createAppointmentWithEmailRecipient(emailRecipient);
        } else if (targetType === 'course') {
          await enrollQ.createMyCourseWithEmailRecipient(emailRecipient);
        }
      }
    }

    return transaction;
  } catch (e) {
    console.log(e);
    throw e;
  }
};

exports.createPaymentCheckout = async options => {
  let priceForPayment = options.price;
  const transaction = new DB.Transaction({
    tutorId: options.tutorId,
    userId: options.userId,
    description: options.description,
    targetType: options.targetType,
    originalPrice: options.price,
    price: options.price,
    type: 'booking-multiple',
    paymentGateway: 'stripe'
  });
  const paymentData = await Service.Stripe.createPaymentIntent(Object.assign(transaction, { description: options.description, priceForPayment }));
  transaction.stripeClientSecret = paymentData && paymentData.client_secret ? paymentData.client_secret : '';
  await transaction.save();
  return transaction;
};

exports.updatePaymentMutilple = async transactionId => {
  try {
    const transaction = transactionId instanceof DB.Transaction ? transactionId : await DB.Transaction.findOne({ _id: transactionId });
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    const user = await DB.User.findOne({ _id: transaction.userId });
    const tutor = await DB.User.findOne({ _id: transaction.tutorId });

    const { paymentInfo } = transaction;
    if (paymentInfo && paymentInfo.captured) {
      transaction.paid = true;
      transaction.status = 'completed';
      await transaction.save();
      const childrenTransactions = await DB.Transaction.find({
        parentTransactionId: transaction._id
      });

      if (childrenTransactions.length > 0) {
        for (const t of childrenTransactions) {
          let commissionRate = process.env.COMMISSION_RATE;
          const config = await DB.Config.findOne({
            key: 'commissionRate'
          });
          if (config) {
            commissionRate = config.value;
          }
          if (commissionRate > 1) {
            if (commissionRate > 100) {
              commissionRate = 100;
            }
            commissionRate = commissionRate / 100;
          }
          const price = t.price;
          const commission = price * (tutor.commissionRate ? tutor.commissionRate : commissionRate);
          const balance = price - commission;

          await DB.Transaction.update(
            { _id: t._id },
            {
              $set: {
                paid: true,
                status: 'completed',
                price,
                commission,
                balance
              }
            }
          );
          if (t.targetType === 'subject') {
            const appointment = await DB.Appointment.findOne({ transactionId: t._id });
            appointment.paid = true;
            await appointment.save();
            await enrollQ.createAppointmentSolo(appointment._id, false);
          }
        }
      }

      await Service.Mailer.send('payment-success', user.email, {
        subject: `Payment successfully made for the reservation #${transaction.code}`,
        user: user.getPublicProfile(),
        transaction: transaction.toObject(),
        topic: {
          name: 'multiple'
        },
        subject_replace_fields: {
          transactionCode: transaction.code
        }
      });

      const notification = {
        title: `Payments`,
        description: `Payment successfully made for the reservation #${transaction.code}`,
        itemId: transaction._id,
        notifyTo: user._id,
        type: 'payment'
      };
      await Service.Notification.create(notification);
    }
  } catch (error) {
    console.log('erro>>>', error);
  }
};
