'use strict';

/**
 * Credit Service Proxy Routes
 *
 * Proxies frontend requests to the Credit Service (PostgreSQL backend).
 * Routes match the /v1/ prefix used by apiBaseUrl in Angular environment.
 *
 * Added: 2026-03-06
 */

module.exports = function(router) {
  var controller = require('../proxy.controller');
  var notificationTrigger = require('../../creditService/notificationTrigger');

  // Client Billing
  router.post('/v1/credit/client-billing', controller.upsertClientBilling);
  router.get('/v1/credit/client-billing/:mongoId', controller.getClientBilling);

  // Expert Compliance
  router.post('/v1/credit/expert-compliance', controller.upsertExpertCompliance);
  router.get('/v1/credit/expert-compliance/:mongoId', controller.getExpertCompliance);

  // Reference Data
  router.get('/v1/credit/state-codes', controller.getStateCodesList);

  // Credit Service Notification Triggers (called by Credit Service after settlement/payout)
  router.post('/v1/credit/notify/invoice', notificationTrigger.sendInvoiceEmail);
  router.post('/v1/credit/notify/payout', notificationTrigger.sendPayoutEmail);
  router.post('/v1/credit/notify/earnings-sync', notificationTrigger.syncExpertEarnings);

  // Client Invoices
  router.get('/v1/credit/client-invoices/:mongoId', controller.getClientInvoices);
  router.patch('/v1/credit/invoices/:bookingId/refresh-buyer', controller.refreshInvoiceBuyer);

  // Expert Search (resolves email / EB-XXXX / ObjectId / UUID)
  router.get('/v1/credit/expert-search', controller.searchExpert);

  // Expert Finance endpoints — proxy to Credit Service
  router.get('/v1/credit/expert/summary', controller.proxyExpertSummary);
  router.get('/v1/credit/expert/earnings', controller.proxyExpertEarnings);

};