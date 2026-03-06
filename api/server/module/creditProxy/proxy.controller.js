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
