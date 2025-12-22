const Joi = require('joi');
const moment = require('moment');
const _ = require('lodash');
const momentTimeZone = require('moment-timezone');

const enrollQ = require('../../webinar/queue');

exports.list = async (req, res, next) => {
  try {
    const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
    const take = parseInt(req.query.take, 10) || 10;
    const query = Helper.App.populateDbQuery(req.query, {
      text: ['description'],
      equal: ['status', 'userId', 'tutorId', 'webinarId', 'targetType', 'transactionId'],
      boolean: ['paid']
    });
    if (req.query.startTime && req.query.toTime) {
      query.startTime = {
        $gte: moment(req.query.startTime).toDate(),
        $lte: moment(req.query.toTime).add(1, 'days').toDate()
      };
    }
    if (req.user.role !== 'admin') {
      query.$or = [
        {
          userId: req.user._id
        },
        {
          tutorId: req.user._id
        },
        {
          idRecipient: req.user._id
        }
      ];
    }

    query.visible = true;
    // query.paid = true;
    const sort = Helper.App.populateDBSort(req.query);
    const count = await DB.Appointment.count(query);
    const items = await DB.Appointment.find(query)
      .populate({ path: 'user', select: '_id name username' })
      .populate({ path: 'tutor', select: '_id name username' })
      .populate({ path: 'subject', select: '_id name alias' })
      .populate({ path: 'topic', select: '_id name alias' })
      .populate({ path: 'category', select: '_id name  alias' })
      .populate({ path: 'webinar', select: '_id name price alias' })
      .populate({ path: 'transaction', select: req.user.role !== 'admin' ? '-commission -balance' : '' })
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
    next(e);
  }
};

exports.tutorAppointmentTime = async (req, res, next) => {
  try {
    const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
    const take = parseInt(req.query.take, 10) || 10;
    const query = Helper.App.populateDbQuery(req.query, {
      equal: ['userId', 'targetType']
    });
    query.tutorId = req.params.tutorId;

    if (req.query && req.query.status && req.query.status.length) {
      const status = req.query.status.split(',');
      query.status = {
        $in: status
      };
    }

    if (req.query.startTime && req.query.toTime) {
      query.startTime = {
        $gte: moment(req.query.startTime).toDate(),
        $lte: moment(req.query.toTime).add(1, 'days').toDate()
      };
    }

    query.visible = true;
    query.paid = true;
    const sort = Helper.App.populateDBSort(req.query);
    const count = await DB.Appointment.count(query);
    const items = await DB.Appointment.find(query)
      .sort(sort)
      .skip(page * take)
      .limit(take)
      .exec();

    res.locals.list = {
      count,
      items: items.map(item => _.pick(item, ['startTime', 'toTime', 'status', 'isFree']))
    };
    next();
  } catch (e) {
    next(e);
  }
};

exports.cancel = async (req, res, next) => {
  try {
    const validateSchema = Joi.object().keys({
      reason: Joi.string().allow([null, '']).optional()
    });
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    const data = await Service.Appointment.cancel(req.params.appointmentId, validate.value.reason, req.user._id);
    res.locals.cancel = data;
    next();
  } catch (e) {
    next(e);
  }
};

exports.tutorCancel = async (req, res, next) => {
  try {
    const validateSchema = Joi.object().keys({
      reason: Joi.string().allow([null, '']).optional()
    });
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    const appointment = await DB.Appointment.findOne({ _id: req.params.appointmentId })
      .populate({ path: 'topic', select: '_id name alias' })
      .populate({ path: 'webinar', select: '_id name price alias' });
    if (!appointment) {
      return next(PopulateResponse.notFound());
    }

    if (req.user._id.toString() !== appointment.tutorId.toString()) {
      return next(PopulateResponse.forbidden());
    }

    const data = await Service.Appointment.userCancel(appointment, validate.value.reason, req.user._id);
    res.locals.tutorCancel = data;
    next();
  } catch (e) {
    next(e);
  }
};

exports.studentCancel = async (req, res, next) => {
  try {
    const validateSchema = Joi.object().keys({
      reason: Joi.string().allow([null, '']).optional()
    });
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    const appointment = await DB.Appointment.findOne({ _id: req.params.appointmentId })
      .populate({ path: 'topic', select: '_id name alias' })
      .populate({ path: 'webinar', select: '_id name price alias' });
    if (!appointment) {
      return next(PopulateResponse.notFound());
    }

    if (req.user._id.toString() !== appointment.userId.toString()) {
      return next(PopulateResponse.forbidden());
    }

    const data = await Service.Appointment.userCancel(appointment, validate.value.reason, req.user._id);
    res.locals.studentCancel = data;
    next();
  } catch (e) {
    next(e);
  }
};

