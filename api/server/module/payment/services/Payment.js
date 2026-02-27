const url = require('url');
const Razorpay = require('razorpay');
const enrollQ = require('../../webinar/queue');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * ==============================
 * CREATE RAZORPAY ORDER
 * (Stripe PaymentIntent replacement)
 * ==============================
 */
exports.createOrderByRazorpay = async options => {
  let priceForPayment = options.price;

  if (
    (options.targetType === 'course' || options.targetType === 'webinar') &&
    options.target.isFree
  ) {
    priceForPayment = 0;
  }

  const transaction = new DB.Transaction({
    tutorId: options.tutorId,
    userId: options.userId,
    targetId: options.target && options.target._id,
    description: options.description,
    targetType: options.targetType,
    originalPrice: options.price,
    emailRecipient: options.emailRecipient || '',
    type: options.type,
    paymentGateway: 'razorpay'
  });

  // 🎟 Coupon logic (unchanged)
  if (options.couponCode) {
    const appliedCoupon = await Service.Coupon.getValidCoupon(
      options.userId,
      {
        code: options.couponCode,
        tutorId: options.tutorId,
        targetType: options.targetType,
        targetId:
          options.targetType === 'subject'
            ? options.tutorId
            : options.target._id
      }
    );

    if (!appliedCoupon) throw new Error('Invalid coupon');

    const dataDiscount = await Service.Coupon.calculate({
      price: options.price,
      couponId: appliedCoupon
    });

    transaction.discountPrice = Math.max(0, dataDiscount.discountPrice);
    transaction.discountAmount = Math.min(
      options.price,
      dataDiscount.discountAmount
    );
    transaction.couponInfo = {
      couponCode: appliedCoupon.code,
      couponId: appliedCoupon._id,
      discountAmount: transaction.discountAmount,
      discountPrice: transaction.discountPrice,
      discountValue: appliedCoupon.value,
      type: appliedCoupon.type
    };
    transaction.usedCoupon = true;
    priceForPayment = transaction.discountPrice;
  }

  // Base amount that the tutor should receive (after any coupon/discount)
  const basePriceForTutor = Math.max(0, priceForPayment);

  // Calculate commission rate (global or tutor-specific)
  let commissionRate = process.env.COMMISSION_RATE;
  const config = await DB.Config.findOne({ key: 'commissionRate' });
  if (config) commissionRate = config.value;
  if (commissionRate > 1) commissionRate /= 100;

  let tutorCommissionRate = null;
  if (options.tutorId) {
    const tutor = await DB.User.findOne({ _id: options.tutorId });
    if (tutor && typeof tutor.commissionRate === 'number') {
      tutorCommissionRate = tutor.commissionRate;
    }
  }

  const effectiveCommissionRate =
    tutorCommissionRate != null ? tutorCommissionRate : commissionRate;

  // Commission is calculated on the tutor's base price
  const commission =
    basePriceForTutor > 0 ? basePriceForTutor * effectiveCommissionRate : 0;

  // Student pays tutor price + commission; tutor later receives full base price
  transaction.price = basePriceForTutor + commission;
  transaction.commission = commission;
  transaction.balance = basePriceForTutor;

  await transaction.save();

  if (options.appointmentId) {
    await DB.Appointment.update(
      { _id: options.appointmentId },
      { $set: { transactionId: transaction._id } }
    );
  }

  // 💸 FREE PAYMENT
  if (transaction.price <= 0) {
    transaction.status = 'completed';
    transaction.paid = true;
    await transaction.save();
    return this.updatePayment(transaction);
  }

  // 💳 Razorpay Order
  const order = await razorpay.orders.create({
    amount: Math.round(transaction.price * 100),
    currency: 'INR',
    notes: {
      transactionId: transaction._id.toString()
    }
  });

  transaction.razorpayOrderId = order.id;
  await transaction.save();

  return {
    transactionId: transaction._id,
    razorpayOrderId: order.id,
    amount: transaction.price,
    currency: 'INR',
    razorpayKey: process.env.RAZORPAY_KEY_ID
  };
};

