const _ = require('lodash');
const Joi = require('joi');
const dto = require('../dto.js');
const { getLanguageName } = require('../index');
const { PLATFORM_ONLINE } = require('../../meeting/index.js');

/**
 * =========================
 * VALIDATION SCHEMA
 * =========================
 */
const validateSchema = Joi.object().keys({
  name: Joi.string().required(),
  username: Joi.string().allow([null, '']).optional(),

  // ✅ SKILLS ADDED
  skillIds: Joi.array().items(Joi.string()).optional().default([]),

  email: Joi.string().email().required(),
  password: Joi.string().allow([null, '']).optional(),
  isActive: Joi.boolean().allow(null).optional(),
  emailVerified: Joi.boolean().allow(null).optional(),
  phoneNumber: Joi.string().allow([null, '']).optional(),
  phoneVerified: Joi.boolean().allow(null).optional(),
  address: Joi.string().allow([null, '']).optional(),
  bio: Joi.string().allow([null, '']).optional(),
  subjectIds: Joi.array().items(Joi.string()).allow([null, '']).optional().default([]),
  certificatedTeacher: Joi.boolean().allow(null).optional(),
  languages: Joi.array().items(Joi.string()).optional(),
  grades: Joi.array().items(Joi.string()).optional().default([]),
  highlights: Joi.array().items(Joi.string()).optional().default([]),
  workHistory: Joi.array().items(Joi.string()).optional().default([]),
  timezone: Joi.string().allow([null, '']).optional(),
  isHomePage: Joi.boolean().allow(null).optional(),
  zipCode: Joi.string().allow([null, '']).optional(),
  idYoutube: Joi.string().allow([null, '']).optional(),
  country: Joi.object().allow(null).optional(),
  featured: Joi.boolean().allow(null).optional(),
  gender: Joi.string().allow([null, '']).optional(),
  yearsExperience: Joi.number().min(0).optional(),
  consultationFee: Joi.number().min(0).optional(),
  industryIds: Joi.array().items(Joi.string()).optional().default([]),
  price1On1Class: Joi.number().allow([null, '']).optional(),
  avatar: Joi.string().allow([null, '']).optional(),
  paypalEmailId: Joi.string().allow([null, '']).optional(),
  commissionRate: Joi.number().allow([null, '']).optional(),
  state: Joi.string().allow([null, '']).optional(),
  city: Joi.string().allow([null, '']).optional(),
  introYoutubeId: Joi.string().allow([null, '']).optional(),
  introVideoId: Joi.string().allow([null, '']).optional(),
  defaultSlotDuration: Joi.number().allow([null, '']).optional(),
  role: Joi.string().allow([null, '']).optional(),
  type: Joi.string().allow([null, '']).optional()
});

/**
 * =========================
 * FIND ONE
 * =========================
 */
exports.findOne = async (req, res, next) => {
  try {
    const query = Helper.App.isMongoId(req.params.tutorId)
      ? { _id: req.params.tutorId }
      : { username: req.params.tutorId };

    let excludeFields = {};
    if ((req.user && req.user.role !== 'admin') || !req.user) {
      excludeFields = {
        zoomAccountInfo: 0,
        availableTimeRange: 0,
        certificationDocument: 0,
        resumeDocument: 0,
        issueDocument: 0,
        commissionRate: 0,
        address: 0,
        email: 0,
        phoneNumber: 0
      };
    }

    const tutor = await DB.User.findOne(query, excludeFields)
      .populate({ path: 'education', populate: { path: 'document' } })
      .populate({ path: 'experience', populate: { path: 'document' } })
      .populate({ path: 'certification', populate: { path: 'document' } })
      .populate({ path: 'gradeItems', select: '_id name alias' })
      .populate('issueDocument')
      .populate('resumeDocument')
      .populate('certificationDocument')
      .populate({ path: 'categories', select: '_id name alias' })
      .populate({ path: 'subjects', select: '_id name alias' })
      .populate({ path: 'skills', select: '_id name alias' })
      .populate({ path: 'industries', select: '_id name alias' })
      .populate('introVideo');

    if (!tutor) {
      return res.status(404).send(PopulateResponse.notFound());
    }

    req.tutor = tutor;
    let resp = tutor;

    if (
      (req.user &&
        (req.user.role === 'user' ||
          (req.user.role === 'tutor' &&
            req.user._id.toString() !== tutor._id.toString()))) ||
      !req.user
    ) {
      resp = dto.toResponse(tutor);
    } else {
      resp = dto.toResponse(tutor, true, true);
    }

    if (req.user) {
      const favorite = await DB.Favorite.findOne({
        userId: req.user._id,
        tutorId: resp._id
      });
      if (favorite) {
        resp.isFavorite = true;
      }
    }

    if (resp.languages && resp.languages.length) {
      resp.languageNames = resp.languages.map(lang => getLanguageName(lang));
    }

    if (resp.country && resp.country.code) {
      resp.country.flag = new URL(
        `flags-png/${resp.country.code.toLowerCase()}.png`,
        process.env.baseUrl
      ).href;
    }

    res.locals.tutor = resp;
    return next();
  } catch (e) {
    return next(e);
  }
};

