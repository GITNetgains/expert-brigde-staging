const statsController = require('./stats.controller');

module.exports = router => {
  /**
   * @apiGroup Stats
   * @apiName GetStats
   * @apiVersion 4.0.0
   * @api {get} /v1/admin/stats Admin get system stats
   * @apiDescription Admin get system stats
   * @apiUse authRequest
   * @apiPermission admin
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "totalStudents": 10
   *         ...
   *     },
   *     "error": false
   *  }
   */
  router.get('/v1/admin/stats', Middleware.hasRole('admin'), statsController.stats, Middleware.Response.success('stats'));
};
