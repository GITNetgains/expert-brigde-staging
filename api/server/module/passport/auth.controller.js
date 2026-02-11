const fs = require('fs');
const util = require('util');
const Joi = require('joi');
const nconf = require('nconf');
const url = require('url');
const { PLATFORM_ONLINE } = require('../meeting');
const signToken = require('./auth.service').signToken;
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

/** Write a line to stdout so it shows immediately in PM2 logs (avoids block buffering). */
function pm2Log(...args) {
  const msg = util.format(...args) + '\n';
  try {
    fs.writeSync(1, msg);
  } catch (e) {
    console.log(...args);
  }
}
/** Same for stderr (errors). */
function pm2Error(...args) {
  const msg = util.format(...args) + '\n';
  try {
    fs.writeSync(2, msg);
  } catch (e) {
    console.error(...args);
  }
}

const BRAND = {
  logo: 'https://admin.expertbridge.co/assets/images/whitelogo.png',
  primary: '#F05A3C',
  dark: '#0F172A',
  background: '#FAF7F3',
  muted: '#6B7280'
};

const baseEmailTemplate = ({ title, subtitle, body }) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:${BRAND.background};font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center" style="padding:40px 16px;">

<table width="600" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.1);">

<tr>
<td style="background:${BRAND.dark};padding:24px;text-align:center;">
<img src="${BRAND.logo}" height="40" alt="ExpertBridge" />
</td>
</tr>

<tr>
<td style="padding:32px;color:#111;">
<h2>${title}</h2>
<p style="color:${BRAND.muted};margin-top:-8px;">${subtitle || ''}</p>
${body}
</td>
</tr>

<tr>
<td style="background:${BRAND.dark};color:#fff;text-align:center;padding:14px;font-size:12px;">
© ${new Date().getFullYear()} ExpertBridge · support@expertbridge.com
</td>
</tr>

</table>