/**
 * =========================
 * CREATE
 * =========================
 */
exports.create = async (req, res, next) => {
  try {
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    const emailCheck = await DB.User.count({ email: validate.value.email });
    if (emailCheck) {
      return next(
        PopulateResponse.error({
          email: 'This email is already in use',
          message: 'This email is already in use'
        })
      );
    }

    let username = validate.value.username
      ? Helper.String.createAlias(validate.value.username)
      : Helper.String.createAlias(validate.value.name);

    const count = await DB.User.count({ username });
    if (count) {
      username = `${username}-${Helper.String.randomString(5)}`;
    }

    let countryCode = '';
    if (validate.value.country) {
      countryCode = validate.value.country.code || '';
    }

    const tutor = await Service.User.create(
      Object.assign(validate.value, {
        username,
        countryCode,
        type: 'tutor',
        rejected: false,
        pendingApprove: false,
        skillIds: _.uniq(validate.value.skillIds || []),
        highlights: _.uniq(validate.value.highlights || []),
        workHistory: _.uniq(validate.value.workHistory || [])
      })
    );

    res.locals.tutor = tutor;
    return next();
  } catch (e) {
    return next(e);
  }
};

/**
 * =========================
 * UPDATE
 * =========================
 */
exports.update = async (req, res, next) => {
  try {
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    const tutor = req.params.tutorId
      ? await DB.User.findOne({ _id: req.params.tutorId })
      : req.user;

    Object.assign(tutor, validate.value);

    // ✅ SKILLS UPDATE
    if (validate.value.skillIds) {
      tutor.skillIds = _.uniq(validate.value.skillIds);
      tutor.markModified('skillIds');
    }
    if (validate.value.highlights) {
  tutor.highlights = _.uniq(validate.value.highlights);
  tutor.markModified('highlights');
}

if (validate.value.workHistory) {
  tutor.workHistory = _.uniq(validate.value.workHistory);
  tutor.markModified('workHistory');
}

    if (validate.value.subjectIds) {
      tutor.subjectIds = _.uniq(validate.value.subjectIds);
      tutor.markModified('subjectIds');
    }

    if (validate.value.industryIds) {
      tutor.industryIds = _.uniq(validate.value.industryIds);
      tutor.markModified('industryIds');
    }

    if (validate.value.languages) {
      tutor.languages = _.uniq(validate.value.languages);
      tutor.markModified('languages');
    }

    if (validate.value.grades) {
      tutor.grades = _.uniq(validate.value.grades);
      tutor.markModified('grades');
    }

  if (validate.value.country) {
    tutor.countryCode = validate.value.country.code || '';
  }

  

    await tutor.save();

    if (validate.value.password) {
      await Service.User.newPassword(tutor, validate.value.password);
    }

    res.locals.update = tutor;
    return next();
  } catch (e) {
    return next();
  }
};

