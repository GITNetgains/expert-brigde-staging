const Joi = require('joi');
const moment = require('moment');

exports.create = async (req, res, next) => {
  try {
    const validateSchema = Joi.object().keys({
      startTime: Joi.string().required(),
      toTime: Joi.string().required(),
      targetId: Joi.string().required(),
      tutorId: Joi.string().required(),
      isFree: Joi.boolean().allow([null]).optional(),
      redirectSuccessUrl: Joi.string().optional(),
      cancelUrl: Joi.string().optional(),
      couponCode: Joi.string().allow([null, '']).optional()
    });
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }
    const minute = (moment(req.body.toTime).unix() - moment(req.body.startTime).unix()) / 60;
    if (minute < 60) {
      return next(PopulateResponse.error({ message: 'Minimum booking duration is 60 minutes' }));
    }
    const data = await Service.Booking.create(
      Object.assign(
        {
          userId: req.user._id,
          targetType: 'subject'
        },
        validate.value
      )
    );
    res.locals.create = data;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.checkFreeBooking = async (req, res, next) => {
  try {
    const validateSchema = Joi.object().keys({
      tutorId: Joi.string().required()
    });
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    const canBookFree = await Service.Booking.canBookFree(req.user._id);
    const canBookFreeWithTutor = await Service.Booking.canBookFreeWithTutor(
      Object.assign(
        {
          userId: req.user._id
        },
        validate.value
      )
    );
    res.locals.check = {
      canBookFree,
      canBookFreeWithTutor
    };
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.checkOverlapSlot = async (req, res, next) => {
  try {
    const options = {
      startTime: req.body.startTime,
      toTime: req.body.toTime
    };
    let userId = req.user._id;
    if (req.body.userId) {
      userId = req.body.userId;
    }
    if (req.body.excludeAppointmentId) {
      options.excludeAppointmentId = req.body.excludeAppointmentId;
    }
    const checkOverlap = await Service.Booking.checkOverlapSlot({ ...options, userId });

    res.locals.checkOverlap = {
      checkOverlap
    };
    return next();
  } catch (e) {
    next(e);
  }
};

exports.checkout = async (req, res, next) => {
  try {
    const validateSchema = Joi.object().keys({
      tutorId: Joi.string().required(),
      redirectSuccessUrl: Joi.string().optional(),
      cancelUrl: Joi.string().optional(),
      times: Joi.array()
        .items(
          Joi.object().keys({
            startTime: Joi.string().required(),
            toTime: Joi.string().required(),
            targetId: Joi.string().required(),
            isFree: Joi.boolean().allow([null]).optional(),
            couponCode: Joi.string().allow([null, '']).optional()
          })
        )
        .required()
    });
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    const data = await Service.Booking.checkout(
      req.user,
      Object.assign(
        {
          userId: req.user._id,
          targetType: 'subject'
        },
        validate.value
      )
    );
    res.locals.checkout = data;
    return next();
  } catch (e) {
    console.log(e);
    return next(e);
  }
};
