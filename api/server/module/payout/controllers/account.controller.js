const Joi = require('joi');
const _ = require('lodash');
const axios = require('axios');

const CREDIT_SERVICE_URL = process.env.CREDIT_SERVICE_URL || 'http://172.31.3.181:8010';
const CREDIT_SERVICE_API_KEY = process.env.CREDIT_SERVICE_API_KEY;

const validateSchema = Joi.object().keys({
  type: Joi.string().allow(['paypal', 'bank-account']).required(),
  bankAccountRegion: Joi.string().allow(['uk', 'india', 'us', 'other', null, '']),
  paypalAccount: Joi.string().allow([null, '']).when('type', {
    is: 'paypal',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  accountHolderName: Joi.string().allow([null, '']),
  accountHolderAddress: Joi.string().allow([null, '']),
  accountHolderPostalCode: Joi.string().allow([null, '']),
  accountNumber: Joi.string().allow([null, '']),
  branchName: Joi.string().allow([null, '']),
  mobileNumber: Joi.string().allow([null, '']),
  country: Joi.string().allow([null, '']),
  isPersonalAccount: Joi.boolean(),
  taxIdNumber: Joi.string().allow([null, '']),
  uniqueIdentificationNumberType: Joi.string().allow([null, '']),
  iban: Joi.string().allow([null, '']),
  bankName: Joi.string().allow([null, '']),
  bankAddress: Joi.string().allow([null, '']),
  sortCode: Joi.string().allow([null, '']),
  routingNumber: Joi.string().allow([null, '']),
  swiftCode: Joi.string().allow([null, '']),
  ifscCode: Joi.string().allow([null, '']),
  routingCode: Joi.string().allow([null, '']),
  additionalDetails: Joi.string().allow([null, ''])
});

/**
 * Forward bank account to Credit Service (PostgreSQL).
 * Non-blocking — logs errors but doesn't fail the main operation.
 */
async function forwardBankAccountToCredit(action, payoutAccount, userId) {
  if (!CREDIT_SERVICE_API_KEY) {
    console.warn('[BankSync] CREDIT_SERVICE_API_KEY not set, skipping sync');
    return;
  }

  try {
    if (action === 'delete') {
      await axios.delete(
        CREDIT_SERVICE_URL + '/api/v1/experts/bank-account/sync/' + payoutAccount._id.toString(),
        { headers: { 'X-API-Key': CREDIT_SERVICE_API_KEY }, timeout: 5000 }
      );
      console.log('[BankSync] Deleted ' + payoutAccount._id + ' from PostgreSQL');
    } else {
      var payload = {
        expert_mongo_id: userId.toString(),
        mongo_doc_id: payoutAccount._id.toString(),
        account_type: payoutAccount.type || 'bank-account',
        bank_account_region: payoutAccount.bankAccountRegion || null,
        is_personal_account: payoutAccount.isPersonalAccount != null ? payoutAccount.isPersonalAccount : true,
        paypal_account: payoutAccount.paypalAccount || null,
        account_holder_name: payoutAccount.accountHolderName || null,
        account_holder_address: payoutAccount.accountHolderAddress || null,
        account_holder_postal_code: payoutAccount.accountHolderPostalCode || null,
        account_number: payoutAccount.accountNumber ? String(payoutAccount.accountNumber) : null,
        bank_name: payoutAccount.bankName || null,
        bank_address: payoutAccount.bankAddress || null,
        ifsc_code: payoutAccount.ifscCode || null,
        sort_code: payoutAccount.sortCode || null,
        routing_number: payoutAccount.routingNumber ? String(payoutAccount.routingNumber) : null,
        swift_code: payoutAccount.swiftCode || null,
        iban: payoutAccount.iban ? String(payoutAccount.iban) : null,
        routing_code: payoutAccount.routingCode || null,
        tax_id_number: payoutAccount.taxIdNumber || null,
        tax_id_type: payoutAccount.uniqueIdentificationNumberType || null,
        additional_details: payoutAccount.additionalDetails || null
      };

      await axios.post(
        CREDIT_SERVICE_URL + '/api/v1/experts/bank-account/sync',
        payload,
        { headers: { 'X-API-Key': CREDIT_SERVICE_API_KEY }, timeout: 5000 }
      );
      console.log('[BankSync] Synced ' + payoutAccount._id + ' to PostgreSQL');
    }
  } catch (err) {
    console.error('[BankSync] Failed to sync ' + payoutAccount._id + ': ' + err.message);
  }
}

exports.create = async (req, res, next) => {
  try {
    // Only tutors/experts can manage payout accounts
    if (!req.user || (req.user.role !== 'tutor' && req.user.type !== 'tutor')) {
      return res.status(403).json({
        success: false,
        message: 'Only experts can manage payout accounts'
      });
    }
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }
    const payoutAccount = new DB.PayoutAccount(
      Object.assign(validate.value, {
        userId: req.user._id,
        tutorId: req.user.tutorId
      })
    );
    await payoutAccount.save();

    // Sync to Credit Service (non-blocking)
    forwardBankAccountToCredit('create', payoutAccount, req.user._id).catch(function() {});

    res.locals.create = payoutAccount;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.findOne = async (req, res, next) => {
  try {
    const payoutAccount = await DB.PayoutAccount.findOne({
      _id: req.params.payoutAccountId
    });
    if (!payoutAccount) {
      return next(PopulateResponse.notFound());
    }

    req.payoutAccount = payoutAccount;
    res.locals.payoutAccount = payoutAccount;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    // Only tutors/experts can manage payout accounts
    if (!req.user || (req.user.role !== 'tutor' && req.user.type !== 'tutor')) {
      return res.status(403).json({
        success: false,
        message: 'Only experts can manage payout accounts'
      });
    }
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }
    _.merge(req.payoutAccount, validate.value);
    await req.payoutAccount.save();

    // Sync to Credit Service (non-blocking)
    forwardBankAccountToCredit('update', req.payoutAccount, req.payoutAccount.userId).catch(function() {});

    res.locals.update = req.payoutAccount;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.list = async (req, res, next) => {
  try {
    const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
    const take = parseInt(req.query.take, 10) || 10;
    const query = Helper.App.populateDbQuery(req.query, {
      equal: ['type']
    });
    const sort = Helper.App.populateDBSort(req.query);
    query.userId = req.user._id;
    const count = await DB.PayoutAccount.count(query);
    const items = await DB.PayoutAccount.find(query)
      .sort(sort)
      .skip(page * take)
      .limit(take)
      .exec();
    res.locals.list = {
      count,
      items
    };
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    // Only tutors/experts can manage payout accounts
    if (!req.user || (req.user.role !== 'tutor' && req.user.type !== 'tutor')) {
      return res.status(403).json({
        success: false,
        message: 'Only experts can manage payout accounts'
      });
    }
    // Sync delete to Credit Service (non-blocking)
    forwardBankAccountToCredit('delete', req.payoutAccount, req.user._id).catch(function() {});

    req.payoutAccount.remove();
    res.locals.remove = { success: true };
    next();
  } catch (e) {
    next(e);
  }
};
