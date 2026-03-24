'use strict';

/**
 * Atlas Assessment Proxy Routes
 *
 * Public endpoints — no JWT required (matches current direct-call flow).
 * API key injected server-side by the controller.
 *
 * Added: 2026-03-23
 * Updated: 2026-03-23 — Phase 0: Interview token auth endpoints
 * Updated: 2026-03-23 — Phase 1: Assessment status, batch-status, summary, report
 */
module.exports = function(router) {
  var controller = require('../atlasProxy.controller');

  // Existing proxy routes (public — no auth)
  router.get('/v1/atlas/eligibility/:email', controller.eligibility);
  router.post('/v1/atlas/init', controller.init);
  router.post('/v1/atlas/next-question', controller.nextQuestion);
  router.post('/v1/atlas/score-async', controller.scoreAsync);

  // Interview token authentication routes (Phase 0)
  router.post('/v1/atlas/generate-token', Middleware.isAuthenticated, controller.generateInterviewToken);
  router.post('/v1/atlas/validate-token', controller.validateInterviewToken);
  router.get('/v1/atlas/auth-config', controller.getAuthConfig);

  // Assessment status & summary routes (Phase 1 — all require auth)
  router.get('/v1/atlas/status/:mongoUserId', Middleware.isAuthenticated, controller.getExpertStatus);
  router.get('/v1/atlas/batch-status', controller.getBatchStatus);  // Public — badge visibility
  router.get('/v1/atlas/summary/:mongoUserId', controller.getAssessmentSummary);  // Public — client profile viewing
  router.get('/v1/atlas/report/:mongoUserId', Middleware.isAuthenticated, controller.getAssessmentReport);
  router.get('/v1/atlas/transcript/:mongoUserId', controller.getAssessmentTranscript);  // Public — client profile transcript viewing
};
