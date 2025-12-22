const controller = require('../controllers/coupon.controller');

module.exports = router => {
  /**
   * @apiGroup Coupon
   * @apiVersion 4.0.0
   * @api {get} /v1/coupons List Coupons
   * @apiUse paginationQuery
   * @apiPermission admin
   *
   * @apiParam {String} [name] Name of the coupon
   * @apiParam {String} [webinarId] Webinar ID associated with the coupon
   * @apiParam {String} [tutorId] Tutor ID associated with the coupon
   * @apiParam {String} [targetType] Target type of the coupon
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "count": "...",
   *         "items": [
   *             {
   *                 "_id": "...",
   *                 "name": "...",
   *                 "code": "...",
   *                 "type": "...",
   *                 "value": "...",
   *                 "targetType": "...",
   *                 "webinarId": "...",
   *                 "courseId": "...",
   *                 "tutorId": "...",
   *                 "expiredDate": "...",
   *                 "active": "...",
   *                 "startTime": "...",
   *                 "limitNumberOfUse": "...",
   *                 // other coupon fields
   *             },
   *             // more coupons
   *         ]
   *     },
   *     "error": false
   *  }
   */
  router.get('/v1/coupons', Middleware.hasRole('admin'), controller.list, Middleware.Response.success('list'));

  /**
   * @apiGroup Coupon
   * @apiVersion 4.0.0
   * @api {get} /v1/coupons/:id Get Coupon
   * @apiPermission authenticated user
   *
   * @apiParam (params) {String} id ID of the coupon to get
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "_id": "...",
   *         "name": "...",
   *         "code": "...",
   *         "type": "...",
   *         "value": "...",
   *         "targetType": "...",
   *         "webinarId": "...",
   *         "courseId": "...",
   *         "tutorId": "...",
   *         "expiredDate": "...",
   *         "active": "...",
   *         "startTime": "...",
   *         "limitNumberOfUse": "...",
   *         // other coupon fields
   *     },
   *     "error": false
   *  }
   */
  router.get('/v1/coupons/:id', Middleware.isAuthenticated, controller.findOne, Middleware.Response.success('coupon'));

  /**
   * @apiGroup Coupon
   * @apiVersion 4.0.0
   * @api {post} /v1/coupons Create Coupon
   * @apiPermission authenticated user
   *
   * @apiParam (body) {String} name Name of the coupon
   * @apiParam (body) {String} code Code of the coupon
   * @apiParam (body) {String} type Type of the coupon (percent or money)
   * @apiParam (body) {Number} [value] Value of the coupon
   * @apiParam (body) {String} targetType Target type of the coupon
   * @apiParam (body) {String} [webinarId] Webinar ID associated with the coupon (required if targetType is webinar)
   * @apiParam (body) {String} [courseId] Course ID associated with the coupon (required if targetType is course)
   * @apiParam (body) {String} tutorId Tutor ID associated with the coupon
   * @apiParam (body) {String} [expiredDate] Expiration date of the coupon
   * @apiParam (body) {Boolean} [active] Whether the coupon is active or not
   * @apiParam (body) {String} startTime Start time of the coupon
   * @apiParam (body) {Number} [limitNumberOfUse] Limit number of uses of the coupon
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "_id": "...",
   *         "name": "...",
   *         "code": "...",
   *         "type": "...",
   *         "value": "...",
   *         "targetType": "...",
   *         "webinarId": "...",
   *         "courseId": "...",
   *         "tutorId": "...",
   *         "expiredDate": "...",
   *         "active": "...",
   *         "startTime": "...",
   *         "limitNumberOfUse": "...",
   *         // other coupon fields
   *     },
   *     "error": false
   *  }
   */
  router.post('/v1/coupons', Middleware.isAuthenticated, controller.create, Middleware.Response.success('create'));

  /**
   * @apiGroup Coupon
   * @apiVersion 4.0.0
   * @api {put} /v1/coupons/:id Update Coupon
   * @apiPermission authenticated user
   *
   * @apiParam (params) {String} id ID of the coupon to update
   * @apiParam (body) {String} name New name of the coupon
   * @apiParam (body) {String} code New code of the coupon
   * @apiParam (body) {String} type New type of the coupon (percent or money)
   * @apiParam (body) {Number} [value] New value of the coupon
   * @apiParam (body) {String} targetType New target type of the coupon
   * @apiParam (body) {String} [webinarId] New webinar ID associated with the coupon (required if targetType is webinar)
   * @apiParam (body) {String} [courseId] New course ID associated with the coupon (required if targetType is course)
   * @apiParam (body) {String} tutorId New tutor ID associated with the coupon
   * @apiParam (body) {String} [expiredDate] New expiration date of the coupon
   * @apiParam (body) {Boolean} [active] Whether the coupon is active or not
   * @apiParam (body) {String} startTime New start time of the coupon
   * @apiParam (body) {Number} [limitNumberOfUse] New limit number of uses of the coupon
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "_id": "...",
   *         "name": "...",
   *         "code": "...",
   *         "type": "...",
   *         "value": "...",
   *         "targetType": "...",
   *         "webinarId": "...",
   *         "courseId": "...",
   *         "tutorId": "...",
   *         "expiredDate": "...",
   *         "active": "...",
   *         "startTime": "...",
   *         "limitNumberOfUse": "...",
   *         // other coupon fields
   *     },
   *     "error": false
   *  }
   */
  router.put('/v1/coupons/:id', Middleware.isAuthenticated, controller.findOne, controller.update, Middleware.Response.success('update'));
  /**
   * @apiGroup Coupon
   * @apiVersion 4.0.0
   * @api {delete} /v1/coupons/:id Delete Coupon
   * @apiPermission authenticated user
   *
   * @apiParam (params) {String} id ID of the coupon to delete
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "message": "Coupon is deleted"
   *     },
   *     "error": false
   *  }
   */
  router.delete('/v1/coupons/:id', Middleware.isAuthenticated, controller.findOne, controller.remove, Middleware.Response.success('remove'));

  /**
   * @apiGroup Coupon
   * @apiVersion 4.0.0
   * @api {get} /v1/coupons/check-used-coupon/:couponId Check if Coupon is Used
   * @apiPermission authenticated user
   *
   * @apiParam (params) {String} couponId ID of the coupon to check
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "used": true/false
   *     },
   *     "error": false
   *  }
   */
  router.get(
    '/v1/coupons/check-used-coupon/:couponId',
    Middleware.isAuthenticated,
    controller.isUsedCoupon,
    Middleware.Response.success('isUsedCoupon')
  );
  /**
   * @apiGroup Coupon
   * @apiVersion 4.0.0
   * @api {get} /v1/coupon/apply-coupon Apply Coupon
   * @apiPermission authenticated user
   *
   * @apiParam {String} code Code of the coupon
   * @apiParam {String} targetType Target type of the coupon
   * @apiParam {String} [webinarId] Webinar ID associated with the coupon (required if targetType is webinar)
   * @apiParam {String} [courseId] Course ID associated with the coupon (required if targetType is course)
   * @apiParam {String} [tutorId] Tutor ID associated with the coupon (required if targetType is subject)
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "canApply": true/false
   *     },
   *     "error": false
   *  }
   */
  router.post('/v1/coupon/apply-coupon', Middleware.isAuthenticated, controller.applyCoupon, Middleware.Response.success('apply'));

  /**
   * @apiGroup Coupon
   * @apiVersion 4.0.0
   * @api {get} /v1/coupon/current Get Current Coupon
   * @apiPermission authenticated user
   *
   * @apiParam {String} [webinarId] Webinar ID associated with the coupon
   * @apiParam {String} [courseId] Course ID associated with the coupon
   * @apiParam {String} [tutorId] Tutor ID associated with the coupon
   * @apiParam {String} [targetType] Target type of the coupon
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "_id": "...",
   *         "name": "...",
   *         "code": "...",
   *         "type": "...",
   *         "value": "...",
   *         "targetType": "...",
   *         "webinarId": "...",
   *         "courseId": "...",
   *         "tutorId": "...",
   *         "expiredDate": "...",
   *         "active": "...",
   *         "startTime": "...",
   *         "limitNumberOfUse": "...",
   *         // other coupon fields
   *     },
   *     "error": false
   *  }
   */
  router.get('/v1/coupon/current', Middleware.isAuthenticated, controller.getCurrentCoupon, Middleware.Response.success('current'));
};
