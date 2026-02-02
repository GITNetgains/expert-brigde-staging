const _ = require('lodash');
const Joi = require('joi');
const fs = require('fs');
const path = require('path');
const Image = require('../../media/components/image');
const url = require('url');
const nconf = require('nconf');
const mongoose = require('mongoose');


const BRAND = {
  logo: 'https://admin.expertbridge.co/assets/images/whitelogo.png',
  primary: '#F05A3C',
  dark: '#0F172A',
  background: '#FAF7F3',
  muted: '#6B7280',
  adminUrl: 'https://admin.expertbridge.co'
};

/**
 * Create a new user
 */
exports.create = async (req, res, next) => {
  try {
    const schema = Joi.object()
      .keys({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required()
      })
      .unknown();

    const validate = Joi.validate(req.body, schema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    let countryCode = '';
    if (validate.value.country) {
      countryCode = validate.value.country.code || '';
    }

    const data = req.body;
    data.countryCode = countryCode;
    if (data.role !== 'admin') {
      data.role = 'user';
    }

    const user = await Service.User.create(data);
    res.locals.user = user;
    return next();
  } catch (e) {
    return next(e);
  }
};

/**
 * do update for user profile or admin update
 */
exports.update = async (req, res, next) => {
  try {
    const schema = Joi.object()
      .keys({
        password: Joi.string().min(6).optional()
      })
      .unknown();

    const validate = Joi.validate(req.body, schema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    if (!validate.value.password) {
      delete validate.value.password;
    }
    
    let countryCode = '';
    if (validate.value.country) {
      countryCode = validate.value.country.code || '';
    }

    const user = req.params.id ? await DB.User.findOne({ _id: req.params.id }) : req.user;
    
    // 1. REMOVE 'aiQueries' from this list. 
    // Queries should only be managed by the specific assign/delete endpoints.
    let publicFields = [
      'name',
      'password',
      'address',
      'phoneNumber',
      'notificationSettings',
      'bio',
      'showPublicIdOnly',
      'aiAttachmentIds',
      'paypalEmailId',
      'timezone',
      'gender',
      'country',
      'state',
      'city',
      'zipCode',
      'avatar'
      // 'aiQueries' // REMOVED
    ];

    if (req.user.role === 'admin') {
      publicFields = publicFields.concat(['isActive', 'emailVerified', 'role', 'type', 'email', 'assignedTutors']);
    }

    const fields = _.pick(validate.value, publicFields);
    
    // 2. Logic for Global Tutor Assignment Sync
    // If an admin is updating the global 'assignedTutors' list directly from the form,
    // we use _.assign. If 'assignedTutors' is provided in the body, it will update.
    _.assign(user, fields);
    
    user.countryCode = countryCode;
    await user.save();

    if (fields.password) {
      await Service.User.newPassword(user, fields.password);
    }

    res.locals.update = user;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.me = (req, res, next) => {
  res.locals.me = req.user;
  next();
};

exports.findOne = async (req, res, next) => {
  try {
    const user = await DB.User.findOne({
      _id: req.params.id
    })
    .populate('assignedTutors', 'name _id email avatarUrl userId');

    res.locals.user = user;
    next();
  } catch (e) {
    next(e);
  }
};

/**
 * update user avatar
 */
exports.updateAvatar = async (req, res, next) => {
  try {
    const user = req.params.id ? await DB.User.findOne({ _id: req.params.id }) : req.user;
    if (!user) {
      return next(PopulateResponse.notFound());
    }

    // create thumb for the avatar
    const thumbPath = await Image.resize({
      input: req.file.path,
      width: process.env.AVATAR_SIZE_WIDTH || 250,
      height: process.env.AVATAR_SIZE_HEIGHT || 250,
      resizeOption: '^'
    });
    const update = {
      avatar: thumbPath
    };

    if (process.env.USE_S3 === 'true') {
      const s3Data = await Service.S3.uploadFile(thumbPath, {
        ACL: 'public-read',
        fileName: `avatars/${Helper.String.getFileName(thumbPath)}`
      });
      update.avatar = s3Data.url;
    }

    await DB.User.update(
      { _id: req.params.id || req.user._id },
      {
        $set: update
      }
    );

    // unlink old avatar
    if (user.avatar && !Helper.String.isUrl(user.avatar) && fs.existsSync(path.resolve(user.avatar))) {
      fs.unlinkSync(path.resolve(user.avatar));
    }
    // remove tmp file
    if (fs.existsSync(path.resolve(req.file.path))) {
      fs.unlinkSync(path.resolve(req.file.path));
    }

    // TODO - remove old avatar in S3?
    if (process.env.USE_S3 === 'true' && fs.existsSync(path.resolve(thumbPath))) {
      fs.unlinkSync(path.resolve(thumbPath));
    }

    res.locals.updateAvatar = {
      url: DB.User.getAvatarUrl(update.avatar)
    };

    return next();
  } catch (e) {
    return next(e);
  }
};

exports.search = async (req, res, next) => {
  const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
  const take = parseInt(req.query.take, 10) || 10;

  try {
    const query = Helper.App.populateDbQuery(req.query, {
      text: ['name', 'phoneNumber', 'email', 'username'],
      boolean: ['isActive', 'phoneVerified', 'emailVerified'],
      equal: ['role', 'type']
    });
    if (req.query.user) {
      query.user = req.query.user;
    }
    const sort = Helper.App.populateDBSort(req.query);
    const count = await DB.User.count(query);
    const items = await DB.User.find(query)
      // .collation({ locale: 'en' })
      .sort(sort)
      .skip(page * take)
      .limit(take)
      .exec();

    res.locals.search = {
      count,
      items
    };
    next();
  } catch (e) {
    next(e);
  }
};

// ai query save

exports.getAiQueries = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid userId'
      });
    }

    const user = await DB.User.findById(userId)
      .select('aiQueries')
      .populate('aiQueries.aiAttachmentIds')
      .populate('aiQueries.assignedTutors', 'name email avatar userId');

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: 'User not found'
      });
    }

    return res.json({
      code: 200,
      data: user.aiQueries || []
    });

  } catch (err) {
    return res.status(500).json({
      code: 500,
      message: err.message
    });
  }
};

