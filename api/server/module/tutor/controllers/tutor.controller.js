const fs = require('fs');
const util = require('util');
const _ = require('lodash');
const Joi = require('joi');
const dto = require('../dto.js');
const { getLanguageName } = require('../index');
const { PLATFORM_ONLINE } = require('../../meeting/index.js');

/** Write to stdout so it shows in PM2 logs. */
function pm2Log(...args) {
  const msg = util.format(...args) + '\n';
  try {
    fs.writeSync(1, msg);
  } catch (e) {
    console.log(...args);
  }
}
/** Same for stderr. */
function pm2Error(...args) {
  const msg = util.format(...args) + '\n';
  try {
    fs.writeSync(2, msg);
  } catch (e) {
    console.error(...args);
  }
}

/**
 * =========================
 * VALIDATION SCHEMA
 * =========================
 */
const validateSchema = Joi.object().keys({
  username: Joi.string().allow([null, '']).optional(),
  name: Joi.string().allow([null, '']).optional(),
  // ✅ SKILLS ADDED
  skillIds: Joi.array().items(Joi.string()).optional().default([]),

  email: Joi.string().email().allow([null, '']).optional(),
  password: Joi.string().allow([null, '']).optional(),
  isActive: Joi.boolean().allow(null).optional(),
  emailVerified: Joi.boolean().allow(null).optional(),
  phoneNumber: Joi.string().allow([null, '']).optional(),
  phoneVerified: Joi.boolean().allow(null).optional(),
  showPublicIdOnly: Joi.boolean().allow(null).optional(),
  address: Joi.string().allow([null, '']).optional(),
  bio: Joi.string().allow([null, '']).optional(),
  subjectIds: Joi.array().items(Joi.string()).allow([null, '']).optional().default([]),
  certificatedTeacher: Joi.boolean().allow(null).optional(),
  languages: Joi.array().items(Joi.string()).optional(),
  grades: Joi.array().items(Joi.string()).optional().default([]),
  highlights: Joi.array().items(Joi.string()).optional().default([]),
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
  issueDocument: Joi.string().allow([null, '']).optional(),
  resumeDocument: Joi.string().allow([null, '']).optional(),
  certificationDocument: Joi.string().allow([null, '']).optional(),
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
        // Keep commissionRate so frontend can calculate final price consistently
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
        highlights: _.uniq(validate.value.highlights || [])
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

    if ('bio' in validate.value) {
      tutor.markModified('bio');
    }

    // ✅ SKILLS UPDATE
    if (validate.value.skillIds) {
      tutor.skillIds = _.uniq(validate.value.skillIds);
      tutor.markModified('skillIds');
    }
    if (validate.value.highlights) {
  tutor.highlights = _.uniq(validate.value.highlights);
  tutor.markModified('highlights');
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

    // ======================================================
    // PROFILE EDIT WEBHOOK - Reverse sync to PostgreSQL
    // Fire-and-forget: don't block the response
    // ======================================================
    try {
      const updatedFieldNames = Object.keys(validate.value);
      // Only fire webhook if meaningful fields changed (not just password)
      const syncableFields = ['bio', 'phoneNumber', 'city', 'state', 'country',
        'yearsExperience', 'highlights', 'languages', 'skillIds', 'industryIds',
        'name', 'email', 'timezone', 'consultationFee'];
      const hasSync = updatedFieldNames.some(f => syncableFields.includes(f));

      if (hasSync) {
        const webhookPayload = {
          source: 'profile_edit',
          mongo_user_id: String(tutor._id),
          email: tutor.email,
          name: tutor.name || null,
          bio: tutor.bio || null,
          phone: tutor.phoneNumber || null,
          city: tutor.city || null,
          state: tutor.state || null,
          country: (tutor.country && tutor.country.name) ? tutor.country.name : (typeof tutor.country === 'string' ? tutor.country : null),
          country_code: tutor.countryCode || null,
          yearsExperience: tutor.yearsExperience || null,
          highlights: tutor.highlights || [],
          languages: tutor.languages || [],
          consultation_fee: tutor.consultationFee || null,
          timezone: tutor.timezone || null,
          updated_fields: updatedFieldNames
        };

        pm2Log('[PROFILE-EDIT-WEBHOOK] Syncing profile edit to PostgreSQL for', tutor.email,
          'fields:', updatedFieldNames.join(', '));

        // Fire-and-forget (don't await, don't block)
        const fetch = (await import('node-fetch')).default;
        fetch(REVERSE_SYNC_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': REVERSE_SYNC_API_KEY
          },
          body: JSON.stringify(webhookPayload)
        }).then(function(resp) {
          pm2Log('[PROFILE-EDIT-WEBHOOK] Response:', resp.status, resp.ok ? 'OK' : 'FAILED');
        }).catch(function(err) {
          pm2Error('[PROFILE-EDIT-WEBHOOK] Error (non-blocking):', err && err.message ? err.message : err);
        });
      }
    } catch (webhookError) {
      // Never fail the main request if webhook fails
      pm2Error('[PROFILE-EDIT-WEBHOOK] Setup error:', webhookError && webhookError.message ? webhookError.message : webhookError);
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

    // ✅ Filter by specific tutor IDs (e.g. from AI query "view assigned experts")
    if (req.query.ids) {
      const requestedIds = req.query.ids.split(',').map((s) => s.trim()).filter(Boolean);
      if (requestedIds.length) {
        if (req.user && req.user.role === 'user' && req.user.assignedTutors && req.user.assignedTutors.length) {
          const allowedSet = new Set(req.user.assignedTutors.map(String));
          const filtered = requestedIds.filter((id) => allowedSet.has(String(id)));
          query._id = { $in: filtered };
        } else {
          query._id = { $in: requestedIds };
        }
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

  const minFeeRaw = req.query.minPrice1On1Class;
const maxFeeRaw = req.query.maxPrice1On1Class;

const minFee =
  minFeeRaw !== undefined && minFeeRaw !== '' ? parseFloat(minFeeRaw) : undefined;
const maxFee =
  maxFeeRaw !== undefined && maxFeeRaw !== '' ? parseFloat(maxFeeRaw) : undefined;

const hasMin = Number.isFinite(minFee);
const hasMax = Number.isFinite(maxFee);

if (hasMin || hasMax) {
  query.price1On1Class = {};
  if (hasMin) query.price1On1Class.$gte = minFee;
  if (hasMax) query.price1On1Class.$lte = maxFee;
}


    if (!req.user || req.user.role !== 'admin') {
      query.isActive = true;
      query.rejected = false;
      query.emailVerified = true;

      // isZoomAccount filter removed - experts no longer need Zoom accounts
    }

    const sort = Helper.App.populateDBSort(req.query);
    const count = await DB.User.count(query);

    const items = await DB.User.find(query)
      .populate({ path: 'subjects', select: '_id name alias price' })
      .populate({ path: 'skills', select: '_id name alias' })
      .populate({ path: 'industries', select: '_id name alias' })
      .populate({ path: 'gradeItems', select: '_id name alias' })
      .populate({ path: 'experience', select: 'title organization fromYear toYear' })
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
    // Capture user data BEFORE deletion for webhook
    const deletedEmail = req.tutor.email;
    const deletedMongoId = String(req.tutor._id);
    const deletedName = req.tutor.name || '';

    await req.tutor.remove();
    res.locals.remove = { success: true };

    // [DELETE-WEBHOOK] Notify PostgreSQL to archive the candidate record
    try {
      const fetch = (await import('node-fetch')).default;
      const webhookPayload = {
        action: 'ARCHIVE',
        email: deletedEmail,
        mongo_user_id: deletedMongoId,
        name: deletedName,
        source: 'admin_delete_tutor'
      };
      pm2Log('[DELETE-WEBHOOK] Archiving tutor in PostgreSQL:', deletedEmail);
      fetch(REVERSE_SYNC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': REVERSE_SYNC_API_KEY
        },
        body: JSON.stringify(webhookPayload)
      }).then(function(r) {
        pm2Log('[DELETE-WEBHOOK] Response status:', r.status);
      }).catch(function(err) {
        pm2Error('[DELETE-WEBHOOK] Error (non-blocking):', err.message);
      });
    } catch (webhookErr) {
      pm2Error('[DELETE-WEBHOOK] Setup error (non-blocking):', webhookErr.message);
    }

    return next();
  } catch (e) {
    return next(e);
  }
};

