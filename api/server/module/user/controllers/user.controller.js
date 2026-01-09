const _ = require('lodash');
const Joi = require('joi');
const fs = require('fs');
const path = require('path');
const Image = require('../../media/components/image');
const url = require('url');
const nconf = require('nconf');
const mongoose = require('mongoose');

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

    // prevent mongoose hook create new pw
    if (!validate.value.password) {
      delete validate.value.password;
    }
    let countryCode = '';
    if (validate.value.country) {
      countryCode = validate.value.country.code || '';
    }

    const user = req.params.id ? await DB.User.findOne({ _id: req.params.id }) : req.user;
    let publicFields = [
      'name',
      'password',
      'address',
      'phoneNumber',
      'notificationSettings',
      'bio',
      'aiAttachmentIds',
      'paypalEmailId',
      'timezone',
      'gender',
      'country',
      'state',
      'city',
      'zipCode',
      'avatar',
      'aiQueries'
    ];
    if (req.user.role === 'admin') {
      publicFields = publicFields.concat(['isActive', 'emailVerified', 'role', 'type', 'email', 'assignedTutors']);
    }

    const fields = _.pick(validate.value, publicFields);
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
    .populate('assignedTutors', 'name _id email avatarUrl');

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
      .populate('aiQueries.assignedTutors', 'name email avatar');

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



// ================= AI QUERY CREATE =================
exports.addAiQuery = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { query, description, aiAttachmentIds = [] } = req.body;

    const user = await DB.User.findByIdAndUpdate(
      userId,
      {
        $push: {
          aiQueries: {
            query,
            description,
            aiAttachmentIds,
            assignedTutors: []
          }
        }
      },
      { new: true }
    );

    if (!user) {
      return next(PopulateResponse.notFound());
    }

    res.locals.aiQuery = {
      success: true
    };

    return next();
  } catch (err) {
    return next(err);
  }
};



// controllers/user.controller.js

exports.assignTutorToAiQuery = async (req, res) => {
  try {
    const { userId, queryId } = req.params;
    const { tutorIds } = req.body;

    if (!Array.isArray(tutorIds)) {
      return res.status(400).json({
        code: 400,
        message: 'tutorIds must be an array'
      });
    }

    const user = await DB.User.findOneAndUpdate(
      {
        _id: userId,
        'aiQueries._id': queryId
      },
      {
        $set: {
          'aiQueries.$.assignedTutors': tutorIds
        }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: 'User or query not found'
      });
    }

    return res.json({
      code: 200,
      message: 'Tutors updated successfully'
    });

  } catch (err) {
    return res.status(500).json({
      code: 500,
      message: err.message
    });
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
