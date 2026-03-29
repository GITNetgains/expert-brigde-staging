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
const CREDIT_API_KEY = process.env.CREDIT_SERVICE_API_KEY || '';

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
      { timeout: FORWARD_TIMEOUT_MS, headers: { 'Content-Type': 'application/json', 'X-API-Key': CREDIT_API_KEY } }
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
      { timeout: FORWARD_TIMEOUT_MS, headers: { 'Content-Type': 'application/json', 'X-API-Key': CREDIT_API_KEY } }
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
async function forwardExpertCompliance(expertMongoId, taxIdNumber, countryCode, gstin) {
  try {
    if (!expertMongoId) return null;

    var payload = {
      expert_mongo_id: expertMongoId,
      pan_number: taxIdNumber,
      gstin: gstin || null,
      is_gst_registered: !!gstin || null,
      residency_country: countryCode || null
    };

    var response = await axios.post(
      CREDIT_SERVICE_URL + '/api/v1/experts/compliance-profile',
      payload,
      { timeout: FORWARD_TIMEOUT_MS, headers: { 'Content-Type': 'application/json', 'X-API-Key': CREDIT_API_KEY } }
    );
    console.log('[CreditService] Expert compliance forwarded:', response.data && response.data.success || 'ok');
    return response.data;
  } catch (error) {
    console.error('[CreditService] Expert compliance forward failed (non-blocking):', error.message);
    return null;
  }
}


/**
 * Forward Zoom participant_joined / participant_left to Credit Service.
 * Fire-and-forget - errors are logged but never block the main flow.
 * Added: March 7, 2026
 */
async function forwardParticipantEvent(payload, eventType) {
  try {
    var meetingId = payload && payload.object && payload.object.id;
    var participant = payload && payload.object && payload.object.participant;
    if (!meetingId || !participant) return null;

    var participantData = {
      zoom_meeting_id: String(meetingId),
      event_type: eventType,
      participant_user_id: participant.user_id || null,
      participant_email: participant.email || null,
      participant_name: participant.user_name || null,
      join_time: participant.join_time || null,
      leave_time: participant.leave_time || null,
      event_timestamp: new Date().toISOString()
    };

    var response = await axios.post(
      CREDIT_SERVICE_URL + '/api/v1/webhook/zoom/participant-event',
      participantData,
      { timeout: FORWARD_TIMEOUT_MS, headers: { 'Content-Type': 'application/json', 'X-API-Key': CREDIT_API_KEY } }
    );
    console.log('[CreditService] Participant', eventType, 'forwarded:', response.data && response.data.success || 'ok');
    return response.data;
  } catch (error) {
    console.error('[CreditService] Participant event forward failed (non-blocking):', error.message);
    return null;
  }
}


const PIPELINE_URL = 'http://13.205.83.59:8002/sync/client-from-mongo';
const REVERSE_SYNC_API_KEY = 'expertbridge-reverse-sync-m7n3p5';

/**
 * Sync client data to PostgreSQL via Pipeline Worker.
 * Called on: client registration, profile update, admin delete.
 * Fire-and-forget - failures are logged but do NOT block the main flow.
 */
async function forwardClientToPostgres(action, clientData) {
  try {
    if (!clientData || !clientData.email) {
      console.warn('[ClientSync] No email provided, skipping sync');
      return null;
    }

    const payload = {
      action: action,
      mongo_id: (clientData._id || clientData.id || '').toString(),
      email: clientData.email,
      full_name: clientData.name || clientData.fullName || '',
      phone: clientData.phoneNumber || clientData.phoneNo || clientData.phone || '',
      company_name: clientData.companyName || clientData.company_name || '',
      company_size: clientData.companySize || clientData.company_size || '',
      industry: clientData.industry || '',
      designation: clientData.designation || '',
      country: clientData.countryName || clientData.country || '',
      state: clientData.state || '',
      city: clientData.city || '',
      address: clientData.address || '',
      timezone: clientData.timezone || '',
      email_verified: clientData.emailVerified || false
    };

    const response = await axios.post(PIPELINE_URL, payload, {
      timeout: FORWARD_TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': REVERSE_SYNC_API_KEY
      }
    });

    console.log('[ClientSync]', action, clientData.email, '->', response.data && response.data.status || 'ok');
    return response.data;
  } catch (error) {
    console.error('[ClientSync] Failed (non-blocking):', error.message);
    return null;
  }
}

module.exports = {
  forwardRazorpayPayment,
  forwardZoomMeetingEnded,
  forwardExpertCompliance,
  forwardParticipantEvent,
  forwardClientToPostgres,
  CREDIT_SERVICE_URL
};
