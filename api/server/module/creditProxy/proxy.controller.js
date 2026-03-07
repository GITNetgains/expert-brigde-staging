'use strict';

/**
 * Credit Service Proxy Controller
 *
 * Proxies frontend requests to the Credit Service on OLD EC2.
 * All compliance/billing data goes directly to PostgreSQL via Credit Service.
 * MongoDB is NOT involved — this is the PostgreSQL-first architecture.
 *
 * Added: 2026-03-06
 */

var axios = require('axios');

var CREDIT_SERVICE_URL = process.env.CREDIT_SERVICE_URL || 'http://172.31.3.181:8010';
var TIMEOUT = 10000;

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
      headers: { 'Content-Type': 'application/json' }
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
      user = await User.findOne({ userId: q.toUpperCase() }, '_id email name userId').lean();
    }
    // Email format
    else if (q.includes('@')) {
      user = await User.findOne({ email: q.toLowerCase() }, '_id email name userId').lean();
    }
    // MongoDB ObjectId
    else if (/^[0-9a-f]{24}$/i.test(q)) {
      user = await User.findById(q, '_id email name userId').lean();
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
    // Fetch compliance profile, then merge MongoDB user fields
    var url = CREDIT_SERVICE_URL + '/api/v1/experts/compliance-profile-by-mongo/' + mongoId;
    var response = await axios({ method: 'GET', url: url, timeout: TIMEOUT, headers: { 'Content-Type': 'application/json' } });
    var profile = response.data;
    profile.expert_email = user.email || null;
    profile.expert_name = user.name || null;
    profile.mongo_id = mongoId;
    profile.eb_id = user.userId || null;
    return res.status(response.status).json(profile);
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