</td>
</tr>
</table>
</body>
</html>
`;
const otpEmailTemplate = ({ otp, purpose = 'verification' }) =>
  baseEmailTemplate({
    title: 'Your One-Time Password',
    subtitle:
      purpose === 'login'
        ? 'Use this code to login'
        : 'Use this code to verify your email',
    body: `
      <p>Hello,</p>

      <p>Please use the OTP below:</p>

      <div style="
        margin:24px 0;
        padding:20px;
        background:#FFF1EE;
        border-radius:10px;
        text-align:center;
      ">
        <h1 style="
          margin:0;
          color:${BRAND.primary};
          letter-spacing:6px;
        ">
          ${otp}
        </h1>
      </div>

      <p style="color:${BRAND.muted};font-size:14px;">
        This OTP is valid for <strong>10 minutes</strong>.
      </p>
    `
  });


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
    await Service.Mailer.send('student-new-account-register', process.env.ADMIN_EMAIL, {
      subject: 'New Registered Client',
      user: user.toObject(),
      adminUrl: nconf.get('adminWebUrl') || nconf.get('adminURL')
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
 phoneNumber: Joi.string().allow('', null).optional(),
address: Joi.string().allow('', null).optional()

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

exports.completeTutorProfile = async (req, res, next) => {
  try {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      name: Joi.string().required(),
      // All fields except email, name, resumeDocumentId are optional now
      timezone: Joi.string().allow('', null).optional(),
      country: Joi.object().allow(null).optional(),
      address: Joi.string().allow('', null).optional(),
      phoneNumber: Joi.string().allow('', null).optional(),
      zipCode: Joi.string().allow('', null).optional(),
      state: Joi.string().allow('', null).optional(),
      city: Joi.string().allow('', null).optional(),
      issueDocumentId: Joi.string().allow('', null).optional(),
      // Resume / CV is mandatory
      resumeDocumentId: Joi.string().required(),
      certificationDocumentId: Joi.string().allow('', null).optional(),
      introVideoId: Joi.string().allow('', null).optional(),
      introYoutubeId: Joi.string().allow('', null).optional(),
      idYoutube: Joi.string().allow('', null).optional(),
      bio: Joi.string().allow('', null).optional(),
      highlights: Joi.array().items(Joi.string()).optional(),
      yearsExperience: Joi.number().allow(null).optional(),
      skillNames: Joi.array().items(Joi.string()).optional(),
      industryNames: Joi.array().items(Joi.string()).optional(),
      languages: Joi.array().items(Joi.string()).optional(),
      education: Joi.array().items(Joi.object({
        title: Joi.string().required(),
        organization: Joi.string().allow('', null).optional(),
        fromYear: Joi.number().required(),
        toYear: Joi.number().allow(null).optional()
      })).optional(),
      experience: Joi.array().items(Joi.object({
        title: Joi.string().required(),
        organization: Joi.string().allow('', null).optional(),
        fromYear: Joi.number().required(),
        toYear: Joi.number().allow(null).optional()
      })).optional()
    });
    const { error, value } = schema.validate(req.body);
    if (error) {
      return next(PopulateResponse.validationError(error));
    }

    const user = await DB.User.findOne({
      email: value.email.toLowerCase(),
      type: 'tutor'
    });
    if (!user) {
      return next(
        PopulateResponse.error(
          { message: 'Tutor not found' },
          'ERR_USER_NOT_FOUND'
        )
      );
    }

    const issueDocument = value.issueDocumentId || null;
    const resumeDocument = value.resumeDocumentId || null;
    const certificationDocument = value.certificationDocumentId || null;

    user.name = value.name;
    user.timezone = value.timezone;
    user.country = value.country;
    user.address = value.address || '';
    user.phoneNumber = value.phoneNumber;
    user.zipCode = value.zipCode || '';
    if (value.state != null) user.state = value.state;
    if (value.city != null) user.city = value.city;
    if (value.bio != null) user.bio = value.bio;
    if (Array.isArray(value.highlights)) user.highlights = value.highlights;
    if (typeof value.yearsExperience === 'number') user.yearsExperience = value.yearsExperience;
    if (Array.isArray(value.languages)) user.languages = value.languages;

    if (issueDocument) user.issueDocument = issueDocument;
    if (resumeDocument) user.resumeDocument = resumeDocument;
    if (certificationDocument) user.certificationDocument = certificationDocument;

    if (value.introVideoId) {
      user.introVideo = value.introVideoId;
      user.introYoutubeId = '';
      user.idYoutube = '';
    } else if (value.introYoutubeId || value.idYoutube) {
      const yid = value.introYoutubeId || value.idYoutube || '';
      user.introYoutubeId = yid;
      user.idYoutube = yid;
      user.introVideo = null;
    }

    if (Array.isArray(value.skillNames) && value.skillNames.length > 0) {
      const rawNames = value.skillNames
        .map(n => (n || '').trim())
        .filter(Boolean);

      const aliases = rawNames
        .map(n => n.toLowerCase().replace(/\s+/g, '-'))
        .filter(Boolean);

      // 1) Find existing skills by name or alias
      const existingSkills = await DB.Skill.find({
        $or: [
          {
            name: {
              $in: rawNames.map(n =>
                new RegExp(`^${(n || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
              )
            }
          },
          { alias: { $in: aliases } }
        ]
      }).limit(200);

      const existingByName = new Set(
        existingSkills
          .map(s => (s.name || '').toLowerCase().trim())
          .filter(Boolean)
      );
      const existingByAlias = new Set(
        existingSkills
          .map(s => (s.alias || '').toLowerCase().trim())
          .filter(Boolean)
      );

      // 2) Create any missing skills so new keywords are persisted
      const skillsToCreate = rawNames.filter(n => {
        const lower = n.toLowerCase();
        const alias = lower.replace(/\s+/g, '-');
        return !existingByName.has(lower) && !existingByAlias.has(alias);
      });

      const createdSkills = [];
      for (const name of skillsToCreate) {
        const alias = Helper.String.createAlias(name);
        try {
          const skill = await DB.Skill.create({ name, alias });
          createdSkills.push(skill);
        } catch (e) {
          // ignore duplicates created concurrently
        }
      }

      const allSkills = existingSkills.concat(createdSkills);
      user.skillIds = allSkills.map(s => s._id);
    }

    if (Array.isArray(value.industryNames) && value.industryNames.length > 0) {
      const aliases = value.industryNames.map(n => (n || '').toLowerCase().trim().replace(/\s+/g, '-')).filter(Boolean);
      const industries = await DB.Industry.find({
        $or: [
          { name: { $in: value.industryNames.map(n => new RegExp(`^${(n || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')) } },
          { alias: { $in: aliases } }
        ]
      }).limit(50);
      user.industryIds = industries.map(i => i._id);
    }

    user.pendingApprove = true;
    user.rejected = false;

    const mediaIds = [issueDocument, resumeDocument, certificationDocument].filter(Boolean);
    if (mediaIds.length) {
      await DB.Media.updateMany(
        { _id: { $in: mediaIds } },
        { $set: { uploaderId: user._id, ownerId: user._id } }
      );
    }
    if (value.introVideoId) {
      await DB.Media.updateMany(
        { _id: { $in: [value.introVideoId] } },
        { $set: { uploaderId: user._id, ownerId: user._id } }
      );
    }

    await user.save();

    // 🔄 Send CV ingestion webhook (non-blocking for user)
    try {
      pm2Log('[CV-WEBHOOK] Preparing payload for expert registration', JSON.stringify({
        userId: String(user._id),
        email: user.email,
        resumeDocument: resumeDocument != null ? String(resumeDocument) : resumeDocument
      }));

      let cvFileUrl = null;
      if (resumeDocument) {
        const media = await DB.Media.findOne({ _id: resumeDocument });
        if (media) {
          const mediaObj = media.toObject();
          cvFileUrl = mediaObj.fileUrl || null;
        }
      }

      const webhookBody = {
        source: 'website_registration',
        mongo_user_id: String(user._id),
        email: user.email,
        name: user.name,
        cv_file_url: cvFileUrl
      };

      pm2Log('[CV-WEBHOOK] Calling expert-registration webhook', JSON.stringify({
        url: 'http://13.205.83.59:5678/webhook/expert-registration',
        body: webhookBody
      }));

      const resp = await fetch('http://13.205.83.59:5678/webhook/expert-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'expertbridge-cv-ingestion-a7f3e9b2d4c1'
        },
        body: JSON.stringify(webhookBody)
      });

      pm2Log('[CV-WEBHOOK] Webhook response status', JSON.stringify({
        status: resp.status,
        ok: resp.ok
      }));
    } catch (err) {
      // Do not block tutor completion if webhook fails
      pm2Error('[CV-WEBHOOK] Error while sending webhook', err && err.message ? err.message : err);
    }

    if (Array.isArray(value.education) && value.education.length > 0) {
      for (let i = 0; i < value.education.length; i++) {
        const e = value.education[i];
        const cert = new DB.Certification({
          title: e.title,
          organization: e.organization || '',
          fromYear: e.fromYear,
          toYear: e.toYear != null ? e.toYear : e.fromYear,
          type: 'education',
          tutorId: user._id,
          ordering: i
        });
        await cert.save();
        await DB.User.updateOne(
          { _id: user._id },
          { $addToSet: { educationIds: cert._id } }
        );
      }
    }

    if (Array.isArray(value.experience) && value.experience.length > 0) {
      for (let i = 0; i < value.experience.length; i++) {
        const e = value.experience[i];
        const cert = new DB.Certification({
          title: e.title,
          organization: e.organization || '',
          fromYear: e.fromYear,
          toYear: e.toYear != null ? e.toYear : e.fromYear,
          type: 'experience',
          tutorId: user._id,
          ordering: i
        });
        await cert.save();
        await DB.User.updateOne(
          { _id: user._id },
          { $addToSet: { experienceIds: cert._id } }
        );
      }
    }

    res.locals.completeTutorProfile = PopulateResponse.success(
      { message: 'Thanks for submitting your profile details. You will be notified once approved via email.' },
      'TUTOR_PROFILE_COMPLETED'
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
 if (user.type === 'tutor') {
  await enrollQ.createAppointmentWithEmailRecipient(user.email);
  await enrollQ.createMyCourseWithEmailRecipient(user.email);
}

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
    const schema = Joi.object({
      email: Joi.string().email().required(),
      type: Joi.string().valid('student', 'tutor').required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) return next(PopulateResponse.validationError(error));

    const email = value.email.toLowerCase();

    // Prevent existing user signup
    const existing = await DB.User.exists({ email });
    if (existing) {
      return next(
        PopulateResponse.error(
          { message: 'This email address is already taken' },
          'ERR_EMAIL_ALREADY_TAKEN'
        )
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await DB.EmailOtp.deleteMany({ email });

    await DB.EmailOtp.create({
      email,
      otp,
      type: value.type,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    await Service.Mailer.sendRawNow(
  email,
  'Your ExpertBridge Verification Code',
  otpEmailTemplate({ otp })
);

    res.locals.sendOtp = PopulateResponse.success(
      { message: 'OTP sent successfully.' },
      'OTP_SENT'
    );

    next();
  } catch (e) {
    next(e);
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
      otp: Joi.string().length(6).required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) return next(PopulateResponse.validationError(error));

    const email = value.email.toLowerCase().trim();

    // 1️⃣ Find OTP record by email ONLY
    const record = await DB.EmailOtp.findOne({
  email,
  otp: value.otp
});


    if (!record) {
      return next(
        PopulateResponse.error({ message: 'Invalid or expired OTP' }, 'ERR_INVALID_OTP')
      );
    }

    // 2️⃣ Expiry check
    if (record.expiresAt < new Date()) {
      await DB.EmailOtp.deleteMany({ email });
      return next(
        PopulateResponse.error({ message: 'OTP expired' }, 'ERR_OTP_EXPIRED')
      );
    }

    // 3️⃣ OTP mismatch → increment attempts
    if (record.otp !== value.otp) {
      await DB.EmailOtp.updateOne(
        { _id: record._id },
        { $inc: { attempts: 1 } }
      );

      if (record.attempts + 1 >= 5) {
        await DB.EmailOtp.deleteMany({ email });
        return next(
          PopulateResponse.error(
            { message: 'OTP locked. Please resend OTP.' },
            'ERR_OTP_LOCKED'
          )
        );
      }

      return next(
        PopulateResponse.error({ message: 'Invalid OTP' }, 'ERR_INVALID_OTP')
      );
    }

    // 4️⃣ VALIDATE COMPANY EMAIL FOR STUDENT
    if (record.type === 'student') {
      const domain = email.split('@')[1];
      
if (!domain || !domain.includes('.')) {
  await DB.EmailOtp.deleteMany({ email });
  return next(
    PopulateResponse.error(
      { message: 'Invalid company email address' },
      'ERR_INVALID_COMPANY_EMAIL'
    )
  );
}
      const personalDomains = [
        'gmail.com',
        'yahoo.com',
        'hotmail.com',
        'outlook.com',
        'icloud.com',
        'aol.com',
        'protonmail.com'
      ];

      if (personalDomains.includes(domain)) {
        await DB.EmailOtp.deleteMany({ email });
        return next(
          PopulateResponse.error(
            { message: 'Please use a company email address' },
            'ERR_PERSONAL_EMAIL_NOT_ALLOWED'
          )
        );
      }
    }

    // 5️⃣ OTP success → delete OTP
    await DB.EmailOtp.deleteMany({ email });

    // 6️⃣ Create user
    const baseUsername = Helper.String
      .createAlias(email.split('@')[0])
      .toLowerCase();

    let username = baseUsername;

    if (await DB.User.exists({ username })) {
      username = `${baseUsername}-${Helper.String.randomString(5)}`;
    }

    await DB.User.create({
      email,
      username,
      type: record.type,
      emailVerified: true
    });

    res.locals.verifyOtp = PopulateResponse.success(
      { message: 'OTP verified. Please set password.' },
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
      password: Joi.string()
        .min(8)
        .regex(/[a-z]/)
        .regex(/[A-Z]/)
        .regex(/\d/)
        .regex(/[@$!%*?&]/)
        .required()
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
  'Your ExpertBridge Login Code',
  otpEmailTemplate({ otp, purpose: 'login' })
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
