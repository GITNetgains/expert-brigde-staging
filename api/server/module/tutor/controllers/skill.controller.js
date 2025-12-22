const Joi = require('joi');

const validateSchema = Joi.object().keys({
  name: Joi.string().required(),
  alias: Joi.string().allow([null, '']).optional(),
  description: Joi.string().allow([null, '']).optional(),
  type: Joi.string().allow([null, '']).optional(),
  ordering: Joi.number().allow([null, '']).optional()
});

exports.findOne = async (req, res, next) => {
  try {
    const id = req.params.skillId;
    const skill = await DB.Skill.findOne({ _id: id });
    if (!skill) {
      return res.status(404).send(PopulateResponse.notFound());
    }
    req.skill = skill;
    res.locals.skill = skill;
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
    const dup = await DB.Skill.count({ $or: [{ alias }, { name: validate.value.name }] });
    if (dup) {
      return next(PopulateResponse.error({ message: 'Skill already exists' }));
    }
    const skill = new DB.Skill(Object.assign(validate.value, { alias }));
    await skill.save();
    res.locals.create = skill;
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
    const skill = await DB.Skill.findOne({ _id: req.params.skillId });
    if (!skill) {
      return res.status(404).send(PopulateResponse.notFound());
    }
    let alias = validate.value.alias || Helper.String.createAlias(validate.value.name);
    const dup = await DB.Skill.count({ _id: { $ne: skill._id }, $or: [{ alias }, { name: validate.value.name }] });
    if (dup) {
      return next(PopulateResponse.error({ message: 'Skill already exists' }));
    }
    Object.assign(skill, validate.value, { alias });
    await skill.save();
    res.locals.update = skill;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const skill = await DB.Skill.findOne({ _id: req.params.skillId });
    if (!skill) {
      return res.status(404).send(PopulateResponse.notFound());
    }
    await skill.remove();
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
    const query = Helper.App.populateDbQuery(req.query, { text: ['name', 'alias'] });
    const sort = Helper.App.populateDBSort(req.query);
    const count = await DB.Skill.count(query);
    const items = await DB.Skill.find(query)
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
