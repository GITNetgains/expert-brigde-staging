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
  var multer = require('multer');
  var audioUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
  var controller = require('../atlasProxy.controller');

  // Existing proxy routes (public — no auth)
  router.get('/v1/atlas/eligibility/:email', controller.eligibility);
  router.post('/v1/atlas/init', controller.init);
  router.post('/v1/atlas/next-question', controller.nextQuestion);

  // Voice-first interview endpoints
  router.post('/v1/atlas/next-question-fast', controller.nextQuestionFast);
  router.get('/v1/atlas/question-audio/:assessmentId', controller.questionAudio);
  router.post('/v1/atlas/audio', audioUpload.single('file'), controller.uploadAudio);
  router.post('/v1/atlas/submit-answer', controller.submitAnswer);

  // Webcam verification routes
  router.post('/v1/atlas/webcam-verify', controller.webcamVerify);

  // Knowledge probing routes
  router.post('/v1/atlas/check-probe', controller.checkProbe);
  router.post('/v1/atlas/submit-probe-response', controller.submitProbeResponse);

  // Behavioral signal tracking routes
  router.post('/v1/atlas/log-signal', controller.logSignal);
  router.post('/v1/atlas/log-browser-info', controller.logBrowserInfo);
  router.get('/v1/atlas/verification-status/:assessmentId', controller.verificationStatus);
  router.get('/v1/atlas/verification-by-email/:email', controller.verificationByEmail);
  router.post('/v1/atlas/score-async', controller.scoreAsync);

  // Interview token authentication routes (Phase 0)
  router.post('/v1/atlas/generate-token', Middleware.isAuthenticated, controller.generateInterviewToken);
  router.post('/v1/atlas/validate-token', controller.validateInterviewToken);
  router.get('/v1/atlas/auth-config', controller.getAuthConfig);

  // Assessment status & summary routes (Phase 1 — all require auth)
  router.get('/v1/atlas/status/:mongoUserId', Middleware.isAuthenticated, controller.getExpertStatus);
  router.get('/v1/atlas/batch-status', controller.getBatchStatus);  // Public — badge visibility
  router.get('/v1/atlas/summary/:mongoUserId', controller.getAssessmentSummary);  // Public — client profile viewing
  router.get('/v1/atlas/report/:mongoUserId', controller.getAssessmentReport);  // Public — client report viewing (window.open)
  router.get('/v1/atlas/transcript/:mongoUserId', controller.getAssessmentTranscript);  // Public — client profile transcript viewing
};
