'use strict';

const pool = require('../pgPool');
const axios = require('axios');
const moment = require('moment-timezone');
const { getZoomRequestHeader } = require('../../zoomus/utils/token');
const { ZOOM_API_BASE_URL } = require('../../zoomus/constants');

class SessionHarvester {

  /**
   * Step 1: Harvest Zoom meeting data
   * Calls Zoom Past Meetings API for meeting details and participants
   */
  static async harvestMeeting(appointment) {
    var zoomData = appointment.zoomData || {};
    var meetingId = appointment.meetingId || zoomData.id || zoomData.meetingId || zoomData.meeting_id;

    if (!meetingId) {
      console.log('[Harvester] No Zoom meeting ID for appointment', appointment._id);
      return null;
    }

    // Check if already harvested in PostgreSQL
    var existing = await pool.query(
      'SELECT id FROM session_logs WHERE appointment_id = $1 AND zoom_data_harvested = true',
      [appointment._id.toString()]
    );
    if (existing.rows.length > 0) {
      return existing.rows[0].id;
    }

    // Get Zoom auth headers (uses cached Redis token or fetches new one)
    var headers;
    try {
      headers = await getZoomRequestHeader();
    } catch (err) {
      console.error('[Harvester] Failed to get Zoom token:', err.message);
      return null;
    }

    // Call Zoom Past Meetings API
    var meetingData = null;
    var participantsData = null;

    // Try fetching past meeting data — first with numeric ID, then UUID
    var fetchId = meetingId.toString();
    var fetched = false;

    // Attempt 1: Use numeric meeting ID (no encoding needed)
    try {
      var meetingResp = await axios.get(
        ZOOM_API_BASE_URL + '/past_meetings/' + fetchId,
        { headers: headers }
      );
      meetingData = meetingResp.data;
      fetched = true;
    } catch (err1) {
      // If numeric ID fails and we have a UUID, try that
      if (zoomData.uuid && err1.response && (err1.response.status === 404 || err1.response.status === 400)) {
        var encodedUUID = encodeURIComponent(encodeURIComponent(zoomData.uuid));
        try {
          var meetingResp2 = await axios.get(
            ZOOM_API_BASE_URL + '/past_meetings/' + encodedUUID,
            { headers: headers }
          );
          meetingData = meetingResp2.data;
          fetchId = encodedUUID;
          fetched = true;
        } catch (err2) {
          // Both attempts failed
        }
      }
    }

    if (!fetched || !meetingData) {
      console.log('[Harvester] No past meeting data available for', meetingId);
      return null;
    }

    // Fetch participants
    try {
      var participantsResp = await axios.get(
        ZOOM_API_BASE_URL + '/past_meetings/' + fetchId + '/participants',
        { headers: headers }
      );
      participantsData = participantsResp.data;
    } catch (partErr) {
      console.log('[Harvester] Could not fetch participants for', meetingId, ':', partErr.message);
      participantsData = { participants: [] };
    }

    // Calculate durations
    var scheduledStart = new Date(appointment.startTime);
    var scheduledEnd = new Date(appointment.toTime);
    var scheduledDuration = Math.round((scheduledEnd - scheduledStart) / 60000);
    var actualStart = meetingData.start_time ? new Date(meetingData.start_time) : null;
    var actualEnd = meetingData.end_time ? new Date(meetingData.end_time) : null;
    var actualDuration = meetingData.duration || (actualStart && actualEnd ? Math.round((actualEnd - actualStart) / 60000) : null);

    // Determine participant roles
    var expertId = (appointment.tutorId || '').toString();
    var clientId = (appointment.userId || '').toString();
    var participants = (participantsData && participantsData.participants) || [];

    // Try to match participants to expert/client
    // Host email from zoomData may help identify the expert
    var expertJoined = null, expertLeft = null, clientJoined = null, clientLeft = null;

    for (var i = 0; i < participants.length; i++) {
      var p = participants[i];
      if (!p.join_time) continue;
      // First joiner is often the expert since they get start_url
      if (!expertJoined) {
        expertJoined = new Date(p.join_time);
        expertLeft = p.leave_time ? new Date(p.leave_time) : null;
      } else if (!clientJoined) {
        clientJoined = new Date(p.join_time);
        clientLeft = p.leave_time ? new Date(p.leave_time) : null;
      }
    }

    // Determine session status
    var sessionStatus = SessionHarvester._determineStatus(
      expertJoined, clientJoined, scheduledStart, actualDuration
    );

    // INSERT into session_logs
    var insertResult = await pool.query(
      'INSERT INTO session_logs (' +
      '  appointment_id, booking_code, zoom_meeting_id, zoom_meeting_uuid, meeting_topic,' +
      '  scheduled_start, scheduled_end, scheduled_duration_minutes,' +
      '  actual_start, actual_end, actual_duration_minutes,' +
      '  expert_id, client_id,' +
      '  expert_joined_at, expert_left_at, client_joined_at, client_left_at,' +
      '  session_status, zoom_data_harvested, harvested_at,' +
      '  raw_zoom_response, raw_participants_response' +
      ') VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,true,NOW(),$19,$20)' +
      ' ON CONFLICT (appointment_id) DO UPDATE SET' +
      '  zoom_data_harvested = true,' +
      '  harvested_at = NOW(),' +
      '  actual_start = EXCLUDED.actual_start,' +
      '  actual_end = EXCLUDED.actual_end,' +
      '  actual_duration_minutes = EXCLUDED.actual_duration_minutes,' +
      '  expert_joined_at = EXCLUDED.expert_joined_at,' +
      '  expert_left_at = EXCLUDED.expert_left_at,' +
      '  client_joined_at = EXCLUDED.client_joined_at,' +
      '  client_left_at = EXCLUDED.client_left_at,' +
      '  session_status = EXCLUDED.session_status,' +
      '  raw_zoom_response = EXCLUDED.raw_zoom_response,' +
      '  raw_participants_response = EXCLUDED.raw_participants_response,' +
      '  updated_at = NOW()' +
      ' RETURNING id',
      [
        appointment._id.toString(), appointment.code || '',
        meetingId.toString(), meetingData.uuid || '',
        meetingData.topic || '',
        scheduledStart, scheduledEnd, scheduledDuration,
        actualStart, actualEnd, actualDuration,
        expertId, clientId,
        expertJoined, expertLeft, clientJoined, clientLeft,
        sessionStatus,
        JSON.stringify(meetingData), JSON.stringify(participantsData)
      ]
    );

    var sessionLogId = insertResult.rows[0].id;

    // INSERT into session_participants
    for (var j = 0; j < participants.length; j++) {
      var part = participants[j];
      var role = (j === 0) ? 'expert' : 'client';
      await pool.query(
        'INSERT INTO session_participants (' +
        '  session_log_id, zoom_participant_id, participant_role, display_name,' +
        '  join_time, leave_time, duration_seconds, device_type' +
        ') VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
        [
          sessionLogId, part.id || '', role, part.name || 'Unknown',
          part.join_time ? new Date(part.join_time) : new Date(),
          part.leave_time ? new Date(part.leave_time) : null,
          part.duration || 0,
          part.device || 'unknown'
        ]
      );
    }

    console.log('[Harvester] Harvested meeting', meetingId, '-> session_log', sessionLogId, '[' + sessionStatus + ']');
    return sessionLogId;
  }

