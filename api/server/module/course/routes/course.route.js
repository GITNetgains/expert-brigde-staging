const controller = require('../controllers/course.controller');

module.exports = router => {
  /**
   * @apiDefine courseRequest
   * @apiBody {String}   name        Course name
   * @apiBody {String[]} categoryIds  Course Categories - get tutor's categories
   * @apiBody {String[]} subjectIds  Course subjects - get tutor's subjects
   * @apiBody {String[]} topicIds  Course subjects - get tutor's topics
   * @apiBody {Number}   price        Course price
   * @apiBody {String}   description  Course description
   * @apiBody {String}   mainImageId  Course main image
   * @apiBody {String}   introductionVideoId  Course video introduction
   * @apiBody {String[]} goalCourse  All the end of my course,students will be able to
   * @apiBody {String[]} whyJoinCourse  Why should take this course? Who should not?
   * @apiBody {String[]} needToJoinCourse  What will students need to know or do before starting this course?
   * @apiBody {Boolean} [featured] Set the course is featured
   * @apiBody {String[]} gradeIds  Course grades
   * @apiBody {Object={"from": 1, "to": 3}} age
   */

  /**
   * @apiDefine courseResponse
   * @apiSuccessExample {json} Response-Success
   * {
   *    "code": 200,
   *    "message": "OK",
   *    "data": {
   *        "_id": "5b99da5989b54c53851fa66c",
   *        "name": "Course name",
   *        "alias": course-alias,
   *        "description": "",
   *        "course": {},
   *        "categories": [],
   *        "mainImage": {},
   *        "videoIntroduction": {},
   *        "mainImageId": "5b99da5989b54c53851fa66c",
   *        "introductionVideoId": "5b99da5989b54c53851fa66c",
   *        "price": "0000",
   *        "goalCourse": [],
   *        "whyJoinCourse": [],
   *        "needToJoinCourse": [],
   *        "createdAt": "2018-09-13T03:32:41.715Z",
   *        "updatedAt": "2018-09-13T03:32:41.715Z",
   *        "__v": 0,
   *    },
   *    "error": false
   * }
   */

  /**
   * @apiGroup Course
   * @apiVersion 4.0.0
   * @api {get} /v1/courses Listing courses
   * @apiQuery {String}   [name]
   * @apiQuery {Boolean}   [approved]
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
   *               "name": "course name"
   *            }
   *          ]
   *     },
   *     "error": false
   *  }
   * @apiPermission all
   */
  router.get('/v1/courses', Middleware.loadUser, controller.list, Middleware.Response.success('list'));

  /**
   * @apiGroup Course
   * @apiVersion 4.0.0
   * @api {get} /v1/courses/:id Details course
   * @apiParam {String}   id course Id
   * @apiUse authRequest
   * @apiUse courseResponse
   * @apiPermission all
   */
  router.get('/v1/courses/:id', Middleware.loadUser, controller.findOne, Middleware.Response.success('course'));
  /**
   * @apiGroup Course
   * @apiVersion 4.0.0
   * @api {post} /v1/courses  Create new course
   * @apiDescription Create new course
   * @apiUse authRequest
   * @apiUse courseRequest
   * @apiUse courseResponse
   * @apiPermission authenticated user
   */
  router.post('/v1/courses', Middleware.isAuthenticated, controller.create, Middleware.Response.success('create'));

  /**
   * @apiGroup Course
   * @apiVersion 4.0.0
   * @api {put} /v1/courses/:courseId  Update a course
   * @apiDescription Update a course
   * @apiUse authRequest
   * @apiParam {String}   id        course id
   * @apiUse courseRequest
   * @apiUse courseResponse
   * @apiPermission  authenticated user
   */
  router.put('/v1/courses/:id', Middleware.isAuthenticated, controller.findOne, controller.update, Middleware.Response.success('update'));

  /**
   * @apiGroup Course
   * @apiVersion 4.0.0
   * @api {delete} /v1/courses/:id Delete a course
   * @apiParam {String}   id courseId
   * @apiSuccessExample {json} Success-Response:
   *  {
   *      "code": 200,
   *       "message": "OK",
   *      "data": {
   *           "message": 'Course is deleted'
   *       },
   *       "error": false
   *  }
   * @apiPermission  authenticated user
   */
  router.delete('/v1/courses/:id', Middleware.isAuthenticated, controller.findOne, controller.remove, Middleware.Response.success('remove'));

  /**
   * @apiGroup Course
   * @apiVersion 4.0.0
   * @api {post} /v1/courses/:courseId/reject Reject
   * @apiParam {String}   courseId
   * @apiParam {String}   [reason] Reason
   * @apiSuccessExample {json} Success-Response:
   *  {
   *      "code": 200,
   *       "message": "OK",
   *      "data": {
   *           "success": true
   *       },
   *       "error": false
   *  }
   * @apiPermission admin
   */
  router.post('/v1/courses/:courseId/reject', Middleware.hasRole('admin'), controller.reject, Middleware.Response.success('reject'));

  /**
   * @apiGroup Course
   * @apiVersion 4.0.0
   * @api {post} /v1/courses/:courseId/approve Approve
   * @apiParam {String}   courseId
   * @apiSuccessExample {json} Success-Response:
   *  {
   *      "code": 200,
   *       "message": "OK",
   *      "data": {
   *           "success": true
   *       },
   *       "error": false
   *  }
   * @apiPermission admin
   */
  router.post('/v1/courses/:courseId/approve', Middleware.hasRole('admin'), controller.approve, Middleware.Response.success('approve'));

  /**
   * @apiGroup Course
   * @apiVersion 4.0.0
   * @api {get} /v1/courses/:tutorId/transaction List Course Transactions
   * @apiUse paginationQuery
   * @apiPermission authenticated user
   *
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
   *                 "transaction": "...",
   *                 "user": "...",
   *                 // other transaction fields
   *             },
   *             // more transactions
   *         ]
   *     },
   *     "error": false
   *  }
   */
  router.get('/v1/courses/:tutorId/transaction', Middleware.isAuthenticated, controller.transaction, Middleware.Response.success('transaction'));

  /**
   * @apiGroup Course
   * @apiVersion 4.0.0
   * @api {get} /v1/courses/:tutorId/transaction/:id Get Course Transaction Detail
   * @apiPermission authenticated user
   *
   * @apiParam (params) {String} tutorId ID of the tutor whose transaction to get
   * @apiParam (params) {String} id ID of the transaction to get
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "_id": "...",
   *         "transaction": "...",
   *         "user": "...",
   *         // other transaction fields
   *     },
   *     "error": false
   *  }
   */
  router.get(
    '/v1/courses/:tutorId/transaction/:id',
    Middleware.loadUser,
    controller.transactionDetail,
    Middleware.Response.success('transactionDetail')
  );

  /**
   * @apiGroup Course
   * @apiVersion 4.0.0
   * @api {get} /v1/courses/:courseId/enrolled List Enrolled Users
   * @apiUse paginationQuery
   * @apiPermission authenticated user
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
   *                 "user": "...",
   *                 // other transaction fields
   *             },
   *             // more transactions
   *         ]
   *     },
   *     "error": false
   *  }
   */
  router.get('/v1/courses/:courseId/enrolled', Middleware.loadUser, controller.enrolledUsers, Middleware.Response.success('enrolled'));

  /**
   * @apiGroup Course
   * @apiVersion 4.0.0
   * @api {post} /v1/courses/:courseId/disable Disable course
   * @apiParam {String}   courseId
   * @apiSuccessExample {json} Success-Response:
   *  {
   *      "code": 200,
   *       "message": "OK",
   *      "data": {
   *           "success": true
   *       },
   *       "error": false
   *  }
   * @apiPermission admin
   */
  router.post('/v1/courses/:courseId/disable', Middleware.hasRole('admin'), controller.disable, Middleware.Response.success('disable'));

  /**
   * @apiGroup Course
   * @apiVersion 4.0.0
   * @api {post} /v1/courses/:courseId/enable Enable course
   * @apiParam {String}   courseId
   * @apiSuccessExample {json} Success-Response:
   *  {
   *      "code": 200,
   *       "message": "OK",
   *      "data": {
   *           "success": true
   *       },
   *       "error": false
   *  }
   * @apiPermission admin
   */
  router.post('/v1/courses/:courseId/enable', Middleware.hasRole('admin'), controller.enable, Middleware.Response.success('enable'));

  /**
   * @apiGroup Course
   * @apiVersion 4.0.0
   * @api {post} /v1/courses/save-as-draff  Save as draft
   * @apiUse authRequest
   * @apiUse courseRequest
   * @apiUse courseResponse
   * @apiPermission authenticated user
   */
  router.post('/v1/courses/save-as-draff', Middleware.isAuthenticated, controller.saveAsDraff, Middleware.Response.success('draff'));
};
