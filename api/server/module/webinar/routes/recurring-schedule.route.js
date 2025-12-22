const controller = require('../controllers/recurring-schedule.controller');

module.exports = router => {
  /**
   * @apiGroup Recurring Schedules
   * @apiVersion 4.0.0
   *
   * @api {post} /v1/recurring-schedule Create Recurring Schedule
   * @apiPermission authenticated user
   *
   * @apiDescription Create a new recurring schedule for a tutor.
   *
   * @apiParam {String} start Start date and time (e.g., "2023-01-20T10:00:00Z").
   * @apiParam {String} end End date and time (e.g., "2023-01-20T12:00:00Z").
   * @apiParam {Object} range Range details:
   * @apiParam {String} range.start Start date and time of the recurrence.
   * @apiParam {String} range.end End date and time of the recurrence.
   * @apiParam {Number[]} dayOfWeek Days of the week (0-6, where 0 is Sunday) for the recurrence.
   * @apiParam {Boolean} [isFree] Indicates if the schedule is free (default: false).
   *
   * @apiSuccess {Object} create Created recurring schedule and associated slots.
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *             "recurring": {
   *                 "_id": "5f3f344be53d2a001cf52e61",
   *                 "tutorId": "5f3f344be53d2a001cf52e62",
   *                 "start": "2023-01-20T10:00:00Z",
   *                 "end": "2023-01-20T12:00:00Z",
   *                 "isFree": false
   *             },
   *             "dataSlots": [
   *                 {
   *                     "_id": "5f3f344be53d2a001cf52e63",
   *                     "start": "2023-01-20T10:00:00Z",
   *                     "end": "2023-01-20T12:00:00Z",
   *                     "tutorId": "5f3f344be53d2a001cf52e62",
   *                     "isFree": false
   *                 }
   *             ]
   *     },
   *     "error": false
   *  }
   */

  router.post('/v1/recurring-schedule', Middleware.canAccessFeature('tutor'), controller.create, Middleware.Response.success('create'));

  /**
   * @apiGroup Recurring Schedules
   * @apiVersion 4.0.0
   *
   * @api {delete} /v1/recurring-schedule/:id Delete Recurring Schedule
   * @apiPermission authenticated user
   *
   * @apiDescription Delete a recurring schedule by its ID.
   *
   * @apiParam {String} id ID of the recurring schedule to delete.
   *
   * @apiSuccess {Object} remove Message indicating the recurring schedule is deleted.
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *             "message": "Recurring is deleted"
   *     },
   *     "error": false
   *  }
   */

  router.delete(
    '/v1/recurring-schedule/:id',
    Middleware.canAccessFeature('tutor'),
    controller.findOne,
    controller.remove,
    Middleware.Response.success('remove')
  );

  /**
   * @apiGroup Recurring Schedules
   * @apiVersion 4.0.0
   *
   * @api {get} /v1/recurring-schedule List Recurring Schedules
   * @apiPermission authenticated user
   *
   * @apiDescription Retrieve a list of recurring schedules for a tutor.
   * @apiUse paginationQuery
   *
   * @apiSuccess {Object} listRecurring List of recurring schedules.
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *             "count": 2,
   *             "items": [
   *                 {
   *                     "_id": "5f3f344be53d2a001cf52e61",
   *                     "tutorId": "5f3f344be53d2a001cf52e62",
   *                     "start": "2023-01-20T10:00:00Z",
   *                     "end": "2023-01-20T12:00:00Z",
   *                     "isFree": false
   *                 },
   *                 {
   *                     "_id": "5f3f344be53d2a001cf52e63",
   *                     "tutorId": "5f3f344be53d2a001cf52e62",
   *                     "start": "2023-01-21T15:00:00Z",
   *                     "end": "2023-01-21T17:00:00Z",
   *                     "isFree": true
   *                 }
   *             ]
   *     },
   *     "error": false
   *  }
   */

  router.get(
    '/v1/recurring-schedule',
    Middleware.canAccessFeature('tutor'),
    controller.getListRecurring,
    Middleware.Response.success('listRecurring')
  );
};
