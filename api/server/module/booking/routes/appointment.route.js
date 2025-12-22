const appointmentController = require('../controllers/appointment.controller');
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
   * @apiGroup Appointment
   * @apiVersion 4.0.0
   * @api {get} /v1/appointments?:status&:tutorId&:userId&startTime&toTime Listing appointments
   * @apiQuery {String}   [status] `created`, `booked`, `pending`, `canceled`, `progressing`, `completed`, `not-start`,  `meeting-completed`
   * @apiQuery {String}   [tutorId]
   * @apiQuery {String}   [userId]
   * @apiQuery {String}   [targetType] `webinar`, `subject`
   * @apiQuery {Date}   [startTime]
   * @apiQuery {Date}   [toTime]
   * @apiUse paginationQuery
   * @apiUse authRequest
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "count": 10,
   *         "items": [
   *            {
   *               "_id": "....",
   *               "status": "pending",
   *               // other appointment fields
   *            },
   *            // more appointments
   *          ]
   *     },
   *     "error": false
   *  }
   * @apiPermission Authenticated user
   */
  router.get('/v1/appointments', Middleware.isAuthenticated, appointmentController.list, Middleware.Response.success('list'));

  /**
   * @apiGroup Appointment
   * @apiVersion 4.0.0
   * @api {get} /v1/appointments/tutors/:tutorId?:status&&:userId&startTime&toTime Listing appointments of tutor
   * @apiParam {String} tutorId
   * @apiQuery {String}   [status]  `created`, `booked`, `pending`, `canceled`, `progressing`, `completed`, `not-start`,  `meeting-completed`
   * @apiQuery {String}   [userId]
   * @apiQuery {Date}   [startTime]
   * @apiQuery {Date}   [toTime]
   * @apiUse paginationQuery
   * @apiUse authRequest
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "count": 10,
   *         "items": [
   *            {
   *               "startTime": "....",
   *               "toTime": "....",
   *               // other appointment fields
   *            },
   *            // more appointments
   *          ]
   *     },
   *     "error": false
   *  }
   * @apiPermission admin / user (tutor type)
   */
  router.get(
    '/v1/appointments/tutors/:tutorId',
    Middleware.loadUser,
    appointmentController.tutorAppointmentTime,
    Middleware.Response.success('list')
  );

  /**
   * @apiGroup Appointment
   * @apiVersion 4.0.0
   * @api {post} /v1/appointments/:appointmentId/cancel Admin cancels an appointment
   * @apiParam {String}   appointmentId
   * @apiBody {String}   [reason]  cancel reason
   * @apiUse authRequest
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "_id": "5b99efc048d35953fbd9e93f",
   *         "status": "canceled",
   *         "cancelReason": "some text"
   *     },
   *     "error": false
   *  }
   * @apiPermission admin
   */
  router.post(
    '/v1/appointments/:appointmentId/cancel',
    Middleware.hasRole('admin'),
    appointmentController.cancel,
    Middleware.Response.success('cancel')
  );

  /**
   * @apiGroup Appointment
   * @apiVersion 4.0.0
   * @api {post} /v1/appointments/student/:appointmentId/cancel Student cancels an appointment
   * @apiParam {String}   appointmentId
   * @apiBody {String}   [reason]  cancel reason
   * @apiUse authRequest
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "_id": "5b99efc048d35953fbd9e93f",
   *         "status": "canceled",
   *         "cancelReason": "some text"
   *     },
   *     "error": false
   *  }
   * @apiPermission Authenticated user (student type)
   */
  router.post(
    '/v1/appointments/student/:appointmentId/cancel',
    Middleware.isAuthenticated,
    appointmentController.studentCancel,
    Middleware.Response.success('studentCancel')
  );

  /**
   * @apiGroup Appointment
   * @apiVersion 4.0.0
   * @api {post} /v1/appointments/tutor/:appointmentId/cancel Tutor cancels an appointment
   * @apiParam {String}   appointmentId
   * @apiBody {String}   [reason]  cancel reason
   * @apiUse authRequest
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "_id": "5b99efc048d35953fbd9e93f",
   *         "status": "canceled",
   *         "cancelReason": "some text"
   *     },
   *     "error": false
   *  }
   * @apiPermission Authenticated user (tutor type)
   */
  router.post(
    '/v1/appointments/tutor/:appointmentId/cancel',
    Middleware.isAuthenticated,
    appointmentController.tutorCancel,
    Middleware.Response.success('tutorCancel')
  );

  /**
   * @apiGroup Appointment
   * @apiVersion 4.0.0
   * @api {get} /v1/appointments/:appointmentId Get appointment detail
   * @apiParam {String}   appointmentId
   * @apiUse authRequest
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *        "_id": "5b99efc048d35953fbd9e93f",
   *        "status": "pending",
   *        "tutor": {},
   *        "user": {}
   *     },
   *     "error": false
   *  }
   * @apiPermission Authenticated user
   */
  router.get(
    '/v1/appointments/:appointmentId',
    Middleware.isAuthenticated,
    appointmentController.findOne,
    Middleware.Response.success('appointment')
  );

  /**
   * @apiGroup Appointment
   * @apiVersion 4.0.0
   * @api {put} /v1/appointments/:appointmentId/update-document Update appointment documents
   * @apiUse authRequest
   * @apiPermission Authenticated user
   *
   * @apiParam {String}   appointmentId
   * @apiBody {String[]} [documentIds]
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "_id": "...",
   *         "status": "...",
   *         "documentIds": ["...", "..."],
   *         // other appointment fields
   *     },
   *     "error": false
   *  }
   */

  router.put(
    '/v1/appointments/:appointmentId/update-document',
    Middleware.isAuthenticated,
    appointmentController.updateDocument,
    Middleware.Response.success('updateDocument')
  );

  /**
   * @apiGroup Appointment
   * @apiVersion 4.0.0
   * @api {post} /v1/appointments/:appointmentId/upload-document Upload appointment document
   * @apiParam {String}   appointmentId
   * @apiBody {File} file
   * @apiUse authRequest
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
   * @apiPermission Authenticated user
   */
  router.post(
    '/v1/appointments/:appointmentId/upload-document',
    Middleware.isAuthenticated,
    appointmentController.findOne,
    uploadDocument.single('file'),
    appointmentController.uploadDocument,
    Middleware.Response.success('upload')
  );

  /**
   * @apiGroup Appointment
   * @apiVersion 4.0.0
   * @api {delete} /v1/appointments/:appointmentId/remove-document/:documentId Remove appointment document
   * @apiParam {String}   appointmentId
   * @apiParam {String}   documentId
   * @apiUse authRequest
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *        "success": true
   *     },
   *     "error": false
   *  }
   * @apiPermission Authenticated user
   */
  router.delete(
    '/v1/appointments/:appointmentId/remove-document/:documentId',
    Middleware.isAuthenticated,
    appointmentController.findOne,
    appointmentController.removeDocument,
    Middleware.Response.success('remove')
  );

  /**
   * @apiGroup Appointment
   * @apiVersion 4.0.0
   * @api {put} /v1/appointments/:appointmentId/reSchedule Reschedule an appointment
   * @apiParam {String}   appointmentId
   * @apiBody {String} startTime=`2023-05-12T01:00:00.000Z` new start time - select slot from  tutor's calendar
   * @apiBody {String} toTime=`2023-05-12T02:00:00.000Z` new end time  - select slot from  tutor's calendar
   * @apiUse authRequest
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *        "message": "OK",
   *     },
   *     "error": false
   *  }
   * @apiPermission Authenticated user
   */
  router.put(
    '/v1/appointments/:id/reSchedule',
    Middleware.isAuthenticated,
    appointmentController.reSchedule,
    Middleware.Response.success('reSchedule')
  );

  /**
   * @apiGroup Appointment
   * @apiVersion 4.0.0
   * @api {post} /v1/appointments/:appointmentId/canReschedule Check if appointment can be rescheduled
   * @apiUse authRequest
   * @apiPermission Authenticated user
   *
   * @apiParam {String} appointmentId ID of the appointment
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "canReschedule": true
   *     },
   *     "error": false
   *  }
   */
  router.post(
    '/v1/appointments/:appointmentId/canReschedule',
    Middleware.isAuthenticated,
    appointmentController.findOne,
    appointmentController.canReschedule,
    Middleware.Response.success('canReschedule')
  );

  /**
   * @apiGroup Appointment
   * @apiVersion 4.0.0
   * @api {get} /v1/appointments/webinar/aggregate Listing all appointments of group classes
   * @apiQuery {String}   [status] `created`, `booked`, `pending`, `canceled`, `progressing`, `completed`, `not-start`,  `meeting-completed`
   * @apiQuery {Date}   [startTime]
   * @apiQuery {Date}   [toTime]
   * @apiUse paginationQuery
   * @apiUse authRequest
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "count": 10,
   *         "items": [
   *            {
   *               "_id": "....",
   *               "status": "pending",
   *               // other appointment fields
   *            },
   *            // more appointments
   *          ]
   *     },
   *     "error": false
   *  }
   * @apiPermission Authenticated user
   */

  router.get(
    '/v1/appointments/webinar/aggregate',
    Middleware.isAuthenticated,
    appointmentController.listByGroupClass,
    Middleware.Response.success('listByGroupClass')
  );
};
