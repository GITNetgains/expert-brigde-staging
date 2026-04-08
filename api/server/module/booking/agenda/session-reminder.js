const moment = require('moment');
const date = require('../../date');
const { PLATFORM_ONLINE } = require('../../meeting');

async function ensureZoomDataForReminder(appointment, tutor) {
  if (!appointment || appointment.zoomData) return appointment;

  const isZoomPlatform = await Service.Meeting.isPlatform(PLATFORM_ONLINE.ZOOM_US);
  if (!isZoomPlatform) return appointment;

  // For webinar/group sessions, reuse one Zoom room for all appointments in the same slot.
  if (appointment.targetType === 'webinar' && appointment.slotId) {
    const siblingWithZoom = await DB.Appointment.findOne({
      _id: { $ne: appointment._id },
      slotId: appointment.slotId,
      zoomData: { $exists: true, $ne: null }
    });

    if (siblingWithZoom && siblingWithZoom.zoomData && siblingWithZoom.meetingId) {
      appointment.zoomData = siblingWithZoom.zoomData;
      appointment.meetingId = siblingWithZoom.meetingId;
      appointment.platform = PLATFORM_ONLINE.ZOOM_US;
      await appointment.save();
      return appointment;
    }
  }

  const tutorDisplayName = tutor.showPublicIdOnly === true
    ? (tutor.userId || tutor._id.toString())
    : tutor.name;
  const durationMinutes = Math.max(
    1,
    Math.ceil((new Date(appointment.toTime) - new Date(appointment.startTime)) / (1000 * 60))
  );
  const zoomData = await Service.ZoomUs.createMeeting({
    appointmentId: appointment._id,
    topic: appointment.description || `${tutorDisplayName}'s Tutoring Session`,
    startTime: appointment.startTime.toISOString(),
    duration: durationMinutes,
    timezone: 'Asia/Calcutta'
  });

  if (zoomData && zoomData.join_url) {
    appointment.zoomData = zoomData;
    appointment.meetingId = zoomData.id;
    appointment.platform = PLATFORM_ONLINE.ZOOM_US;
    await appointment.save();

    if (appointment.targetType === 'webinar' && appointment.slotId) {
      await DB.Appointment.update(
        {
          _id: { $ne: appointment._id },
          slotId: appointment.slotId,
          status: { $in: ['pending', 'booked'] },
          paid: true
        },
        {
          $set: {
            zoomData,
            meetingId: zoomData.id,
            platform: PLATFORM_ONLINE.ZOOM_US
          }
        },
        { multi: true }
      );
    }
  }

  return appointment;
}

/**
 * Session Reminder — 10 minutes before start
 * Sends email + dashboard notification to both expert and client
 * Runs every 2 minutes via Agenda
 */
module.exports = async (job, done) => {
  try {
    const now = moment();
    const reminderWindowEnd = moment().add(12, 'minutes').toDate();

    const flag = 'meta.sendNotifications.before.10';
    const query = {
      visible: true,
      startTime: { $lte: reminderWindowEnd },
      status: { $in: ['pending', 'booked'] },
      paid: true
    };
    query[flag] = { $ne: true };

    const appointments = await DB.Appointment.find(query);

    if (!appointments || !appointments.length) {
      return done();
    }

    let sentCount = 0;

    await Promise.all(
      appointments.map(async (appointment) => {
        try {
          const updateFlag = {};
          updateFlag[flag] = true;

          // Skip and mark old/past appointments so they don't keep appearing in query
          if (!moment().isSameOrBefore(moment(appointment.startTime))) {
            await DB.Appointment.update(
              { _id: appointment._id },
              { $set: updateFlag }
            );
            return;
          }

          // Only send if within the 12-minute window before start
          if (!moment().isSameOrAfter(moment(appointment.startTime).add(-12, 'minutes').toDate())) {
            return;
          }

          const tutor = await DB.User.findOne({ _id: appointment.tutorId });
          const user = await DB.User.findOne({ _id: appointment.userId });

          if (!tutor || !user) {
            console.log('[SessionReminder] Missing tutor or user for appointment', appointment._id);
            await DB.Appointment.update({ _id: appointment._id }, { $set: updateFlag });
            return;
          }

          await ensureZoomDataForReminder(appointment, tutor);

          const startTimeTutor = date.formatDate(appointment.startTime, 'DD/MM/YYYY HH:mm', tutor.timezone || '');
          const toTimeTutor = date.formatDate(appointment.toTime, 'DD/MM/YYYY HH:mm', tutor.timezone || '');
          const startTimeUser = date.formatDate(appointment.startTime, 'DD/MM/YYYY HH:mm', user.timezone || '');
          const toTimeUser = date.formatDate(appointment.toTime, 'DD/MM/YYYY HH:mm', user.timezone || '');

          // Send reminder email to expert
          await Service.Mailer.send('session-reminder-expert', tutor.email, {
            subject: 'Reminder: Your ExpertBridge session starts in 10 minutes',
            appointment: appointment.toObject(),
            tutor: tutor.getPublicProfile(),
            user: user.getPublicProfile(),
            startTime: startTimeTutor,
            toTime: toTimeTutor
          });

          // Send reminder email to client
          await Service.Mailer.send('session-reminder-client', user.email, {
            subject: 'Reminder: Your ExpertBridge session starts in 10 minutes',
            appointment: appointment.toObject(),
            tutor: tutor.getPublicProfile(),
            user: user.getPublicProfile(),
            startTime: startTimeUser,
            toTime: toTimeUser
          });

          // Dashboard notification to expert
          await Service.Notification.create({
            title: 'Session Reminder',
            description: 'Your session #' + appointment.code + ' starts in 10 minutes',
            itemId: appointment._id,
            notifyTo: tutor._id,
            type: 'booking'
          });

          // Dashboard notification to client
          await Service.Notification.create({
            title: 'Session Reminder',
            description: 'Your session #' + appointment.code + ' starts in 10 minutes',
            itemId: appointment._id,
            notifyTo: user._id,
            type: 'booking'
          });

          // Mark as reminded
          await DB.Appointment.update(
            { _id: appointment._id },
            { $set: updateFlag }
          );

          sentCount++;
          console.log('[SessionReminder] Sent 10-min reminder for appointment', appointment._id.toString(), appointment.code);
        } catch (apptErr) {
          console.error('[SessionReminder] Error processing appointment', appointment._id, apptErr.message);
        }
      })
    );

    if (sentCount > 0) {
      console.log('[SessionReminder] Sent reminders for', sentCount, 'appointments');
    }

    done();
  } catch (e) {
    console.error('[SessionReminder] Cron error:', e.message);
    await Service.Logger.create({
      level: 'error',
      path: 'session-reminder',
      error: e
    });
    done();
  }
};
