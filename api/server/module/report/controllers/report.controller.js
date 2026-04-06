const _ = require('lodash');
const Joi = require('joi');

const validateSchema = Joi.object().keys({
  targetId: Joi.string().required(),
  issue: Joi.string().optional(),
  targetType: Joi.string().optional(),
  status: Joi.string().valid('progressing', 'approved', 'rejected').optional(),
  note: Joi.string().allow('', null).optional()
});

exports.findOne = async (req, res, next) => {
  try {
    const id = req.params.id || req.params.reportId || req.body.reportId;
    if (!id) {
      return next(PopulateResponse.validationError());
    }
    const report = await DB.Report.findOne({ _id: id })
      .populate('reportByUserId', 'name username type role userId')
      .populate('reportToUserId', 'name username type role userId');
    if (!report) {
      return res.status(404).send(PopulateResponse.notFound());
    }

    if (report.targetId && (report.targetType === 'subject' || report.targetType === 'webinar')) {
      const target = await DB.Appointment.findOne({ _id: report.targetId });
      if (target) {
        report._doc.startTime = target.startTime;
        report._doc.toTime = target.toTime;
      }
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
          message: 'Expert not found'
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

    // When expert (tutor) submits: reportTo = client. When client submits: reportTo = tutor.
    const isExpertReporter = req.user._id.toString() === target.tutorId.toString();
    let reportToUserId = target.tutorId;
    let reportToName = tutor.name;
    if (isExpertReporter) {
      reportToUserId = target.userId;
      const client = await DB.User.findOne({ _id: target.userId });
      reportToName = client ? client.name : '';
    }

    const report = new DB.Report({
      ...validate.value,
      transactionId: target.transactionId || null,
      reportByUserId: req.user._id,
      reportToUserId,
      targetCode: target.code,
      transactionCode: transaction.code,
      meta: {
        reportBy: req.user.name,
        reportByUsername: req.user.username,
        reportTo: reportToName,
        reportToUsername: isExpertReporter ? (await DB.User.findOne({ _id: target.userId }))?.username : tutor.username,
        startTime: target.startTime,
        toTime: target.toTime
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

    const and = [];
    if (req.query.q) {
      and.push({
        $or: [
          { issue: { $regex: req.query.q.trim(), $options: 'i' } },
          { 'meta.reportBy': { $regex: req.query.q.trim(), $options: 'i' } },
          { 'meta.reportTo': { $regex: req.query.q.trim(), $options: 'i' } },
          { transactionCode: { $regex: req.query.q.trim(), $options: 'i' } },
          { targetCode: { $regex: req.query.q.trim(), $options: 'i' } }
        ]
      });
    }

    if (req.query.userID || req.query.userId) {
      const uId = (req.query.userID || req.query.userId).trim();
      const users = await DB.User.find({
        $or: [
          { userId: { $regex: uId, $options: 'i' } },
          { username: { $regex: uId, $options: 'i' } }
        ]
      }).select('_id');
      const userIds = users.map((u) => u._id);
      
      and.push({
        $or: [
          { reportByUserId: { $in: userIds } },
          { reportToUserId: { $in: userIds } },
          { 'meta.reportByUsername': { $regex: uId, $options: 'i' } },
          { 'meta.reportToUsername': { $regex: uId, $options: 'i' } }
        ]
      });
    }

    if (and.length > 0) {
      query.$and = and;
    }

    const sort = Helper.App.populateDBSort(req.query);
    const count = await DB.Report.count(query);
    let items = await DB.Report.find(query)
      .populate('reportByUserId', 'name username type role userId')
      .populate('reportToUserId', 'name username type role userId')
      .sort(sort)
      .skip(page * take)
      .limit(take)
      .exec();

    // Populate session times for appointments
    const appointmentIds = items.filter(i => i.targetId && (i.targetType === 'subject' || i.targetType === 'webinar')).map(i => i.targetId);
    const appointments = await DB.Appointment.find({ _id: { $in: appointmentIds } }).select('startTime toTime');
    const apptMap = _.keyBy(appointments, (a) => a._id.toString());
    
    items = items.map(item => {
      const appt = item.targetId ? apptMap[item.targetId.toString()] : null;
      if (appt) {
        item._doc.startTime = appt.startTime;
        item._doc.toTime = appt.toTime;
      } else if (item.meta && item.meta.startTime) {
        item._doc.startTime = item.meta.startTime;
        item._doc.toTime = item.meta.toTime;
      }
      return item;
    });

    res.locals.list = { count, items };
    next();
  } catch (e) {
    next(e);
  }
};
