const _ = require('lodash');
const Joi = require('joi');

const validateSchema = Joi.object().keys({
  originalCategoryId: Joi.string().required(),
  isActive: Joi.boolean().allow(null, '').optional(),
  tutorId: Joi.string().allow([null, '']).optional()
});

exports.findOne = async (req, res, next) => {
  try {
    const myCategory = await DB.MyCategory.findOne({ _id: req.params.id, isDeleted: false });
    if (!myCategory) {
      return res.status(404).send(PopulateResponse.notFound());
    }
    req.myCategory = myCategory;
    res.locals.category = myCategory;
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
    const category = await DB.Category.findOne({ _id: validate.value.originalCategoryId });
    if (!category) {
      return next(PopulateResponse.notFound({ message: 'Category not found' }));
    }
    const tutorId = req.user.role === 'admin' && req.body.tutorId ? req.body.tutorId : req.user._id;
    let myCategory = await DB.MyCategory.findOne({
      originalCategoryId: validate.value.originalCategoryId,
      tutorId: tutorId,
      isDeleted: false
    });
    if (myCategory) {
      return next(PopulateResponse.error({ message: 'The category name you have selected is duplicated!' }));
    }

    myCategory = new DB.MyCategory({ ...req.body, alias: category.alias, name: category.name, tutorId: tutorId });
    await myCategory.save();
    await DB.User.update(
      {
        _id: tutorId
      },
      {
        $addToSet: {
          categoryIds: {
            $each: [category._id]
          }
        }
      }
    );
    res.locals.category = myCategory;
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
    _.merge(req.myCategory, req.body);
    await req.myCategory.save();

    await DB.User.update(
      {
        _id: req.myCategory.tutorId
      },

      {
        ...(!req.myCategory.isActive
          ? {
              $pull: {
                categoryIds: { $in: [req.myCategory.originalCategoryId] }
              }
            }
          : {
              $addToSet: {
                categoryIds: { $each: [req.myCategory.originalCategoryId] }
              }
            })
      }
    );

    res.locals.update = req.myCategory;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    req.myCategory.isDeleted = true;
    await req.myCategory.save();

    await DB.User.update(
      {
        _id: req.myCategory.tutorId
      },
      {
        $pull: {
          categoryIds: { $in: [req.myCategory.originalCategoryId] }
        }
      }
    );

    await DB.MySubject.updateMany({ myCategoryId: req.myCategory._id }, { $set: { isDeleted: true } });
    await DB.MyTopic.updateMany({ myCategoryId: req.myCategory._id }, { $set: { isDeleted: true } });
    await Service.Tutor.updatePrice(req.myCategory.tutorId);

    res.locals.remove = {
      success: true,
      message: 'Category is deleted'
    };
    next();
  } catch (e) {
    next(e);
  }
};

/**
 * get list category
 */
exports.list = async (req, res, next) => {
  const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
  const take = parseInt(req.query.take, 10) || 10;

  try {
    const query = Helper.App.populateDbQuery(req.query, {
      text: ['name', 'alias'],
      boolean: ['isActive']
    });
    if (!req.query.tutorId) {
      return next(
        PopulateResponse.error({
          message: 'Missing params'
        })
      );
    }
    query.tutorId = req.query.tutorId;
    query.isActive = true;
    query.isDeleted = false;
    const sort = Helper.App.populateDBSort(req.query);
    const count = await DB.MyCategory.count(query);
    const items = await DB.MyCategory.find(query)
      .sort(sort)
      .skip(page * take)
      .limit(take)
      .exec();

    res.locals.list = {
      count,
      items
    };
    next();
  } catch (e) {
    next();
  }
};

exports.listOfMe = async (req, res, next) => {
  const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
  const take = parseInt(req.query.take, 10) || 10;

  try {
    const query = Helper.App.populateDbQuery(req.query, {
      text: ['name', 'alias'],
      boolean: ['isActive']
    });
    query.tutorId = req.user._id;
    query.isDeleted = false;
    const sort = Helper.App.populateDBSort(req.query);
    const count = await DB.MyCategory.count(query);
    const items = await DB.MyCategory.find(query)
      .sort(sort)
      .skip(page * take)
      .limit(take)
      .exec();

    res.locals.listOfMe = {
      count,
      items
    };
    next();
  } catch (e) {
    next();
  }
};

exports.changeStatus = async (req, res, next) => {
  try {
    const canChangeStatus = req.user.role === 'admin' || (req.user.type === 'tutor' && req.user._id.toString() === req.myCategory.tutorId.toString());
    if (!canChangeStatus) return next(PopulateResponse.forbidden());
    req.myCategory.isActive = !req.myCategory.isActive;
    await req.myCategory.save();

    await DB.User.update(
      {
        _id: req.myCategory.tutorId
      },

      {
        ...(!req.myCategory.isActive
          ? {
              $pull: {
                categoryIds: { $in: [req.myCategory.originalCategoryId] }
              }
            }
          : {
              $addToSet: {
                categoryIds: { $each: [req.myCategory.originalCategoryId] }
              }
            })
      }
    );

    res.locals.changeStatus = { success: true };
    return next();
  } catch (e) {
    return next(e);
  }
};
