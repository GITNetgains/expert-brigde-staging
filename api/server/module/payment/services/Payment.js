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
    targetId: options.target._id,
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

  transaction.price = Math.max(0, priceForPayment);

  await transaction.save();

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

  const price = transaction.price;
  const commission =
    price * (tutor.commissionRate || commissionRate);

  await DB.Transaction.update(
    { _id: transaction._id },
    {
      $set: {
        commission,
        balance: price - commission
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