/**
 * =========================
 * LIST
 * =========================
 */
exports.list = async (req, res, next) => {
  const page = Math.max(0, req.query.page - 1) || 0;
  const take = parseInt(req.query.take, 10) || 10;

  try {
    const query = Helper.App.populateDbQuery(req.query, {
      text: ['name', 'email', 'zipCode', 'state', 'city'],
      equal: ['isActive', 'isHomePage', 'countryCode', 'state'],
      boolean: ['rejected', 'featured', 'pendingApprove']
    });

    query.type = 'tutor';

    if (req.user && req.user.role === 'user') {
      if (req.user.assignedTutors && req.user.assignedTutors.length) {
        query._id = { $in: req.user.assignedTutors };
      } else {
        query._id = { $in: [] };
      }
    }

    // ✅ SKILL FILTER
    if (req.query.skillIds) {
      query.skillIds = { $in: req.query.skillIds.split(',') };
    }

    if (req.query.subjectIds) {
      query.subjectIds = { $in: req.query.subjectIds.split(',') };
    }

    if (req.query.categoryIds) {
      query.categoryIds = { $in: req.query.categoryIds.split(',') };
    }

    if (req.query.industryIds) {
      query.industryIds = { $in: req.query.industryIds.split(',') };
    }

    if (req.query.rating) {
      const rating = parseFloat(req.query.rating);
      if (!Number.isNaN(rating)) {
        query.ratingAvg = { $gte: rating };
      }
    }

    if (req.query.yearsExperience) {
      const yearsExp = parseInt(req.query.yearsExperience, 10);
      if (!Number.isNaN(yearsExp)) {
        query.yearsExperience = { $gte: yearsExp };
      }
    }

    const minFeeRaw = req.query.minConsultationFee;
    const maxFeeRaw = req.query.maxConsultationFee;
    const minFee = minFeeRaw !== undefined && minFeeRaw !== '' ? parseFloat(minFeeRaw) : undefined;
    const maxFee = maxFeeRaw !== undefined && maxFeeRaw !== '' ? parseFloat(maxFeeRaw) : undefined;
    const hasMin = Number.isFinite(minFee);
    const hasMax = Number.isFinite(maxFee);
    if (hasMin || hasMax) {
      query.consultationFee = {};
      if (hasMin) query.consultationFee.$gte = minFee;
      if (hasMax) query.consultationFee.$lte = maxFee;
    }

    if (!req.user || req.user.role !== 'admin') {
      query.isActive = true;
      query.rejected = false;
      query.emailVerified = true;

      const isZoomPlatform = await Service.Meeting.isPlatform(
        PLATFORM_ONLINE.ZOOM_US
      );
      if (isZoomPlatform) {
        query.$or = [
          { isZoomAccount: true },
          { isZoomAccount: { $exists: false } }
        ];
      }
    }

    const sort = Helper.App.populateDBSort(req.query);
    const count = await DB.User.count(query);

    const items = await DB.User.find(query)
      .populate({ path: 'subjects', select: '_id name alias price' })
      .populate({ path: 'skills', select: '_id name alias' })
      .populate({ path: 'industries', select: '_id name alias' })
      .populate({ path: 'gradeItems', select: '_id name alias' })
      .sort(sort)
      .skip(page * take)
      .limit(take)
      .exec();

    res.locals.list = { count, items };
    next();
  } catch (e) {
    next();
  }
};

/**
 * =========================
 * CHANGE STATUS
 * =========================
 */
exports.changeStatus = async (req, res, next) => {
  try {
    req.tutor.isActive = !req.tutor.isActive;
    await req.tutor.save();
    res.locals.changeStatus = { success: true };
    return next();
  } catch (e) {
    return next(e);
  }
};

/**
 * =========================
 * REMOVE
 * =========================
 */
exports.remove = async (req, res, next) => {
  try {
    await req.tutor.remove();
    res.locals.remove = { success: true };
    return next();
  } catch (e) {
    return next(e);
  }
};
