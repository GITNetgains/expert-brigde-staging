/**
 * razorpay.controller.js
 */

const Joi = require('joi');
const crypto = require('crypto');
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * ==============================
 * RAZORPAY WEBHOOK
 * (Stripe webhook equivalent)
 * ==============================
 *
 * IMPORTANT:
 * - Uses RAW body
 * - Only webhook updates business logic
 */
exports.hook = async (req, res, next) => {
  try {
    console.log('🔥 RAZORPAY WEBHOOK HIT');
    console.log('Headers:', req.headers);
    console.log('Raw body type:', Buffer.isBuffer(req.body))
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(req.body)
      .digest('hex');

    console.log('🔐 Razorpay Signature:', signature);
    console.log('🔐 Expected Signature:', expectedSignature);

    if (signature !== expectedSignature) {
      console.error('❌ SIGNATURE MISMATCH');
      return res.status(400).send('Invalid signature');
    }

    console.log('✅ SIGNATURE VERIFIED');




    const event = JSON.parse(req.body.toString());

    if (event.event !== 'payment.captured') {
      return res.status(200).send('Ignored');
    }

    const payment = event.payload.payment.entity;
    const transactionId = payment.notes?.transactionId;

    if (!transactionId) return res.status(200).send('No transaction');
    const transaction = await DB.Transaction.findOne({ _id: transactionId });

    if (!transaction) {
      console.error('❌ Transaction not found in DB');
      return res.status(200).send('Transaction not found');
    }

    console.log('📄 Current DB status:', transaction.status);

    if (transaction.status === 'completed') {
      console.log('🔁 Already processed');
      return res.status(200).send('Already processed');
    }

    transaction.paymentInfo = payment;
    transaction.status = 'completed';
    await transaction.save();

    console.log('✅ Transaction marked COMPLETED');


    // ✅ SAME AS STRIPE LOGIC
       console.log('⚙️ Calling updatePayment, type:', transaction.type);

    switch (transaction.type) {
      case 'booking':
      case 'gift':
        await Service.Payment.updatePayment(transaction);
        break;
      case 'booking-multiple':
        await Service.Payment.updatePaymentMutilple(transaction);
        break;
    }

    console.log('🎉 Payment fully processed');

    return res.status(200).send('OK');
  } catch (err) {
    return next(err);
  }
};

/**
 * ==============================
 * CREATE ORDER
 * (Stripe PaymentIntent replacement)
 * ==============================
 */
exports.createOrder = async (req, res, next) => {
  try {
    const schema = Joi.object({
      transactionId: Joi.string().required(),
      amount: Joi.number().positive().required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return next(PopulateResponse.validationError(error));
    }

    const order = await razorpay.orders.create({
      amount: Math.round(value.amount * 100),
      currency: 'INR',
      notes: {
        transactionId: value.transactionId
      }
    });

    res.locals.order = order;
    return next();
  } catch (err) {
    return next(err);
  }
};

/**
 * ==============================
 * CONFIRM PAYMENT
 * (Stripe confirm() equivalent)
 * ==============================
 *
 * IMPORTANT:
 * - Does NOT mark payment successful
 * - Only verifies Razorpay payment exists
 * - Webhook does final update
 */
exports.confirm = async (req, res, next) => {
  try {
    const schema = Joi.object({
      transactionId: Joi.string().required(),
      razorpayPaymentId: Joi.string().required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return next(PopulateResponse.validationError(error));
    }

    const transaction = await DB.Transaction.findOne({
      _id: value.transactionId
    });

    if (!transaction) {
      return next(PopulateResponse.notFound());
    }

    // Idempotency: skip if already completed
    if (transaction.status === 'completed') {
      res.locals.confirm = { success: true, message: 'Already completed' };
      return next();
    }

    // Verify payment from Razorpay
    const payment = await razorpay.payments.fetch(
      value.razorpayPaymentId
    );

    if (!payment || payment.status !== 'captured') {
      return next(
        PopulateResponse.error('Payment not completed')
      );
    }

    // Save payment info
    transaction.paymentInfo = payment;
    await transaction.save();

    // Complete payment and trigger downstream business logic
    // (same as webhook: commission, enrollment, notifications)
    try {
      switch (transaction.type) {
        case 'booking':
        case 'gift':
          await Service.Payment.updatePayment(transaction);
          break;
        case 'booking-multiple':
          await Service.Payment.updatePaymentMutilple(transaction);
          break;
      }
      console.log('Confirm: payment fully processed for transaction', transaction._id);
    } catch (bizErr) {
      // Money was captured, so log the error but don't fail the response
      console.error('Confirm: downstream logic error for transaction', transaction._id, bizErr);
    }

    res.locals.confirm = { success: true };
    return next();
  } catch (err) {
    return next(err);
  }
};
