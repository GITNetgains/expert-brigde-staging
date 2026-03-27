'use strict';

/**
 * Atlas Assessment Proxy Controller
 *
 * Forwards interview frontend requests to Atlas API on NEW EC2 (VPC).
 * Injects X-API-KEY server-side so the key is never in the browser.
 *
 * Updated: 2026-03-23 — Phase 0: interview token authentication
 * Updated: 2026-03-23 — Phase 1: assessment status, batch-status, summary, report endpoints
 */

var jwt = require('jsonwebtoken');

var ATLAS_URL = process.env.ATLAS_API_URL || 'https://assess.expertbridge.co';
var ATLAS_KEY = process.env.ASSESSMENT_API_KEY;
var INTERVIEW_JWT_SECRET = process.env.INTERVIEW_JWT_SECRET;
var ALLOW_EMAIL_FALLBACK = process.env.ALLOW_EMAIL_FALLBACK === 'true';
var TOKEN_EXPIRY = '1h';

async function forwardToAtlas(method, path, body, res) {
  var url = ATLAS_URL + '/api/v1/interview' + path;
  var opts = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': ATLAS_KEY
    },
    signal: AbortSignal.timeout(120000)
  };
  if (body && method !== 'GET') {
    opts.body = JSON.stringify(body);
  }
  try {
    var response = await fetch(url, opts);
    var data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error('[AtlasProxy] ' + method + ' ' + path + ' failed:', err.message);
    return res.status(502).json({ error: 'Atlas API unreachable' });
  }
}

exports.eligibility = async function(req, res) {
  var email = req.params.email;
  await forwardToAtlas('GET', '/eligibility/' + encodeURIComponent(email), null, res);
};

exports.init = async function(req, res) {
  await forwardToAtlas('POST', '/init', req.body, res);
};

exports.nextQuestion = async function(req, res) {
  await forwardToAtlas('POST', '/next-question', req.body, res);
};

exports.scoreAsync = async function(req, res) {
  await forwardToAtlas('POST', '/score-async', req.body, res);
};

// ============================================
// INTERVIEW TOKEN AUTHENTICATION (Phase 0)
// ============================================

/**
 * Generate signed JWT for interview redirect.
 * POST /v1/atlas/generate-token
 * Requires: Logged-in expert (Middleware.isAuthenticated)
 */
exports.generateInterviewToken = async function(req, res) {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    var expert = await DB.User.findById(req.user._id).select('email fullName _id');

    if (!expert) {
      return res.status(404).json({ error: 'Expert not found' });
    }

    if (!expert.email) {
      return res.status(400).json({ error: 'Expert email not found' });
    }

    var payload = {
      email: expert.email,
      name: expert.fullName || 'Expert',
      mongoUserId: expert._id.toString(),
      purpose: 'interview'
    };

    var token = jwt.sign(payload, INTERVIEW_JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    var interviewUrl = 'https://interview.expertbridge.co?token=' + encodeURIComponent(token);

    console.log('[generateInterviewToken] Generated token for ' + expert.email);

    return res.status(200).json({
      success: true,
      token: token,
      interviewUrl: interviewUrl,
      expiresIn: TOKEN_EXPIRY
    });
  } catch (error) {
    console.error('[generateInterviewToken] Error:', error);
    return res.status(500).json({ error: 'Failed to generate interview token' });
  }
};

/**
 * Validate interview token (server-side).
 * POST /v1/atlas/validate-token
 * No auth required — the token IS the authentication.
 */
exports.validateInterviewToken = async function(req, res) {
  try {
    var token = req.body && req.body.token;

    if (!token) {
      return res.status(400).json({ valid: false, error: 'Token is required' });
    }

    var decoded = jwt.verify(token, INTERVIEW_JWT_SECRET);

    if (decoded.purpose !== 'interview') {
      return res.status(400).json({ valid: false, error: 'Invalid token purpose' });
    }

    console.log('[validateInterviewToken] Valid token for ' + decoded.email);

    return res.status(200).json({
      valid: true,
      email: decoded.email,
      name: decoded.name,
      mongoUserId: decoded.mongoUserId
    });
  } catch (error) {
    console.error('[validateInterviewToken] Error:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        valid: false,
        error: 'Token expired. Please start from your dashboard.'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        valid: false,
        error: 'Invalid token. Please start from your dashboard.'
      });
    }

    return res.status(500).json({ valid: false, error: 'Token validation failed' });
  }
};

/**
 * Auth config for interview frontend.
 * GET /v1/atlas/auth-config
 * Public — tells frontend whether email fallback is allowed.
 */
exports.getAuthConfig = async function(req, res) {
  return res.status(200).json({
    allowEmailFallback: ALLOW_EMAIL_FALLBACK,
    tokenRequired: !ALLOW_EMAIL_FALLBACK
  });
};

// ============================================
// PHASE 1: ASSESSMENT STATUS & SUMMARY
// ============================================

