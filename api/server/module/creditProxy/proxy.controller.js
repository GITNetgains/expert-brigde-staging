'use strict';

/**
 * Credit Service Proxy Controller
 *
 * Proxies frontend requests to the Credit Service on OLD EC2.
 * All compliance/billing data goes directly to PostgreSQL via Credit Service.
 * MongoDB is NOT involved — this is the PostgreSQL-first architecture.
 *
 * Added: 2026-03-06
 * Updated: 2026-03-10 — Expert invoice upload (multipart proxy)
 */

var axios = require('axios');
var FormDataLib = require('form-data');

var CREDIT_SERVICE_URL = process.env.CREDIT_SERVICE_URL || 'http://172.31.3.181:8010';
var TIMEOUT = 10000;
var CREDIT_API_KEY = process.env.CREDIT_SERVICE_API_KEY || '';

/**
 * Generic proxy — forwards request to Credit Service and returns response
 */
async function proxyToCredit(req, res, method, path, data) {
  try {
    var url = CREDIT_SERVICE_URL + path;
    var config = {
      method: method,
      url: url,
      timeout: TIMEOUT,
      headers: { 'Content-Type': 'application/json', 'X-API-Key': CREDIT_API_KEY }
    };

    if (data) {
      config.data = data;
    }

    if (req.query && Object.keys(req.query).length > 0) {
      config.params = req.query;
    }

    var response = await axios(config);
    return res.status(response.status).json(response.data);
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    console.error('[CreditProxy] Error:', err.message);
    return res.status(502).json({
      error: 'Billing service temporarily unavailable',
      detail: 'Please try again in a moment'
    });
  }
}

// === Client Billing Profile ===

exports.upsertClientBilling = async function(req, res) {
  return proxyToCredit(req, res, 'POST', '/api/v1/clients/billing-profile', req.body);
};

exports.getClientBilling = async function(req, res) {
  var mongoId = req.params.mongoId;
  return proxyToCredit(req, res, 'GET', '/api/v1/clients/billing-profile-by-mongo/' + mongoId);
};

// === Expert Compliance Profile ===

exports.upsertExpertCompliance = async function(req, res) {
  return proxyToCredit(req, res, 'POST', '/api/v1/experts/compliance-profile', req.body);
};

exports.getExpertCompliance = async function(req, res) {
  var mongoId = req.params.mongoId;
  return proxyToCredit(req, res, 'GET', '/api/v1/experts/compliance-profile-by-mongo/' + mongoId);
};

// === Reference Data ===

exports.getStateCodesList = async function(req, res) {
  return proxyToCredit(req, res, 'GET', '/api/v1/clients/gst-state-codes');
};


// === Expert Search Resolver ===
// Resolves email or EB-XXXX to MongoDB _id, then fetches compliance profile

// Generate UUID v5 (same algorithm as Python's uuid.uuid5)
function generateUuid5(namespace, name) {
  var crypto = require('crypto');
  // Parse namespace UUID to bytes
  var ns = namespace.replace(/-/g, '');
  var nsBytes = Buffer.from(ns, 'hex');
  var nameBytes = Buffer.from(name, 'utf8');
  var hash = crypto.createHash('sha1').update(Buffer.concat([nsBytes, nameBytes])).digest();
  // Set version (5) and variant bits
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  var hex = hash.toString('hex').substring(0, 32);
  return hex.substring(0, 8) + '-' + hex.substring(8, 12) + '-' + hex.substring(12, 16) + '-' + hex.substring(16, 20) + '-' + hex.substring(20, 32);
}

