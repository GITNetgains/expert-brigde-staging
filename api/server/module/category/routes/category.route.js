const categoryCtr = require('../controllers/category.controller');

module.exports = router => {
  /**
   * @apiGroup Category
   * @apiVersion 4.0.0
   * @api {post} /v1/categories Create Category
   * @apiPermission admin
   *
   * @apiParam (body) {String} name Name of the category
   * @apiParam (body) {String} [alias] Alias of the category
   * @apiParam (body) {String} [description] Description of the category
   * @apiParam (body) {Number} [ordering] Ordering of the category
   * @apiParam (body) {String} imageId ID of the image associated with the category
   * @apiParam (body) {Boolean} [isActive] Whether the category is active or not
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "_id": "...",
   *         "name": "...",
   *         "alias": "...",
   *         "description": "...",
   *         "ordering": "...",
   *         "imageId": "...",
   *         "isActive": "...",
   *         // other category fields
   *     },
   *     "error": false
   *  }
   */
  router.post('/v1/categories', Middleware.hasRole('admin'), categoryCtr.create, Middleware.Response.success('category'));

  /**
   * @apiGroup Category
   * @apiVersion 4.0.0
   * @api {put} /v1/categories/:id Update Category
   * @apiPermission admin
   *
   * @apiParam (params) {String} id ID of the category to update
   * @apiParam (body) {String} name New name of the category
   * @apiParam (body) {String} [alias] New alias of the category
   * @apiParam (body) {String} [description] New description of the category
   * @apiParam (body) {Number} [ordering] New ordering of the category
   * @apiParam (body) {String} imageId ID of the new image associated with the category
   * @apiParam (body) {Boolean} [isActive] Whether the category is active or not
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "_id": "...",
   *         "name": "...",
   *         "alias": "...",
   *         "description": "...",
   *         "ordering": "...",
   *         "imageId": "...",
   *         "isActive": "...",
   *         // other category fields
   *     },
   *     "error": false
   *  }
   */
  router.put('/v1/categories/:id', Middleware.hasRole('admin'), categoryCtr.findOne, categoryCtr.update, Middleware.Response.success('update'));

  /**
   * @apiGroup Category
   * @apiVersion 4.0.0
   * @api {delete} /v1/categories/:id Delete Category
   * @apiPermission admin
   *
   * @apiParam (params) {String} id ID of the category to delete
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "message": "Category is deleted"
   *     },
   *     "error": false
   *  }
   */
  router.delete('/v1/categories/:id', Middleware.hasRole('admin'), categoryCtr.findOne, categoryCtr.remove, Middleware.Response.success('remove'));
  /**
   * @apiGroup Category
   * @apiVersion 4.0.0
   * @api {get} /v1/categories/:id Get Category
   * @apiPermission authenticated user
   *
   * @apiParam (params) {String} id ID of the category to get
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "_id": "...",
   *         "name": "...",
   *         "alias": "...",
   *         "description": "...",
   *         "ordering": "...",
   *         "imageId": "...",
   *         "isActive": "...",
   *         // other category fields
   *     },
   *     "error": false
   *  }
   */

  router.get('/v1/categories/:id', Middleware.isAuthenticated, categoryCtr.findOne, Middleware.Response.success('category'));

  /**
   * @apiGroup Category
   * @apiVersion 4.0.0
   * @api {get} /v1/categories List Categories
   * @apiPermission all
   * @apiUse paginationQuery
   *
   * @apiParam {String} [name] Name of the category
   * @apiParam {String} [alias] Alias of the category
   * @apiParam {String} [description] Description of the category
   * @apiParam {Boolean} [isActive] Whether the category is active or not
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
   *                 "alias": "...",
   *                 "description": "...",
   *                 "ordering": "...",
   *                 "imageId": "...",
   *                 "isActive": "...",
   *                 // other category fields
   *             },
   *             // more categories
   *         ]
   *     },
   *     "error": false
   *  }
   */

  router.get('/v1/categories', categoryCtr.list, Middleware.Response.success('list'));
};