var ATLAS_TIMEOUT = 5000; // 5s timeout for status/summary calls

/**
 * Helper: forward to Atlas with shorter timeout (for status/summary)
 */
async function forwardToAtlasQuick(method, path, body) {
  var url = ATLAS_URL + '/api/v1/interview' + path;
  var opts = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': ATLAS_KEY
    },
    signal: AbortSignal.timeout(ATLAS_TIMEOUT)
  };
  if (body && method !== 'GET') {
    opts.body = JSON.stringify(body);
  }
  var response = await fetch(url, opts);
  return response.json();
}

/**
 * Helper: Get expert email from MongoDB
 */
async function getExpertEmailById(mongoUserId) {
  var expert = await DB.User.findById(mongoUserId).select('email');
  return expert ? expert.email : null;
}

/**
 * GET /v1/atlas/status/:mongoUserId
 * Expert dashboard: Get own assessment status.
 * Requires authentication; expert can only see own status.
 */
exports.getExpertStatus = async function(req, res) {
  try {
    var mongoUserId = req.params.mongoUserId;

    // Verify the requesting user owns this mongoUserId (or is admin)
    if (req.user._id.toString() !== mongoUserId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    var email = await getExpertEmailById(mongoUserId);
    if (!email) {
      return res.status(404).json({ error: 'Expert not found' });
    }

    var data = await forwardToAtlasQuick('GET', '/eligibility/' + encodeURIComponent(email), null);

    return res.status(200).json({
      hasAssessment: data.assessments_this_month > 0 || !data.eligible,
      assessmentsThisMonth: data.assessments_this_month || 0,
      remaining: data.remaining || 0,
      canRetake: data.eligible
    });
  } catch (err) {
    console.error('[getExpertStatus] Error:', err.message);
    if (err.name === 'TimeoutError') {
      return res.status(503).json({ error: 'Assessment service temporarily unavailable' });
    }
    return res.status(500).json({ error: 'Failed to fetch assessment status' });
  }
};

/**
 * GET /v1/atlas/batch-status?ids=id1,id2,id3
 * Client list: Get assessment status for multiple experts.
 * Requires authentication.
 */
exports.getBatchStatus = async function(req, res) {
  try {
    var ids = req.query.ids;
    if (!ids) {
      return res.status(400).json({ error: 'ids query parameter required' });
    }

    var mongoUserIds = ids.split(',').slice(0, 50);

    // Get emails for all mongoUserIds
    var experts = await DB.User.find({ _id: { $in: mongoUserIds } }).select('_id email');

    var emailMap = {};
    var emails = [];
    experts.forEach(function(e) {
      if (e.email) {
        emailMap[e.email] = e._id.toString();
        emails.push(e.email);
      }
    });

    if (emails.length === 0) {
      return res.status(200).json({ statuses: {} });
    }

    // Call Atlas batch endpoint
    var data = await forwardToAtlasQuick('POST', '/batch-eligibility', { emails: emails });

    // Transform: email-keyed → mongoUserId-keyed
    var statuses = {};
    var results = data.results || {};
    Object.keys(results).forEach(function(email) {
      var mongoId = emailMap[email];
      if (mongoId) {
        statuses[mongoId] = {
          hasAssessment: results[email].hasAssessment,
          tier: results[email].tier
        };
      }
    });

    // Fill in missing IDs
    mongoUserIds.forEach(function(id) {
      if (!statuses[id]) {
        statuses[id] = { hasAssessment: false, tier: null };
      }
    });

    return res.status(200).json({ statuses: statuses });
  } catch (err) {
    console.error('[getBatchStatus] Error:', err.message);
    if (err.name === 'TimeoutError') {
      return res.status(503).json({ error: 'Assessment service temporarily unavailable' });
    }
    return res.status(500).json({ error: 'Failed to fetch batch status' });
  }
};

/**
 * GET /v1/atlas/summary/:mongoUserId
 * Client profile: Get assessment summary with top strengths.
 * Requires authentication.
 */
exports.getAssessmentSummary = async function(req, res) {
  try {
    var mongoUserId = req.params.mongoUserId;

    var email = await getExpertEmailById(mongoUserId);
    if (!email) {
      return res.status(200).json({ hasAssessment: false });
    }

    var data = await forwardToAtlasQuick('GET', '/assessment-summary/' + encodeURIComponent(email), null);
    return res.status(200).json(data);
  } catch (err) {
    console.error('[getAssessmentSummary] Error:', err.message);
    if (err.name === 'TimeoutError') {
      return res.status(503).json({ error: 'Assessment service temporarily unavailable' });
    }
    return res.status(500).json({ error: 'Failed to fetch assessment summary' });
  }
};

/**
 * GET /v1/atlas/report/:mongoUserId
 * Client profile: Get PDF report (pre-signed S3 URL).
 * Requires authentication.
 */
exports.getAssessmentReport = async function(req, res) {
  try {
    var mongoUserId = req.params.mongoUserId;

    var email = await getExpertEmailById(mongoUserId);
    if (!email) {
      return res.status(404).json({ error: 'Expert not found' });
    }

    // Get summary to check if report exists
    var summary = await forwardToAtlasQuick('GET', '/assessment-summary/' + encodeURIComponent(email), null);

    if (!summary.hasAssessment || !summary.reportAvailable) {
      return res.status(404).json({ error: 'Assessment report not available' });
    }

    // Get PDF URL from Atlas admin API
    var url = ATLAS_URL + '/api/v1/admin/assessments/' + summary.assessmentId + '/pdf';
    var pdfRes = await fetch(url, {
      headers: { 'X-API-KEY': ATLAS_KEY },
      signal: AbortSignal.timeout(ATLAS_TIMEOUT)
    });
    var pdfData = await pdfRes.json();

    if (pdfData.pdf_url) {
      return res.redirect(302, pdfData.pdf_url);
    }
    return res.status(404).json({ error: 'Report not found' });
  } catch (err) {
    console.error('[getAssessmentReport] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch assessment report' });
  }
};

