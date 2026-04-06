const Joi = require('joi');

const validateSchema = Joi.object().keys({
  name: Joi.string().required(),
  alias: Joi.string().allow([null, '']).optional(),
  description: Joi.string().allow([null, '']).optional(),
  ordering: Joi.number().allow([null, '']).optional(),
  isActive: Joi.boolean().optional()
});

exports.findOne = async (req, res, next) => {
  try {
    const id = req.params.industryId;
    const industry = await DB.Industry.findOne({ _id: id });
    if (!industry) {
      return res.status(404).send(PopulateResponse.notFound());
    }
    req.industry = industry;
    res.locals.industry = industry;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.create = async (req, res, next) => {
  try {
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }
    let alias = validate.value.alias || Helper.String.createAlias(validate.value.name);
    const dup = await DB.Industry.count({ $or: [{ alias }, { name: validate.value.name }] });
    if (dup) {
      return next(PopulateResponse.error({ message: 'Industry already exists' }));
    }
    const industry = new DB.Industry(Object.assign(validate.value, { alias }));
    await industry.save();
    res.locals.create = industry;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }
    const industry = await DB.Industry.findOne({ _id: req.params.industryId });
    if (!industry) {
      return res.status(404).send(PopulateResponse.notFound());
    }
    let alias = validate.value.alias || Helper.String.createAlias(validate.value.name);
    const dup = await DB.Industry.count({ _id: { $ne: industry._id }, $or: [{ alias }, { name: validate.value.name }] });
    if (dup) {
      return next(PopulateResponse.error({ message: 'Industry already exists' }));
    }
    Object.assign(industry, validate.value, { alias });
    await industry.save();
    res.locals.update = industry;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const industry = await DB.Industry.findOne({ _id: req.params.industryId });
    if (!industry) {
      return res.status(404).send(PopulateResponse.notFound());
    }
    await industry.remove();
    res.locals.remove = { success: true };
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.list = async (req, res, next) => {
  const page = Math.max(0, req.query.page - 1) || 0;
  const take = parseInt(req.query.take, 10) || 10;
  try {
    const query = Helper.App.populateDbQuery(req.query, { text: ['name', 'alias'], boolean: ['isActive'] });
    const sort = Helper.App.populateDBSort(req.query);
    // Post-based industry sync removed (2026-04-06) — industries now use GICS taxonomy

    const count = await DB.Industry.count(query);
    const items = await DB.Industry.find(query)
      .collation({ locale: 'en' })
      .sort(sort)
      .skip(page * take)
      .limit(take)
      .exec();
    res.locals.list = { count, items };
    return next();
  } catch (e) {
    return next(e);
  }
};
