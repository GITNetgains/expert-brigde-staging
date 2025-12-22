const categoryController = require('../controllers/my-category.controller');

module.exports = router => {
  /**
   * @apiGroup My Categories
   * @apiVersion 4.0.0
   * @api {post} /v1/my-category Create a My Category
   * @apiPermission authenticated user
   *
   * @apiParam {String} originalCategoryId ID of the original category (required).
   * @apiParam {Boolean} [isActive] Whether the my category is active (optional).
   * @apiParam {String} [tutorId] ID of the tutor (optional).
   *
   * @apiSuccess {Object} category Created my category.
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *             "_id": "5f7f0dd4ae6d1e1001cdd998",
   *             "originalCategoryId": "5f7f0dd4ae6d1e1001cdd999",
   *             "isActive": true,
   *             "tutorId": "5f7f0dd4ae6d1e1001cdd99b"
   *     },
   *     "error": false
   *  }
   */
  router.post('/v1/my-category', Middleware.isAuthenticated, categoryController.create, Middleware.Response.success('category'));

  /**
   * @apiGroup My Categories
   * @apiVersion 4.0.0
   * @api {put} /v1/my-category/:id Update a My Category
   * @apiPermission authenticated user
   *
   * @apiParam {String} id ID of the my category to update.
   * @apiParam {String} originalCategoryId ID of the original category (required).
   * @apiParam {Boolean} [isActive] Whether the my category is active (optional).
   * @apiParam {String} [tutorId] ID of the tutor (optional).
   *
   * @apiSuccess {Object} update Updated my category.
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *             "_id": "5f7f0dd4ae6d1e1001cdd998",
   *             "originalCategoryId": "5f7f0dd4ae6d1e1001cdd999",
   *             "isActive": true,
   *             "tutorId": "5f7f0dd4ae6d1e1001cdd99b"
   *     },
   *     "error": false
   *  }
   */
  router.put(
    '/v1/my-category/:id',
    Middleware.isAuthenticated,
    categoryController.findOne,
    categoryController.update,
    Middleware.Response.success('update')
  );

  /**
   * @apiGroup My Categories
   * @apiVersion 4.0.0
   * @api {delete} /v1/my-category/:id Delete a My Category
   * @apiPermission authenticated user
   *
   * @apiParam {String} id ID of the my category to delete.
   *
   * @apiSuccess {Object} remove Removal response.
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *             "success": true,
   *             "message": "My Category is deleted"
   *     },
   *     "error": false
   *  }
   */
  router.delete(
    '/v1/my-category/:id',
    Middleware.isAuthenticated,
    categoryController.findOne,
    categoryController.remove,
    Middleware.Response.success('remove')
  );

  /**
   * @apiGroup My Categories
   * @apiVersion 4.0.0
   * @api {get} /v1/my-category/:id Get a My Category by ID
   * @apiPermission authenticated user
   *
   * @apiParam {String} id ID of the my category to retrieve.
   *
   * @apiSuccess {Object} category Retrieved my category.
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *             "_id": "5f7f0dd4ae6d1e1001cdd998",
   *             "originalCategoryId": "5f7f0dd4ae6d1e1001cdd999",
   *             "isActive": true,
   *             "tutorId": "5f7f0dd4ae6d1e1001cdd99b"
   *     },
   *     "error": false
   *  }
   */
  router.get('/v1/my-category/:id', Middleware.isAuthenticated, categoryController.findOne, Middleware.Response.success('category'));

  /**
 * @apiGroup My Categories
 * @apiVersion 4.0.0
 * @api {get} /v1/my-categories List My Categories
 * @apiPermission none
 *
 * @apiSuccess {Number} count Total number of my categories.
 * @apiSuccess {Array} items List of my categories.

 * @apiSuccessExample {json} Success-Response:
 *  {
 *     "code": 200,
 *     "message": "OK",
 *     "data": {
 *             "count": 3,
 *             "items": [
 *                 {
 *                     "_id": "5f7f0dd4ae6d1e1001cdd998",
 *                     "originalCategoryId": "5f7f0dd4ae6d1e1001cdd999",
 *                     "isActive": true,
 *                     "tutorId": "5f7f0dd4ae6d1e1001cdd99b"
 *                 },
 *                 // Other my category objects...
 *             ]
 *     },
 *     "error": false
 *  }
 */
  router.get('/v1/my-categories', categoryController.list, Middleware.Response.success('list'));
  /**
 * @apiGroup My Categories
 * @apiVersion 4.0.0
 * @api {get} /v1/my-categories/me List My Categories of the Authenticated User
 * @apiPermission authenticated user
 *
 * @apiSuccess {Number} count Total number of my categories for the authenticated user.
 * @apiSuccess {Array} items List of my categories for the authenticated user.

 * @apiSuccessExample {json} Success-Response:
 *  {
 *     "code": 200,
 *     "message": "OK",
 *     "data": {
 *             "count": 3,
 *             "items": [
 *                 {
 *                     "_id": "5f7f0dd4ae6d1e1001cdd998",
 *                     "originalCategoryId": "5f7f0dd4ae6d1e1001cdd999",
 *                     "isActive": true,
 *                     "tutorId": "5f7f0dd4ae6d1e1001cdd99b"
 *                 },
 *                 // Other my category objects for the authenticated user...
 *             ]
 *     },
 *     "error": false
 *  }
 */
  router.get('/v1/my-categories/me', Middleware.isAuthenticated, categoryController.listOfMe, Middleware.Response.success('listOfMe'));

  /**
   * @apiGroup My Categories
   * @apiVersion 4.0.0
   * @api {put} /v1/my-category/:id/change-status Change active status
   * @apiPermission authenticated user
   *
   * @apiParam {String} id ID of the my category to update.
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
    '/v1/my-category/:id/change-status',
    Middleware.isAuthenticated,
    categoryController.findOne,
    categoryController.changeStatus,
    Middleware.Response.success('changeStatus')
  );
};
