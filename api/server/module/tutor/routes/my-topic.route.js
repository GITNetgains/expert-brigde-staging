const topicController = require('../controllers/my-topic.controller');

module.exports = router => {
  /**
   * @apiGroup My Topics
   * @apiVersion 4.0.0
   * @api {post} /v1/my-topic Create a My Topic
   * @apiPermission authenticated user
   *
   * @apiParam {String} originalTopicId ID of the original topic (required).
   * @apiParam {Boolean} [isActive] Whether the my topic is active (optional).
   * @apiParam {String} mySubjectId ID of the associated subject (required).
   * @apiParam {String} myCategoryId ID of the associated category (required).
   * @apiParam {Number} price Price for the my topic (required).
   * @apiParam {String} [tutorId] ID of the tutor (optional).
   *
   * @apiSuccess {Object} topic Created my topic.
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *             "_id": "5f7f0dd4ae6d1e1001cdd998",
   *             "originalTopicId": "5f7f0dd4ae6d1e1001cdd999",
   *             "isActive": true,
   *             "mySubjectId": "5f7f0dd4ae6d1e1001cdd99a",
   *             "myCategoryId": "5f7f0dd4ae6d1e1001cdd99b",
   *             "price": 20,
   *             "tutorId": "5f7f0dd4ae6d1e1001cdd99c"
   *     },
   *     "error": false
   *  }
   */
  router.post('/v1/my-topic', Middleware.isAuthenticated, topicController.create, Middleware.Response.success('topic'));

  /**
   * @apiGroup My Topics
   * @apiVersion 4.0.0
   * @api {put} /v1/my-topic/:id Update a My Topic
   * @apiPermission authenticated user
   *
   * @apiParam {String} id ID of the my topic to update.
   * @apiParam {String} originalTopicId ID of the original topic (required).
   * @apiParam {Boolean} [isActive] Whether the my topic is active (optional).
   * @apiParam {String} mySubjectId ID of the associated subject (required).
   * @apiParam {String} myCategoryId ID of the associated category (required).
   * @apiParam {Number} price Price for the my topic (required).
   * @apiParam {String} [tutorId] ID of the tutor (optional).
   *
   * @apiSuccess {Object} update Updated my topic.
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *             "_id": "5f7f0dd4ae6d1e1001cdd998",
   *             "originalTopicId": "5f7f0dd4ae6d1e1001cdd999",
   *             "isActive": true,
   *             "mySubjectId": "5f7f0dd4ae6d1e1001cdd99a",
   *             "myCategoryId": "5f7f0dd4ae6d1e1001cdd99b",
   *             "price": 20,
   *             "tutorId": "5f7f0dd4ae6d1e1001cdd99c"
   *     },
   *     "error": false
   *  }
   */
  router.put('/v1/my-topic/:id', Middleware.isAuthenticated, topicController.findOne, topicController.update, Middleware.Response.success('update'));

  /**
   * @apiGroup My Topics
   * @apiVersion 4.0.0
   * @api {delete} /v1/my-topic/:id Delete a My Topic
   * @apiPermission authenticated user
   *
   * @apiParam {String} id ID of the my topic to delete.
   *
   * @apiSuccess {Object} remove Removal response.
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *             "success": true,
   *             "message": "My Topic is deleted"
   *     },
   *     "error": false
   *  }
   */
  router.delete(
    '/v1/my-topic/:id',
    Middleware.isAuthenticated,
    topicController.findOne,
    topicController.remove,
    Middleware.Response.success('remove')
  );

  /**
   * @apiGroup My Topics
   * @apiVersion 4.0.0
   * @api {get} /v1/my-topic/:id Get a My Topic by ID
   * @apiPermission authenticated user
   *
   * @apiParam {String} id ID of the my topic to retrieve.
   *
   * @apiSuccess {Object} topic Retrieved my topic.
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *             "_id": "5f7f0dd4ae6d1e1001cdd998",
   *             "originalTopicId": "5f7f0dd4ae6d1e1001cdd999",
   *             "isActive": true,
   *             "mySubjectId": "5f7f0dd4ae6d1e1001cdd99a",
   *             "myCategoryId": "5f7f0dd4ae6d1e1001cdd99b",
   *             "price": 20,
   *             "tutorId": "5f7f0dd4ae6d1e1001cdd99c"
   *     },
   *     "error": false
   *  }
   */
  router.get('/v1/my-topic/:id', Middleware.isAuthenticated, topicController.findOne, Middleware.Response.success('topic'));

  /**
   * @apiGroup My Topics
   * @apiVersion 4.0.0
   * @api {get} /v1/my-topics Get a List of My Topics
   * @apiUse paginationQuery
   * @apiPermission authenticated user
   *
   * @apiParam {String} [tutorId] ID of the tutor (optional).
   * @apiParam {String} [mySubjectIds] Comma-separated list of my subject IDs (optional).
   * @apiParam {String} [text] Search text for name or alias (optional).
   * @apiParam {String} [myCategoryId] Filter by my category ID (optional).
   * @apiParam {Boolean} [isActive] Filter by whether the my topic is active (optional).
   *
   * @apiSuccess {Object} list List of my topics and pagination info.
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *             "count": 3,
   *             "items": [
   *                 {
   *                     "_id": "5f7f0dd4ae6d1e1001cdd998",
   *                     "originalTopicId": "5f7f0dd4ae6d1e1001cdd999",
   *                     "isActive": true,
   *                     "mySubjectId": "5f7f0dd4ae6d1e1001cdd99a",
   *                     "myCategoryId": "5f7f0dd4ae6d1e1001cdd99b",
   *                     "price": 20,
   *                     "tutorId": "5f7f0dd4ae6d1e1001cdd99c"
   *                 }
   *             ]
   *     },
   *     "error": false
   *  }
   */
  router.get('/v1/my-topics', topicController.list, Middleware.Response.success('list'));

  /**
   * @apiGroup My Topics
   * @apiVersion 4.0.0
   * @api {get} /v1/my-topics/me Get My Topics for the Currently Authenticated User
   * @apiPermission authenticated user
   * @apiUse paginationQuery
   *
   * @apiParam {String} [text] Search text for name or alias (optional).
   * @apiParam {String} [myCategoryId] Filter by my category ID (optional).
   * @apiParam {String} [mySubjectId] Filter by my subject ID (optional).
   *
   * @apiSuccess {Object} listOfMe List of my topics for the authenticated user and pagination info.
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *             "count": 3,
   *             "items": [
   *                 {
   *                     "_id": "5f7f0dd4ae6d1e1001cdd998",
   *                     "originalTopicId": "5f7f0dd4ae6d1e1001cdd999",
   *                     "isActive": true,
   *                     "mySubjectId": "5f7f0dd4ae6d1e1001cdd99a",
   *                     "myCategoryId": "5f7f0dd4ae6d1e1001cdd99b",
   *                     "price": 20,
   *                     "tutorId": "5f7f0dd4ae6d1e1001cdd99c"
   *                 }
   *             ]
   *     },
   *     "error": false
   *  }
   */
  router.get('/v1/my-topics/me', Middleware.isAuthenticated, topicController.listOfMe, Middleware.Response.success('listOfMe'));

  /**
   * @apiGroup My Topics
   * @apiVersion 4.0.0
   * @api {put} /v1/my-topic/:id/change-status Change active status
   * @apiPermission authenticated user
   *
   * @apiParam {String} id ID of the my topic to update.
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *           "success": true
   *     },
   *     "error": false
   *  }
   */
  router.put(
    '/v1/my-topic/:id/change-status',
    Middleware.isAuthenticated,
    topicController.findOne,
    topicController.changeStatus,
    Middleware.Response.success('changeStatus')
  );
};
