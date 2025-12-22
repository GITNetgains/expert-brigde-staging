const controller = require('../controllers/favorite.controller');

module.exports = router => {
  /**
   * @apiDefine favoriteRequest
   * @apiParam {String}   type `tutor`,`webinar`,`course`
   * @apiBody {String}   type `tutor`,`webinar`,`course`
   * @apiBody {String}   [webinarId]
   * @apiBody {String}   [tutorId]
   * @apiBody {String}   [courseId]
   */

  /**
   * @apiDefine favoriteResponse
   * @apiSuccessExample {json} Response-Success
   * {
   *    "code": 200,
   *    "message": "OK",
   *    "data": {
   *        "_id": "5b99da5989b54c53851fa66c",
   *        "createdAt": "2018-09-13T03:32:41.715Z",
   *        "updatedAt": "2018-09-13T03:32:41.715Z",
   *        "__v": 0,
   *    },
   *    "error": false
   * }
   */

  /**
   * @apiGroup Favourite
   * @apiVersion 4.0.0
   * @api {get} /v1/favorites/:type Listing favourites
   * @apiParam {String}   type `tutor`,`webinar`,`course`
   * @apiUse paginationQuery
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "count": 10,
   *         "items": [
   *            {
   *               "_id": "....",
   *            }
   *          ]
   *     },
   *     "error": false
   *  }
   * @apiPermission all
   */
  router.get('/v1/favorites/:type', Middleware.isAuthenticated, controller.list, Middleware.Response.success('list'));

  /**
   * @apiGroup Favourite
   * @apiVersion 4.0.0
   * @api {get} /v1/favorites/:type/:id Details favourite
   * @apiParam {String}   id favourite Id
   * @apiParam {String}   type target type of favourite item
   * @apiUse authRequest
   * @apiUse favoriteResponse
   * @apiPermission Authenticated user
   */
  router.get('/v1/favorites/:type/:id', Middleware.isAuthenticated, controller.findOne, Middleware.Response.success('favorite'));

  /**
   * @apiGroup Favourite
   * @apiVersion 4.0.0
   * @api {post} /v1/favorites/:type  Create new favourite
   * @apiDescription Create new favourite
   * @apiUse authRequest
   * @apiUse favoriteRequest
   * @apiUse favoriteResponse
   * @apiPermission admin, tutor
   */
  router.post('/v1/favorites/:type', Middleware.isAuthenticated, controller.favorite, Middleware.Response.success('favorite'));

  /**
   * @apiGroup Favourite
   * @apiVersion 4.0.0
   * @api {delete} /v1/favorites/:type/:id Delete favourite
   * @apiParam {String}   id favourite Id
   * @apiParam {String}   type target type of favourite item
   * @apiUse authRequest
   * @apiSuccessExample {json} Response-Success
   * {
   *    "code": 200,
   *    "message": "OK",
   *    "data": {
   *        "success": true
   *    },
   *    "error": false
   * }
   * @apiPermission Authenticated user
   */
  router.delete('/v1/favorites/:type/:id', Middleware.isAuthenticated, controller.unFavorite, Middleware.Response.success('unFavorite'));
};
