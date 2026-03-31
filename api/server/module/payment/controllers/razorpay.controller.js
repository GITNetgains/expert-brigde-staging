/**
 * razorpay.controller.js
 */

const Joi = require('joi');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { forwardRazorpayPayment } = require('../../creditService/forwarder'); // Credit Service forwarding (March 4, 2026)

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

    // === CREDIT SERVICE FORWARDING (Added March 4, 2026) ===
    // Include wallet credit info if wallet was used at checkout
    if (transaction.walletCredit && transaction.walletCredit.amount_minor > 0) {
      event._walletCreditInfo = {
        user_mongo_id: transaction.walletCredit.user_mongo_id,
        amount_minor: transaction.walletCredit.amount_minor,
        currency: transaction.walletCredit.currency || 'INR'
      };
      console.log('[CreditService] Wallet credit info:', transaction.walletCredit.amount_minor, 'paise for user', transaction.walletCredit.user_mongo_id);
    }

    // Enrich with appointment ID and Zoom meeting ID for Credit Service booking linkage
    (async function() {
      try {
        var appt = await DB.Appointment.findOne({ transactionId: transaction._id }, '_id meetingId').lean();
        if (appt) {
          event._appointmentEnrichment = {
            appointment_id: String(appt._id),
            zoom_meeting_id: appt.meetingId ? String(appt.meetingId) : null
          };
          console.log('[CreditService] Appointment enrichment:', appt._id, 'zoom:', appt.meetingId || '(none)');
        } else {
          console.warn('[CreditService] No appointment found for transaction:', transaction._id);
        }
      } catch (enrichErr) {
        console.warn('[CreditService] Appointment enrichment failed (non-blocking):', enrichErr.message);
      }

      // Enrich with commission breakdown from transaction for correct settlement
      if (transaction.balance > 0) {
        var commissionPct = transaction.commission > 0
          ? Math.round((transaction.commission / transaction.balance) * 10000) / 100
          : 0;
        event._commissionEnrichment = {
          commission_minor: Math.round(transaction.commission * 100),
          commission_percent: commissionPct,
          expert_base_minor: Math.round(transaction.balance * 100)
        };
        console.log('[CreditService] Commission enrichment: base=%d commission=%d pct=%s%%',
          event._commissionEnrichment.expert_base_minor,
          event._commissionEnrichment.commission_minor,
          commissionPct);
      }

      forwardRazorpayPayment(event).catch(function(err) {
        console.error('[CreditService] Async forward error:', err.message);
      });
    })();
    // === END CREDIT SERVICE FORWARDING ===

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

    // Add GST (18%) on top of base amount for domestic orders
    var gstRate = 0.18;
    var baseAmountPaise = Math.round(value.amount * 100);
    var gstAmountPaise = Math.round(baseAmountPaise * gstRate);
    var totalAmountPaise = baseAmountPaise + gstAmountPaise;

    console.log('[Razorpay] Order: base=%d GST=%d total=%d paise', baseAmountPaise, gstAmountPaise, totalAmountPaise);

    const order = await razorpay.orders.create({
      amount: totalAmountPaise,
      currency: 'INR',
      notes: {
        transactionId: value.transactionId,
        baseAmount: baseAmountPaise,
        gstAmount: gstAmountPaise,
        gstRate: '18'
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

    // === CREDIT SERVICE FORWARDING (redundant path — webhook may not arrive) ===
    (async function() {
      try {
        // Build synthetic Razorpay webhook event for the forwarder
        var syntheticEvent = {
          event: 'payment.captured',
          payload: { payment: { entity: payment } }
        };

        // Appointment enrichment
        var appt = await DB.Appointment.findOne({ transactionId: transaction._id }, '_id meetingId').lean();
        if (appt) {
          syntheticEvent._appointmentEnrichment = {
            appointment_id: String(appt._id),
            zoom_meeting_id: appt.meetingId ? String(appt.meetingId) : null
          };
        }

        // Commission enrichment
        if (transaction.balance > 0) {
          var commPct = transaction.commission > 0
            ? Math.round((transaction.commission / transaction.balance) * 10000) / 100
            : 0;
          syntheticEvent._commissionEnrichment = {
            commission_minor: Math.round(transaction.commission * 100),
            commission_percent: commPct,
            expert_base_minor: Math.round(transaction.balance * 100)
          };
        }

        // Wallet credit enrichment
        if (transaction.walletCredit && transaction.walletCredit.amount_minor > 0) {
          syntheticEvent._walletCreditInfo = {
            user_mongo_id: transaction.walletCredit.user_mongo_id,
            amount_minor: transaction.walletCredit.amount_minor,
            currency: transaction.walletCredit.currency || 'INR'
          };
        }

        forwardRazorpayPayment(syntheticEvent).catch(function(err) {
          console.error('[CreditService] Confirm-path forward error:', err.message);
        });
        console.log('[CreditService] Confirm-path forward queued for txn:', transaction._id);
      } catch (enrichErr) {
        console.warn('[CreditService] Confirm-path enrichment failed:', enrichErr.message);
      }
    })();
    // === END CREDIT SERVICE FORWARDING ===

    res.locals.confirm = { success: true };
    return next();
  } catch (err) {
    return next(err);
  }
};
