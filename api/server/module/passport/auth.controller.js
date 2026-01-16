const Joi = require('joi');
const nconf = require('nconf');
const url = require('url');
const { PLATFORM_ONLINE } = require('../meeting');
const signToken = require('./auth.service').signToken;

const enrollQ = require('../webinar/queue');
exports.register = async (req, res, next) => {
  const schema = Joi.object().keys({
    type: Joi.string().allow(['student', 'parent']).required().default('student'),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phoneNumber: Joi.string().allow(['', null]).optional(),
    name: Joi.string().allow(['', null]).optional(),
    timezone: Joi.string().allow(['', null]).optional()
  });

  const validate = Joi.validate(req.body, schema);
  if (validate.error) {
    return next(PopulateResponse.validationError(validate.error));
  }

  try {
    const count = await DB.User.count({
      email: validate.value.email.toLowerCase()
    });
    if (count) {
      return next(
        PopulateResponse.error(
          {
            message: 'This email address is already taken'
          },
          'ERR_EMAIL_ALREADY_TAKEN'
        )
      );
    }

    const user = new DB.User(validate.value);
    user.emailVerifiedToken = Helper.String.randomString(48);

    let username = validate.value.name
      ? Helper.String.createAlias(validate.value.name)
      : Helper.String.createAlias(validate.value.email.split('@')[0]);
    username = username.toLowerCase();

    const countUser = await DB.User.count({ username });
    if (countUser) {
      username = `${username}-${Helper.String.randomString(5)}`;
    }
    user.username = username;
    await user.save();

    // now send email verificaiton to user

    await Service.Mailer.send('verify-email', user.email, {
      userName: user.name,
      isSignup: true,
      subject: 'Verify email address',
      emailVerifyLink: url.resolve(nconf.get('baseUrl'), `v1/auth/verifyEmail/${user.emailVerifiedToken}`)
    });

    res.locals.register = PopulateResponse.success(
      {
        message: 'Your account has been created, please check your email to access'
      },
      'USE_CREATED'
    );
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.updateStudentPersonalInfo = async (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().required(),
    phoneNumber: Joi.string().required(),
    address: Joi.string().required()
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return next(PopulateResponse.validationError(error));
  }

  try {
    const user = await DB.User.findOne({
      email: value.email.toLowerCase(),
      type: 'student'
    });

    if (!user) {
      return next(
        PopulateResponse.error(
          { message: 'Student not found' },
          'ERR_USER_NOT_FOUND'
        )
      );
    }

    user.name = value.name;
    user.phoneNumber = value.phoneNumber;
    user.address = value.address;

    await user.save();

    res.locals.updateStudentPersonalInfo = PopulateResponse.success(
      { message: 'Personal information saved successfully' },
      'PROFILE_UPDATED'
    );
    next();
  } catch (e) {
    next(e);
  }
};


exports.verifyEmail = async (req, res, next) => {
  const schema = Joi.object().keys({
    token: Joi.string().required()
  });

  const validate = Joi.validate(req.body, schema);
  if (validate.error) {
    return next(PopulateResponse.validationError(validate.error));
  }

  try {
    const user = await DB.User.findOne({
      emailVerifiedToken: req.body.token
    });
    if (!user) {
      return next(
        PopulateResponse.error(
          {
            message: 'This token is incorrect'
          },
          'ERR_INVALID_EMAIL_VERIFY_TOKEN'
        )
      );
    }

    user.emailVerified = true;
    user.emailVerifiedToken = null;

    // Only create ZoomUs account for tutor
    await enrollQ.createAppointmentWithEmailRecipient(user.email);
    await enrollQ.createMyCourseWithEmailRecipient(user.email);

    await user.save();
    res.locals.verifyEmail = PopulateResponse.success(
      {
        message: 'Your email was successfully verified.'
      },
      'EMAIL_VERIFIED'
    );
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.verifyEmailView = async (req, res, next) => {
  try {
    const user = await DB.User.findOne({
      emailVerifiedToken: req.params.token
    });

    if (!user) {
      return next(
        PopulateResponse.error(
          {
            message: 'This token is incorrect'
          },
          'ERR_INVALID_EMAIL_VERIFY_TOKEN'
        )
      );
    }
    user.emailVerified = true;
    user.emailVerifiedToken = null;

    await enrollQ.createAppointmentWithEmailRecipient(user.email);
    await enrollQ.createMyCourseWithEmailRecipient(user.email);

    const isLessonspacePlatform = await Service.Meeting.isPlatform(PLATFORM_ONLINE.LESSON_SPACE);

    if (isLessonspacePlatform) {
      const lessonSpaceUser = await Service.LessonSpace.addUser({
        name: user.name,
        email: user.email,
        role: user.type === 'tutor' ? 'teacher' : 'student'
      });
      if (lessonSpaceUser && lessonSpaceUser.id) {
        user.lessonSpaceUserId = lessonSpaceUser.id;
        user.lessonSpaceUserInfo = lessonSpaceUser;
      } else {
        let lessonSpaceUsers = await Service.LessonSpace.getUsers(user.type === 'tutor' ? 'teacher' : 'student');
        lessonSpaceUsers = JSON.parse(lessonSpaceUsers);
        if (lessonSpaceUsers && lessonSpaceUsers.results && lessonSpaceUsers.results.length) {
          for (const item of lessonSpaceUsers.results) {
            const user = await DB.User.findOne({
              email: item.email
            });
            if (user) {
              user.lessonSpaceUserId = item.id;
              user.lessonSpaceUserInfo = item;
            }
          }
        }
      }
    }
    await user.save();
    const siteLogo = await DB.Config.findOne({
      key: 'siteLogo'
    });

    return res.render('auth/verify-email.html', {
      verified: user !== null,
      isSignup: true,
      userName: user.name,
      siteName: nconf.get('SITE_NAME'),
      urlLogin: nconf.get('userWebUrl') + '/auth/login',
      logoUrl: siteLogo.value || nconf.get('logoUrl')
    });
  } catch (e) {
    return next(e);
  }
};

exports.forgot = async (req, res, next) => {
  const schema = Joi.object().keys({
    email: Joi.string().email().required()
  });

  const validate = Joi.validate(req.body, schema);
  if (validate.error) {
    return next(PopulateResponse.validationError(validate.error));
  }

  try {
    const user = await DB.User.findOne({
      email: validate.value.email
    });
    if (!user) {
      return next(
        PopulateResponse.error(
          {
            message: 'Your email is not registered'
          },
          'ERR_INVALID_EMAIL_ADDRESS'
        )
      );
    }

    const passwordResetToken = Helper.String.randomString(48);
    await DB.User.update(
      {
        _id: user._id
      },
      {
        $set: { passwordResetToken }
      }
    );

    // now send email verificaiton to user
    await Service.Mailer.send('forgot-password', user.email, {
      subject: 'Forgot your password?',
      passwordResetLink: url.resolve(nconf.get('baseUrl'), `v1/auth/passwordReset/${passwordResetToken}`),
      user: user.toObject()
    });

    res.locals.forgot = PopulateResponse.success(
      {
        message: 'Your password has been sent.'
      },
      'FORGOT_PASSWORD_EMAIL_SENT'
    );
    return next();
  } catch (e) {
    return next(e);
  }
};
//
// =======================
// SEND OTP
// =======================
//
exports.sendOtp = async (req, res, next) => {
  try {
    const schema = Joi.object().keys({
      email: Joi.string().email().required(),
      type: Joi.string().valid('student', 'tutor').required()
    });

    const validate = Joi.validate(req.body, schema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    const email = validate.value.email.toLowerCase();
    const type = validate.value.type;

    // Check existing user
    const existing = await DB.User.findOne({ email });
    if (existing) {
      return next(
        PopulateResponse.error(
          { message: 'This email address is already taken' },
          'ERR_EMAIL_ALREADY_TAKEN'
        )
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Remove previous OTPs
    await DB.EmailOtp.deleteMany({ email });

    // Store new OTP
    await DB.EmailOtp.create({
      email,
      otp,
      type,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    // Send Email
 await Service.Mailer.sendRawNow(
  email,
  'Your Verification Code',
  `
    <div style="font-family: Arial; padding: 20px;">
      <h2>Your OTP Code</h2>
      <p>Your verification code is:</p>
      <h1 style="letter-spacing: 4px; font-size: 32px;">${otp}</h1>
      <p>This OTP will expire in 10 minutes.</p>
      <br/>
      <p>If you did not request this, please ignore this email.</p>
    </div>
  `
);


    res.locals.sendOtp = PopulateResponse.success(
      { message: 'OTP sent to your email.' },
      'OTP_SENT'
    );

    next();
  } catch (e) {
    return next(e);
  }
};

//
// =======================
// VERIFY OTP & AUTO REGISTER USER
// =======================
//
exports.verifyOtp = async (req, res, next) => {
  try {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      otp: Joi.string().required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) return next(PopulateResponse.validationError(error));

    const email = value.email.toLowerCase();

    const record = await DB.EmailOtp.findOne({ email, otp: value.otp });
    if (!record) {
      return next(
        PopulateResponse.error({ message: 'Invalid OTP' }, 'ERR_INVALID_OTP')
      );
    }

    if (record.expiresAt < new Date()) {
      await DB.EmailOtp.deleteMany({ email });
      return next(
        PopulateResponse.error({ message: 'OTP expired' }, 'ERR_OTP_EXPIRED')
      );
    }

    await DB.EmailOtp.deleteMany({ email });

    let username = Helper.String.createAlias(email.split('@')[0]).toLowerCase();
    if (await DB.User.count({ username })) {
      username = `${username}-${Helper.String.randomString(5)}`;
    }

    const user = await DB.User.create({
      email,
      username,
      type: record.type,
      emailVerified: true
    });

    res.locals.verifyOtp = PopulateResponse.success(
      {
        message: 'OTP verified. Please create password.'
      },
      'OTP_VERIFIED'
    );
    next();
  } catch (e) {
    next(e);
  }
};

exports.setPassword = async (req, res, next) => {
  try {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) return next(PopulateResponse.validationError(error));

    const user = await DB.User.findOne({ email: value.email.toLowerCase() });
    if (!user) {
      return next(
        PopulateResponse.error({ message: 'User not found' }, 'ERR_USER_NOT_FOUND')
      );
    }

    user.password = value.password;
    await user.save();

    res.locals.setPassword = PopulateResponse.success(
      { message: 'Password set successfully. Please login.' },
      'PASSWORD_SET'
    );
    next();
  } catch (e) {
    next(e);
  }
};



exports.resetPasswordView = async (req, res, next) => {
  try {
    const user = await DB.User.findOne({
      passwordResetToken: req.params.token
    });

    if (!user) {
      return res.render('not-found.html');
    }

    const siteLogo = await DB.Config.findOne({
      key: 'siteLogo'
    });

    const siteName = await DB.Config.findOne({
      key: 'siteName'
    });

    if (req.method === 'GET') {
      return res.render('auth/change-password.html', {
        openForm: true,
        logoUrl: siteLogo.value || nconf.get('logoUrl'),
        siteName: siteName.value || nconf.get('SITE_NAME'),
        logoUrl: siteLogo.value || nconf.get('logoUrl'),
        urlLogin: nconf.get('userWebUrl') + '/auth/login'
      });
    }

    if (!req.body.password) {
      return res.render('auth/change-password.html', {
        openForm: true,
        error: true,
        siteName: siteName.value || nconf.get('SITE_NAME'),
        logoUrl: siteLogo.value || nconf.get('logoUrl'),
        urlLogin: nconf.get('userWebUrl') + '/auth/login'
      });
    }

    user.password = req.body.password;
    user.passwordResetToken = null;
    await user.save();
    await Service.User.newPassword(user, req.body.password);

    return res.render('auth/change-password.html', {
      openForm: false,
      error: false,
      siteName: siteName.value || nconf.get('SITE_NAME'),
      logoUrl: siteLogo.value || nconf.get('logoUrl'),
      urlLogin: nconf.get('userWebUrl') + '/auth/login'
    });
  } catch (e) {
    return next(e);
  }
};

exports.loginSendOtp = async (req, res, next) => {
  try {
    const schema = Joi.object().keys({
      email: Joi.string().email().required()
    });

    const validate = Joi.validate(req.body, schema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    const email = validate.value.email.toLowerCase();

    const user = await DB.User.findOne({ email });
    if (!user) {
      return next(
        PopulateResponse.error(
          { message: 'This email is not registered' },
          'ERR_USER_NOT_FOUND'
        )
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await DB.EmailOtp.deleteMany({ email });
    await DB.EmailOtp.create({
      email,
      otp,
      type: user.type,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    await Service.Mailer.sendRawNow(
      email,
      'Your Login Code',
      `
        <h2>Your OTP Code</h2>
        <h1>${otp}</h1>
        <p>This OTP expires in 10 minutes.</p>
      `
    );

    res.locals.loginSendOtp = PopulateResponse.success(
      { message: 'OTP sent successfully' },
      'LOGIN_OTP_SENT'
    );
    next();

  } catch (e) {
    next(e);
  }
};


exports.loginVerifyOtp = async (req, res, next) => {
  try {
    const schema = Joi.object().keys({
      email: Joi.string().email().required(),
      otp: Joi.string().required()
    });

    const validate = Joi.validate(req.body, schema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    const { email, otp } = validate.value;

    const record = await DB.EmailOtp.findOne({ email, otp });
    if (!record) {
      return next(
        PopulateResponse.error(
          { message: 'Invalid OTP' },
          'ERR_INVALID_OTP'
        )
      );
    }

    if (record.expiresAt < new Date()) {
      await DB.EmailOtp.deleteMany({ email });
      return next(
        PopulateResponse.error(
          { message: 'OTP expired' },
          'ERR_OTP_EXPIRED'
        )
      );
    }

    await DB.EmailOtp.deleteMany({ email });

    const user = await DB.User.findOne({ email });
    if (!user) {
      return next(
        PopulateResponse.error(
          { message: 'User not found' },
          'ERR_USER_NOT_FOUND'
        )
      );
    }

    const token = signToken(
      user._id,
      user.role || user.type,
      60 * 60 * 24 * 30
    );

    res.locals.loginVerifyOtp = PopulateResponse.success(
      {
        message: 'Login successful',
        token,
        user,
        redirectTo: '/users/dashboard'
      },
      'LOGIN_OTP_VERIFIED'
    );

    next();

  } catch (e) {
    next(e);
  }
};
