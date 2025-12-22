const paydunyaController = require('../controllers/paydunya.controller');

module.exports = router => {
  router.get('/v1/payment/paydunya/callback', Middleware.Request.log, paydunyaController.callback, Middleware.Response.success('callback'));

  router.post('/v1/payment/paydunya/callback', Middleware.Request.log, paydunyaController.callback, Middleware.Response.success('callback'));
};
