const controller = require('../controllers/section.controller');

module.exports = router => {
  /**
   * @apiDefine sectionRequest
   * @apiParam {String}   title        Section name
   * @apiParam {String}   courseId     Course Id
   * @apiParam {String}   description  Section description
   * @apiParam {Number}   ordering     Section ordering
   */

  /**
   * @apiDefine sectionResponse
   * @apiSuccessExample {json} Response-Success
   * {
   *    "code": 200,
   *    "message": "OK",
   *    "data": {
   *        "_id": "5b99da5989b54c53851fa66c",
   *        "title": "Section name",
   *        "description": "",
   *        "courseId": "5b99da5989b54c53851fa66",
   *        "course": {}
   *        "lectures": [],
   *        "lectureIds": ['5b99da5989b54c53851fa66', '5b99da5989b54c53851fa66sdef'],
   *        "ordering": 0,
   *        "totalLecture": 0,
   *        "totalLength": 0,
   *        "createdAt": "2018-09-13T03:32:41.715Z",
   *        "updatedAt": "2018-09-13T03:32:41.715Z",
   *        "__v": 0,
   *    },
   *    "error": false
   * }
   */

  /**
   * @apiGroup Course Section
   * @apiVersion 4.0.0
   * @api {get} /v1/sections?courseId=XXXX Listing section
   * @apiQuery {String}   courseId Required this param when query section
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
   *               "courseId": "..."
   *            }
   *          ]
   *     },
   *     "error": false
   *  }
   * @apiPermission all
   */
  router.get('/v1/sections', Middleware.loadUser, controller.list, Middleware.Response.success('list'));

  /**
   * @apiGroup Course Section
   * @apiVersion 4.0.0
   * @api {get} /v1/sections/:id Details section
   * @apiParam {String}   id section Id
   * @apiUse authRequest
   * @apiUse sectionResponse
   * @apiPermission all
   */
  router.get('/v1/sections/:id', Middleware.loadUser, controller.findOne, Middleware.Response.success('section'));

  /**
   * @apiGroup Course Section
   * @apiVersion 4.0.0
   * @api {post} /v1/sections  Create new section
   * @apiDescription Create new section
   * @apiUse authRequest
   * @apiUse sectionRequest
   * @apiUse sectionResponse
   * @apiPermission admin,tutor
   */
  router.post('/v1/sections', Middleware.isAuthenticated, controller.create, Middleware.Response.success('create'));

  /**
   * @apiGroup Course Section
   * @apiVersion 4.0.0
   * @api {put} /v1/sections/:id  Update a section
   * @apiDescription Update a section
   * @apiUse authRequest
   * @apiParam {String}   id        section id
   * @apiUse sectionRequest
   * @apiUse sectionResponse
   * @apiPermission admin,tutor
   */
  router.put('/v1/sections/:id', Middleware.isAuthenticated, controller.findOne, controller.update, Middleware.Response.success('update'));

  /**
   * @apiGroup Course Section
   * @apiVersion 4.0.0
   * @api {delete} /v1/sections/:id Delete a section
   * @apiParam {String}   id section Id
   * @apiSuccessExample {json} Success-Response:
   *  {
   *      "code": 200,
   *       "message": "OK",
   *      "data": {
   *           "message": 'Section is deleted'
   *       },
   *       "error": false
   *  }
   * @apiPermission admin, tutor
   */
  router.delete('/v1/sections/:id', Middleware.isAuthenticated, controller.findOne, controller.remove, Middleware.Response.success('remove'));
};
