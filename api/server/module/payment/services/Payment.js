const url = require('url');
const Razorpay = require('razorpay');
const enrollQ = require('../../webinar/queue');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Commission settings cache -- source of truth is PostgreSQL via Credit Service API
let _commissionCache = null;
let _commissionCacheExpiry = 0;
const COMMISSION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Hardcoded fallback -- used ONLY if Credit Service unreachable
// These MUST match PostgreSQL compliance_config -- update if Finance Hub settings change
const COMMISSION_FALLBACK = {
  MIN_COMMISSION_PERCENT: 0.30,
  DEFAULT_COMMISSION_PERCENT: 0.50,
  GST_DOMESTIC_RATE: 0.18
};

async function getCommissionSettings() {
  if (_commissionCache && Date.now() < _commissionCacheExpiry) {
    return _commissionCache;
  }
  try {
    const apiKey = process.env.CREDIT_SERVICE_API_KEY;
    const baseUrl = process.env.CREDIT_SERVICE_URL || 'http://172.31.3.181:8010';
    const [minRes, defaultRes, gstRes] = await Promise.all([
      fetch(baseUrl + '/api/v1/compliance/config/MIN_COMMISSION_PERCENT', {
        headers: { 'X-API-Key': apiKey }, signal: AbortSignal.timeout(3000)
      }),
      fetch(baseUrl + '/api/v1/compliance/config/DEFAULT_COMMISSION_PERCENT', {
        headers: { 'X-API-Key': apiKey }, signal: AbortSignal.timeout(3000)
      }),
      fetch(baseUrl + '/api/v1/compliance/config/GST_DOMESTIC_RATE', {
        headers: { 'X-API-Key': apiKey }, signal: AbortSignal.timeout(3000)
      })
    ]);
    if (!minRes.ok || !defaultRes.ok || !gstRes.ok) throw new Error('Non-200 from Credit Service');
    const [minData, defaultData, gstData] = await Promise.all([
      minRes.json(), defaultRes.json(), gstRes.json()
    ]);
    _commissionCache = {
      MIN_COMMISSION_PERCENT: minData.value.rate,
      DEFAULT_COMMISSION_PERCENT: defaultData.value.rate,
      GST_DOMESTIC_RATE: gstData.value.rate
    };
    _commissionCacheExpiry = Date.now() + COMMISSION_CACHE_TTL;
    console.log('[Payment.js] Commission settings loaded from Credit Service:', JSON.stringify(_commissionCache));
    return _commissionCache;
  } catch (err) {
    console.warn('[Payment.js] Credit Service unreachable -- using fallback commission values:', err.message);
    return COMMISSION_FALLBACK;
  }
}

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

  // Commission rates from Credit Service (PostgreSQL compliance_config)
  const settings = await getCommissionSettings();

  let tutorCommissionRate = null;
  if (options.tutorId) {
    const tutor = await DB.User.findOne({ _id: options.tutorId });
    if (tutor && typeof tutor.commissionRate === 'number') {
      tutorCommissionRate = tutor.commissionRate;
    }
  }

  // If expert has no commission set, use DEFAULT (50%); otherwise enforce MIN floor (30%)
  var effectiveCommissionRate;
  if (tutorCommissionRate == null) {
    effectiveCommissionRate = settings.DEFAULT_COMMISSION_PERCENT;
  } else {
    effectiveCommissionRate = Math.max(parseFloat(tutorCommissionRate) || 0, settings.MIN_COMMISSION_PERCENT);
  }

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

  // 💳 Razorpay Order — Add GST (18%) on top of base amount
  var gstRate = settings.GST_DOMESTIC_RATE;
  var baseAmountPaise = Math.round(transaction.price * 100);
  var gstAmountPaise = Math.round(baseAmountPaise * gstRate);
  var totalAmountPaise = baseAmountPaise + gstAmountPaise;

  console.log('[Razorpay] Order: base=%d GST=%d total=%d paise (Rs %s + Rs %s GST = Rs %s)',
    baseAmountPaise, gstAmountPaise, totalAmountPaise,
    (baseAmountPaise / 100).toFixed(2), (gstAmountPaise / 100).toFixed(2), (totalAmountPaise / 100).toFixed(2));

  const order = await razorpay.orders.create({
    amount: totalAmountPaise,
    currency: 'INR',
    notes: {
      transactionId: transaction._id.toString(),
      tutorId: options.tutorId ? options.tutorId.toString() : '',
      baseAmount: String(baseAmountPaise),
      gstAmount: String(gstAmountPaise),
      gstRate: '18'
    }
  });

  transaction.razorpayOrderId = order.id;
  transaction.vat = gstAmountPaise / 100;  // GST amount in rupees
  await transaction.save();

  return {
    transactionId: transaction._id,
    razorpayOrderId: order.id,
    amount: totalAmountPaise / 100,
    baseAmount: transaction.price,
    gstAmount: gstAmountPaise / 100,
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
  // Commission rates from Credit Service (PostgreSQL compliance_config)
  const settings = await getCommissionSettings();
  const tutorCommissionRate =
    tutor && typeof tutor.commissionRate === 'number'
      ? tutor.commissionRate
      : null;
  // If expert has no commission set, use DEFAULT (50%); otherwise enforce MIN floor (30%)
  const effectiveCommissionRate = tutorCommissionRate == null
    ? settings.DEFAULT_COMMISSION_PERCENT
    : Math.max(parseFloat(tutorCommissionRate) || 0, settings.MIN_COMMISSION_PERCENT);
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

  // Commission rates from Credit Service (PostgreSQL compliance_config)
  const settings = await getCommissionSettings();
  const tutorCommissionRate =
    tutor && typeof tutor.commissionRate === 'number'
      ? tutor.commissionRate
      : null;
  // If expert has no commission set, use DEFAULT (50%); otherwise enforce MIN floor (30%)
  const effectiveCommissionRate = tutorCommissionRate == null
    ? settings.DEFAULT_COMMISSION_PERCENT
    : Math.max(parseFloat(tutorCommissionRate) || 0, settings.MIN_COMMISSION_PERCENT);

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
