'use strict';

var SessionHarvester = require('../../sessionLogs/services/SessionHarvester');
var moment = require('moment-timezone');

/**
 * Session Harvester — runs every 15 minutes via Agenda
 * Harvests Zoom meeting data, calculates billing, deactivates links, syncs to MongoDB
 */
module.exports = async function(job, done) {
  try {
    // Find appointments that need harvesting:
    // - Have Zoom data
    // - Session should be over (scheduledEnd + 30 min buffer has passed)
    // - Not yet harvested (no updatedByHarvester flag)
    var cutoff = moment().subtract(30, 'minutes').toDate();

    var appointments = await DB.Appointment.find({
      zoomData: { $exists: true, $ne: null },
      toTime: { $lt: cutoff },
      status: { $in: ['booked', 'pending', 'progressing', 'completed', 'meeting-completed', 'not-start'] },
      updatedByHarvester: { $exists: false }
    })
    .limit(10)  // Process max 10 per cycle to avoid overwhelming Zoom API
    .lean();

    if (!appointments || appointments.length === 0) {
      return done();
    }

    console.log('[Harvester] Found', appointments.length, 'appointments to process');

    for (var i = 0; i < appointments.length; i++) {
      var appt = appointments[i];
      try {
        // Step 1: Harvest Zoom data
        var sessionLogId = await SessionHarvester.harvestMeeting(appt);

        if (!sessionLogId) {
          // If harvest returns null (meeting not found/no data), mark to avoid retrying endlessly
          // But only if the meeting should definitely be over (scheduled_end + 2 hours)
          var twoHoursAfterEnd = new Date(new Date(appt.toTime).getTime() + 2 * 60 * 60000);
          if (new Date() > twoHoursAfterEnd) {
            await DB.Appointment.updateOne(
              { _id: appt._id },
              { $set: { updatedByHarvester: new Date(), sessionStatus: 'no_data' } }
            );
            console.log('[Harvester] Marked no_data for appointment', appt._id);
          }
          continue;
        }

        // Step 2: Calculate billing
        await SessionHarvester.calculateBilling(appt, sessionLogId);

        // Step 3: Deactivate Zoom link
        await SessionHarvester.deactivateZoomLink(appt, sessionLogId);

        // Step 4: Sync to MongoDB
        await SessionHarvester.syncToMongoDB(appt._id, sessionLogId);

      } catch (apptErr) {
        console.error('[Harvester] Error processing', appt._id, ':', apptErr.message);
      }
    }

    done();
  } catch (err) {
    console.error('[Harvester] Job error:', err.message);
    try {
      await Service.Logger.create({
        level: 'error',
        path: 'session-harvester',
        error: err
      });
    } catch (logErr) { /* ignore */ }
    done();
  }
};