exports.deleteAiQuery = async (req, res) => {
  await DB.User.updateOne(
    { _id: req.params.userId },
    { $pull: { aiQueries: { _id: req.params.queryId } } }
  );

  res.json({ code: 200 });
};

const baseEmailTemplate = ({ title, subtitle, body }) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:${BRAND.background};font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center" style="padding:40px 16px;">

<table width="600" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.1);">

<!-- HEADER -->
<tr>
<td style="background:${BRAND.dark};padding:24px;text-align:center;">
<img src="${BRAND.logo}" height="40" alt="ExpertBridge" style="display:block;margin:auto;">
</td>
</tr>

<!-- CONTENT -->
<tr>
<td style="padding:32px;color:#111;">
<h2 style="margin-top:0;">${title}</h2>
<p style="color:${BRAND.muted};margin-top:-8px;">${subtitle || ''}</p>
${body}
</td>
</tr>

<!-- FOOTER -->
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


// ================= AI QUERY CREATE =================

exports.sendAiOtp = async (req, res, next) => {
  try {
    const schema = Joi.object({
      email: Joi.string().email().required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) return next(PopulateResponse.validationError(error));

    const email = value.email.toLowerCase().trim();

    // 🚫 BLOCK TUTORS
    const existingUser = await DB.User.findOne({ email });
    if (existingUser && existingUser.type === 'tutor') {
      return next(
        PopulateResponse.error(
          { message: 'Tutors cannot submit AI queries' },
          'ERR_TUTOR_NOT_ALLOWED'
        )
      );
    }

    // block personal emails
    const blockedDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com',
      'outlook.com', 'icloud.com', 'aol.com',
      'protonmail.com'
    ];

    const domain = email.split('@')[1];
    if (blockedDomains.includes(domain)) {
      return next(
        PopulateResponse.error(
          { message: 'Please use your company email address' },
          'INVALID_EMAIL_DOMAIN'
        )
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await DB.EmailOtp.deleteMany({ email });

    await DB.EmailOtp.create({
      email,
      otp,
      type: 'student',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

   const otpEmailHtml = baseEmailTemplate({
  title: 'Verify Your Email',
  subtitle: 'Use the OTP below to continue',
  body: `
    <p>Hello,</p>

    <p>Please use the verification code below:</p>

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

await Service.Mailer.sendRawNow(
  email,
  'Your ExpertBridge Verification Code',
  otpEmailHtml
);


    res.locals.sendAiOtp = PopulateResponse.success(
      { message: 'OTP sent successfully' },
      'OTP_SENT'
    );

    next();
  } catch (e) {
    next(e);
  }
};


/**
 * VERIFY OTP + SUBMIT AI QUERY
 */
exports.verifyAiOtpAndSubmit = async (req, res, next) => {
  try {
    delete req.body.captchaToken;

    const schema = Joi.object({
      email: Joi.string().email().required(),
      otp: Joi.string().length(6).required(),
      query: Joi.string().required(),
      description: Joi.string().required(),
      aiAttachmentIds: Joi.array().items(Joi.string()).optional(),
      lead: Joi.object({
        name: Joi.string().allow('', null),
        phone: Joi.string().allow('', null)
      }).optional()
    });

    const { error, value } = schema.validate(req.body);
    if (error) return next(PopulateResponse.validationError(error));

    const email = value.email.toLowerCase().trim();

    // 🚫 BLOCK TUTORS AGAIN (SAFETY)
    const existingUser = await DB.User.findOne({ email });
    if (existingUser && existingUser.type === 'tutor') {
      return next(
        PopulateResponse.error(
          { message: 'Tutors cannot submit AI queries' },
          'ERR_TUTOR_NOT_ALLOWED'
        )
      );
    }

    const record = await DB.EmailOtp.findOne({
      email,
      otp: value.otp,
      type: 'student'
    });

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

    let user = existingUser;
    if (!user) {
      user = await DB.User.create({
        email,
        name: value.lead?.name || '',
        phoneNumber: value.lead?.phone || '',
        type: 'student',
        role: 'user',
        emailVerified: true,
        aiQueries: []
      });
    } else {
      user.emailVerified = true;
      await user.save();
    }

    await DB.User.updateOne(
      { _id: user._id },
      {
        $push: {
          aiQueries: {
            query: value.query,
            description: value.description,
            aiAttachmentIds: value.aiAttachmentIds || [],
            assignedTutors: []
          }
        }
      }
    );
const adminEmail = process.env.ADMIN_EMAIL ;

const adminHtml = baseEmailTemplate({
  title: 'New AI Query Received',
  subtitle: 'A new lead has been submitted',
  body: `
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Name:</strong> ${value.lead?.name || 'N/A'}</p>
    <p><strong>Phone:</strong> ${value.lead?.phone || 'N/A'}</p>

    <p><strong>Query:</strong></p>
    <p style="background:#F9FAFB;padding:14px;border-radius:8px;">
      ${value.query}
    </p>

    <a href="${BRAND.adminUrl}/users/update/${user._id}"
      style="
        display:inline-block;
        margin-top:20px;
        background:${BRAND.primary};
        color:#fff;
        padding:12px 20px;
        border-radius:8px;
        text-decoration:none;
        font-weight:600;
      ">
      View in Admin Dashboard
    </a>
  `
});

await Service.Mailer.sendRawNow(
  adminEmail,
  '🚀 New  Lead – ExpertBridge',
  adminHtml
);
const userConfirmHtml = baseEmailTemplate({
  title: 'Query Submitted Successfully',
  subtitle: 'We’ll get back to you shortly',
  body: `
    <p>Hello,</p>

    <p>Your query has been successfully submitted to ExpertBridge.</p>

    <p style="background:#F9FAFB;padding:14px;border-radius:8px;">
      ${value.query}
    </p>

    <p>Our team will contact you shortly.</p>
  `
});

await Service.Mailer.sendRawNow(
  email,
  'Your AI Query Has Been Submitted',
  userConfirmHtml
);

    res.locals.verifyAiOtp = PopulateResponse.success(
      { message: 'AI query submitted successfully' },
      'AI_QUERY_SUBMITTED'
    );

    next();
  } catch (e) {
    next(e);
  }
};

exports.addAiQuery = async (req, res, next) => {
  try {
    const schema = Joi.object({
      query: Joi.string().required(),
      description: Joi.string().required(),
      aiAttachmentIds: Joi.array().items(Joi.string()).optional(),
      captchaToken: Joi.string().required() // ✅ REQUIRED
    });

    const { error, value } = schema.validate(req.body);
    if (error) return next(PopulateResponse.validationError(error));

    const user = req.user;

    // 🚫 Tutors blocked
    if (user.type === 'tutor') {
      return next(
        PopulateResponse.error(
          { message: 'Tutors cannot submit AI queries' },
          'ERR_TUTOR_NOT_ALLOWED'
        )
      );
    }

    delete value.captchaToken; // ❌ never store captcha

    await DB.User.updateOne(
      { _id: user._id },
      {
        $push: {
          aiQueries: {
            query: value.query,
            description: value.description,
            aiAttachmentIds: value.aiAttachmentIds || [],
            assignedTutors: []
          }
        }
      }
    );
    const adminEmail = process.env.ADMIN_EMAIL ;

const adminHtml = baseEmailTemplate({
  title: 'New AI Query Received',
  subtitle: 'A new lead has been submitted',
  body: `
   <p><strong>Email:</strong> ${user.email}</p>
<p><strong>Name:</strong> ${user.name || 'N/A'}</p>
<p><strong>Phone:</strong> ${user.phoneNumber || 'N/A'}</p>


    <p><strong>Query:</strong></p>
    <p style="background:#F9FAFB;padding:14px;border-radius:8px;">
      ${value.query}
    </p>

    <a href="${BRAND.adminUrl}/users/update/${user._id}"
      style="
        display:inline-block;
        margin-top:20px;
        background:${BRAND.primary};
        color:#fff;
        padding:12px 20px;
        border-radius:8px;
        text-decoration:none;
        font-weight:600;
      ">
      View in Admin Dashboard
    </a>
  `
});

await Service.Mailer.sendRawNow(
  adminEmail,
  '🚀 New Lead – ExpertBridge',
  adminHtml
);

const userConfirmHtml = baseEmailTemplate({
  title: 'Query Submitted Successfully',
  subtitle: 'We’ll get back to you shortly',
  body: `
    <p>Hello,</p>

    <p>Your query has been successfully submitted to ExpertBridge.</p>

    <p style="background:#F9FAFB;padding:14px;border-radius:8px;">
      ${value.query}
    </p>

    <p>Our team will contact you shortly.</p>
  `
});

await Service.Mailer.sendRawNow(
  user.email,
  'Your AI Query Has Been Submitted',
  userConfirmHtml
);

    res.locals.addAiQuery = { message: 'AI query submitted successfully' };
    next();
  } catch (e) {
    next(e);
  }
};


// controllers/user.controller.js

exports.assignTutorToAiQuery = async (req, res) => {
  try {
    const { userId, queryId } = req.params;
    const { tutorIds } = req.body;

    if (!Array.isArray(tutorIds)) {
      return res.status(400).json({ message: 'tutorIds must be an array' });
    }

    // Convert IDs to ObjectIds to ensure Mongoose matches correctly
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const queryObjectId = new mongoose.Types.ObjectId(queryId);
    const tutorObjectIds = tutorIds.map(id => new mongoose.Types.ObjectId(id));

    // 1. Update the specific query's assigned tutors
    const user = await DB.User.findOneAndUpdate(
      { 
        _id: userObjectId, 
        'aiQueries._id': queryObjectId 
      },
      { 
        $set: { 'aiQueries.$.assignedTutors': tutorObjectIds } 
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User or query not found' });
    }

    // 2. Add these tutors to the global list (avoiding duplicates)
    await DB.User.findByIdAndUpdate(
      userObjectId,
      { 
        $addToSet: { assignedTutors: { $each: tutorObjectIds } } 
      }
    );

    return res.json({ code: 200, message: 'Tutors updated successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.notifyUserAboutAiQuery = async (req, res, next) => {
  try {
    const { userId, queryId } = req.params;

    const user = await DB.User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const query = user.aiQueries.id(queryId);
    if (!query) {
      return res.status(404).json({ message: 'Query not found' });
    }

    const emailHtml = baseEmailTemplate({
      title: 'Update on Your AI Query',
      subtitle: 'Experts Assigned',
      body: `
        <p>Hello ${user.name || 'User'},</p>
        <p>Based on your query:</p>
        <p style="background:#F9FAFB;padding:14px;border-radius:8px;">
          ${query.query}
        </p>
        <p>Our admin team has assigned experts to assist you. Please check your dashboard for more details.</p>
        <a href="${nconf.get('userWebUrl')}users/ai-queries"
          style="
            display:inline-block;
            margin-top:20px;
            background:${BRAND.primary};
            color:#fff;
            padding:12px 20px;
            border-radius:8px;
            text-decoration:none;
            font-weight:600;
          ">
          View Assigned Experts
        </a>
      `
    });

    await Service.Mailer.sendRawNow(
      user.email,
      'Update on Your AI Query - ExpertBridge',
      emailHtml
    );

    res.locals.notifyUser = { message: 'Email sent successfully' };
    return next();
  } catch (e) {
    return next(e);
  }
};







exports.remove = async (req, res, next) => {
  try {
    const user = await DB.User.findOne({ _id: req.params.userId });
    if (!user) {
      return next(PopulateResponse.notFound());
    }

    if (user.role === 'admin') {
      return next(PopulateResponse.forbidden());
    }
    await Service.Mailer.send('admin-delete-student', user.email, {
      subject: 'Admin deleted your profile',
      user: user.getPublicProfile()
    });
    await user.remove();
    res.locals.remove = {
      success: true
    };
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.adminUploadAvatar = async (req, res, next) => {
  try {
    // create thumb for the avatar
    const thumbPath = await Image.resize({
      input: req.file.path,
      width: process.env.AVATAR_SIZE_WIDTH || 250,
      height: process.env.AVATAR_SIZE_HEIGHT || 250,
      resizeOption: '^'
    });

    if (process.env.USE_S3 === 'true') {
      const s3Data = await Service.S3.uploadFile(thumbPath, {
        ACL: 'public-read',
        fileName: `avatars/${Helper.String.getFileName(thumbPath)}`
      });
      update.avatar = s3Data.url;
    }

    // remove tmp file
    if (fs.existsSync(path.resolve(req.file.path))) {
      fs.unlinkSync(path.resolve(req.file.path));
    }

    // TODO - remove old avatar in S3?
    if (process.env.USE_S3 === 'true' && fs.existsSync(path.resolve(thumbPath))) {
      fs.unlinkSync(path.resolve(thumbPath));
    }

    res.locals.adminUploadAvatar = {
      avatar: thumbPath,
      url: `${process.env.baseUrl}${thumbPath.replace(/^public\/?/, '')}`
    };

    return next();
  } catch (e) {
    return next(e);
  }
};

exports.deleteAvatar = async (req, res, next) => {
  try {
    const user = req.params.id ? await DB.User.findOne({ _id: req.params.id }) : req.user;
    if (!user) {
      return next(PopulateResponse.notFound());
    }

    const update = {
      avatar: ''
    };

    await DB.User.update(
      { _id: req.params.id || req.user._id },
      {
        $set: update
      }
    );

    // unlink old avatar
    if (user.avatar && !Helper.String.isUrl(user.avatar) && fs.existsSync(path.resolve(user.avatar))) {
      fs.unlinkSync(path.resolve(user.avatar));
    }

    res.locals.deleteAvatar = {
      success: true
    };

    return next();
  } catch (e) {
    return next(e);
  }
};

exports.changeEmail = async (req, res, next) => {
  const schema = Joi.object().keys({
    email: Joi.string().email().required()
  });

  const validate = Joi.validate(req.body, schema);
  if (validate.error) {
    return next(PopulateResponse.validationError(validate.error));
  }

  try {
    if (req.user.type !== 'student') {
      return next(
        PopulateResponse.error(
          {
            message: 'Tutors can not change email'
          },
          'CAN_NOT_CHANGE_EMAIL'
        )
      );
    }
    const count = await DB.User.count({
      email: validate.value.email.toLowerCase()
    });

    if (count) {
      return next(
        PopulateResponse.error(
          {
            message: 'This email address is already taken'
          },
          'CAN_NOT_CHANGE_EMAIL'
        )
      );
    }
    req.user.emailVerified = false;
    req.user.emailVerifiedToken = Helper.String.randomString(48);
    req.user.email = req.body.email;
    await Service.Mailer.send('verify-email', req.body.email, {
      userName: req.user.name,
      isSignup: false,
      subject: 'Verify email address',
      emailVerifyLink: url.resolve(nconf.get('baseUrl'), `v1/auth/verifyEmail/${req.user.emailVerifiedToken}`)
    });
    await req.user.save();
    res.locals.changeEmail = { sendMail: true };
    return next();
  } catch (e) {
    return next(e);
  }
};
