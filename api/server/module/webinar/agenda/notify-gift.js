const url = require('url');
const moment = require('moment');
const { PLATFORM_ONLINE } = require('../../meeting');

function giftRecipientReminderHtml({ emailRecipient, webinar, tutor, slot, beforeMinutes, joinUrl }) {
  return `
    <p>Hello ${emailRecipient},</p>
    <p>Your gifted group session "${webinar.name}" starts in ${beforeMinutes} minutes.</p>
    <p><strong>Expert:</strong> ${tutor.showPublicIdOnly ? (tutor.userId || '') : tutor.name}</p>
    <p><strong>Start time:</strong> ${moment(slot.startTime).format('DD/MM/YYYY HH:mm')}</p>
    <p><strong>End time:</strong> ${moment(slot.toTime).format('DD/MM/YYYY HH:mm')}</p>
    <p>Please be on time and click the Zoom link below to join.</p>
    <p>
      <a href="${joinUrl}" style="background-color:#2D89EF;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:4px;font-weight:bold;">
        Join Zoom Meeting
      </a>
    </p>
    <p>If the button does not work, use this link: ${joinUrl}</p>
  `;
}

function giftRecipientBookedHtml({ emailRecipient, senderName, webinar, tutor, nextSlot, joinUrl }) {
  return `
    <p>Hello ${emailRecipient},</p>
    <p>${senderName} has booked a group session for you.</p>
    <p>Please be on time. You will receive reminder emails at 60 minutes and 10 minutes before the session.</p>
    ${nextSlot ? `<p><strong>Session time:</strong> ${moment(nextSlot.startTime).format('DD/MM/YYYY HH:mm')} - ${moment(nextSlot.toTime).format('DD/MM/YYYY HH:mm')}</p>` : ''}
    ${joinUrl ? `<p>
      <a href="${joinUrl}" style="background-color:#2D89EF;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:4px;font-weight:bold;">
        Join Zoom Meeting
      </a>
    </p>
    <p>If the button does not work, use this link: ${joinUrl}</p>` : ''}
    <p><strong>Expert:</strong> ${tutor.showPublicIdOnly ? (tutor.userId || '') : tutor.name}</p>
  `;
}

function giftSenderReminderHtml({ senderName, recipientEmail, webinar, tutor, code }) {
  return `
    <p>Hello ${senderName},</p>
    <p>
      Friendly reminder: your gifted group session for <strong>${recipientEmail}</strong> is still pending registration.
    </p>
    <p><strong>Session:</strong> ${webinar.name}</p>
    <p><strong>Expert:</strong> ${tutor.showPublicIdOnly ? (tutor.userId || '') : tutor.name}</p>
    <p><strong>Code:</strong> ${code}</p>
  `;
}

async function ensureSlotZoomData(slot, tutor, webinar) {
  if (!slot) return null;

  if (slot.zoomData && slot.zoomData.join_url) {
    return slot.zoomData;
  }

  const isZoomPlatform = await Service.Meeting.isPlatform(PLATFORM_ONLINE.ZOOM_US);
  if (!isZoomPlatform) return null;

  const appointmentWithZoom = await DB.Appointment.findOne({
    slotId: slot._id,
    zoomData: { $exists: true, $ne: null }
  });
  if (appointmentWithZoom && appointmentWithZoom.zoomData && appointmentWithZoom.zoomData.join_url) {
    slot.zoomData = appointmentWithZoom.zoomData;
    await slot.save();
    return slot.zoomData;
  }

  const durationMinutes = Math.max(
    1,
    Math.ceil((new Date(slot.toTime) - new Date(slot.startTime)) / (1000 * 60))
  );
  const zoomData = await Service.ZoomUs.createMeeting({
    appointmentId: slot._id,
    topic: (webinar && webinar.name) ? webinar.name : 'ExpertBridge Group Session',
    startTime: slot.startTime.toISOString(),
    duration: durationMinutes,
    timezone: 'UTC'
  });

  if (zoomData && zoomData.join_url) {
    slot.zoomData = zoomData;
    await slot.save();

    await DB.Appointment.update(
      { slotId: slot._id, status: { $in: ['booked', 'pending'] }, paid: true },
      {
        $set: {
          zoomData,
          meetingId: zoomData.id,
          platform: PLATFORM_ONLINE.ZOOM_US
        }
      },
      { multi: true }
    );

    return zoomData;
  }

  return null;
}

async function sendGiftRecipientSessionReminders() {
  await sendGiftRecipientSessionReminderByMinute(60);
  await sendGiftRecipientSessionReminderByMinute(10);
}