exports.getAssessmentTranscript = async function(req, res) {
  try {
    var mongoUserId = req.params.mongoUserId;
    var email = await getExpertEmailById(mongoUserId);
    if (!email) {
      return res.status(404).json({ error: 'Expert not found' });
    }

    var url = ATLAS_URL + '/api/v1/interview/transcript/' + encodeURIComponent(email);
    var response = await fetch(url, {
      headers: { 'X-API-KEY': ATLAS_KEY },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      var errText = await response.text();
      console.error('[getAssessmentTranscript] Atlas error:', response.status, errText);
      return res.status(response.status).json({ error: 'Failed to fetch transcript' });
    }

    var data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error('[getAssessmentTranscript] Error:', err.message);
    if (err.name === 'TimeoutError') {
      return res.status(503).json({ error: 'Atlas API timeout' });
    }
    return res.status(500).json({ error: 'Failed to fetch transcript' });
  }
};


// ============================================
// VOICE-FIRST INTERVIEW ENDPOINTS
// ============================================

exports.nextQuestionFast = async function(req, res) {
  await forwardToAtlas('POST', '/next-question-fast', req.body, res);
};

exports.questionAudio = async function(req, res) {
  var assessmentId = req.params.assessmentId;
  var url = ATLAS_URL + '/api/v1/interview/question-audio/' + assessmentId;
  try {
    var response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': ATLAS_KEY
      },
      signal: AbortSignal.timeout(30000)
    });
    var data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error('[AtlasProxy] question-audio failed:', err.message);
    return res.status(502).json({ error: 'Atlas API unreachable' });
  }
};

exports.uploadAudio = async function(req, res) {
  // Forward multipart file to Atlas /audio endpoint
  var FormData = require('form-data');
  var https = require('https');
  var http = require('http');

  var form = new FormData();
  if (req.file) {
    form.append('file', req.file.buffer, {
      filename: req.file.originalname || 'recording.webm',
      contentType: req.file.mimetype || 'audio/webm'
    });
  } else {
    return res.status(400).json({ error: 'No audio file provided' });
  }
  if (req.body.candidate_id) form.append('candidate_id', req.body.candidate_id);
  if (req.body.assessment_id) form.append('assessment_id', req.body.assessment_id);

  var parsed = new URL(ATLAS_URL + '/api/v1/interview/audio');
  var proto = parsed.protocol === 'https:' ? https : http;

  var options = {
    hostname: parsed.hostname,
    port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
    path: parsed.pathname,
    method: 'POST',
    headers: Object.assign({}, form.getHeaders(), { 'X-API-KEY': ATLAS_KEY }),
    timeout: 30000
  };

  var atlasReq = proto.request(options, function(atlasRes) {
    var chunks = [];
    atlasRes.on('data', function(chunk) { chunks.push(chunk); });
    atlasRes.on('end', function() {
      var body = Buffer.concat(chunks).toString();
      try {
        var data = JSON.parse(body);
        res.status(atlasRes.statusCode).json(data);
      } catch (e) {
        console.error('[AtlasProxy] audio: invalid response:', body.substring(0, 200));
        res.status(502).json({ error: 'Invalid response from Atlas' });
      }
    });
  });

  atlasReq.on('error', function(err) {
    console.error('[AtlasProxy] audio upload failed:', err.message);
    res.status(502).json({ error: 'Audio upload failed' });
  });

  atlasReq.on('timeout', function() {
    atlasReq.destroy();
    res.status(504).json({ error: 'Audio upload timed out' });
  });

  form.pipe(atlasReq);
};

exports.submitAnswer = async function(req, res) {
  await forwardToAtlas('POST', '/submit-answer', req.body, res);
};

