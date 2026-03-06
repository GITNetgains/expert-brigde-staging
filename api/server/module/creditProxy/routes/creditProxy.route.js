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

  // Client Billing
  router.post('/v1/credit/client-billing', controller.upsertClientBilling);
  router.get('/v1/credit/client-billing/:mongoId', controller.getClientBilling);

  // Expert Compliance
  router.post('/v1/credit/expert-compliance', controller.upsertExpertCompliance);
  router.get('/v1/credit/expert-compliance/:mongoId', controller.getExpertCompliance);

  // Reference Data
  router.get('/v1/credit/state-codes', controller.getStateCodesList);
};