exports.findOne = async (req, res, next) => {
  try {
    const item = await DB.Appointment.findOne({ _id: req.params.appointmentId })
      .populate({ path: 'user', select: '_id name username totalRating ratingAvg' })
      .populate({ path: 'tutor', select: '_id name username totalRating ratingAvg' })
      .populate({ path: 'subject', select: '_id name price alias' })
      .populate({ path: 'topic', select: '_id name alias' })
      .populate({ path: 'category', select: '_id name  alias' })
      .populate('documents')
      .populate({
        path: 'webinar',
        select: '_id name price mediaIds alias',
        populate: { path: 'media' }
      })
      .populate({ path: 'transaction', select: req.user.role !== 'admin' ? '-commission -balance' : '' });
    if (!item) {
      return next(PopulateResponse.notFound());
    }
    const data = item.toObject();
    if (!data.paid && data.webinar && data.webinar.mediaIds && data.webinar.mediaIds.length) {
      data.webinar.media = [];
    }

    const report = await DB.Report.findOne({
      targetId: item._id,
      reportByUserId: req.user._id
    });

    if (report) {
      data.report = report;
    }
    // TODO - validate permission?
    req.appointment = item;
    res.locals.appointment = data;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.updateDocument = async (req, res, next) => {
  try {
    const validateSchema = Joi.object().keys({
      documentIds: Joi.array().items(Joi.string()).allow([null, '']).optional()
    });
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }
    const id = req.params.appointmentId;
    if (!id) {
      return next(PopulateResponse.error({ message: 'Missing params' }));
    }
    const appointment = await DB.Appointment.findOne({ _id: id });
    if (!appointment) {
      return next(PopulateResponse.notFound());
    }
    appointment.documentIds = validate.value.documentIds;
    await appointment.save();
    res.locals.updateDocument = appointment;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(
        PopulateResponse.error(
          {
            message: 'Missing document'
          },
          'ERR_MISSING_FILE'
        )
      );
    }

    const file = await Service.Media.createFile({
      value: { systemType: 'document' },
      file: req.file,
      user: req.user
    });
    if (req.appointment && file) {
      await DB.Appointment.update(
        {
          _id: req.appointment._id
        },
        { $addToSet: { documentIds: { $each: [file._id] } } }
      );
      const user = await DB.User.findOne({ _id: req.appointment.userId });
      const tutor = await DB.User.findOne({ _id: req.appointment.tutorId });

      if (user && tutor) {
        if (req.user.type === 'tutor') {
          const startTimeUser = user.timezone
            ? momentTimeZone(req.appointment.startTime).tz(user.timezone).format('DD/MM/YYYY HH:mm')
            : moment(req.appointment.startTime).format('DD/MM/YYYY HH:mm');
          const toTimeUser = user.timezone
            ? momentTimeZone(req.appointment.toTime).tz(user.timezone).format('DD/MM/YYYY HH:mm')
            : moment(req.appointment.toTime).format('DD/MM/YYYY HH:mm');
          await Service.Mailer.send('material-class-uploaded-to-user', user.email, {
            subject: 'New material uploaded',
            user: user.getPublicProfile(),
            tutor: tutor.getPublicProfile(),
            title: 'New Material Uploaded!',
            appointment: req.appointment.toObject(),
            startTime: startTimeUser,
            toTime: toTimeUser
          });

          const notificationUser = {
            title: `New material uploaded`,
            description: '',
            itemId: req.appointment._id,
            notifyTo: user._id,
            type: 'booking'
          };
          await Service.Notification.create(notificationUser);

          if (req.appointment.targetType === 'webinar') {
            const relatedAppointments = await DB.Appointment.find({
              _id: { $nin: [req.appointment._id] },
              slotId: req.appointment.slotId,
              targetType: 'webinar'
            });
            if (relatedAppointments && relatedAppointments.length > 0) {
              await DB.Appointment.updateMany(
                {
                  _id: relatedAppointments.map(a => a._id)
                },
                { $addToSet: { documentIds: { $each: [file._id] } } }
              );
            }
          }
        } else {
          const startTimeUser = tutor.timezone
            ? momentTimeZone(req.appointment.startTime).tz(tutor.timezone).format('DD/MM/YYYY HH:mm')
            : moment(req.appointment.startTime).format('DD/MM/YYYY HH:mm');
          const toTimeUser = tutor.timezone
            ? momentTimeZone(req.appointment.toTime).tz(tutor.timezone).format('DD/MM/YYYY HH:mm')
            : moment(req.appointment.toTime).format('DD/MM/YYYY HH:mm');
          await Service.Mailer.send('material-class-uploaded-to-tutor', tutor.email, {
            subject: 'New material uploaded',
            user: user.getPublicProfile(),
            tutor: tutor.getPublicProfile(),
            title: 'New Material Uploaded By Student!',
            appointment: req.appointment.toObject(),
            startTime: startTimeUser,
            toTime: toTimeUser
          });

          const notificationTutor = {
            title: `New material uploaded`,
            description: '',
            itemId: req.appointment._id,
            notifyTo: tutor._id,
            type: 'booking'
          };
          await Service.Notification.create(notificationTutor);
        }
      }
    }

    res.locals.upload = file;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.removeDocument = async (req, res, next) => {
  try {
    const id = req.params.appointmentId;
    const documentId = req.params.documentId;
    if (!id || !documentId) {
      return next(PopulateResponse.error({ message: 'Missing params' }));
    }
    const removedFile = await Service.Media.removeFile(documentId);
    const appointment = await DB.Appointment.findOne({ _id: id });
    if (!appointment) {
      return next(PopulateResponse.notFound());
    }
    if (removedFile) {
      await DB.Appointment.updateOne(
        {
          _id: req.appointment._id
        },
        {
          $pull: { documentIds: documentId }
        }
      );
      if (req.appointment.targetType === 'webinar') {
        const relatedAppointments = await DB.Appointment.find({
          _id: { $nin: [req.appointment._id] },
          slotId: req.appointment.slotId,
          targetType: 'webinar'
        });
        if (relatedAppointments && relatedAppointments.length > 0) {
          await DB.Appointment.updateMany(
            {
              _id: relatedAppointments.map(a => a._id)
            },
            {
              $pull: { documentIds: documentId }
            }
          );
        }
      }
    }
    res.locals.remove = { success: true };
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.reSchedule = async (req, res, next) => {
  try {
    const appointment = await DB.Appointment.findOne({ _id: req.params.id });
    if (!appointment) return next(PopulateResponse.notFound());
    let canReschedule = await Service.Appointment.canReschedule(appointment);
    if (!canReschedule) {
      return next(
        PopulateResponse.error({
          message: 'Cannot reschedule the class starting within 8 hours'
        })
      );
    }
    const startTime = req.body.startTime;
    const toTime = req.body.toTime;

    await DB.Appointment.update(
      { _id: req.params.id },
      {
        $set: { startTime, toTime }
      }
    );

    await enrollQ.rescheduleClass(appointment._id);
    res.locals.reSchedule = {
      message: 'Ok'
    };
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.canReschedule = async (req, res, next) => {
  try {
    let canReschedule = await Service.Appointment.canReschedule(req.appointment);
    res.locals.canReschedule = {
      canReschedule: canReschedule
    };
    return next();
  } catch (e) {
    next(e);
  }
};

exports.listByGroupClass = async (req, res, next) => {
  try {
    const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
    const take = parseInt(req.query.take, 10) || 10;
    const query = {
      targetType: 'webinar'
    };
    query.visible = true;

    if (req.query.startTime && req.query.toTime) {
      // query.startTime = {
      //   $gte: new Date(moment(req.query.startTime).format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]')),
      //   $lte: new Date(moment(req.query.toTime).format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]'))
      // };

      query.startTime = {
        $gte: moment(req.query.startTime).toDate(),
        $lte: moment(req.query.toTime).toDate()
      };
    }

    let targetGroupBy = req.user.type === 'tutor' ? '$userId' : '$tutorId';
    if (req.user.role !== 'admin') {
      query.$or = [
        {
          userId: Helper.App.toObjectId(req.user._id)
        },
        {
          tutorId: Helper.App.toObjectId(req.user._id)
        },
        {
          idRecipient: Helper.App.toObjectId(req.user._id)
        }
      ];
    }
    const sort = Helper.App.populateDBSort(req.query);
    const appointments = await DB.Appointment.aggregate([
      {
        $match: query
      },
      {
        $group: {
          _id: {
            webinarId: '$webinarId',
            userId: targetGroupBy,
            tutorId: targetGroupBy
          },
          count: { $sum: 1 }
        }
      },
      {
        $facet: {
          metadata: [
            { $count: 'total' } // Calculate the total count of documents
          ],
          data: [
            {
              $project: {
                _id: 0,
                webinarId: '$_id.webinarId',
                userId: '$_id.userId',
                tutorId: '$_id.tutorId',
                count: '$count'
              }
            },
            { $sort: sort },
            { $skip: page * take },
            { $limit: take }
          ]
        }
      }
    ]);

    const count = appointments[0].metadata[0] ? appointments[0].metadata[0].total : 0;
    const paginatedAppointments = appointments[0].data;

    const items = await Promise.all(
      (paginatedAppointments || []).map(async item => {
        const data = item;
        if (item.webinarId) {
          const webinar = await DB.Webinar.findOne({ _id: item.webinarId });
          if (webinar) {
            data.webinar = {
              _id: webinar._id,
              name: webinar.name
            };
          }
        }
        if (item.userId) {
          const user = await DB.User.findOne({ _id: item.userId });
          if (user) {
            data.user = user.getPublicProfile();
          }
        }
        if (item.tutorId) {
          const tutor = await DB.User.findOne({ _id: item.tutorId });
          if (tutor) {
            data.tutor = tutor.getPublicProfile();
          }
        }
        return data;
      })
    );

    res.locals.listByGroupClass = {
      items,
      count
    };
    next();
  } catch (e) {
    next(e);
  }
};
