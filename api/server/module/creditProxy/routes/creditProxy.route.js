'use strict';

/**
 * Credit Service Proxy Routes
 *
 * Proxies frontend requests to the Credit Service (PostgreSQL backend).
 * Routes match the /v1/ prefix used by apiBaseUrl in Angular environment.
 *
 * Added: 2026-03-06
 * Updated: 2026-03-08 — Added authentication to all routes
 */

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



module.exports = function(router) {
  var controller = require('../proxy.controller');
  var notificationTrigger = require('../../creditService/notificationTrigger');

  // Client Billing (requires logged-in user)
  router.post('/v1/credit/client-billing', Middleware.isAuthenticated, controller.upsertClientBilling);
  router.get('/v1/credit/client-billing/:mongoId', Middleware.isAuthenticated, controller.getClientBilling);

  // Expert Compliance (requires logged-in user)
  router.post('/v1/credit/expert-compliance', Middleware.isAuthenticated, controller.upsertExpertCompliance);
  router.get('/v1/credit/expert-compliance/:mongoId', Middleware.isAuthenticated, controller.getExpertCompliance);

  // Reference Data (public — state codes are not sensitive)
  router.get('/v1/credit/state-codes', controller.getStateCodesList);

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

};
