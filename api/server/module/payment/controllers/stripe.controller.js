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
      }
    }
    return next();
  } catch (e) {
    return next(e);
  }
};
