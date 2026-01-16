// server/routes/razorpay.route.js
const razorpayController = require('../controllers/razorpay.controller');
const appointmentPaymentController = require('../controllers/booking.controller');

module.exports = router => {
  /**
   * @apiGroup Razorpay
   * @apiVersion 4.0.0
   * @api {post} /v1/payment/razorpay/webhook Razorpay Webhook
   * @apiDescription Webhook endpoint for Razorpay payment events
   */
  router.post(
    '/v1/payment/razorpay/webhook',
    Middleware.Request.log,
    razorpayController.webhook,
    Middleware.Response.success('webhook')
  );

  /**
   * @apiGroup Razorpay
   * @apiVersion 4.0.0
   * @api {post} /v1/payment/razorpay/verify Verify Razorpay Payment
   * @apiDescription Verify payment signature and update transaction
   * @apiParam {String} razorpay_order_id Order ID from Razorpay
   * @apiParam {String} razorpay_payment_id Payment ID from Razorpay
   * @apiParam {String} razorpay_signature Payment signature from Razorpay
   * @apiParam {String} transactionId Transaction ID from database
   */
  router.post(
    '/v1/payment/razorpay/verify',
    Middleware.isAuthenticated,
    razorpayController.verifyPayment,
    Middleware.Response.success('verify')
  );

  /**
   * @apiGroup Payment
   * @apiVersion 4.0.0
   * @api {post} /v1/payment/appointment/create Create Razorpay Order for Appointment
   * @apiDescription Create a Razorpay order for appointment booking without creating the appointment
   * @apiParam {String} startTime Start time of appointment
   * @apiParam {String} toTime End time of appointment
   * @apiParam {String} targetId Subject/Topic ID
   * @apiParam {String} tutorId Tutor ID
   * @apiParam {String} [couponCode] Coupon code for discount
   */
  router.post(
    '/v1/payment/appointment/create',
    Middleware.isAuthenticated,
    appointmentPaymentController.createPayment,
    Middleware.Response.success('payment')
  );

  /**
   * @apiGroup Payment
   * @apiVersion 4.0.0
   * @api {post} /v1/payment/appointment/confirm Confirm Appointment After Payment
   * @apiDescription Create the actual appointment after successful payment
   * @apiParam {String} transactionId Transaction ID
   */
  router.post(
    '/v1/payment/appointment/confirm',
    Middleware.isAuthenticated,
    appointmentPaymentController.confirmAppointment,
    Middleware.Response.success('confirm')
  );
};