const industryController = require('../controllers/industry.controller');

module.exports = router => {
  router.post('/v1/industries', Middleware.hasRole('admin'), industryController.create, Middleware.Response.success('create'));
  router.put('/v1/industries/:industryId', Middleware.hasRole('admin'), industryController.update, Middleware.Response.success('update'));
  router.delete('/v1/industries/:industryId', Middleware.hasRole('admin'), industryController.remove, Middleware.Response.success('remove'));
  router.get('/v1/industries/:industryId', industryController.findOne, Middleware.Response.success('industry'));
  router.get('/v1/industries', industryController.list, Middleware.Response.success('list'));
};
