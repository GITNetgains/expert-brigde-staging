const _ = require('lodash');
const Joi = require('joi');

const validateSchema = Joi.object().keys({
  originalTopicId: Joi.string().required(),
  isActive: Joi.boolean().allow(null, '').optional(),
  mySubjectId: Joi.string().required(),
  myCategoryId: Joi.string().required(),
  price: Joi.number().required(),
  tutorId: Joi.string().allow([null, '']).optional()
});

exports.findOne = async (req, res, next) => {
  try {
    const myTopic = await DB.MyTopic.findOne({ _id: req.params.id, isDeleted: false });
    if (!myTopic) {
      return res.status(404).send(PopulateResponse.notFound());
    }
    req.myTopic = myTopic;
    res.locals.topic = myTopic;
    return next();
  } catch (e) {
    return next(e);
  }
};

/**
 * Create a new media topic
 */
exports.create = async (req, res, next) => {
  try {
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }
    const topic = await DB.Topic.findOne({ _id: validate.value.originalTopicId });
    if (!topic) {
      return next(PopulateResponse.notFound({ message: 'Topic not found' }));
    }
    const tutorId = req.user.role === 'admin' && req.body.tutorId ? req.body.tutorId : req.user._id;

    let myTopic = await DB.MyTopic.findOne({
      tutorId,
      originalTopicId: validate.value.originalTopicId,
      mySubjectId: validate.value.mySubjectId,
      myCategoryId: validate.value.myCategoryId,
      isDeleted: false
    });
    if (myTopic) {
      return next(PopulateResponse.error({ message: 'The topic you selected is duplicated!' }));
    }

    myTopic = new DB.MyTopic({ ...req.body, alias: topic.alias, name: topic.name, tutorId });
    await myTopic.save();

    await Service.Tutor.updatePrice(tutorId);

    await DB.User.update(
      {
        _id: tutorId
      },
      {
        $addToSet: {
          topicIds: {
            $each: [topic._id]
          }
        }
      }
    );

    res.locals.topic = myTopic;
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
    _.merge(req.myTopic, req.body);
    await req.myTopic.save();

    await Service.Tutor.updatePrice(req.myTopic.tutorId);

    await DB.User.update(
      {
        _id: req.myTopic.tutorId
      },

      {
        ...(!req.myTopic.isActive
          ? {
              $pull: {
                topicIds: { $in: [req.myTopic.originalTopicId] }
              }
            }
          : {
              $addToSet: {
                topicIds: { $each: [req.myTopic.originalTopicId] }
              }
            })
      }
    );

    res.locals.update = req.myTopic;
    return next();
  } catch (e) {
    return next();
  }
};

exports.remove = async (req, res, next) => {
  try {
    req.myTopic.isDeleted = true;
    await req.myTopic.save();

    await DB.User.update(
      {
        _id: req.myTopic.tutorId
      },
      {
        $pull: {
          topicIds: { $in: [req.myTopic.originalTopicId] }
        }
      }
    );

    await Service.Tutor.updatePrice(req.myTopic.tutorId);
    res.locals.remove = {
      success: true,
      message: 'Topic is deleted'
    };
    next();
  } catch (e) {
    next(e);
  }
};

/**
 * get list topic
 */
exports.list = async (req, res, next) => {
  const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
  const take = parseInt(req.query.take, 10) || 10;

  try {
    const query = Helper.App.populateDbQuery(req.query, {
      text: ['name', 'alias'],
      equal: ['myCategoryId', 'mySubjectId'],
      boolean: ['isActive']
    });
    if (!req.query.tutorId) {
      return next(
        PopulateResponse.error({
          message: 'Missing params'
        })
      );
    }
    if (req.query.mySubjectIds && req.query.mySubjectIds.length) {
      query.$or = [];
      for (const id of req.query.mySubjectIds.split(',')) {
        query.$or.push({
          mySubjectId: id
        });
      }
    }
    query.tutorId = req.query.tutorId;
    query.isActive = true;
    query.isDeleted = false;
    const sort = Helper.App.populateDBSort(req.query);
    const count = await DB.MyTopic.count(query);
    const items = await DB.MyTopic.find(query)
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
      equal: ['myCategoryId', 'mySubjectId']
    });
    query.tutorId = req.user._id;
    query.isDeleted = false;
    const sort = Helper.App.populateDBSort(req.query);
    const count = await DB.MyTopic.count(query);
    const items = await DB.MyTopic.find(query)
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
    const canChangeStatus = req.user.role === 'admin' || (req.user.type === 'tutor' && req.user._id.toString() === req.myTopic.tutorId.toString());
    if (!canChangeStatus) return next(PopulateResponse.forbidden());
    req.myTopic.isActive = !req.myTopic.isActive;

    await DB.User.update(
      {
        _id: req.myTopic.tutorId
      },

      {
        ...(!req.myTopic.isActive
          ? {
              $pull: {
                topicIds: { $in: [req.myTopic.originalTopicId] }
              }
            }
          : {
              $addToSet: {
                topicIds: { $each: [req.myTopic.originalTopicId] }
              }
            })
      }
    );

    await req.myTopic.save();
    await Service.Tutor.updatePrice(req.myTopic.tutorId);
    res.locals.changeStatus = { success: true };
    return next();
  } catch (e) {
    return next(e);
  }
};