  /**
   * Step 2: Calculate billing
   */
  static async calculateBilling(appointment, sessionLogId) {
    // Get session log data
    var logResult = await pool.query(
      'SELECT * FROM session_logs WHERE id = $1', [sessionLogId]
    );
    if (logResult.rows.length === 0) return;
    var log = logResult.rows[0];

    // Get pricing and commission info from the transaction
       var transaction = null;
    var baseTutorAmount = 0; // total amount belonging to tutor for the booked session
    var totalCommissionAmount = 0; // total platform commission for the booked session
    var commissionRate = 0; // derived effective commission rate for reporting
    try {
      transaction = await DB.Transaction.findOne({ _id: appointment.transactionId });
      if (transaction) {
        // Use the tutor's share (balance/originalPrice) to derive hourly rate
        baseTutorAmount =
          (typeof transaction.balance === 'number' && transaction.balance > 0
            ? transaction.balance
            : (typeof transaction.originalPrice === 'number' && transaction.originalPrice > 0
              ? transaction.originalPrice
              : 0));

        totalCommissionAmount = transaction.commission || 0;

        // Effective commission rate for reporting (already applied in payment)
        if (baseTutorAmount > 0 && totalCommissionAmount > 0) {
          commissionRate = totalCommissionAmount / baseTutorAmount;
        }

        // Convert tutor base amount to hourly rate
        var bookedHours = log.scheduled_duration_minutes / 60;
        if (bookedHours > 0 && baseTutorAmount > 0) {
          hourlyRate = baseTutorAmount / bookedHours;
        }
      }
    } catch (e) {
      console.log('[Harvester] Could not fetch transaction for pricing:', e.message);
    }

    var bookedDuration = log.scheduled_duration_minutes;
    var actualDuration = log.actual_duration_minutes || 0;
    // Amounts here are based purely on tutor's hourly rate (no extra commission)
    var bookedAmount = hourlyRate * (bookedDuration / 60);
    var deliveredAmount = hourlyRate * (actualDuration / 60);

    // Credits (only if completed and unused > 5 min grace period)
    var unusedMinutes = 0, creditAmount = 0, creditStatus = 'none';
    if (log.session_status === 'completed' && (bookedDuration - actualDuration) > 5) {
      unusedMinutes = bookedDuration - actualDuration;
      creditAmount = hourlyRate * (unusedMinutes / 60);
      creditStatus = 'pending';
    }

    // Commission: do NOT hardcode; use effective rate derived from transaction
    // This is only for reporting; commission itself was charged during payment
    var platformCommission =
      commissionRate > 0 ? deliveredAmount * commissionRate : 0;
    // Tutor should receive their full delivered tutor amount
    var expertPayout = deliveredAmount;

    // GST (18% standard)
    var gstRate = 0.18;
    var gstAmount = bookedAmount * gstRate;

    // No-show handling
    var noShowParty = null, noShowRefund = 0, noShowPenalty = 0;

    if (log.session_status === 'no_show_expert') {
      noShowParty = 'expert';
      noShowRefund = transaction ? transaction.price : bookedAmount;
      expertPayout = 0;
      creditAmount = bookedAmount;
      creditStatus = 'issued';
      console.log('noShowRefund', noShowRefund);
      console.log('bookedAmount', bookedAmount);
      console.log('transaction', transaction);
      console.log('transaction.price', transaction.price);
      console.log('transaction.originalPrice', transaction.originalPrice);
      console.log('transaction.discountPrice', transaction.discountPrice);
      console.log('transaction.commission', transaction.commission);
      console.log('transaction.commissionRate', transaction.commissionRate);
    } else if (log.session_status === 'no_show_client') {
      noShowParty = 'client';
      noShowRefund = 0;
      // Tutor gets 50% of their booked amount in case client doesn't show
      expertPayout = bookedAmount * 0.5;
      // Commission only on delivered/payout portion
      platformCommission = commissionRate > 0 ? expertPayout * commissionRate : 0;
      console.log('platformCommission', platformCommission);
      console.log('expertPayout', expertPayout);
      console.log('commissionRate', commissionRate);
      console.log('bookedAmount', bookedAmount);
      console.log('transaction', transaction);
      console.log('transaction.price', transaction.price);
      console.log('transaction.originalPrice', transaction.originalPrice);
      console.log('transaction.discountPrice', transaction.discountPrice);
      console.log('transaction.commission', transaction.commission);
      console.log('transaction.commissionRate', transaction.commissionRate);
    } else if (log.session_status === 'no_show_both') {
      noShowParty = 'both';
      noShowRefund = bookedAmount;
      expertPayout = 0;
      creditAmount = bookedAmount;
      creditStatus = 'issued';
      console.log('noShowRefund', noShowRefund);
      console.log('bookedAmount', bookedAmount);
      console.log('transaction', transaction);
      console.log('transaction.price', transaction.price);
      console.log('transaction.originalPrice', transaction.originalPrice);
      console.log('transaction.discountPrice', transaction.discountPrice);
      console.log('transaction.commission', transaction.commission);
      console.log('transaction.commissionRate', transaction.commissionRate);
    }

    // Razorpay reference
    var razorpayId = '';
    try {
      if (!transaction) {
        transaction = await DB.Transaction.findOne({ _id: appointment.transactionId });
      }
      if (transaction && transaction.razorpayPaymentId) {
        razorpayId = transaction.razorpayPaymentId;
      }
    } catch (e) { /* ignore */ }

    await pool.query(
      'INSERT INTO session_billing (' +
      '  session_log_id, appointment_id,' +
      '  booked_duration_minutes, hourly_rate, booked_amount, currency,' +
      '  razorpay_payment_id,' +
      '  actual_duration_minutes, delivered_amount,' +
      '  unused_minutes, credit_amount, credit_status,' +
      '  expert_payout_amount, platform_commission, commission_rate,' +
      '  expert_payout_status,' +
      '  gst_applicable, gst_rate, gst_amount, sac_code,' +
      '  supplier_legal_name,' +
      '  billing_status,' +
      '  no_show_party, no_show_refund_amount, no_show_penalty_amount,' +
      '  calculated_at' +
      ") VALUES ($1,$2,$3,$4,$5,'INR',$6,$7,$8,$9,$10,$11,$12,$13,$14,'pending'," +
      "  true,$15,$16,'998399','Elevatexcel Consulting Private Limited'," +
      "  'calculated',$17,$18,$19,NOW())" +
      ' ON CONFLICT (appointment_id) DO UPDATE SET' +
      '  actual_duration_minutes = EXCLUDED.actual_duration_minutes,' +
      '  delivered_amount = EXCLUDED.delivered_amount,' +
      '  unused_minutes = EXCLUDED.unused_minutes,' +
      '  credit_amount = EXCLUDED.credit_amount,' +
      '  credit_status = EXCLUDED.credit_status,' +
      '  expert_payout_amount = EXCLUDED.expert_payout_amount,' +
      '  platform_commission = EXCLUDED.platform_commission,' +
      "  billing_status = 'calculated'," +
      '  no_show_party = EXCLUDED.no_show_party,' +
      '  no_show_refund_amount = EXCLUDED.no_show_refund_amount,' +
      '  no_show_penalty_amount = EXCLUDED.no_show_penalty_amount,' +
      '  last_recalculated_at = NOW(),' +
      '  updated_at = NOW()' +
      ' RETURNING id',
      [
        sessionLogId, appointment._id.toString(),
        bookedDuration, hourlyRate, bookedAmount,
        razorpayId,
        actualDuration, deliveredAmount,
        unusedMinutes, creditAmount, creditStatus,
        expertPayout, platformCommission, commissionRate,
        gstRate, gstAmount,
        noShowParty, noShowRefund, noShowPenalty
      ]
    );

    console.log('[Harvester] Billing calculated for appointment', appointment._id, '- status:', log.session_status);
  }

