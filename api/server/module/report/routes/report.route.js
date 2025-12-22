const reportCtr = require('../controllers/report.controller');

module.exports = router => {
  /**
   * @apiDefine reportRequest
   * @apiParam {String}   name Report name
   * @apiParam {String}   [description]
   * @apiParam {Number}   [ordering]
   */

  /**
   * @apiGroup  Report
   * @apiVersion 4.0.0
   * @api {post} /v1/reports  Create new  report
   * @apiDescription Create new report
   * @apiUse authRequest
   * @apiUse reportRequest
   * @apiPermission admin
   */
  router.post('/v1/reports', Middleware.isAuthenticated, reportCtr.create, Middleware.Response.success('report'));

  /**
   * @apiGroup  Report
   * @apiVersion 4.0.0
   * @api {put} /v1/reports/:id  Update a report
   * @apiDescription Update a report
   * @apiUse authRequest
   * @apiParam {String}   id        Report id
   * @apiUse reportRequest
   * @apiPermission admin
   */
  router.put('/v1/reports/:id', Middleware.hasRole('admin'), reportCtr.findOne, reportCtr.update, Middleware.Response.success('update'));

  /**
   * @apiGroup  Report
   * @apiVersion 4.0.0
   * @api {delete} /v1/reports/:id Remove a report
   * @apiDescription Remove a report
   * @apiUse authRequest
   * @apiParam {String}   id        Report id
   * @apiPermission admin
   */
  router.delete('/v1/reports/:id', Middleware.hasRole('admin'), reportCtr.findOne, reportCtr.remove, Middleware.Response.success('remove'));

  /**
   * @apiGroup  Report
   * @apiVersion 4.0.0
   * @api {get} /v1/reports/:id Get report details
   * @apiDescription Get report details
   * @apiParam {String}   id        Report id
   * @apiPermission all
   */
  router.get('/v1/reports/:id', Middleware.hasRole('admin'), reportCtr.findOne, Middleware.Response.success('report'));

  /**
   * @apiGroup  Report
   * @apiVersion 4.0.0
   * @api {get} /v1/reports?:name&:alias  Get list reports
   * @apiDescription Get list reports
   * @apiParam {String}   [name]      report name
   * @apiParam {String}   [alias]     report alias
   * @apiPermission all
   */
  router.get('/v1/reports', Middleware.hasRole('admin'), reportCtr.list, Middleware.Response.success('list'));
};
