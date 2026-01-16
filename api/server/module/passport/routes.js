const authController = require('./auth.controller');
const facebookController = require('./social/facebook');
const googleController = require('./social/google');
const localController = require('./local');
const linkedinController = require('./social/linkedin');
module.exports = router => {
  /**
   * @apiGroup Auth
   * @apiVersion 4.0.0
   * @api {post} /v1/auth/login  Local login
   * @apiDescription Login with email and password
   * @apiParam {String}   email      email address
   * @apiParam {String}   password   password
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....",
   *         "expiredAt": "2018-09-14T06:39:18.140Z"
   *     },
   *     "error": false
   *  }
   * @apiPermission all
   */
  router.post('/v1/auth/login', localController.login, Middleware.Response.success('login'));

  // /**
  //  * @apiGroup Auth
  //  * @apiVersion 4.0.0
  //  * @api {post} /v1/auth/login/facebook  Local with facebook
  //  * @apiDescription Local with facebook. User in the client side MUST have scope for email
  //  * @apiParam {String}   accessToken Access token
  //  * @apiSuccessExample {json} Success-Response:
  //  *  {
  //  *     "code": 200,
  //  *     "message": "OK",
  //  *     "data": {
  //  *         "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....",
  //  *         "expiredAt": "2018-09-14T06:39:18.140Z"
  //  *     },
  //  *     "error": false
  //  *  }
  //  * @apiPermission all
  //  */
  router.post('/v1/auth/login/facebook', facebookController.login, Middleware.Response.success('login'));

  // /**
  //  * @apiGroup Auth
  //  * @apiVersion 4.0.0
  //  * @api {post} /v1/auth/login/google  Local with google
  //  * @apiDescription Local with google. User in the client side MUST have scope for email
  //  * @apiParam {String}   accessToken Access token
  //  * @apiSuccessExample {json} Success-Response:
  //  *  {
  //  *     "code": 200,
  //  *     "message": "OK",
  //  *     "data": {
  //  *         "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....",
  //  *         "expiredAt": "2018-09-14T06:39:18.140Z"
  //  *     },
  //  *     "error": false
  //  *  }
  //  * @apiPermission all
  //  */
router.get('/v1/auth/login/google', googleController.login, Middleware.Response.success('login'));

router.post('/v1/auth/login/google', googleController.login, Middleware.Response.success('login'));

  
  router.post('/v1/auth/login/linkedin', linkedinController.login, Middleware.Response.success('login'));


router.get(
  '/v1/auth/login/linkedin',
  linkedinController.login,
  Middleware.Response.success('login')
);
  /**
   * @apiGroup Auth
   * @apiVersion 4.0.0
   * @api {post} /v1/auth/register   Student Regiser
   * @apiDescription Only for student register: Login with email and password
   * @apiParam (body) {String} [type] Type of the user (optional, default: 'student').
   * @apiParam (body) {String} email Email of the user (required).
   * @apiParam (body) {String} password Password of the user (required).
   * @apiParam (body) {String} [phoneNumber] Phone number of the user (optional).
   * @apiParam (body) {String} name Name of the user (required).
   * @apiParam (body) {String} timezone Timezone of the user (required).
   * @apiSuccessExample {json} Success-Response:
   *  {
   *      "code": 200,
   *       "message": "OK",
   *      "data": {
   *           "code": 200,
   *           "httpCode": 200,
   *           "error": false,
   *           "message": "USE_CREATED",
   *           "data": {
   *               "message": "Your account has been created, please verify your email address and get access."
   *           }
   *       },
   *       "error": false
   *  }
   * @apiPermission all
   */
  router.post('/v1/auth/register', authController.register, Middleware.Response.success('register'));

  /**
   * @apiGroup Auth
   * @apiVersion 4.0.0
   * @api {post} /v1/auth/verifyEmail  Verify email address
   * @apiDescription Verify email address
   * @apiParam {String}   token verification token which sent to email
   * @apiSuccessExample {json} Success-Response:
   *  {
   *    "code": 200,
   *    "message": "OK",
   *    "data": {
   *      "code": 200,
   *      "httpCode": 200,
   *      "error": false,
   *      "message": "EMAIL_VERIFIED",
   *      "data": {
   *        "message": "Your email has been verified."
   *       }
   *     },
   *     "error": false
   *  }
   * @apiPermission all
   */
  router.post('/v1/auth/verifyEmail', authController.verifyEmail, Middleware.Response.success('verifyEmail'));

  /**
   * @apiGroup Auth
   * @apiVersion 4.0.0
   * @api {get} /v1/auth/verifyEmail/:token  Verify email address
   * @apiDescription Render HTML view
   * @apiParam {String}   token verification token which sent to email
   * @apiPermission all
   */
  router.get('/v1/auth/verifyEmail/:token', authController.verifyEmailView);

  /**
   * @apiGroup Auth
   * @apiVersion 4.0.0
   * @api {post} /v1/auth/forgot  Forgot password
   * @apiDescription Send forgot password to email
   * @apiParam {String}   email      email address
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "code": 200,
   *         "httpCode": 200,
   *         "error": false,
   *         "message": "FORGOT_PASSWORD_EMAIL_SENT",
   *         "data": {
   *             "message": "Your password email has been sent."
   *         }
   *     },
   *     "error": false
   *  }
   * @apiPermission all
   */
  router.post('/v1/auth/forgot', authController.forgot, Middleware.Response.success('forgot'));
router.post('/v1/auth/sendOtp', 
  authController.sendOtp, Middleware.Response.success('sendOtp',),);
router.post('/v1/auth/verifyOtp', authController.verifyOtp, Middleware.Response.success('verifyOtp'));

router.post(
  '/v1/auth/setPassword',
  authController.setPassword,
  Middleware.Response.success('setPassword')
);
router.post(
  '/v1/auth/student/personal-info',
  authController.updateStudentPersonalInfo,
  Middleware.Response.success('updateStudentPersonalInfo')
);

// =====================================
// OTP LOGIN ROUTES (NON-BREAKING)
// =====================================

/**
 * @apiGroup Auth
 * @apiVersion 4.0.0
 * @api {post} /v1/auth/login/sendOtp  Send OTP for Login
 * @apiDescription Sends OTP only if user exists
 * @apiParam {String} email Registered email
 * @apiSuccessExample {json} Success:
 * {
 *   "code": 200,
 *   "message": "OK",
 *   "data": { "message": "OTP sent successfully" },
 *   "error": false
 * }
 * @apiPermission all
 */
router.post(
  '/v1/auth/login/sendOtp',
  authController.loginSendOtp,
  Middleware.Response.success('loginSendOtp')
);

/**
 * @apiGroup Auth
 * @apiVersion 4.0.0
 * @api {post} /v1/auth/login/verifyOtp  Verify OTP Login
 * @apiDescription Verify OTP → Login user → Return JWT token
 * @apiParam {String} email Registered email
 * @apiParam {String} otp OTP sent to email
 * @apiSuccessExample {json} Success:
 * {
 *   "code": 200,
 *   "message": "OK",
 *   "data": {
 *     "token": "xxxx",
 *     "redirectTo": "/users/dashboard"
 *   },
 *   "error": false
 * }
 * @apiPermission all
 */
router.post(
  '/v1/auth/login/verifyOtp',
  authController.loginVerifyOtp,
  Middleware.Response.success('loginVerifyOtp')
);

  /**
   * @apiGroup Auth
   * @apiVersion 4.0.0
   * @api {get} /v1/auth/passwordReset/:token  Open view for password reset
   * @apiDescription  Open view for password reset
   * @apiParam {String}   token password reset token
   * @apiPermission all
   */
  router.use('/v1/auth/passwordReset/:token', authController.resetPasswordView);
};
