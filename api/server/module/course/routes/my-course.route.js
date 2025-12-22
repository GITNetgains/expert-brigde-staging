const controller = require('../controllers/my-course.controller');

module.exports = router => {
  /**
   * @apiGroup MyCourse
   * @apiVersion 4.0.0
   * @api {get} /v1/my-courses List My Courses
   * @apiUse paginationQuery
   * @apiPermission authenticated user
   *
   * @apiParam {String} [name] Name of the my course to list
   * @apiParam {Boolean} [paid] Whether the my course is paid or not
   * @apiParam {Boolean} [isCompleted] Whether the my course is completed or not
   * @apiParam {Array} [categoryIds] Array of category IDs associated with the my course
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
   *                 "courseId": "...",
   *                 "sectionId": "...",
   *                 "title": "...",
   *                 "description": "...",
   *                 "ordering": "...",
   *                 "preview": "...",
   *                 "mediaIds": "...",
   *                 "hashLecture": "...",
   *                 "completedPercent": "...",
   *                 // other my course fields
   *             },
   *             // more my courses
   *         ]
   *     },
   *     "error": false
   *  }
   */
  router.get('/v1/my-courses', Middleware.isAuthenticated, controller.list, Middleware.Response.success('list'));

  /**
   * @apiGroup MyCourse
   * @apiVersion 4.0.0
   * @api {get} /v1/my-courses/:id Get My Course
   * @apiPermission authenticated user
   *
   * @apiParam (params) {String} id ID of the my course to get
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "_id": "...",
   *         "courseId": "...",
   *         "sectionId": "...",
   *         "title": "...",
   *         "description": "...",
   *         "ordering": "...",
   *         "preview": "...",
   *         "mediaIds": "...",
   *         "hashLecture": "...",
   *         // other my course fields
   *     },
   *     "error": false
   *  }
   */
  router.get('/v1/my-courses/:id', Middleware.isAuthenticated, controller.findOne, Middleware.Response.success('course'));

  /**
   * @apiGroup MyCourse
   * @apiVersion 4.0.0
   * @api {get} /v1/my-course/get-by-course-id/:courseId Get My Course by Course ID
   * @apiPermission authenticated user
   *
   * @apiParam (params) {String} courseId ID of the course to get
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "_id": "...",
   *         "courseId": "...",
   *         "sectionId": "...",
   *         "title": "...",
   *         "description": "...",
   *         "ordering": "...",
   *         "preview": "...",
   *         "mediaIds": "...",
   *         "hashLecture": "...",
   *         // other my course fields
   *     },
   *     "error": false
   *  }
   */
  router.get(
    '/v1/my-course/get-by-course-id/:courseId',
    Middleware.isAuthenticated,
    controller.findOneByCourseId,
    Middleware.Response.success('byCourseId')
  );

  /**
   * @apiGroup MyCourse
   * @apiVersion 4.0.0
   * @api {get} /v1/my-courses/:id/sections List My Course Sections
   * @apiUse paginationQuery
   * @apiPermission authenticated user
   *
   * @apiParam {Number} [take=10] Number of my course sections to take per page
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
   *                 "courseId": "...",
   *                 "sectionId": "...",
   *                 "title": "...",
   *                 "description": "...",
   *                 "ordering": "...",
   *                 "preview": "...",
   *                 "mediaIds": "...",
   *                 "hashLecture": "...",
   *                 // other my course section fields
   *             },
   *             // more my course sections
   *         ]
   *     },
   *     "error": false
   *  }
   */
  router.get('/v1/my-courses/:id/sections', Middleware.isAuthenticated, controller.listSection, Middleware.Response.success('sections'));

  /**
   * @apiGroup MyCourse
   * @apiVersion 4.0.0
   * @api {delete} /v1/my-courses/:id Delete My Course
   * @apiPermission authenticated user
   *
   * @apiParam (params) {String} id ID of the my course to delete
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "message": "Course is deleted"
   *     },
   *     "error": false
   *  }
   */
  router.delete('/v1/my-courses/:id', Middleware.isAuthenticated, controller.findOne, controller.remove, Middleware.Response.success('remove'));

  /**
   * @apiGroup MyCourse
   * @apiVersion 4.0.0
   * @api {put} /v1/my-courses/:id/update-progress Update My Course Progress
   * @apiPermission authenticated user
   *
   * @apiParam (params) {String} id ID of the my course to update progress
   * @apiParam (body) {String} lectureMediaId ID of the lecture media to add to completed lecture medias
   *
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
  router.put(
    '/v1/my-courses/:id/update-progress',
    Middleware.isAuthenticated,
    controller.findOne,
    controller.updateProgress,
    Middleware.Response.success('updateProgress')
  );

  /**
   * @apiGroup MyCourse
   * @apiVersion 4.0.0
   * @api {put} /v1/my-courses/:id/complete Complete My Course
   * @apiPermission authenticated user
   *
   * @apiParam (params) {String} id ID of the my course to complete
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "_id": "...",
   *         "courseId": "...",
   *         "sectionId": "...",
   *         "title": "...",
   *         "description": "...",
   *         "ordering": "...",
   *         "preview": "...",
   *         "mediaIds": "...",
   *         "hashLecture": "...",
   *         // other my course fields
   *     },
   *     "error": false
   *  }
   */
  router.put(
    '/v1/my-courses/:id/complete',
    Middleware.isAuthenticated,
    controller.findOne,
    controller.complete,
    Middleware.Response.success('complete')
  );
};
