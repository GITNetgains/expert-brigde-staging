const controller = require('../controllers/lecture.controller');

module.exports = router => {
  /**
   * @apiDefine lectureRequest
   * @apiParam {String}   title        Lecture name
   * @apiParam {String}   sectionId     Section Id
   * @apiParam {String}   description  Lecture description
   * @apiParam {Number}   ordering     Lecture ordering
   * @apiParam {Number}   totalLength     Lecture ordering
   * @apiParam {String}   mediaType  Media type
   * @apiParam {Boolean}   preview Preview or private
   * @apiParam {String} mediaId Media Id
   */

  /**
   * @apiDefine lectureResponse
   * @apiSuccessExample {json} Response-Success
   * {
   *    "code": 200,
   *    "message": "OK",
   *    "data": {
   *        "_id": "5b99da5989b54c53851fa66c",
   *        "title": "Lecture name",
   *        "description": "",
   *        "sectionId": "5b99da5989b54c53851fa66",
   *        "section": {}
   *        "ordering": 0,
   *        "totalLength": 0,
   *        "mediaType": "video",
   *        "preview": true,
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
   * @apiGroup Course Lecture
   * @apiVersion 4.0.0
   * @api {get} /v1/lectures?sectionId=XXXX Listing lectures
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
   *               "title": ""
   *               "sectionId": "..."
   *            }
   *          ]
   *     },
   *     "error": false
   *  }
   * @apiPermission all
   */
  router.get('/v1/lectures', Middleware.loadUser, controller.list, Middleware.Response.success('list'));

  /**
   * @apiGroup Course Lecture
   * @apiVersion 4.0.0
   * @api {get} /v1/lectures/:id Details lecture
   * @apiParam {String}   id lecture Id
   * @apiUse authRequest
   * @apiUse lectureResponse
   * @apiPermission all
   */
  router.get('/v1/lectures/:id', Middleware.loadUser, controller.findOne, Middleware.Response.success('lecture'));
  /**
   * @apiGroup Course Lecture
   * @apiVersion 4.0.0
   * @api {post} /v1/lectures  Create new lecture
   * @apiDescription Create new lecture
   * @apiUse authRequest
   * @apiUse lectureRequest
   * @apiUse lectureResponse
   * @apiPermission tutor
   */
  router.post('/v1/lectures', Middleware.isAuthenticated, controller.create, Middleware.Response.success('create'));

  /**
   * @apiGroup Course Lecture
   * @apiVersion 4.0.0
   * @api {put} /v1/lectures/:id  Update a lecture
   * @apiDescription Update a lecture
   * @apiUse authRequest
   * @apiParam {String}   id        lecture id
   * @apiUse lectureRequest
   * @apiUse lectureResponse
   * @apiPermission tutor
   */
  router.put('/v1/lectures/:id', Middleware.isAuthenticated, controller.findOne, controller.update, Middleware.Response.success('update'));

  /**
   * @apiGroup Course Lecture
   * @apiVersion 4.0.0
   * @api {delete} /v1/lectures/:id Delete a lecture
   * @apiParam {String}   id lecture Id
   * @apiSuccessExample {json} Success-Response:
   *  {
   *      "code": 200,
   *       "message": "OK",
   *      "data": {
   *           "message": 'Lecture is deleted'
   *       },
   *       "error": false
   *  }
   * @apiPermission admin, tutor
   */
  router.delete('/v1/lectures/:id', Middleware.isAuthenticated, controller.findOne, controller.remove, Middleware.Response.success('remove'));
};