exports.searchExpert = async function(req, res) {
  var q = (req.query.q || '').trim();
  if (!q) {
    return res.status(400).json({ error: 'Query parameter q is required' });
  }

  var mongoose = require('mongoose');
  var User = mongoose.model('User');

  try {
    var user = null;

    // EB-XXXX format
    if (/^EB-\d{4,}$/i.test(q)) {
      user = await User.findOne({ userId: q.toUpperCase() }, '_id email name userId role type').lean();
    }
    // Email format
    else if (q.includes('@')) {
      user = await User.findOne({ email: q.toLowerCase() }, '_id email name userId role type').lean();
    }
    // MongoDB ObjectId
    else if (/^[0-9a-f]{24}$/i.test(q)) {
      user = await User.findById(q, '_id email name userId role type').lean();
    }
    // UUID — pass directly to credit service (no MongoDB user available)
    else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q)) {
      return proxyToCredit(req, res, 'GET', '/api/v1/experts/compliance-profile/' + q);
    }
    else {
      return res.status(400).json({ error: 'Unrecognized format. Use email, EB-XXXX, UUID, or MongoDB ObjectId.' });
    }

    if (!user) {
      return res.status(404).json({ error: 'Expert not found in database for: ' + q });
    }

    var mongoId = user._id.toString();
    // Try compliance profile first (experts have this)
    try {
      var url = CREDIT_SERVICE_URL + '/api/v1/experts/compliance-profile-by-mongo/' + mongoId;
      var response = await axios({ method: 'GET', url: url, timeout: TIMEOUT, headers: { 'Content-Type': 'application/json', 'X-API-Key': CREDIT_API_KEY } });
      var profile = response.data;
      profile.expert_email = user.email || null;
      profile.expert_name = user.name || null;
      profile.mongo_id = mongoId;
      profile.eb_id = user.userId || null;
      profile.user_type = 'expert';
      return res.status(response.status).json(profile);
    } catch (compErr) {
      // Compliance profile not found — this user is likely a client.
      // Generate the wallet user_id (UUID5 from mongo user ID, same as Credit Service uses)
      var crypto = require('crypto');
      var nsUrl = '6ba7b811-9dad-11d1-80b4-00c04fd430c8'; // UUID NAMESPACE_URL
      var walletUserId = generateUuid5(nsUrl, 'mongo:user:' + mongoId);
      return res.status(200).json({
        expert_id: walletUserId,
        expert_email: user.email || null,
        expert_name: user.name || null,
        mongo_id: mongoId,
        eb_id: user.userId || null,
        user_type: (user.role === 'tutor' || user.type === 'tutor') ? 'expert' : 'client'
      });
    }
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    console.error('[CreditProxy] searchExpert error:', err.message);
    return res.status(500).json({ error: 'Search failed: ' + err.message });
  }
};


// === Client Invoices ===

exports.getClientInvoices = async function(req, res) {
  var mongoId = req.params.mongoId;
  return proxyToCredit(req, res, 'GET', '/api/v1/invoices/by-client/' + mongoId);
};

exports.refreshInvoiceBuyer = async function(req, res) {
  var bookingId = req.params.bookingId;
  return proxyToCredit(req, res, 'PATCH', '/api/v1/invoices/' + bookingId + '/refresh-buyer');
};


// === Expert Finance Proxy ===

exports.proxyExpertSummary = async function(req, res) {
  return proxyToCredit(req, res, 'GET', '/api/v1/expert/summary?expert_email=' + encodeURIComponent(req.query.expert_email || ''));
};

exports.proxyExpertEarnings = async function(req, res) {
  return proxyToCredit(req, res, 'GET', '/api/v1/expert/earnings?expert_email=' + encodeURIComponent(req.query.expert_email || ''));
};


// === Expert Payout Invoice Upload (multipart) ===

exports.uploadExpertInvoice = async function(req, res) {
  try {
    var formData = new FormDataLib();
    if (req.file) {
      formData.append('file', req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype
      });
    }
    if (req.body.expert_mongo_id) formData.append('expert_mongo_id', req.body.expert_mongo_id);
    if (req.body.booking_id) formData.append('booking_id', req.body.booking_id);
    if (req.body.invoice_number) formData.append('invoice_number', req.body.invoice_number);
    if (req.body.invoice_date) formData.append('invoice_date', req.body.invoice_date);
    if (req.body.invoice_amount) formData.append('invoice_amount', req.body.invoice_amount);

    var resp = await axios.post(
      CREDIT_SERVICE_URL + '/api/v1/experts/payout-invoice/upload',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'X-API-Key': CREDIT_API_KEY
        },
        timeout: 30000
      }
    );
    return res.json(resp.data);
  } catch (err) {
    console.error('[CreditProxy] uploadExpertInvoice error:', err.message);
    var status = err.response ? err.response.status : 500;
    return res.status(status).json(err.response ? err.response.data : { error: 'Invoice upload failed' });
  }
};

exports.getExpertInvoices = async function(req, res) {
  var expertId = req.params.expertMongoId;
  return proxyToCredit(req, res, 'GET', '/api/v1/experts/payout-invoice/by-expert/' + expertId);
};

exports.getInvoiceByBooking = async function(req, res) {
  var bookingId = req.params.bookingId;
  return proxyToCredit(req, res, 'GET', '/api/v1/experts/payout-invoice/by-booking/' + bookingId);
};


// === Client Wallet ===

exports.getWalletBalance = async function(req, res) {
  var userId = req.params.userId;
  return proxyToCredit(req, res, 'GET', '/api/v1/credits/balance/' + userId);
};

exports.getWalletHistory = async function(req, res) {
  var userId = req.params.userId;
  return proxyToCredit(req, res, 'GET', '/api/v1/credits/history/' + userId);
};

exports.applyWalletCredit = async function(req, res) {
  return proxyToCredit(req, res, 'POST', '/api/v1/credits/apply', req.body);
};

// === Client Credit Notes ===

exports.getClientCreditNotes = async function(req, res, userId, email) {
  var url = '/api/v1/credit-notes/by-client/' + userId;
  if (email) url += '?email=' + encodeURIComponent(email);
  return proxyToCredit(req, res, 'GET', url);
};

