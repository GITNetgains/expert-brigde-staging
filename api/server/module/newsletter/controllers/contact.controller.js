// const Joi = require('joi');
// const _ = require('lodash');

// exports.register = async (req, res, next) => {
//   try {
//     const validateSchema = Joi.object().keys({
//       email: Joi.string().required(),
//       name: Joi.string()
//         .allow([null, ''])
//         .optional(),
//       address: Joi.string()
//         .allow([null, ''])
//         .optional()
//     });
//     const validate = Joi.validate(req.body, validateSchema);
//     if (validate.error) {
//       return next(PopulateResponse.validationError(validate.error));
//     }

//     let contact = await DB.Contact.findOne({ email: validate.value.email });
//     if (!contact) {
//       contact = new DB.Contact(validate.value);
//     }

//     _.merge(contact, validate.value);
//     await contact.save();
//     res.locals.register = { success: true };
//     return next();
//   } catch (e) {
//     return next(e);
//   }
// };

// exports.list = async (req, res, next) => {
//   try {
//     const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
//     const take = parseInt(req.query.take, 10) || 10;
//     const query = Helper.App.populateDbQuery(req.query, {
//       text: ['name', 'email']
//     });

//     const sort = Helper.App.populateDBSort(req.query);
//     const count = await DB.Contact.count(query);
//     const items = await DB.Contact.find(query)
//       // .collation({ locale: 'en' })
//       .sort(sort)
//       .skip(page * take)
//       .limit(take)
//       .exec();

//     res.locals.list = {
//       count,
//       items
//     };
//     next();
//   } catch (e) {
//     next(e);
//   }
// };

// exports.remove = async (req, res, next) => {
//   try {
//     await DB.Contact.remove({ _id: req.params.contactId });
//     res.locals.remove = { success: true };
//     next();
//   } catch (e) {
//     next(e);
//   }
// };
const Joi = require('joi');
const { verifyRecaptcha } = require('../services/verifyRecaptcha');

exports.submit = async (req, res, next) => {
  try {
    const schema = Joi.object({
      name: Joi.string().required(),
      companyName: Joi.string().required(),
      email: Joi.string().email().required(),
      phoneNumber: Joi.string().required(),
      message: Joi.string().min(5).required(),
      recaptchaToken: Joi.string().required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return next(PopulateResponse.validationError(error));
    }
const recaptchaResult = await verifyRecaptcha(
  value.recaptchaToken,
  req.ip
);

console.log('reCAPTCHA result:', recaptchaResult);

const minScore =
  process.env.NODE_ENV === 'production' ? 0.5 : 0.1;

if (!recaptchaResult.success) {
  return next(
    PopulateResponse.error({ message: 'reCAPTCHA verification failed' })
  );
}

if (recaptchaResult.score < minScore) {
  return next(
    PopulateResponse.error({ message: 'reCAPTCHA score too low' })
  );
}

// optional but recommended
if (recaptchaResult.action && recaptchaResult.action !== 'contact_us') {
  return next(
    PopulateResponse.error({ message: 'Invalid reCAPTCHA action' })
  );
}


    const contact = new DB.Contact({
      name: value.name,
      companyName: value.companyName,
      email: value.email,
      phoneNumber: value.phoneNumber,
      message: value.message
    });

    await contact.save();
    const email = process.env.ADMIN_EMAIL;
    await Service.Mailer.sendRawNow(
      email,
      'New Contact Us Enquiry',
      `
      <div style="font-family:Arial;padding:20px">
        <h2>New Contact Us Submission</h2>
        <p><strong>Name:</strong> ${value.name}</p>
        <p><strong>Company:</strong> ${value.companyName}</p>
        <p><strong>Email:</strong> ${value.email}</p>
        <p><strong>Phone:</strong> ${value.phoneNumber}</p>
        <hr />
        <p style="white-space:pre-line">${value.message}</p>
      </div>
      `
    );

    await Service.Mailer.sendRawNow(
      value.email,
      'We received your message',
      `
      <div style="font-family:Arial;padding:20px">
        <h2>Thank you for contacting us</h2>
        <p>Hi ${value.name},</p>
        <p>We’ll get back to you shortly.</p>
      </div>
      `
    );

    res.locals.submit = { success: true };
    next();
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const page = Math.max(0, Number(req.query.page) - 1 || 0);
    const take = Number(req.query.take) || 10;

    const query = Helper.App.populateDbQuery(req.query, {
      text: ['name', 'email', 'companyName', 'phoneNumber', 'message']
    });

    const sort = Helper.App.populateDBSort(req.query);

    const count = await DB.Contact.countDocuments(query);
    const items = await DB.Contact.find(query)
      .sort(sort)
      .skip(page * take)
      .limit(take);

    res.locals.list = { count, items };
    next();
  } catch (err) {
    next(err);
  }
};
exports.get = async (req, res, next) => {
  try {
    const contact = await DB.Contact.findById(req.params.contactId);

    if (!contact) {
      return next(
        PopulateResponse.notFound({ message: 'Contact not found' })
      );
    }

    res.locals.get = contact;
    next();
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await DB.Contact.deleteOne({ _id: req.params.contactId });
    res.locals.remove = { success: true };
    next();
  } catch (err) {
    next(err);
  }
};