  /**
   * Step 3: Deactivate Zoom meeting link
   */
  static async deactivateZoomLink(appointment, sessionLogId) {
    var zoomData = appointment.zoomData || {};
    var meetingId = appointment.meetingId || zoomData.id || zoomData.meetingId;
    if (!meetingId) return;

    try {
      var headers = await getZoomRequestHeader();

      await axios.delete(
        ZOOM_API_BASE_URL + '/meetings/' + meetingId,
        { headers: headers }
      );

      await pool.query(
        'UPDATE session_logs SET zoom_link_deactivated = true, deactivated_at = NOW(), updated_at = NOW() WHERE id = $1',
        [sessionLogId]
      );

      console.log('[Harvester] Deactivated Zoom meeting', meetingId);
    } catch (err) {
      // 404 = already deleted
      if (err.response && err.response.status === 404) {
        await pool.query(
          'UPDATE session_logs SET zoom_link_deactivated = true, deactivated_at = NOW(), updated_at = NOW() WHERE id = $1',
          [sessionLogId]
        );
        console.log('[Harvester] Zoom meeting', meetingId, 'already deleted');
      } else {
        console.error('[Harvester] Failed to deactivate', meetingId, ':', err.message);
        // Will retry next cycle
      }
    }
  }

  /**
   * Step 4: Sync minimal data back to MongoDB for frontend display
   */
  static async syncToMongoDB(appointmentId, sessionLogId) {
    var logResult = await pool.query(
      'SELECT session_status, actual_duration_minutes FROM session_logs WHERE id = $1',
      [sessionLogId]
    );
    var billingResult = await pool.query(
      'SELECT credit_amount FROM session_billing WHERE session_log_id = $1',
      [sessionLogId]
    );

    var log = logResult.rows[0] || {};
    var billing = billingResult.rows[0] || {};

    await DB.Appointment.updateOne(
      { _id: appointmentId },
      {
        $set: {
          sessionCompleted: true,
          actualDuration: log.actual_duration_minutes || 0,
          sessionStatus: log.session_status || 'unknown',
          creditIssued: billing.credit_amount || 0,
          sessionLogId: sessionLogId,
          zoomLinkActive: false,
          updatedByHarvester: new Date()
        }
      }
    );

    console.log('[Harvester] MongoDB synced for appointment', appointmentId);
  }

  /**
   * Session status determination
   */
  static _determineStatus(expertJoined, clientJoined, scheduledStart, actualDuration) {
    var tenMinAfter = new Date(scheduledStart.getTime() + 10 * 60000);
    var now = new Date();

    if (expertJoined && clientJoined && actualDuration > 0) return 'completed';
    if (expertJoined && !clientJoined && now > tenMinAfter) return 'no_show_client';
    if (!expertJoined && clientJoined && now > tenMinAfter) return 'no_show_expert';
    if (!expertJoined && !clientJoined && now > tenMinAfter) return 'no_show_both';
    return 'scheduled';
  }
}

module.exports = SessionHarvester;
