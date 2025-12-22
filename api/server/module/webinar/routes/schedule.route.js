const controller = require('../controllers/schedule.controller');

module.exports = router => {
  /**
   * @apiGroup Schedule
   * @apiVersion 4.0.0
   * @api {get} /v1/schedule List Schedules
   * @apiUse paginationQuery
   * @apiPermission authenticated user
   *
   * @apiParam {String} [webinarId] ID of the associated group class
   * @apiParam {String} [tutorId] ID of the tutor
   * @apiParam {String} [type] Type of the schedule
   * @apiParam {String} [hashWebinar] Hash value of the group class (optional)
   * @apiParam {Boolean} [isFree] Whether the schedule is free or not
   * @apiParam {String} [startTime] Start time filter
   * @apiParam {String} [toTime] End time filter
   *
   * @apiSuccessExample {json} Success-Response:
   * {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "count": 10,
   *         "items": [
   *             // List of schedules
   *         ]
   *     },
   *     "error": false
   * }
   */
  router.get('/v1/schedule', Middleware.loadUser, controller.list, Middleware.Response.success('list'));

  /**
   * @apiGroup Schedule
   * @apiVersion 4.0.0
   * @api {post} /v1/schedule Create Schedule
   * @apiPermission authenticated user
   *
   * @apiParam (body) {String} webinarId ID of the associated group class (optional if `type` is 'webinar')
   * @apiParam (body) {String} startTime Start time of the schedule
   * @apiParam (body) {String} toTime End time of the schedule
   * @apiParam (body) {String} type Type of the schedule (default is 'webinar')
   * @apiParam (body) {String} hashWebinar Hash value of the group class (optional)
   * @apiParam (body) {String} tutorId ID of the tutor (optional)
   * @apiParam (body) {Boolean} [isFree] Whether the schedule is free or not (default is false)
   *
   * @apiSuccessExample {json} Success-Response:
   * {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         // Created schedule data
   *     },
   *     "error": false
   * }
   */
  router.post('/v1/schedule', Middleware.isAuthenticated, controller.create, Middleware.Response.success('create'));

  /**
   * @apiGroup Schedule
   * @apiVersion 4.0.0
   * @api {put} /v1/schedule/:slotId Update Schedule
   * @apiPermission authenticated user
   *
   * @apiParam {String} slotId ID of the schedule slot to update
   * @apiParam (body) {String} webinarId ID of the associated group class (optional)
   * @apiParam (body) {String} startTime Start time of the schedule
   * @apiParam (body) {String} toTime End time of the schedule
   * @apiParam (body) {String} [status] Status of the schedule (optional)
   * @apiParam (body) {String} [type] Type of the schedule (default is 'webinar')
   * @apiParam (body) {String} [hashWebinar] Hash value of the group class (optional)
   *
   * @apiSuccessExample {json} Success-Response:
   * {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         // Updated schedule data
   *     },
   *     "error": false
   * }
   */
  router.put('/v1/schedule/:slotId', Middleware.isAuthenticated, controller.update, Middleware.Response.success('update'));

  /**
   * @apiGroup Schedule
   * @apiVersion 4.0.0
   * @api {delete} /v1/schedule/:slotId Remove Schedule
   * @apiPermission authenticated user
   *
   * @apiParam {String} slotId ID of the schedule slot to remove
   *
   * @apiSuccessExample {json} Success-Response:
   * {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "success": true
   *     },
   *     "error": false
   * }
   */
  router.delete('/v1/schedule/:slotId', Middleware.isAuthenticated, controller.remove, Middleware.Response.success('remove'));

  /**
   * @apiGroup Schedule
   * @apiVersion 4.0.0
   * @api {delete} /v1/schedule/remove-by-hash/:hash Remove Schedule by Hash
   * @apiPermission authenticated user
   *
   * @apiParam {String} hash Hash value of the schedule to remove
   *
   * @apiSuccessExample {json} Success-Response:
   * {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         // Success message or data
   *     },
   *     "error": false
   * }
   */
  router.delete('/v1/schedule/remove-by-hash/:hash', Middleware.isAuthenticated, controller.removeByHash, Middleware.Response.success('removeHash'));

  /**
   * @apiGroup Schedule
   * @apiVersion 4.0.0
   * @api {post} /v1/schedule/check-by-hash/:hash Check Schedule by Hash
   * @apiPermission authenticated user
   *
   * @apiParam {String} hash Hash value of the schedule to check
   *
   * @apiSuccessExample {json} Success-Response:
   * {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "success": true // or false
   *     },
   *     "error": false
   * }
   */
  router.post('/v1/schedule/check-by-hash/:hash', Middleware.isAuthenticated, controller.checkByHash, Middleware.Response.success('checkHash'));

  /**
   * @apiGroup Schedule
   * @apiVersion 4.0.0
   * @api {post} /v1/schedule/check-by-webinar/:webinarId Check Schedule by group class
   * @apiPermission authenticated user
   *
   * @apiParam {String} webinarId ID of the associated group class
   *
   * @apiSuccessExample {json} Success-Response:
   * {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "success": true // or false
   *     },
   *     "error": false
   * }
   */
  router.post(
    '/v1/schedule/check-by-webinar/:webinarId',
    Middleware.isAuthenticated,
    controller.checkByWebinar,
    Middleware.Response.success('checkByWebinar')
  );
};
