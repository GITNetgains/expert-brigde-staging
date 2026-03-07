/**
 * Credit Service Forwarder
 * Forwards webhook events to Credit Service on OLD EC2 (Port 8010)
 * Added: March 4, 2026
 * Updated: March 4, 2026 — client state/country enrichment for GST
 *
 * IMPORTANT: Fire-and-forget with full error handling.
 * Failures are logged but do NOT block the main flow.
 */

const axios = require('axios');

const CREDIT_SERVICE_URL = process.env.CREDIT_SERVICE_URL || 'http://172.31.3.181:8010';
const FORWARD_TIMEOUT_MS = 5000;

/**
 * Look up client state/country from MongoDB for GST determination.
 * Returns enrichment object or empty object on failure.
 * Entirely non-blocking — errors are caught and logged.
 */
async function _getClientEnrichment(payload) {
  try {
    // DB.User is a global Mongoose model (set by kernel in app.js)
    if (typeof DB === 'undefined' || !DB.User) {
      return {};
    }

    const notes = (payload && payload.payload && payload.payload.payment &&
                   payload.payload.payment.entity && payload.payload.payment.entity.notes) || {};

    let clientId = notes.userId || notes.client_id;

    // If no userId in notes, try looking up via transactionId
    if (!clientId && notes.transactionId && DB.Transaction) {
      try {
        const txn = await DB.Transaction.findById(notes.transactionId, 'userId').lean();
        if (txn && txn.userId) {
          clientId = txn.userId.toString();
        }
      } catch (txnErr) {
        console.warn('[CreditService] Transaction lookup failed:', txnErr.message);
      }
    }

    if (!clientId) {
      return {};
    }

    const client = await DB.User.findById(clientId, 'state countryCode city email name').lean();
    if (!client) {
      return {};
    }

    const enrichment = {
      client_state: client.state || '',
      client_country: client.countryCode || 'IN',
      client_city: client.city || '',
      client_email: client.email || '',
      client_name: client.name || ''
    };

    console.log('[CreditService] Client enrichment:', clientId, '->', enrichment.client_state || '(no state)', enrichment.client_country);
    return enrichment;
  } catch (err) {
    console.warn('[CreditService] Client enrichment failed (non-blocking):', err.message);
    return {};
  }
}

/**
 * Forward Razorpay payment.captured to Credit Service.
 * Enriches payload with client state/country from MongoDB for GST logic.
 */
async function forwardRazorpayPayment(payload) {
  try {
    // Enrich with client location data for GST determination
    const clientEnrichment = await _getClientEnrichment(payload);

    // Look up expert email/name from MongoDB
    let expertEnrichment = {};
    try {
      const notes = (payload && payload.payload && payload.payload.payment &&
                     payload.payload.payment.entity && payload.payload.payment.entity.notes) || {};
      const expertId = notes.tutorId || notes.expert_id || notes.tutor_id;
      if (expertId && typeof DB !== 'undefined' && DB.User) {
        const expert = await DB.User.findById(expertId, 'email name').lean();
        if (expert) {
          expertEnrichment = {
            expert_email: expert.email || '',
            expert_name: expert.name || ''
          };
          console.log('[CreditService] Expert enrichment:', expertId, '->', expert.email || '(no email)');
        }
      }
      // Also try via appointment/booking lookup if no tutorId in notes
      if (!expertEnrichment.expert_email && notes.booking_id && DB.Appointment) {
        try {
          const appt = await DB.Appointment.findById(notes.booking_id, 'tutorId').lean();
          if (appt && appt.tutorId) {
            const expert = await DB.User.findById(appt.tutorId, 'email name').lean();
            if (expert) {
              expertEnrichment = { expert_email: expert.email || '', expert_name: expert.name || '' };
              console.log('[CreditService] Expert enrichment (via appointment):', appt.tutorId, '->', expert.email);
            }
          }
        } catch (apptErr) {
          console.warn('[CreditService] Appointment expert lookup failed:', apptErr.message);
        }
      }
    } catch (expErr) {
      console.warn('[CreditService] Expert enrichment failed (non-blocking):', expErr.message);
    }

    // Namespaced to avoid conflicts with Razorpay payload fields
    const enrichedPayload = Object.assign({}, payload, {
      _clientEnrichment: clientEnrichment,
      _expertEnrichment: expertEnrichment
    });

    const response = await axios.post(
      `${CREDIT_SERVICE_URL}/webhook/razorpay/payment-captured`,
      enrichedPayload,
      { timeout: FORWARD_TIMEOUT_MS, headers: { 'Content-Type': 'application/json' } }
    );
    console.log('[CreditService] Razorpay forwarded:', response.data && response.data.status || 'ok');
    return response.data;
  } catch (error) {
    console.error('[CreditService] Razorpay forward failed (non-blocking):', error.message);
    return null;
  }
}

/**
 * Forward Zoom meeting.ended to Credit Service
 */
async function forwardZoomMeetingEnded(payload) {
  try {
    const response = await axios.post(
      `${CREDIT_SERVICE_URL}/webhook/zoom/meeting-ended`,
      payload,
      { timeout: FORWARD_TIMEOUT_MS, headers: { 'Content-Type': 'application/json' } }
    );
    console.log('[CreditService] Zoom meeting.ended forwarded:', response.data && response.data.status || 'ok');
    return response.data;
  } catch (error) {
    console.error('[CreditService] Zoom forward failed (non-blocking):', error.message);
    return null;
  }
}

/**
 * Forward expert PAN/tax data to Credit Service when payout account is saved.
 * Called by creditProxy or directly by payout controllers.
 */
async function forwardExpertCompliance(expertMongoId, taxIdNumber, countryCode) {
  try {
    if (!expertMongoId) return null;

    var payload = {
      expert_mongo_id: expertMongoId,
      pan_number: taxIdNumber || null,
      residency_country: countryCode || null
    };

    var response = await axios.post(
      CREDIT_SERVICE_URL + '/api/v1/experts/compliance-profile',
      payload,
      { timeout: FORWARD_TIMEOUT_MS, headers: { 'Content-Type': 'application/json' } }
    );
    console.log('[CreditService] Expert compliance forwarded:', response.data && response.data.success || 'ok');
    return response.data;
  } catch (error) {
    console.error('[CreditService] Expert compliance forward failed (non-blocking):', error.message);
    return null;
  }
}

module.exports = {
  forwardRazorpayPayment,
  forwardZoomMeetingEnded,
  forwardExpertCompliance,
  CREDIT_SERVICE_URL
};
