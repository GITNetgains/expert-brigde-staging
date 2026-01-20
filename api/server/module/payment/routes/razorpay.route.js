const bodyParser = require('body-parser');
const razorpayController = require('../controllers/razorpay.controller');

module.exports = router => {

  /**
   * ============================
   * RAZORPAY WEBHOOK
   * ============================
   * ⚠ MUST use RAW BODY
   * ⚠ NO auth middleware
   * ⚠ Logging middleware MUST NOT consume body
   */
  router.post(
    '/v1/payment/razorpay/hook',
    bodyParser.raw({ type: 'application/json' }), // ✅ REQUIRED
    razorpayController.hook
  );

  /**
   * ============================
   * CREATE ORDER
   * ============================
   */
  router.post(
    '/v1/payment/razorpay/order',
    Middleware.isAuthenticated,
    razorpayController.createOrder,
    Middleware.Response.success('order')
  );

  /**
   * ============================
   * CONFIRM PAYMENT
   * ============================
   */
  router.post(
    '/v1/payment/razorpay/confirm',
    Middleware.isAuthenticated,
    razorpayController.confirm,
    Middleware.Response.success('confirm')
  );
};
