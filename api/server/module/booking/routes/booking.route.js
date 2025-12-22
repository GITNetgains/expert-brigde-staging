const bookingController = require('../controllers/booking.controller');

module.exports = router => {
  /**
   * @apiGroup Booking
   * @apiVersion 4.0.0
   * @apiName Book an Appointment
   * @api {post} /v1/appointments/book Book an Appointment
   * @apiParam {String}   startTime start time of the appointment in UTC time format
   * @apiParam {String}   toTime end time of the appointment in UTC time format
   * @apiParam {String}   targetId ID of the target (selected topic id)
   * @apiParam {String}   tutorId tutorId ID of the tutor
   * @apiParam {Boolean}  [isFree]  Whether the appointment is free or not (booking free trial)
   * @apiParam {String}   [redirectSuccessUrl] URL to redirect to after successful booking
   * @apiParam {String}   [cancelUrl] URL to redirect to after cancellation
   * @apiParam {String}   [couponCode] Coupon code for the booking
   * @apiParamExample {json} Request-Example:
   * {
   *     "startTime": "2018-08-27T08:12:56.939Z",
   *     "toTime": "2018-08-27T08:12:56.939Z"
   *     "tutorId": "5b83b28890bcc22a0a614449",
   *     "targetId": "668d38d21171e3a4f6126756",
   *     "isFree": true
   * }
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "_id": "5b99efc048d35953fbd9e93f",
   *         "status": "pending"
   *     },
   *     "error": false
   *  }
   * @apiPermission Authenticated user
   */
  router.post('/v1/appointments/book', Middleware.isAuthenticated, bookingController.create, Middleware.Response.success('create'));

  /**
   * @apiGroup Booking
   * @apiVersion 4.0.0
   * @apiName Checkout for multiple appointments
   * @api {post} /v1/appointments/book Checkout for multiple appointments
   * @apiParam {Array}    times Array containing all slots to book
   * @apiParam {String}   times.startTime Start time of the appointment in UTC time format
   * @apiParam {String}   times.toTime end time of the appointment in UTC time format
   * @apiParam {String}   times.targetId Target ID for the appointment (selected topic id)
   * @apiParam {Boolean}  [times.isFree]  Whether the appointment is free or not (booking free trial)
   * @apiParam {String}   [times.couponCode] Coupon code for discount
   * @apiParam {String}   tutorId tutorId ID of the tutor
   * @apiParam {String}   [redirectSuccessUrl] URL to redirect to after successful booking
   * @apiParam {String}   [cancelUrl] URL to redirect to after cancellation
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         total: 3 // total appointments have been booked successfully
   *     },
   *     "error": false
   *  }
   * @apiPermission Authenticated user
   */
  router.post('/v1/appointments/checkout', Middleware.isAuthenticated, bookingController.checkout, Middleware.Response.success('checkout'));

  /**
   * @apiGroup Booking
   * @apiVersion 4.0.0
   * @apiName Check Free Trial Booking Availability
   * @api {post} /v1/appointments/check/free Check if current student can book a free trial slot with the tutor
   * @apiParam {String}   tutorId
   * @apiParamExample {json} Request-Example:
   * {
   *     "tutorId": "5b83b28890bcc22a0a614449"
   * }
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "canBookFree": true
   *     },
   *     "error": false
   *  }
   * @apiPermission Authenticated user
   */
  router.post('/v1/appointments/check/free', Middleware.isAuthenticated, bookingController.checkFreeBooking, Middleware.Response.success('check'));

  /**
   * @apiGroup Booking
   * @apiVersion 4.0.0
   * @api {post} /v1/appointments/check/overlap Check if a booking slot is overlapped
   * @apiBody {String} startTime=`2023-05-12T01:00:00.000Z` select slot from  tutor's calenda
   * @apiBody {String} toTime=`2023-05-12T02:00:00.000Z` select slot from  tutor's calenda
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *       "checkOverlap": false //true if it is overlaped with some scheduled classes of student or tutor
   *     },
   *     "error": false
   *  }
   * @apiPermission Authenticated user
   */
  router.post(
    '/v1/appointments/check/overlap',
    Middleware.isAuthenticated,
    bookingController.checkOverlapSlot,
    Middleware.Response.success('checkOverlap')
  );
};
