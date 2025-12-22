const _ = require('lodash');
const Joi = require('joi');

const validateSchema = Joi.object().keys({
  originalSubjectId: Joi.string().required(),
  isActive: Joi.boolean().allow(null, '').optional(),
  myCategoryId: Joi.string().required(),
  tutorId: Joi.string().allow([null, '']).optional()
});

exports.findOne = async (req, res, next) => {
  try {
    const mySubject = await DB.MySubject.findOne({ _id: req.params.id, isDeleted: false });
    if (!mySubject) {
      return res.status(404).send(PopulateResponse.notFound());
    }
    req.mySubject = mySubject;
    res.locals.subject = mySubject;
    return next();
  } catch (e) {
    return next(e);
  }
};

/**
 * Create a new media subject
 */
exports.create = async (req, res, next) => {
  try {
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }
    const subject = await DB.Subject.findOne({ _id: validate.value.originalSubjectId });
    if (!subject) {
      return next(PopulateResponse.notFound({ message: 'Subject not found' }));
    }
    const tutorId = req.user.role === 'admin' && req.body.tutorId ? req.body.tutorId : req.user._id;
    let mySubject = await DB.MySubject.findOne({
      originalSubjectId: validate.value.originalSubjectId,
      tutorId: tutorId,
      myCategoryId: validate.value.myCategoryId,
      isDeleted: false
    });
    if (mySubject) {
      return next(PopulateResponse.error({ message: 'The subject you selected is duplicated!' }));
    }

    mySubject = new DB.MySubject({ ...req.body, alias: subject.alias, name: subject.name, tutorId });
    await mySubject.save();
    await DB.User.update(
      {
        _id: tutorId
      },
      {
        $addToSet: {
          subjectIds: {
            $each: [subject._id]
          }
        }
      }
    );
    res.locals.subject = mySubject;
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
    _.merge(req.mySubject, req.body);
    await req.mySubject.save();

    await DB.User.update(
      {
        _id: req.mySubject.tutorId
      },

      {
        ...(!req.mySubject.isActive
          ? {
              $pull: {
                subjectIds: { $in: [req.mySubject.originalSubjectId] }
              }
            }
          : {
              $addToSet: {
                subjectIds: { $each: [req.mySubject.originalSubjectId] }
              }
            })
      }
    );

    res.locals.update = req.mySubject;
    return next();
  } catch (e) {
    console.log(e);
    return next();
  }
};

exports.remove = async (req, res, next) => {
  try {
    req.mySubject.isDeleted = true;
    await req.mySubject.save();

    await DB.User.update(
      {
        _id: req.mySubject.tutorId
      },
      {
        $pull: {
          subjectIds: { $in: [req.mySubject.originalSubjectId] }
        }
      }
    );

    await DB.MyTopic.updateMany({ mySubjectId: req.mySubject._id }, { $set: { isDeleted: true } });

    await Service.Tutor.updatePrice(req.mySubject.tutorId);

    res.locals.remove = {
      success: true,
      message: 'Subject is deleted'
    };
    next();
  } catch (e) {
    next(e);
  }
};

/**
 * get list subject
 */
exports.list = async (req, res, next) => {
  const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
  const take = parseInt(req.query.take, 10) || 10;

  try {
    const query = Helper.App.populateDbQuery(req.query, {
      text: ['name', 'alias'],
      equal: ['myCategoryId'],
      boolean: ['isActive']
    });
    if (!req.query.tutorId) {
      return next(
        PopulateResponse.error({
          message: 'Missing params'
        })
      );
    }
    if (req.query.myCategoryIds && req.query.myCategoryIds.length) {
      query.$or = [];
      for (const id of req.query.myCategoryIds.split(',')) {
        query.$or.push({
          myCategoryId: id
        });
      }
    }
    query.isDeleted = false;
    query.tutorId = req.query.tutorId;
    query.isActive = true;
    const sort = Helper.App.populateDBSort(req.query);
    const count = await DB.MySubject.count(query);
    const items = await DB.MySubject.find(query)
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
      equal: ['myCategoryId']
    });
    query.isDeleted = false;
    query.tutorId = req.user._id;
    if (req.query.myCategoryIds && req.query.myCategoryIds.length) {
      query.$or = [];
      for (const id of req.query.myCategoryIds.split(',')) {
        query.$or.push({
          myCategoryId: id
        });
      }
    }
    const sort = Helper.App.populateDBSort(req.query);
    const count = await DB.MySubject.count(query);
    const items = await DB.MySubject.find(query)
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
    const canChangeStatus = req.user.role === 'admin' || (req.user.type === 'tutor' && req.user._id.toString() === req.mySubject.tutorId.toString());
    if (!canChangeStatus) return next(PopulateResponse.forbidden());
    req.mySubject.isActive = !req.mySubject.isActive;

    await DB.User.update(
      {
        _id: req.mySubject.tutorId
      },

      {
        ...(!req.mySubject.isActive
          ? {
              $pull: {
                subjectIds: { $in: [req.mySubject.originalSubjectId] }
              }
            }
          : {
              $addToSet: {
                subjectIds: { $each: [req.mySubject.originalSubjectId] }
              }
            })
      }
    );

    await req.mySubject.save();
    res.locals.changeStatus = { success: true };
    return next();
  } catch (e) {
    return next(e);
  }
};
