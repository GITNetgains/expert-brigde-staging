const _ = require('lodash');
const Joi = require('joi');

const validateSchema = Joi.object().keys({
  targetId: Joi.string().required(),
  issue: Joi.string().required(),
  targetType: Joi.string().required()
});

exports.findOne = async (req, res, next) => {
  try {
    const id = req.params.id || req.params.reportId || req.body.reportId;
    if (!id) {
      return next(PopulateResponse.validationError());
    }
    const report = await DB.Report.findOne({ _id: id });
    if (!report) {
      return res.status(404).send(PopulateResponse.notFound());
    }

    req.report = report;
    res.locals.report = report;
    return next();
  } catch (e) {
    return next(e);
  }
};

/**
 * Create a new report
 */
exports.create = async (req, res, next) => {
  try {
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    const target = await DB.Appointment.findOne({
      _id: validate.value.targetId
    });

    if (!target) {
      return res.status(404).send(PopulateResponse.notFound());
    }

    const tutor = await DB.User.findOne({
      _id: target.tutorId
    });

    if (!tutor) {
      return res.status(404).send(
        PopulateResponse.notFound({
          message: 'Tutor not found'
        })
      );
    }
    const transaction = await DB.Transaction.findOne({
      _id: target.transactionId
    });

    if (!transaction) {
      return res.status(404).send(
        PopulateResponse.notFound({
          message: 'Transaction not found'
        })
      );
    }
    const report = new DB.Report({
      ...validate.value,
      transactionId: target.transactionId || null,
      reportByUserId: req.user._id,
      targetCode: target.code,
      transactionCode: transaction.code,
      meta: {
        reportBy: req.user.name,
        reportTo: tutor.name
      }
    });
    await report.save();

    res.locals.report = report;
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

    Object.assign(req.report, validate.value);
    await req.report.save();
    res.locals.update = req.report;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await req.report.remove();

    res.locals.remove = {
      message: 'Email template is deleted'
    };
    next();
  } catch (e) {
    next(e);
  }
};

/**
 * get list report
 */
exports.list = async (req, res, next) => {
  const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
  const take = parseInt(req.query.take, 10) || 10;

  try {
    const query = {};

    if (req.query.q) {
      query.$or = [
        {
          issue: { $regex: req.query.q.trim(), $options: 'i' }
        },
        {
          'meta.reportBy': { $regex: req.query.q.trim(), $options: 'i' }
        },
        {
          transactionCode: { $regex: req.query.q.trim(), $options: 'i' }
        },
        {
          targetCode: { $regex: req.query.q.trim(), $options: 'i' }
        }
      ];
    }

    const sort = Helper.App.populateDBSort(req.query);
    const count = await DB.Report.count(query);
    let items = await DB.Report.find(query)
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
