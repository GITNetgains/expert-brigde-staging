const controller = require('../controllers/webinar.controller');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const documentDir = 'public/documents/';

if (!fs.existsSync(documentDir)) {
  mkdirp.sync(documentDir);
}

const uploadDocument = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, documentDir);
    },
    filename(req, file, cb) {
      const ext = Helper.String.getExt(file.originalname);
      const nameWithoutExt = Helper.String.createAlias(Helper.String.getFileName(file.originalname, true));
      let fileName = `${nameWithoutExt}${ext}`;
      if (fs.existsSync(path.resolve(documentDir, fileName))) {
        fileName = `${nameWithoutExt}-${Helper.String.randomString(5)}${ext}`;
      }

      cb(null, fileName);
    },
    fileSize: (process.env.MAX_PHOTO_SIZE || 10) * 1024 * 1024 // 10MB limit
  })
});
module.exports = router => {
  /**
   * @apiGroup Group class
   * @apiVersion 4.0.0
   * @api {get} /v1/webinars List group classes
   * @apiUse paginationQuery
   * @apiPermission all
   *
   * @apiParam  {String} [tutorName] Filter by tutor name (optional)
   * @apiParam  {String} [categoryIds] Filter by category IDs (optional)
   * @apiParam  {String} [subjectIds] Filter by subject IDs (optional)
   * @apiParam  {String} [topicIds] Filter by topic IDs (optional)
   * @apiParam  {Boolean} [isOpen] Filter by open status (optional)
   * @apiParam  {Boolean} [isAvailable] Filter by availability (optional)
   * @apiParam  {String} [startTime] Filter by start time (optional)
   * @apiParam  {String} [toTime] Filter by end time (optional)
   * @apiParam  {Object} [age] Filter by age range (optional)
   *
   * @apiSuccessExample {json} Success-Response:
   * {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "count": "...",
   *         "items": [
   *             {
   *                 "_id": "...",
   *                 "name": "...",
   *                 "maximumStrength": "...",
   *                 "categoryIds": ["..."],
   *                 "mediaIds": ["..."],
   *                 "isOpen": "...",
   *                 "price": "...",
   *                 "description": "...",
   *                 "mainImageId": "...",
   *                 "hashWebinar": "...",
   *                 "featured": "...",
   *                 "alias": "...",
   *                 "tutorId": "...",
   *                 "isFree": "...",
   *                 "gradeIds": ["..."],
   *                 "subjectIds": ["..."],
   *                 "topicIds": ["..."],
   *                 "age": {
   *                     "from": "...",
   *                     "to": "..."
   *                 }
   *                 // other Group class fields
   *             },
   *             // more Group class items
   *         ]
   *     },
   *     "error": false
   * }
   */
  router.get('/v1/webinars', Middleware.loadUser, controller.list, Middleware.Response.success('list'));

  /**
   * @apiGroup Group class
   * @apiVersion 4.0.0
   * @api {get} /v1/webinars/:id Find One group class
   * @apiPermission all
   *
   * @apiParam (params) {String} id ID of the  group class to find
   *
   * @apiSuccessExample {json} Success-Response:
   * {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "_id": "...",
   *         "name": "...",
   *         "maximumStrength": "...",
   *         "categoryIds": ["..."],
   *         "mediaIds": ["..."],
   *         "isOpen": "...",
   *         "price": "...",
   *         "description": "...",
   *         "mainImageId": "...",
   *         "hashWebinar": "...",
   *         "featured": "...",
   *         "alias": "...",
   *         "tutorId": "...",
   *         "isFree": "...",
   *         "gradeIds": ["..."],
   *         "subjectIds": ["..."],
   *         "topicIds": ["..."],
   *         "age": {
   *             "from": "...",
   *             "to": "..."
   *         }
   *         // other group class fields
   *     },
   *     "error": false
   * }
   */
  router.get('/v1/webinars/:id', Middleware.loadUser, controller.findOne, Middleware.Response.success('webinar'));

  /**
   * @apiGroup Group class
   * @apiVersion 4.0.0
   * @api {post} /v1/webinars Create Group class
   * @apiPermission authenticated user
   *
   * @apiParam (body) {String} name Name of the Group class
   * @apiParam (body) {Number} maximumStrength Maximum strength of the Group class (must be at least 1)
   * @apiParam (body) {Array} [categoryIds] Array of category IDs
   * @apiParam (body) {Array} [mediaIds] Array of media IDs (optional)
   * @apiParam (body) {Boolean} [isOpen] Indicates if the Group class is open (optional)
   * @apiParam (body) {Number} price Price of the Group class
   * @apiParam (body) {String} [description] Description of the Group class (optional)
   * @apiParam (body) {String} mainImageId ID of the main image
   * @apiParam (body) {String} [hashWebinar] Hash of the webinaGroup classr (optional)
   * @apiParam (body) {Boolean} [featured] Indicates if the Group class is featured (optional)
   * @apiParam (body) {String} [alias] Alias of the Group class (optional)
   * @apiParam (body) {String} [tutorId] ID of the tutor (optional)
   * @apiParam (body) {Boolean} [isFree] Indicates if the Group class is free (optional)
   * @apiParam (body) {Array} [gradeIds] Array of grade IDs
   * @apiParam (body) {Array} subjectIds Array of subject IDs (at least 1 required)
   * @apiParam (body) {Array} topicIds Array of topic IDs (at least 1 required)
   * @apiParam (body) {Object} age Age range object with 'from' and 'to' properties
   *
   * @apiSuccessExample {json} Success-Response:
   * {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "_id": "...",
   *         "name": "...",
   *         "maximumStrength": "...",
   *         "categoryIds": ["..."],
   *         "mediaIds": ["..."],
   *         "isOpen": "...",
   *         "price": "...",
   *         "description": "...",
   *         "mainImageId": "...",
   *         "hashWebinar": "...",
   *         "featured": "...",
   *         "alias": "...",
   *         "tutorId": "...",
   *         "isFree": "...",
   *         "gradeIds": ["..."],
   *         "subjectIds": ["..."],
   *         "topicIds": ["..."],
   *         "age": {
   *             "from": "...",
   *             "to": "..."
   *         }
   *         // other Group class fields
   *     },
   *     "error": false
   * }
   */
  router.post('/v1/webinars', Middleware.isAuthenticated, controller.create, Middleware.Response.success('create'));

  /**
   * @apiGroup Group class
   * @apiVersion 4.0.0
   * @api {put} /v1/webinars/:id Update Group class
   * @apiPermission authenticated user
   *
   * @apiParam {String} id ID of the Group class to update
   * @apiParam (body) {String} name Name of the Group class
   * @apiParam (body) {Number} maximumStrength Maximum strength of the Group class (must be at least 1)
   * @apiParam (body) {Array} [categoryIds] Array of category IDs
   * @apiParam (body) {Array} [mediaIds] Array of media IDs (optional)
   * @apiParam (body) {Boolean} [isOpen] Indicates if the Group class is open (optional)
   * @apiParam (body) {Number} price Price of the Group class
   * @apiParam (body) {String} [description] Description of the Group class (optional)
   * @apiParam (body) {String} mainImageId ID of the main image
   * @apiParam (body) {String} [hashWebinar] Hash of the Group class (optional)
   * @apiParam (body) {Boolean} [featured] Indicates if the Group class is featured (optional)
   * @apiParam (body) {String} [alias] Alias of the Group class (optional)
   * @apiParam (body) {String} [tutorId] ID of the tutor (optional)
   * @apiParam (body) {Boolean} [isFree] Indicates if the Group class is free (optional)
   * @apiParam (body) {Array} [gradeIds] Array of grade IDs
   * @apiParam (body) {Array} subjectIds Array of subject IDs (at least 1 required)
   * @apiParam (body) {Array} topicIds Array of topic IDs (at least 1 required)
   * @apiParam (body) {Object} age Age range object with 'from' and 'to' properties
   *
   * @apiSuccessExample {json} Success-Response:
   * {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "_id": "...",
   *         "name": "...",
   *         "maximumStrength": "...",
   *         "categoryIds": ["..."],
   *         "mediaIds": ["..."],
   *         "isOpen": "...",
   *         "price": "...",
   *         "description": "...",
   *         "mainImageId": "...",
   *         "hashWebinar": "...",
   *         "featured": "...",
   *         "alias": "...",
   *         "tutorId": "...",
   *         "isFree": "...",
   *         "gradeIds": ["..."],
   *         "subjectIds": ["..."],
   *         "topicIds": ["..."],
   *         "age": {
   *             "from": "...",
   *             "to": "..."
   *         }
   *         // other Group class fields
   *     },
   *     "error": false
   * }
   */
  router.put('/v1/webinars/:id', Middleware.isAuthenticated, controller.findOne, controller.update, Middleware.Response.success('update'));

  /**
   * @apiGroup Group class
   * @apiVersion 4.0.0
   * @api {delete} /v1/webinars/:id Delete Group class
   * @apiPermission authenticated user
   *
   * @apiParam {String} id ID of the Group class to delete
   *
   * @apiSuccessExample {json} Success-Response:
   * {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "message": "Webinar is deleted"
   *     },
   *     "error": false
   * }
   */
  router.delete('/v1/webinars/:id', Middleware.isAuthenticated, controller.findOne, controller.remove, Middleware.Response.success('remove'));

  /**
   * @apiGroup Group class
   * @apiVersion 4.0.0
   * @api {get} /v1/webinars/:webinarId/enrolled Get Enrolled Users of a Group class
   * @apiPermission authenticated user
   *
   * @apiParam {String} webinarId ID of the Group class to get enrolled users
   *
   * @apiSuccessExample {json} Success-Response:
   * {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "count": "...",
   *         "items": [
   *             {
   *                 "user": {
   *                     "name": "...",
   *                     "avatarUrl": "..."
   *                 }
   *             },
   *             // more enrolled user items
   *         ]
   *     },
   *     "error": false
   * }
   */
  router.get('/v1/webinars/:webinarId/enrolled', Middleware.loadUser, controller.enrolledUsers, Middleware.Response.success('enrolled'));

  /**
   * @apiGroup Webinar
   * @apiVersion 4.0.0
   * @api {put} /v1/webinar/:id/change-status Change Group class active status
   * @apiPermission authenticated user
   *
   * @apiParam {String} id ID of the Group class to change status
   *
   * @apiSuccessExample {json} Success-Response:
   * {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "success": true
   *     },
   *     "error": false
   * }
   */
  router.put(
    '/v1/webinar/:id/change-status',
    Middleware.isAuthenticated,
    controller.findOne,
    controller.changeStatus,
    Middleware.Response.success('changeStatus')
  );

  /**
   * @apiGroup Group class
   * @apiVersion 4.0.0
   * @api {get} /v1/webinars/:id/latest Get Latest Slot
   *
   * @apiParam {String} id ID of the Group class to get the latest slot
   *
   * @apiSuccessExample {json} Success-Response:
   * {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "latest": {
   *             // Latest slot data
   *         }
   *     },
   *     "error": false
   * }
   */
  router.get('/v1/webinars/:id/latest', controller.getLatestSlot, Middleware.Response.success('latest'));

  /**
   * @apiGroup Group class
   * @apiVersion 4.0.0
   * @api {delete} /v1/webinars/:webinarId/remove-document/:documentId Remove Group class Document
   * @apiPermission authenticated user
   *
   * @apiParam {String} webinarId ID of the Group class
   * @apiParam {String} documentId ID of the document to remove
   *
   * @apiSuccessExample {json} Success-Response:
   * {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "success": true
   *     },
   *     "error": false
   * }
   */
  router.delete(
    '/v1/webinars/:webinarId/remove-document/:documentId',
    Middleware.isAuthenticated,
    controller.removeDocument,
    Middleware.Response.success('remove')
  );

  /**
   * @apiGroup Group class
   * @apiVersion 4.0.0
   * @api {post} /v1/webinars/:webinarId/remove-document/:upload Upload Group class Document
   * @apiPermission authenticated user
   *
   * @apiParam {String} webinarId ID of the Group class
   * @apiBody {File} file document file
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *        "_id": "5b99efc048d35953fbd9e93f",
   *        "name": "xyz.pdf",
   *        ...
   *     },
   *     "error": false
   *  }
   */
  router.post(
    '/v1/webinar/:webinarId/upload-document',
    Middleware.isAuthenticated,
    controller.findOne,
    uploadDocument.single('file'),
    controller.uploadDocument,
    Middleware.Response.success('upload')
  );
};