exports.updatePaymentMutilple = async transactionId => {
  const transaction =
    transactionId instanceof DB.Transaction
      ? transactionId
      : await DB.Transaction.findOne({ _id: transactionId });
  if (!transaction) throw new Error('Transaction not found');
  const paymentInfo = transaction.paymentInfo;
  const isSuccess =
    paymentInfo && paymentInfo.status === 'captured';
  transaction.status = isSuccess ? 'completed' : 'pending';
  transaction.paid = isSuccess;
  await transaction.save();
  if (!isSuccess) return transaction;
  const user = await DB.User.findOne({ _id: transaction.userId });
  const tutor = await DB.User.findOne({ _id: transaction.tutorId });
  let commissionRate = process.env.COMMISSION_RATE;
  const config = await DB.Config.findOne({ key: 'commissionRate' });
  if (config) commissionRate = config.value;
  if (commissionRate > 1) commissionRate /= 100;
  const tutorCommissionRate =
    tutor && typeof tutor.commissionRate === 'number'
      ? tutor.commissionRate
      : null;
  const effectiveCommissionRate =
    tutorCommissionRate != null ? tutorCommissionRate : commissionRate;
  const children = await DB.Transaction.find({
    parentTransactionId: transaction._id
  });
  await Promise.all(
    children.map(async child => {
      // Base amount that the tutor should receive for this child transaction
      const basePriceForTutor =
        child.usedCoupon && child.discountPrice
          ? child.discountPrice
          : child.originalPrice || child.price;
      const commission =
        basePriceForTutor > 0
          ? basePriceForTutor * effectiveCommissionRate
          : 0;
      await DB.Transaction.update(
        { _id: child._id },
        {
          $set: {
            status: 'completed',
            paid: true,
            commission,
            // Tutor receives the full base price they set
            balance: basePriceForTutor
          }
        }
      );
      const appointment = await DB.Appointment.findOne({
        transactionId: child._id
      });
      if (appointment) {
        await enrollQ.createAppointmentSolo(appointment._id);
      }
    })
  );
  return transaction;
};





exports.updatePayment = async transactionId => {
  const transaction =
    transactionId instanceof DB.Transaction
      ? transactionId
      : await DB.Transaction.findOne({ _id: transactionId });

  if (!transaction) throw new Error('Transaction not found');

  const paymentInfo = transaction.paymentInfo;

  const isSuccess =
    paymentInfo && paymentInfo.status === 'captured';

  transaction.status = isSuccess ? 'completed' : 'pending';
  transaction.paid = isSuccess;
  await transaction.save();

  if (!isSuccess) return transaction;

  // 💰 Commission logic (unchanged)
  const user = await DB.User.findOne({ _id: transaction.userId });
  const tutor = await DB.User.findOne({ _id: transaction.tutorId });

  let commissionRate = process.env.COMMISSION_RATE;
  const config = await DB.Config.findOne({ key: 'commissionRate' });
  if (config) commissionRate = config.value;

  if (commissionRate > 1) commissionRate /= 100;

  const tutorCommissionRate =
    tutor && typeof tutor.commissionRate === 'number'
      ? tutor.commissionRate
      : null;
  const effectiveCommissionRate =
    tutorCommissionRate != null ? tutorCommissionRate : commissionRate;

  // Base amount that the tutor should receive (after discount, before commission on top)
  const basePriceForTutor =
    transaction.usedCoupon && transaction.discountPrice
      ? transaction.discountPrice
      : transaction.originalPrice || transaction.price;
  const commission =
    basePriceForTutor > 0
      ? basePriceForTutor * effectiveCommissionRate
      : 0;

  await DB.Transaction.update(
    { _id: transaction._id },
    {
      $set: {
        commission,
        // Tutor receives the full base price they set
        balance: basePriceForTutor
      }
    }
  );

  // 📚 Enrollment logic (unchanged)
  const { targetType, targetId, type, emailRecipient } = transaction;

  const target =
    targetType === 'webinar'
      ? await DB.Webinar.findOne({ _id: targetId })
      : targetType === 'course'
      ? await DB.Course.findOne({ _id: targetId })
      : await DB.MySubject.findOne({ _id: targetId });

  if (targetType === 'subject') {
    const appointment = await DB.Appointment.findOne({
      transactionId: transaction._id
    });
    await enrollQ.createAppointmentSolo(appointment._id);
  } else if (targetType === 'webinar' && type === 'booking') {
    await enrollQ.createWebinarAppointment(transaction);
  } else if (targetType === 'course' && type === 'booking') {
    await enrollQ.createMyCourse(transaction);
  }

  // 🎁 Gift logic (unchanged)
  if (type === 'gift') {
    await Service.Mailer.send('send-gift', emailRecipient, {
      subject: `${user.name} gave you a gift`,
      user: user.getPublicProfile(),
      tutor: tutor.getPublicProfile(),
      transaction: transaction.toObject(),
      signupLink: url.resolve(
        process.env.userWebUrl,
        '/auth/signup'
      ),
      appName: process.env.APP_NAME
    });
  }

  return transaction;
};
