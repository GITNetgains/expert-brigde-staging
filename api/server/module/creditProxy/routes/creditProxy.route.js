'use strict';

/**
 * Credit Service Proxy Routes
 *
 * Proxies frontend requests to the Credit Service (PostgreSQL backend).
 * Routes match the /v1/ prefix used by apiBaseUrl in Angular environment.
 *
 * Added: 2026-03-06
 * Updated: 2026-03-08 — Added authentication to all routes
 * Updated: 2026-03-10 — Expert payout invoice upload (multipart)
 */

var multer = require('multer');
var upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

var CREDIT_SERVICE_NOTIFY_SECRET = process.env.CREDIT_SERVICE_NOTIFY_SECRET || 'eb-credit-notify-2026-internal';

/**
 * Validates that internal-only routes are called by the Credit Service.
 * Checks shared secret header OR VPC private IP.
 */
function validateCreditServiceCaller(req, res, next) {
  var secret = req.headers['x-credit-service-secret'];
  if (secret === CREDIT_SERVICE_NOTIFY_SECRET) {
    return next();
  }

  // Allow from VPC private IPs (172.31.x.x)
  var ip = req.ip || req.connection.remoteAddress || '';
  if (ip.startsWith('172.31.') || ip === '::ffff:172.31.3.181' || ip === '172.31.3.181') {
    return next();
  }

  return res.status(403).json({ error: 'Forbidden — internal route' });
}

/**
 * Allows Finance Hub requests (via Nginx reverse proxy with internal header)
 * to bypass JWT auth. Finance Hub is already protected by Basic Auth in Nginx.
 * Nginx proxy_set_header always overwrites client-provided X-Finance-Hub,
 * so external requests cannot forge this header.
 */
function adminOrFinanceHub(req, res, next) {
  if (req.headers['x-finance-hub'] === 'internal') {
    return next();
  }
  // Otherwise require JWT admin
  return Middleware.hasRole('admin')(req, res, next);
}



// Commission config cache -- public endpoint, 5-minute TTL
var _commissionConfigCache = null;
var _commissionConfigExpiry = 0;
var COMMISSION_CONFIG_TTL = 5 * 60 * 1000; // 5 minutes

