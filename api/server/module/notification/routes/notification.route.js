const notificationController = require('../controllers/notification.controller');

module.exports = router => {
  /**
   * @apiGroup Notification
   * @apiVersion 4.0.0
   * @api {get} /v1/notifications Get list
   * @apiDescription Get list notifications
   * @apiPermission Authenticated user
   */
  router.get('/v1/notifications', Middleware.isAuthenticated, notificationController.list, Middleware.Response.success('listNotifications'));

  /**
   * @apiGroup Notification
   * @apiVersion 4.0.0
   * @api {post} /v1/notification/read/:notificationId Read notification
   * @apiParam notificationId notification ID
   * @apiDescription Read notification
   * @apiPermission Authenticated user
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "success": true
   *     },
   *     "error": false
   *  }
   */
  router.post('/v1/notification/read/:notificationId', Middleware.isAuthenticated, notificationController.read, Middleware.Response.success('read'));

  /**
   * @apiGroup Notification
   * @apiVersion 4.0.0
   * @api {delete} /v1/notification/remove/:notificationId Remove notification
   * @apiParam notificationId notification ID
   * @apiDescription Delete notification
   * @apiPermission Authenticated user
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "success": true
   *     },
   *     "error": false
   *  }
   */
  router.delete(
    '/v1/notification/remove/:notificationId',
    Middleware.isAuthenticated,
    notificationController.remove,
    Middleware.Response.success('remove')
  );

  /**
   * @apiGroup Notification
   * @apiVersion 4.0.0
   * @api {post} /v1/notification/read-all Read all notifications
   * @apiDescription Read all notifications
   * @apiPermission Authenticated user
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "success": true
   *     },
   *     "error": false
   *  }
   */
  router.post('/v1/notification/read-all', Middleware.isAuthenticated, notificationController.readAll, Middleware.Response.success('readAll'));

  /**
   * @apiGroup Notification
   * @apiVersion 4.0.0
   * @api {post} /v1/notifications/count-unread Count unread
   * @apiDescription Count unread notifications
   * @apiPermission Authenticated user
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "count": 10
   *     },
   *     "error": false
   *  }
   */
  router.get(
    '/v1/notifications/count-unread',
    Middleware.isAuthenticated,
    notificationController.countUnreadNotification,
    Middleware.Response.success('count')
  );
};
