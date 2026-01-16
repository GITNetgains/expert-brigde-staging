// server/services/razorpay.service.js
const Razorpay = require('razorpay');
const crypto = require('crypto');

/**
 * Create Razorpay Order
 */
exports.createOrder = async (transaction) => {
  try {
    const configs = await DB.Config.find({
      key: {
        $in: ['currency', 'razorpayKeyId', 'razorpayKeySecret', 'commissionRate', 'commissionCourse']
      }
    }).exec();
    
    const dataConfig = {};
    configs.forEach(item => {
      dataConfig[item.key] = item.value;
    });

    const currency = dataConfig.currency || 'INR';
    const keyId = dataConfig.razorpayKeyId || process.env.RAZORPAY_KEY_ID;
    const keySecret = dataConfig.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET;

    console.log('Loading Razorpay credentials...');
    console.log('Key ID:', keyId);

    if (!keyId || !keySecret) {
      console.error('Razorpay credentials missing!');
      throw new Error('Razorpay credentials not configured. Check database Config collection and .env file');
    }

    if (!keyId.startsWith('rzp_test_') && !keyId.startsWith('rzp_live_')) {
      throw new Error('Invalid Razorpay Key ID format. Must start with rzp_test_ or rzp_live_');
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });

    // Razorpay expects amount in smallest currency unit (paise for INR)
    const amount = parseInt(transaction.priceForPayment * 100, 10);

    const options = {
      amount: amount,
      currency: currency.toUpperCase(),
      receipt: transaction._id.toString(),
      notes: {
        transactionId: transaction._id.toString(),
        targetType: transaction.targetType || '',
        userId: transaction.userId.toString(),
        tutorId: transaction.tutorId.toString(),
        description: transaction.description || ''
      }
    };

    console.log('Creating Razorpay order with options:', options);
    const order = await razorpay.orders.create(options);
    console.log('Razorpay order created:', order.id);
    
    return order;
  } catch (e) {
    console.error('Razorpay createOrder error:', e);
    throw e;
  }
};

/**
 * Verify Payment Signature
 */
exports.verifyPayment = async (paymentData) => {
  try {
    const configs = await DB.Config.find({
      key: {
        $in: ['razorpayKeySecret']
      }
    }).exec();
    
    const dataConfig = {};
    configs.forEach(item => {
      dataConfig[item.key] = item.value;
    });

    const keySecret = dataConfig.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET;

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      console.log('Payment signature verified successfully');
      return {
        success: true,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id
      };
    } else {
      console.error('Payment signature verification failed');
      throw new Error('Payment verification failed');
    }
  } catch (e) {
    console.error('Razorpay verifyPayment error:', e);
    throw e;
  }
};

/**
 * Capture Payment
 */
exports.capturePayment = async (paymentId, amount) => {
  try {
    const configs = await DB.Config.find({
      key: {
        $in: ['razorpayKeyId', 'razorpayKeySecret', 'currency']
      }
    }).exec();
    
    const dataConfig = {};
    configs.forEach(item => {
      dataConfig[item.key] = item.value;
    });

    const keyId = dataConfig.razorpayKeyId || process.env.RAZORPAY_KEY_ID;
    const keySecret = dataConfig.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET;
    const currency = dataConfig.currency || 'INR';

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });

    const captureAmount = parseInt(amount * 100, 10);
    
    const payment = await razorpay.payments.capture(
      paymentId,
      captureAmount,
      currency.toUpperCase()
    );

    return payment;
  } catch (e) {
    console.error('Razorpay capturePayment error:', e);
    throw e;
  }
};

/**
 * Create Refund
 */
exports.createRefund = async (paymentId, amount) => {
  try {
    const configs = await DB.Config.find({
      key: {
        $in: ['razorpayKeyId', 'razorpayKeySecret']
      }
    }).exec();
    
    const dataConfig = {};
    configs.forEach(item => {
      dataConfig[item.key] = item.value;
    });

    const keyId = dataConfig.razorpayKeyId || process.env.RAZORPAY_KEY_ID;
    const keySecret = dataConfig.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET;

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });

    const refundAmount = amount ? parseInt(amount * 100, 10) : undefined;
    
    const refund = await razorpay.payments.refund(paymentId, {
      amount: refundAmount
    });

    return refund;
  } catch (e) {
    console.error('Razorpay createRefund error:', e);
    throw e;
  }
};