module.exports = function(router) {
  var controller = require('../proxy.controller');
  var notificationTrigger = require('../../creditService/notificationTrigger');

  // Client Billing (requires logged-in user)
  router.post('/v1/credit/client-billing', Middleware.isAuthenticated, controller.upsertClientBilling);
  router.get('/v1/credit/client-billing/:mongoId', Middleware.isAuthenticated, controller.getClientBilling);

  // Expert Compliance (requires logged-in user)
  router.post('/v1/credit/expert-compliance', Middleware.isAuthenticated, controller.upsertExpertCompliance);
  router.get('/v1/credit/expert-compliance/:mongoId', Middleware.isAuthenticated, controller.getExpertCompliance);

  // Reference Data (public -- state codes are not sensitive)
  router.get('/v1/credit/state-codes', controller.getStateCodesList);

  // Commission config (public -- needed by booking modal before login)
  // Cached for 5 minutes to avoid hammering Credit Service
  router.get('/v1/public/config/commission', async function(req, res) {
    if (_commissionConfigCache && Date.now() < _commissionConfigExpiry) {
      return res.json(_commissionConfigCache);
    }
    try {
      var CREDIT_SERVICE_URL = process.env.CREDIT_SERVICE_URL || 'http://172.31.3.181:8010';
      var apiKey = process.env.CREDIT_SERVICE_API_KEY;
      var [minRes, defaultRes, gstRes] = await Promise.all([
        fetch(CREDIT_SERVICE_URL + '/api/v1/compliance/config/MIN_COMMISSION_PERCENT', {
          headers: { 'X-API-Key': apiKey }, signal: AbortSignal.timeout(3000)
        }),
        fetch(CREDIT_SERVICE_URL + '/api/v1/compliance/config/DEFAULT_COMMISSION_PERCENT', {
          headers: { 'X-API-Key': apiKey }, signal: AbortSignal.timeout(3000)
        }),
        fetch(CREDIT_SERVICE_URL + '/api/v1/compliance/config/GST_DOMESTIC_RATE', {
          headers: { 'X-API-Key': apiKey }, signal: AbortSignal.timeout(3000)
        })
      ]);
      if (!minRes.ok || !defaultRes.ok || !gstRes.ok) throw new Error('Non-200 from Credit Service');
      var [minData, defaultData, gstData] = await Promise.all([
        minRes.json(), defaultRes.json(), gstRes.json()
      ]);
      _commissionConfigCache = {
        minCommissionPercent: minData.value.rate,
        defaultCommissionPercent: defaultData.value.rate,
        gstDomesticRate: gstData.value.rate
      };
      _commissionConfigExpiry = Date.now() + COMMISSION_CONFIG_TTL;
      return res.json(_commissionConfigCache);
    } catch (err) {
      console.warn('[PublicConfig] Credit Service unreachable:', err.message);
      return res.json({
        minCommissionPercent: 0.30,
        defaultCommissionPercent: 0.50,
        gstDomesticRate: 0.18
      });
    }
  });

  // Credit Service Notification Triggers — INTERNAL ONLY (Credit Service on OLD EC2)
  router.post('/v1/credit/notify/invoice', validateCreditServiceCaller, notificationTrigger.sendInvoiceEmail);
  router.post('/v1/credit/notify/payout', validateCreditServiceCaller, notificationTrigger.sendPayoutEmail);
  router.post('/v1/credit/notify/earnings-sync', validateCreditServiceCaller, notificationTrigger.syncExpertEarnings);

  // Client Invoices (requires logged-in user)
  router.get('/v1/credit/client-invoices/:mongoId', Middleware.isAuthenticated, controller.getClientInvoices);
  router.patch('/v1/credit/invoices/:bookingId/refresh-buyer', Middleware.isAuthenticated, controller.refreshInvoiceBuyer);

  // Expert Search (admin only)
  router.get('/v1/credit/expert-search', adminOrFinanceHub, controller.searchExpert);

  // Expert Finance endpoints — proxy to Credit Service (requires logged-in user)
  router.get('/v1/credit/expert/summary', Middleware.isAuthenticated, controller.proxyExpertSummary);
  router.get('/v1/credit/expert/earnings', Middleware.isAuthenticated, controller.proxyExpertEarnings);

  // Expert Payout Invoice Upload (multipart, requires logged-in user)
  router.post('/v1/credit/experts/payout-invoice/upload', Middleware.isAuthenticated, upload.single('file'), controller.uploadExpertInvoice);
  router.get('/v1/credit/experts/payout-invoice/by-expert/:expertMongoId', Middleware.isAuthenticated, controller.getExpertInvoices);
  router.get('/v1/credit/experts/payout-invoice/by-booking/:bookingId', Middleware.isAuthenticated, controller.getInvoiceByBooking);

  // DocuSeal "sign later" email trigger — sends Terms of Work via email
  // Called by Angular skipDocuseal() when expert clicks "Sign Later"
  // No JWT required — expert has just completed signup but hasn't logged in yet.
  // Validated by: email is required, and the orchestrator only sends to valid DocuSeal templates.
  router.post('/v1/docuseal/send-signing-email', async function(req, res) {
    var email = (req.body.expert_email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid email required' });
    }
    try {
      var ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || 'http://172.31.8.118:8006';
      var ADMIN_KEY = process.env.ADMIN_API_KEY;
      var response = await fetch(ORCHESTRATOR_URL + '/api/docuseal/send-by-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': ADMIN_KEY
        },
        body: JSON.stringify({
          email: email,
          name: req.body.expert_name || ''
        })
      });
      var data = await response.json();
      res.json(data);
    } catch(e) {
      console.error('[DocuSeal] send-signing-email proxy failed:', e.message || e);
      res.status(200).json({ success: false, error: 'DocuSeal unavailable' });
    }
  });

};
