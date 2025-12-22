const controller = require('../controllers/lecture-media.controller');

module.exports = router => {
  /**
   * @apiDefine lectureMediaRequest
   * @apiParam {String}   lectureId        Lecture id
   * @apiParam {String}   hashLecture     random string
   * @apiParam {String}   mediaId  file Id
   * @apiParam {Number}   totalLength     total duration for read file pdf
   * @apiParam {String}   mediaType     Media ordering
   * @apiParam {Number}   ordering Lecture ordering
   */

  /**
   * @apiDefine lectureMediaResponse
   * @apiSuccessExample {json} Response-Success
   * {
   *    "code": 200,
   *    "message": "OK",
   *    "data": {
   *        "_id": "5b99da5989b54c53851fa66c",
   *        "lectureId": "5b99da5989b54c53851fa66",
   *        "mediaId": "5b99da5989b54c53851fa66",
   *        "media": {},
   *        "createdAt": "2018-09-13T03:32:41.715Z",
   *        "updatedAt": "2018-09-13T03:32:41.715Z",
   *        "__v": 0,
   *    },
   *    "error": false
   * }
   */

  /**
   * @apiGroup Course Lecture Media
   * @apiVersion 4.0.0
   * @api {get} /v1/lecture-medias?lectureId=XXXX Listing lectures
   * @apiQuery {String}   sectionId Required this param when query lecture
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
   *               "mediaId": "XXXXXXXX"
   *               "media": "{}"
   *            }
   *          ]
   *     },
   *     "error": false
   *  }
   * @apiPermission all
   */
  router.get('/v1/lecture-medias', Middleware.loadUser, controller.list, Middleware.Response.success('list'));

  /**
   * @apiGroup Course Lecture Media
   * @apiVersion 4.0.0
   * @api {post} /v1/lecture-medias  Create new lecture media
   * @apiDescription Create new lecture media
   * @apiUse authRequest
   * @apiUse lectureMediaRequest
   * @apiUse lectureMediaResponse
   * @apiPermission admin, tutor
   */
  router.post('/v1/lecture-medias', Middleware.isAuthenticated, controller.create, Middleware.Response.success('create'));

  /**
   * @apiGroup Course Lecture Media
   * @apiVersion 4.0.0
   * @api {put} /v1/lecture-medias/:id  Update a lecture media
   * @apiDescription Update a lecture
   * @apiUse authRequest
   * @apiParam {String}   id        lecture id
   * @apiUse lectureMediaRequest
   * @apiUse lectureMediaResponse
   * @apiPermission admin, tutor
   */
  router.put('/v1/lecture-medias/:id', Middleware.isAuthenticated, controller.findOne, controller.update, Middleware.Response.success('update'));

  /**
   * @apiGroup Course Lecture Media
   * @apiVersion 4.0.0
   * @api {delete} /v1/lecture-medias/:id Delete a lecture
   * @apiParam {String}   id media Id
   * @apiSuccessExample {json} Success-Response:
   *  {
   *      "code": 200,
   *       "message": "OK",
   *      "data": {
   *           "message": 'Media is deleted'
   *       },
   *       "error": false
   *  }
   * @apiPermission admin, tutor
   */
  router.delete('/v1/lecture-medias/:id', Middleware.isAuthenticated, controller.findOne, controller.remove, Middleware.Response.success('remove'));
};
