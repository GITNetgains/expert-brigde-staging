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
 * Get client wallet balance from Credit Service
 * @param {string} userMongoId - MongoDB user ObjectId
 * @returns {Promise<number>} Available balance in paisa (always positive)
 */
async function getWalletBalance(userMongoId) {
  try {
    var apiKey = process.env.CREDIT_SERVICE_API_KEY;
    var baseUrl = process.env.CREDIT_SERVICE_URL || 'http://172.31.3.181:8010';
    var res = await fetch(baseUrl + '/api/v1/credits/balance/' + userMongoId, {
      headers: { 'X-API-Key': apiKey },
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) return 0;
    var data = await res.json();
    var clientWallet = (data.balances || []).find(function(b) {
      return b.account_type === 'CLIENT_WALLET';
    });
    // balance_minor is negative in double-entry (credits are negative), use Math.abs
    return clientWallet ? Math.abs(clientWallet.balance_minor) : 0;
  } catch (e) {
    console.warn('[Payment.js] getWalletBalance error:', e.message);
    return 0;
  }
}

// Wallet cap settings cache — source of truth is PostgreSQL via Credit Service API
let _walletCapCache = null;
let _walletCapCacheExpiry = 0;
const WALLET_CAP_FALLBACK = 90; // Default: 90% of booking payable via wallet

async function getWalletCapPercent() {
  if (_walletCapCache !== null && Date.now() < _walletCapCacheExpiry) {
    return _walletCapCache;
  }
  try {
    var apiKey = process.env.CREDIT_SERVICE_API_KEY;
    var baseUrl = process.env.CREDIT_SERVICE_URL || 'http://172.31.3.181:8010';
    var res = await fetch(baseUrl + '/api/v1/compliance/config/MAX_WALLET_USAGE_PERCENT', {
      headers: { 'X-API-Key': apiKey }, signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) throw new Error('Non-200');
    var data = await res.json();
    var rate = data.value.rate;
    // Clamp to 0-95 range
    rate = Math.max(0, Math.min(95, rate));
    _walletCapCache = rate;
    _walletCapCacheExpiry = Date.now() + COMMISSION_CACHE_TTL;
    console.log('[Payment.js] Wallet cap loaded from Credit Service: %d%%', rate);
    return rate;
  } catch (err) {
    console.warn('[Payment.js] Wallet cap fetch failed — using fallback %d%%:', WALLET_CAP_FALLBACK, err.message);
    return WALLET_CAP_FALLBACK;
  }
}



// ========================
// Wallet Reservation Helpers (prevent double-spend)
// ========================

/**
 * Get available wallet balance (total minus active reservations).
 * @param {string} userMongoId - MongoDB user ObjectId
 * @returns {Promise<{available: number, walletAccountId: string|null}>}
 */
async function getAvailableWalletBalance(userMongoId) {
  try {
    var apiKey = process.env.CREDIT_SERVICE_API_KEY;
    var baseUrl = process.env.CREDIT_SERVICE_URL || 'http://172.31.3.181:8010';
    var res = await fetch(baseUrl + '/api/v1/wallet/reservation/available/' + userMongoId, {
      headers: { 'X-API-Key': apiKey },
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) return { available: 0, walletAccountId: null };
    var data = await res.json();
    return {
      available: data.available_minor || 0,
      walletAccountId: data.wallet_account_id || null
    };
  } catch (e) {
    console.warn('[Payment.js] getAvailableWalletBalance error:', e.message);
    return { available: 0, walletAccountId: null };
  }
}

/**
 * Create a wallet reservation to hold credits during checkout.
 * @param {string} userMongoId
 * @param {number} amountMinor - paise to reserve
 * @param {string} [checkoutSessionId] - Razorpay order ID or similar
 * @returns {Promise<string|null>} reservation_id or null on failure
 */
async function createWalletReservation(userMongoId, amountMinor, checkoutSessionId) {
  try {
    var apiKey = process.env.CREDIT_SERVICE_API_KEY;
    var baseUrl = process.env.CREDIT_SERVICE_URL || 'http://172.31.3.181:8010';
    var res = await fetch(baseUrl + '/api/v1/wallet/reservation/create', {
      method: 'POST',
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_mongo_id: userMongoId,
        amount_minor: amountMinor,
        checkout_session_id: checkoutSessionId || null
      }),
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) {
      var errText = await res.text();
      console.warn('[Payment.js] createWalletReservation failed:', res.status, errText);
      return null;
    }
    var data = await res.json();
    console.log('[Payment.js] Wallet reservation created: id=%s amount=%d expires=%s',
      data.reservation_id, amountMinor, data.expires_at);
    return data.reservation_id;
  } catch (e) {
    console.warn('[Payment.js] createWalletReservation error:', e.message);
    return null;
  }
}

/**
 * Release a wallet reservation (on payment failure or cancel).
 * @param {string} reservationId
 */
async function releaseWalletReservation(reservationId) {
  if (!reservationId) return;
  try {
    var apiKey = process.env.CREDIT_SERVICE_API_KEY;
    var baseUrl = process.env.CREDIT_SERVICE_URL || 'http://172.31.3.181:8010';
    await fetch(baseUrl + '/api/v1/wallet/reservation/release/' + reservationId, {
      method: 'POST',
      headers: { 'X-API-Key': apiKey },
      signal: AbortSignal.timeout(3000)
    });
    console.log('[Payment.js] Wallet reservation released: %s', reservationId);
  } catch (e) {
    console.warn('[Payment.js] releaseWalletReservation error:', e.message);
  }
}

/**
 * Consume a wallet reservation (on payment success).
 * @param {string} reservationId
 */
async function consumeWalletReservation(reservationId) {
  if (!reservationId) return;
  try {
    var apiKey = process.env.CREDIT_SERVICE_API_KEY;
    var baseUrl = process.env.CREDIT_SERVICE_URL || 'http://172.31.3.181:8010';
    await fetch(baseUrl + '/api/v1/wallet/reservation/consume/' + reservationId, {
      method: 'POST',
      headers: { 'X-API-Key': apiKey },
      signal: AbortSignal.timeout(3000)
    });
    console.log('[Payment.js] Wallet reservation consumed: %s', reservationId);
  } catch (e) {
    console.warn('[Payment.js] consumeWalletReservation error:', e.message);
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

  // 💰 Wallet credit check (with reservation to prevent double-spend)
  var walletCreditPaise = 0;
  var walletReservationId = null;
  if (options.useWalletCredits && options.userId) {
    try {
      var userMongoId = options.userId.toString();
      var walletInfo = await getAvailableWalletBalance(userMongoId);
      var walletBalance = walletInfo.available;
      if (walletBalance > 0) {
        // Gateway-agnostic wallet cap from compliance_config (default 90%)
        var walletCapPercent = await getWalletCapPercent();
        // Max wallet = configured % of total booking amount
        var maxWalletFromPercent = Math.floor(totalAmountPaise * (walletCapPercent / 100));
        // Also enforce minimum gateway payment of Rs 1 (100 paise)
        var maxWalletFromMinGateway = totalAmountPaise - 100;
        // Use the stricter of the two caps
        var maxWallet = Math.min(maxWalletFromPercent, maxWalletFromMinGateway);
        walletCreditPaise = Math.min(walletBalance, maxWallet);
        walletCreditPaise = Math.max(0, walletCreditPaise);

        // Create reservation to lock these credits
        if (walletCreditPaise > 0) {
          walletReservationId = await createWalletReservation(userMongoId, walletCreditPaise);
          if (!walletReservationId) {
            // Reservation failed — proceed without wallet credits (safe fallback)
            console.warn('[Payment.js] Wallet reservation failed, proceeding without wallet credits');
            walletCreditPaise = 0;
          }
        }

        console.log('[Payment.js] Wallet: available=%d, cap=%d%% (max=%d), applying=%d paise, reservation=%s',
          walletBalance, walletCapPercent, maxWallet, walletCreditPaise, walletReservationId || 'none');
      }
    } catch (walletErr) {
      console.warn('[Payment.js] Wallet balance check failed (proceeding without credit):', walletErr.message);
      walletCreditPaise = 0;
      walletReservationId = null;
    }
  }

  var razorpayAmountPaise = totalAmountPaise - walletCreditPaise;

  // Store wallet credit info on transaction for webhook processing
  if (walletCreditPaise > 0) {
    transaction.walletCredit = {
      amount_minor: walletCreditPaise,
      user_mongo_id: options.userId.toString(),
      currency: 'INR',
      original_total_paise: totalAmountPaise,
      reservation_id: walletReservationId
    };
  }

  console.log('[Razorpay] Order: base=%d GST=%d total=%d wallet=%d razorpay=%d paise',
    baseAmountPaise, gstAmountPaise, totalAmountPaise, walletCreditPaise, razorpayAmountPaise);

  const order = await razorpay.orders.create({
    amount: razorpayAmountPaise,
    currency: 'INR',
    notes: {
      transactionId: transaction._id.toString(),
      tutorId: options.tutorId ? options.tutorId.toString() : '',
      baseAmount: String(baseAmountPaise),
      gstAmount: String(gstAmountPaise),
      gstRate: '18',
      walletCreditPaise: String(walletCreditPaise),
      totalBeforeWallet: String(totalAmountPaise),
      walletReservationId: walletReservationId || ''
    }
  });

  transaction.razorpayOrderId = order.id;
  transaction.vat = gstAmountPaise / 100;  // GST amount in rupees
  await transaction.save();

  return {
    transactionId: transaction._id,
    razorpayOrderId: order.id,
    amount: razorpayAmountPaise / 100,
    baseAmount: transaction.price,
    gstAmount: gstAmountPaise / 100,
    walletCreditApplied: walletCreditPaise / 100,
    originalTotal: totalAmountPaise / 100,
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

  // Handle wallet reservation based on payment outcome
  if (transaction.walletCredit && transaction.walletCredit.reservation_id) {
    if (isSuccess) {
      consumeWalletReservation(transaction.walletCredit.reservation_id);
    } else {
      releaseWalletReservation(transaction.walletCredit.reservation_id);
    }
  }

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

  // Handle wallet reservation based on payment outcome
  if (transaction.walletCredit && transaction.walletCredit.reservation_id) {
    if (isSuccess) {
      consumeWalletReservation(transaction.walletCredit.reservation_id);
    } else {
      releaseWalletReservation(transaction.walletCredit.reservation_id);
    }
  }

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
