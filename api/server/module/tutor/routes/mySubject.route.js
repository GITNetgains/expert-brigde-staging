const subjectController = require('../controllers/mySubject.controller');

module.exports = router => {
  /**
   * @apiGroup My Subjects
   * @apiVersion 4.0.0
   * @api {post} /v1/my-subject Create a My Subject
   * @apiPermission authenticated user
   *
   * @apiParam {String} originalSubjectId ID of the original subject (required).
   * @apiParam {Boolean} [isActive] Whether the my subject is active (optional).
   * @apiParam {String} myCategoryId ID of the category for the my subject (required).
   * @apiParam {String} [tutorId] ID of the tutor (optional).
   *
   * @apiSuccess {Object} subject Created my subject.
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *             "_id": "5f7f0dd4ae6d1e1001cdd998",
   *             "originalSubjectId": "5f7f0dd4ae6d1e1001cdd999",
   *             "isActive": true,
   *             "myCategoryId": "5f7f0dd4ae6d1e1001cdd99a",
   *             "tutorId": "5f7f0dd4ae6d1e1001cdd99b"
   *     },
   *     "error": false
   *  }
   */
  router.post('/v1/my-subject', Middleware.isAuthenticated, subjectController.create, Middleware.Response.success('subject'));

  /**
   * @apiGroup My Subjects
   * @apiVersion 4.0.0
   * @api {put} /v1/my-subject/:id Update a My Subject
   * @apiPermission authenticated user
   *
   * @apiParam {String} id ID of the my subject to update.
   * @apiParam {String} originalSubjectId ID of the original subject (required).
   * @apiParam {Boolean} [isActive] Whether the my subject is active (optional).
   * @apiParam {String} myCategoryId ID of the category for the my subject (required).
   * @apiParam {String} [tutorId] ID of the tutor (optional).
   *
   * @apiSuccess {Object} update Updated my subject.
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *             "_id": "5f7f0dd4ae6d1e1001cdd998",
   *             "originalSubjectId": "5f7f0dd4ae6d1e1001cdd999",
   *             "isActive": true,
   *             "myCategoryId": "5f7f0dd4ae6d1e1001cdd99a",
   *             "tutorId": "5f7f0dd4ae6d1e1001cdd99b"
   *     },
   *     "error": false
   *  }
   */
  router.put(
    '/v1/my-subject/:id',
    Middleware.isAuthenticated,
    subjectController.findOne,
    subjectController.update,
    Middleware.Response.success('update')
  );

  /**
   * @apiGroup My Subjects
   * @apiVersion 4.0.0
   * @api {delete} /v1/my-subject/:id Delete a My Subject
   * @apiPermission authenticated user
   *
   * @apiParam {String} id ID of the my subject to delete.
   *
   * @apiSuccess {Object} remove Removal response.
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *             "success": true,
   *             "message": "My Subject is deleted"
   *     },
   *     "error": false
   *  }
   */
  router.delete(
    '/v1/my-subject/:id',
    Middleware.isAuthenticated,
    subjectController.findOne,
    subjectController.remove,
    Middleware.Response.success('remove')
  );

  /**
 * @apiGroup My Subjects
 * @apiVersion 4.0.0
 * @api {get} /v1/my-subjects List My Subjects
 * @apiPermission none
 *
 * @apiSuccess {Number} count Total number of my subjects.
 * @apiSuccess {Array} items List of my subjects.

 * @apiSuccessExample {json} Success-Response:
 *  {
 *     "code": 200,
 *     "message": "OK",
 *     "data": {
 *             "count": 3,
 *             "items": [
 *                 {
 *                     "_id": "5f7f0dd4ae6d1e1001cdd998",
 *                     "originalSubjectId": "5f7f0dd4ae6d1e1001cdd999",
 *                     "isActive": true,
 *                     "myCategoryId": "5f7f0dd4ae6d1e1001cdd99a",
 *                     "tutorId": "5f7f0dd4ae6d1e1001cdd99b"
 *                 },
 *                 // Other my subject objects...
 *             ]
 *     },
 *     "error": false
 *  }
 */
  router.get('/v1/my-subjects', subjectController.list, Middleware.Response.success('list'));

  /**
 * @apiGroup My Subjects
 * @apiVersion 4.0.0
 * @api {get} /v1/my-subjects/me List My Subjects of the Authenticated User
 * @apiPermission authenticated user
 *
 * @apiSuccess {Number} count Total number of my subjects for the authenticated user.
 * @apiSuccess {Array} items List of my subjects for the authenticated user.

 * @apiSuccessExample {json} Success-Response:
 *  {
 *     "code": 200,
 *     "message": "OK",
 *     "data": {
 *             "count": 3,
 *             "items": [
 *                 {
 *                     "_id": "5f7f0dd4ae6d1e1001cdd998",
 *                     "originalSubjectId": "5f7f0dd4ae6d1e1001cdd999",
 *                     "isActive": true,
 *                     "myCategoryId": "5f7f0dd4ae6d1e1001cdd99a",
 *                     "tutorId": "5f7f0dd4ae6d1e1001cdd99b"
 *                 },
 *                 // Other my subject objects for the authenticated user...
 *             ]
 *     },
 *     "error": false
 *  }
 */
  router.get('/v1/my-subjects/me', Middleware.isAuthenticated, subjectController.listOfMe, Middleware.Response.success('listOfMe'));

  /**
   * @apiGroup My Subjects
   * @apiVersion 4.0.0
   * @api {put} /v1/my-subject/:id/change-status Change active status
   * @apiPermission authenticated user
   *
   * @apiParam {String} id ID of the my subject to update.
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *            "success": true
   *     },
   *     "error": false
   *  }
   */
  router.put(
    '/v1/my-subject/:id/change-status',
    Middleware.isAuthenticated,
    subjectController.findOne,
    subjectController.changeStatus,
    Middleware.Response.success('changeStatus')
  );
};
