// server/controllers/razorpay.controller.js
const Joi = require('joi');
const crypto = require('crypto');

/**
 * Verify Razorpay Payment
 */
exports.verifyPayment = async (req, res, next) => {
  try {
    const validateSchema = Joi.object().keys({
      razorpay_order_id: Joi.string().required(),
      razorpay_payment_id: Joi.string().required(),
      razorpay_signature: Joi.string().required(),
      transactionId: Joi.string().required()
    });

    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    // Verify payment signature
    const verification = await Service.Razorpay.verifyPayment({
      razorpay_order_id: validate.value.razorpay_order_id,
      razorpay_payment_id: validate.value.razorpay_payment_id,
      razorpay_signature: validate.value.razorpay_signature
    });

    if (!verification.success) {
      return next(PopulateResponse.error({ message: 'Payment verification failed' }));
    }

    // Update transaction
    const transaction = await DB.Transaction.findById(validate.value.transactionId);
    if (!transaction) {
      return next(PopulateResponse.error({ message: 'Transaction not found' }));
    }

    // Update transaction status
    transaction.paid = true;
    transaction.status = 'completed';
    transaction.paymentId = verification.paymentId;
    transaction.orderId = verification.orderId;
    await transaction.save();

    // Update enrollment count for webinars
    if (transaction.targetType === 'webinar') {
      await DB.Webinar.updateOne(
        { _id: transaction.targetId },
        { $inc: { numberParticipants: 1 } }
      );
    }

    console.log('Payment verified and transaction updated:', transaction._id);

    res.locals.verify = {
      success: true,
      transaction: transaction
    };
    return next();
  } catch (e) {
    console.error('verifyPayment error:', e);
    return next(e);
  }
};

/**
 * Razorpay Webhook Handler
 */
exports.webhook = async (req, res, next) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.warn('Webhook secret not configured');
      return res.status(200).json({ received: true });
    }

    const body = JSON.stringify(req.body);
    
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== webhookSignature) {
      console.error('Invalid webhook signature');
      return res.status(400).send('Invalid signature');
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log('Razorpay webhook event:', event);

    switch (event) {
      case 'payment.captured':
        const paymentEntity = payload.payment.entity;
        const transactionId = paymentEntity.notes.transactionId;
        
        if (transactionId) {
          const transaction = await DB.Transaction.findById(transactionId);
          if (transaction && !transaction.paid) {
            transaction.paid = true;
            transaction.status = 'completed';
            transaction.paymentId = paymentEntity.id;
            await transaction.save();
            console.log('Transaction updated via webhook:', transactionId);
          }
        }
        break;

      case 'payment.failed':
        const failedPayment = payload.payment.entity;
        const failedTransactionId = failedPayment.notes.transactionId;
        
        if (failedTransactionId) {
          const failedTransaction = await DB.Transaction.findById(failedTransactionId);
          if (failedTransaction) {
            failedTransaction.status = 'failed';
            await failedTransaction.save();
            console.log('Transaction marked as failed:', failedTransactionId);
          }
        }
        break;

      case 'order.paid':
        console.log('Order paid event received');
        break;

      default:
        console.log('Unhandled webhook event:', event);
    }

    res.locals.webhook = { success: true };
    return next();
  } catch (e) {
    console.error('webhook error:', e);
    return next(e);
  }
};