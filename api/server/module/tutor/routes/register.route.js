const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const config = require('../../media/config');
const registerController = require('../controllers/register.controller');

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

const uploadVideo = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, config.videoDir);
    },
    filename(req, file, cb) {
      const ext = Helper.String.getExt(file.originalname);
      const nameWithoutExt = Helper.String.createAlias(Helper.String.getFileName(file.originalname, true));
      let fileName = `${nameWithoutExt}${ext}`;
      if (fs.existsSync(path.resolve(config.videoDir, fileName))) {
        fileName = `${nameWithoutExt}-${Helper.String.randomString(5)}${ext}`;
      }

      cb(null, fileName);
    },
    fileSize: (process.env.MAX_VIDEO_SIZE || 10) * 1024 * 1024 // 10MB limit
  })
});

module.exports = router => {
  /**
   * @apiGroup Tutor Registration
   * @apiVersion 4.0.0
   * @api {post} /v1/tutors/register Tutor Register
   *
   * @apiParam {String} email Tutor's email address (required).
   * @apiParam {String} password Tutor's password (required, minimum length: 6).
   * @apiParam {String} [phoneNumber] Tutor's phone number (optional).
   * @apiParam {String} [name] Tutor's name (optional).
   * @apiParam {String} issueDocument Document for identity verification (required).
   * @apiParam {String} resumeDocument Tutor's resume document (required).
   * @apiParam {String} certificationDocument Tutor's certification document (required).
   * @apiParam {String} [timezone] Tutor's timezone (optional).
   * @apiParam {String} [introVideoId] ID of the introduction video (optional).
   * @apiParam {String} [introYoutubeId] YouTube video ID for the introduction (optional).
   * @apiParam {String} [type] Type of user (allow 'tutor' only) (optional).
   *
   * @apiSuccess {Object} register Success message and status.
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "register": {
   *             "message": "Your account has been created, please check your email to access it",
   *             "status": "USE_CREATED"
   *         }
   *     },
   *     "error": false
   *  }
   *
   * @apiError {Object} ERR_EMAIL_ALREADY_TAKEN Error message when the email is already registered.
   * @apiErrorExample {json} Error-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "error": {
   *             "message": "This email address is already taken.",
   *             "status": "ERR_EMAIL_ALREADY_TAKEN"
   *         }
   *     },
   *     "error": true
   *  }
   *
   */
  router.post(
    '/v1/tutors/register',
    // uploadDocument.single('file'),
    registerController.register,
    Middleware.Response.success('register')
  );

  /**
   * @apiGroup Tutor Registration
   * @apiVersion 4.0.0
   * @api {post} /v1/tutors/upload-document Upload Tutor Document
   *
   * @apiParam (Request File) {File} file Document file to upload.
   *
   * @apiSuccess {Object} upload Uploaded document file information.
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "upload": {
   *             "file": "uploaded_file_name.ext"
   *         }
   *     },
   *     "error": false
   *  }
   *
   * @apiError {Object} ERR_MISSING_FILE Error message for missing document file.
   * @apiErrorExample {json} Error-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "error": {
   *             "message": "Missing document",
   *             "status": "ERR_MISSING_FILE"
   *         }
   *     },
   *     "error": true
   *  }
   */
  router.post('/v1/tutors/upload-document', uploadDocument.single('file'), registerController.uploadDocument, Middleware.Response.success('upload'));

  /**
   * @apiGroup Tutor Registration
   * @apiVersion 4.0.0
   * @api {post} /v1/tutors/upload-introVideo Upload Tutor Introduction Video
   *
   * @apiParam (Request File) {File} file Video file to upload.
   *
   * @apiSuccess {Object} upload Uploaded video file information.
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "upload": {
   *             "file": "uploaded_video_name.ext"
   *         }
   *     },
   *     "error": false
   *  }
   *
   * @apiError {Object} ERR_MISSING_FILE Error message for missing video file.
   * @apiErrorExample {json} Error-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "error": {
   *             "message": "Missing video",
   *             "status": "ERR_MISSING_FILE"
   *         }
   *     },
   *     "error": true
   *  }
   */
  router.post('/v1/tutors/upload-introVideo', uploadVideo.single('file'), registerController.uploadIntroVideo, Middleware.Response.success('upload'));
  /**
   * @apiGroup Tutor
   * @apiVersion 4.0.0
   * @api {post} /v1/tutors/:tutorId/reject Reject tutor
   * @apiParam {String}   tutorId
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
  router.post('/v1/tutors/:tutorId/reject', Middleware.hasRole('admin'), registerController.reject, Middleware.Response.success('reject'));

  /**
   * @apiGroup Tutor
   * @apiVersion 4.0.0
   * @api {post} /v1/tutors/:tutorId/approve Approve tutor
   * @apiParam {String}   tutorId
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
  router.post('/v1/tutors/:tutorId/approve', Middleware.hasRole('admin'), registerController.approve, Middleware.Response.success('approve'));
};
