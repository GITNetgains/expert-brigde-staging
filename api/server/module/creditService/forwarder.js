/**
 * Credit Service Forwarder
 * Forwards webhook events to Credit Service on OLD EC2 (Port 8010)
 * Added: March 4, 2026
 *
 * IMPORTANT: Fire-and-forget with full error handling.
 * Failures are logged but do NOT block the main flow.
 */

const axios = require('axios');

const CREDIT_SERVICE_URL = process.env.CREDIT_SERVICE_URL || 'http://172.31.3.181:8010';
const FORWARD_TIMEOUT_MS = 5000;

/**
 * Forward Razorpay payment.captured to Credit Service
 */
async function forwardRazorpayPayment(payload) {
  try {
    const response = await axios.post(
      `${CREDIT_SERVICE_URL}/webhook/razorpay/payment-captured`,
      payload,
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

module.exports = {
  forwardRazorpayPayment,
  forwardZoomMeetingEnded,
  CREDIT_SERVICE_URL
};
