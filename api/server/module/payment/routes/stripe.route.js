const stripeController = require('../controllers/stripe.controller');

module.exports = router => {
  /**
   * @apiGroup Stripe
   * @apiVersion 4.0.0
   * @api {post} /v1/payment/stripe/hook Stripe Webhook
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "hook": {
   *             "success": true
   *         }
   *     },
   *     "error": false
   *  }
   */

  router.post('/v1/payment/stripe/hook', Middleware.Request.log, stripeController.hook, Middleware.Response.success('hook'));
};
