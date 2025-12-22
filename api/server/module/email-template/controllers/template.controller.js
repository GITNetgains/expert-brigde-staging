const _ = require('lodash');
const Joi = require('joi');

const validateSchema = Joi.object().keys({
  subject: Joi.string().required(),
  content: Joi.string().allow([null, '']).optional()
});

exports.findOne = async (req, res, next) => {
  try {
    const id = req.params.id || req.params.emailTemplateId || req.body.emailTemplateId;
    if (!id) {
      return next(PopulateResponse.validationError());
    }
    const emailTemplate = await DB.EmailTemplate.findOne({ _id: id });
    if (!emailTemplate) {
      return res.status(404).send(PopulateResponse.notFound());
    }

    req.emailTemplate = emailTemplate;
    res.locals.emailTemplate = emailTemplate;
    return next();
  } catch (e) {
    return next(e);
  }
};

/**
 * Create a new emailTemplate
 */
exports.create = async (req, res, next) => {
  try {
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    let alias = req.body.alias ? Helper.String.createAlias(req.body.alias) : Helper.String.createAlias(req.body.name);
    const count = await DB.EmailTemplate.count({ alias });
    if (count) {
      alias = `${alias}-${Helper.String.randomString(5)}`;
    }

    const emailTemplate = new DB.EmailTemplate(validate.value);
    await emailTemplate.save();

    res.locals.emailTemplate = emailTemplate;
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
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    Object.assign(req.emailTemplate, validate.value);
    await req.emailTemplate.save();
    res.locals.update = req.emailTemplate;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await req.emailTemplate.remove();

    res.locals.remove = {
      message: 'Email template is deleted'
    };
    next();
  } catch (e) {
    next(e);
  }
};

/**
 * get list emailTemplate
 */
exports.list = async (req, res, next) => {
  const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
  const take = parseInt(req.query.take, 10) || 10;

  try {
    const query = Helper.App.populateDbQuery(req.query, {
      text: ['name', 'subject', 'description'],
      equal: ['group']
    });

    const sort = Helper.App.populateDBSort(req.query);
    const count = await DB.EmailTemplate.count(query);
    let items = await DB.EmailTemplate.find(query)
      .sort(sort)
      .skip(page * take)
      .limit(take)
      .exec();

    res.locals.list = { count, items };
    next();
  } catch (e) {
    next(e);
  }
};
