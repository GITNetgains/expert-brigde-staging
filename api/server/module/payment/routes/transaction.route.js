const transactionController = require('../controllers/transaction.controller');

module.exports = router => {
  /**
   * @apiGroup Transaction
   * @apiVersion 4.0.0
   * @api {get} /v1/payment/transactions?:status&:userId&:type Listing
   * @apiParam {String}   [status]  `pending`, `canceled`, `completed`
   * @apiParam {String}   [userId]
   * @apiParam {String}   [type]
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
   *               "status": "pending"
   *            }
   *          ]
   *     },
   *     "error": false
   *  }
   * @apiPermission admin
   */
  router.get('/v1/payment/transactions', Middleware.isAuthenticated, transactionController.list, Middleware.Response.success('list'));

  /**
   * @apiGroup Transaction
   * @apiVersion 4.0.0
   * @api {get} /v1/payment/transactions/:transactionId Detail
   * @apiParam {String}   transactionId
   * @apiUse paginationQuery
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "_id": ".....",
   *         "type": "booking",
   *         "paymentGateway": "paypal",
   *         "price": 100,
   *         "user": {
   *            "_id": "....",
   *            "username": "xxxxx"
   *         }
   *     },
   *     "error": false
   *  }
   * @apiPermission admin
   */
  router.get(
    '/v1/payment/transactions/:transactionId',
    Middleware.isAuthenticated,
    transactionController.findOne,
    Middleware.Response.success('transaction')
  );

  /**
   * @apiGroup Enroll
   * @apiVersion 4.0.0
   * @api {post} /v1/enroll Enroll for a group class / course
   * @apiPermission authenticated user
   *
   * @apiParam  {String} targetType Type of the enrollment
   * @apiParam  {String} tutorId ID of the tutor
   * @apiParam  {String} targetId ID of the target (course ID / Group class Id)
   * @apiParam  {String} [couponCode] Coupon code (optional)
   * @apiParam  {String} [type] Type of the enrollment (optional, default: 'booking')
   * @apiParam  {String} [emailRecipient] Email recipient (optional)
   * @apiParam {String}   [redirectSuccessUrl] URL to redirect to after successful booking
   * @apiParam {String}   [cancelUrl] URL to redirect to after cancellation
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "enroll": {
   *             // Created transaction data
   *         }
   *     },
   *     "error": false
   *  }
   */
  router.post('/v1/enroll', Middleware.isAuthenticated, transactionController.enroll, Middleware.Response.success('enroll'));

  /**
   * @apiGroup Enroll
   * @apiVersion 4.0.0
   * @api {post} /v1/enroll/:id/:targetType/booked Mark Item as Booked
   * @apiPermission authenticated user
   *
   * @apiParam (params) {String} id ID of the enrollment target (course / group class)
   * @apiParam (params) {String} targetType Type of the enrollment target
   *
   * @apiSuccess {Object} booked Information about the enrollment status.
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "booked": true // or false
   *     },
   *     "error": false
   *  }
   */
  router.post('/v1/enroll/:id/:targetType/booked', Middleware.isAuthenticated, transactionController.booked, Middleware.Response.success('booked'));

  router.post(
    '/v1/webinars/check/overlap',
    Middleware.isAuthenticated,
    transactionController.checkOverlapWebinar,
    Middleware.Response.success('overlapSlots')
  );

  /**
   * @apiGroup Transaction
   * @apiVersion 4.0.0
   * @api {get} /v1/payment/transactions-of-tutor List Transactions of Tutor
   * @apiUse paginationQuery
   * @apiPermission authenticated user
   *
   * @apiParam {String} [targetType] Filter by transaction target type
   * @apiParam {String} [userId] Filter by user ID
   * @apiParam {String} [tutorId] Filter by tutor ID
   * @apiParam {String} [targetId] Filter by target ID
   * @apiParam {String} [status] Filter by transaction status
   * @apiParam {String} [code] Filter by transaction code
   * @apiParam {String} [description] Filter by transaction description
   *
   * @apiSuccess {Number} count Total number of transactions matching the query.
   * @apiSuccess {Object[]} items List of transactions.
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *             "count": 50,
   *             "items": [
   *                 {
   *                     "_id": "...",
   *                     // Transaction fields
   *                     "webinar": {
   *                         "_id": "...",
   *                         "name": "...",
   *                         "alias": "..."
   *                     },
   *                     "subject": {
   *                         "_id": "...",
   *                         "name": "...",
   *                         "alias": "..."
   *                     },
   *                     "tutorSubject": {
   *                         "_id": "...",
   *                         "name": "...",
   *                         "alias": "..."
   *                     }
   *                 },
   *                 // More transactions
   *             ]
   *     },
   *     "error": false
   *  }
   */
  router.get(
    '/v1/payment/transactions-of-tutor',
    Middleware.isAuthenticated,
    transactionController.transactionOfTutor,
    Middleware.Response.success('listOfTutor')
  );
};
