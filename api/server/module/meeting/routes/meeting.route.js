const meetingController = require('../controllers/meeting.controller');

module.exports = router => {
  /**
   * @apiGroup Meeting
   * @apiVersion 4.0.0
   * @api {post} /v1/meeting/start/:appointmentId Start Meeting
   * @apiPermission tutor
   *
   * @apiParam (params) {String} appointmentId ID of the appointment to start the meeting
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "signature": {
   *             "platform": "...",
   *             "zoomus": {
   *                 "url": "...",
   *                 "signature": "...",
   *                 "meetingNumber": "...",
   *                 "password": "..."
   *             },
   *             "lessonspace": {
   *                 "url": "..."
   *             }
   *         }
   *     },
   *     "error": false
   *  }
   */

  router.post(
    '/v1/meeting/start/:appointmentId',
    Middleware.isAuthenticated,
    meetingController.startMeeting,
    Middleware.Response.success('signature')
  );

  /**
   * @apiGroup Meeting
   * @apiVersion 4.0.0
   * @api {post} /v1/meeting/join/:appointmentId Join Meeting
   * @apiPermission authenticated user
   *
   * @apiParam (params) {String} appointmentId ID of the appointment to join the meeting
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "signature": {
   *             "platform": "...",
   *             "zoomus": {
   *                 "url": "...",
   *                 "signature": "...",
   *                 "meetingNumber": "...",
   *                 "password": "..."
   *             },
   *             "lessonspace": {
   *                 "url": "..."
   *             }
   *         }
   *     },
   *     "error": false
   *  }
   */
  router.post('/v1/meeting/join/:appointmentId', Middleware.isAuthenticated, meetingController.joinMeeting, Middleware.Response.success('signature'));

  router.get('/v1/permission/check', Middleware.isAuthenticated, meetingController.permissionCheck, Middleware.Response.success('permission'));
};