async function sendGiftRecipientSessionReminderByMinute(beforeMinutes) {
  const now = moment();
  const reminderWindowEnd = moment().add(beforeMinutes + 2, 'minutes').toDate();
  const slots = await DB.Schedule.find({
    type: 'webinar',
    status: { $in: ['scheduled', 'pending'] },
    startTime: { $lte: reminderWindowEnd }
  });

  if (!slots || !slots.length) return;

  for (const slot of slots) {
    // Skip past slots.
    if (!now.isSameOrBefore(moment(slot.startTime))) {
      continue;
    }
    // Only send if now is inside a small window around beforeMinutes.
    const remindFrom = moment(slot.startTime).add(-1 * (beforeMinutes + 2), 'minutes');
    const remindTo = moment(slot.startTime).add(-1 * (beforeMinutes - 2), 'minutes');
    if (!now.isBetween(remindFrom, remindTo, undefined, '[]')) {
      continue;
    }

    const webinar = await DB.Webinar.findOne({ _id: slot.webinarId });
    const tutor = await DB.User.findOne({ _id: slot.tutorId });
    if (!webinar || !tutor) continue;

    const transactions = await DB.Transaction.find({
      targetType: 'webinar',
      type: 'gift',
      paid: true,
      targetId: webinar._id,
      emailRecipient: { $ne: '' },
      $or: [{ idRecipient: { $exists: false } }, { idRecipient: null }]
    });
    if (!transactions || !transactions.length) continue;

    const zoomData = await ensureSlotZoomData(slot, tutor, webinar);
    if (!zoomData || !zoomData.join_url) {
      continue;
    }

    for (const transaction of transactions) {
      const reminderKey = `before${beforeMinutes}`;
      const flagPath = `meta.giftReminder.${transaction._id.toString()}.${reminderKey}`;
      const alreadySent = slot.meta &&
        slot.meta.giftReminder &&
        slot.meta.giftReminder[transaction._id.toString()] &&
        slot.meta.giftReminder[transaction._id.toString()][reminderKey];
      if (alreadySent) continue;

      const rawEmailHtml = giftRecipientReminderHtml({
        emailRecipient: transaction.emailRecipient,
        webinar,
        tutor,
        slot,
        beforeMinutes,
        joinUrl: zoomData.join_url
      });

      await Service.Mailer.sendRawNow(
        transaction.emailRecipient,
        `Reminder: Your gifted group session starts in ${beforeMinutes} minutes`,
        rawEmailHtml,
        null,
        { useDefaultLayout: true }
      );
      console.log('[GiftMailRaw] Sent recipient reminder', {
        to: transaction.emailRecipient,
        webinarId: webinar._id.toString(),
        beforeMinutes
      });

      await DB.Schedule.update(
        { _id: slot._id },
        { $set: { [flagPath]: true } }
      );
    }
  }
}

async function sendAlert(beforeTimeInMinute = 60) {
  try {
    const query = {
      type: 'gift',
      paid: true,
      isRemindRecipient: false,
      targetType: 'webinar'
    };
    const transactions = await DB.Transaction.find(query);
    if (transactions && transactions.length > 0) {
      transactions.map(async transaction => {
        const user = await DB.User.findOne({ _id: transaction.userId });
        // if (!user) {
        //   throw new Error('Cannot found user');
        // }
        const tutor = await DB.User.findOne({ _id: transaction.tutorId });
        // if (!tutor) {
        //   throw new Error('Cannot found tutor');
        // }
        const webinar = await DB.Webinar.findOne({ _id: transaction.targetId });
        // if (!webinar) {
        //   throw new Error('Cannot found webinar');
        // }
        const recipient = await DB.User.findOne({
          email: transaction.emailRecipient
        });
        if (!recipient && webinar && tutor && user) {
          const nextSlot = await DB.Schedule.findOne({
            webinarId: webinar._id,
            status: { $in: ['scheduled', 'pending'] },
            startTime: { $gte: new Date() }
          }).sort({ startTime: 1 });
          const nextZoomData = nextSlot ? await ensureSlotZoomData(nextSlot, tutor, webinar) : null;
          const bookedEmailHtml = giftRecipientBookedHtml({
            emailRecipient: transaction.emailRecipient,
            senderName: user.name,
            webinar,
            tutor,
            nextSlot,
            joinUrl: nextZoomData && nextZoomData.join_url ? nextZoomData.join_url : ''
          });
          await Service.Mailer.sendRawNow(
            transaction.emailRecipient,
            `${user.name} booked a gifted group session for you`,
            bookedEmailHtml,
            null,
            { useDefaultLayout: true }
          );
          console.log('[GiftMailRaw] Sent initial gifted-recipient email', {
            to: transaction.emailRecipient,
            transactionId: transaction._id.toString()
          });

          await Service.Mailer.sendRawNow(
            user.email,
            '[Notification] Remind your friend',
            giftSenderReminderHtml({
              senderName: user.name,
              recipientEmail: transaction.emailRecipient,
              webinar,
              tutor,
              code: transaction.code
            }),
            null,
            { useDefaultLayout: true }
          );
          console.log('[GiftMailRaw] Sent sender reminder email', {
            to: user.email,
            transactionId: transaction._id.toString()
          });
        }
        await DB.Transaction.update(
          { _id: transaction._id },
          {
            $set: {
              isRemindRecipient: true
            }
          }
        );
      });
    }
  } catch (e) {
    await Service.Logger.create({
      path: 'notify-gift',
      type: 'error',
      error: e
    });
    throw e;
  }
}

/**
 * notify appointment before 30m and before 8h
 */
module.exports = async (job, done) => {
  try {
    await sendGiftRecipientSessionReminders();
    await sendAlert(480);
    await sendAlert(60);
    done();
  } catch (e) {
    await Service.Logger.create({
      level: 'error',
      path: 'notify-gift',
      error: e
    });
    done();
  }
};
