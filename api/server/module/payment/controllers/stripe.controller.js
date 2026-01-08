const Stripe = require('stripe');
const Joi = require('joi');

exports.hook = async (req, res, next) => {
  try {
    const data = req.body;
    const eventType = data.type;

    if (data.id && data.data && data.data.object) {
      const object = data.data.object;
      if (eventType === 'charge.succeeded') {
        const transaction = await DB.Transaction.findOne({ _id: object.metadata.transactionId });
        if (!transaction) return next();
        transaction.paymentInfo = object;
        await transaction.save();
        switch (transaction.type) {
          case 'booking':
            await Service.Payment.updatePayment(transaction);
            break;
          case 'gift':
            await Service.Payment.updatePayment(transaction);
            break;
          case 'booking-multiple':
            await Service.Payment.updatePaymentMutilple(transaction);
            break;
          default:
            break;
        }
      } else if (eventType === 'payment_intent.succeeded') {
        const transactionId = object.metadata && object.metadata.transactionId;
        if (!transactionId) return next();
        const transaction = await DB.Transaction.findOne({ _id: transactionId });
        if (!transaction) return next();
        transaction.paymentInfo = object;
        await transaction.save();
        switch (transaction.type) {
          case 'booking':
            await Service.Payment.updatePayment(transaction);
            break;
          case 'gift':
            await Service.Payment.updatePayment(transaction);
            break;
          case 'booking-multiple':
            await Service.Payment.updatePaymentMutilple(transaction);
            break;
          default:
            break;
        }
      }
    }
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.confirm = async (req, res, next) => {
  try {
    const schema = Joi.object().keys({
      transactionId: Joi.string().required()
    });
    const validate = Joi.validate(req.body, schema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }
    const transaction = await DB.Transaction.findOne({ _id: validate.value.transactionId });
    if (!transaction) {
      return next(PopulateResponse.notFound());
    }
    transaction.paymentInfo = Object.assign({}, transaction.paymentInfo, { status: 'succeeded' });
    await transaction.save();
    await Service.Payment.updatePayment(transaction);
    res.locals.confirm = { success: true };
    return next();
  } catch (e) {
    return next(e);
  }
};