const EXPERT_REGISTRATION_WEBHOOK_URL = 'http://13.205.83.59:5678/webhook/expert-registration';

// REVERSE SYNC: Expert profile edits -> PostgreSQL
const REVERSE_SYNC_URL = 'http://13.205.83.59:8002/sync/expert-from-mongo';
const REVERSE_SYNC_API_KEY = 'expertbridge-reverse-sync-m7n3p5';
const EXPERT_REGISTRATION_WEBHOOK_API_KEY = 'expertbridge-cv-ingestion-a7f3e9b2d4c1';

/**
 * =========================
 * SEND CV WEBHOOK (profile dashboard)
 * =========================
 * Called when tutor updates name/CV URL from profile and wants to resend data to external system.
 * Body: { name: string, cv_file_url: string }
 */
exports.sendCvWebhook = async (req, res, next) => {
  try {
    const schema = Joi.object({
      name: Joi.string().allow('').optional(),
      cv_file_url: Joi.string().min(1).required()
    });
    const { error, value } = schema.validate(req.body);
    if (error) {
      return next(PopulateResponse.validationError(error));
    }

    const user = req.user;
    if (!user || user.type !== 'tutor') {
      return next(PopulateResponse.error({ message: 'Only experts can use this' }, 'ERR_FORBIDDEN'));
    }

    // Rewrite localhost API URLs to public URL so n8n (Docker) can reach them
    let cvFileUrl = value.cv_file_url;
    if (cvFileUrl && cvFileUrl.includes('localhost:9000')) {
      cvFileUrl = cvFileUrl
        .replace('http://localhost:9000', 'https://api.expertbridge.co')
        .replace('/public/documents/', '/documents/');
    }

    const webhookBody = {
      source: 'profile_dashboard',
      mongo_user_id: String(user._id),
      email: user.email,
      name: value.name != null && value.name !== '' ? value.name : user.name,
      cv_file_url: cvFileUrl
    };

    pm2Log('[CV-WEBHOOK] Profile dashboard: calling expert-registration webhook', JSON.stringify({
      url: EXPERT_REGISTRATION_WEBHOOK_URL,
      body: webhookBody
    }));

    const fetch = (await import('node-fetch')).default;
    const resp = await fetch(EXPERT_REGISTRATION_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': EXPERT_REGISTRATION_WEBHOOK_API_KEY
      },
      body: JSON.stringify(webhookBody)
    });

    const responseText = await resp.text();

    if (!resp.ok) {
      pm2Error('[CV-WEBHOOK] Profile dashboard: webhook failed', JSON.stringify({
        status: resp.status,
        statusText: resp.statusText,
        body: responseText
      }));
      return next(
        PopulateResponse.error(
          { message: `Webhook returned ${resp.status}: ${responseText || resp.statusText}` },
          'ERR_WEBHOOK_FAILED'
        )
      );
    }

    pm2Log('[CV-WEBHOOK] Profile dashboard: webhook successful', JSON.stringify({
      status: resp.status,
      ok: resp.ok,
      response: responseText || '(empty)'
    }));

    res.locals.sendCvWebhook = { success: true, message: 'CV data sent successfully' };
    return next();
  } catch (e) {
    pm2Error('[CV-WEBHOOK] Profile dashboard: error', e && e.message ? e.message : e);
    return next(e);
  }
};