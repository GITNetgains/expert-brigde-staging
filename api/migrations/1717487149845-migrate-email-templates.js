'use strict';
const { readFileSync } = require('fs');
const { join, parse } = require('path');

const TEMPLATE_DIR = join(__dirname, '..', 'server', 'emails');
const templates = {
  'material-class-uploaded-to-user': {
    name: 'New material uploaded for student',
    subject: 'New material uploaded',
    description: 'Email to student when tutor upload new material',
    path: 'material/class-uploaded.html',
    group: 'material'
  },
  'material-class-uploaded-to-tutor': {
    name: 'New material uploaded for tutor',
    subject: 'New material uploaded',
    description: 'Email to tutor when student upload new material',
    path: 'material/class-uploaded-by-student.html',
    group: 'material'
  },
  'notify-review-to-user': {
    name: 'Tutor review class',
    subject: 'Your teacher reviewed the lesson',
    description: 'Email to user when tutor review the lesson',
    path: 'review/notify-review-student.html',
    group: 'review'
  },
  'appointment-cancel-to-tutor': {
    name: 'Appointment has been canceled',
    subject: 'Cancellation Request',
    description: 'Email to tutor when appointment has been canceled',
    path: 'appointment/cancel-tutor.html',
    group: 'appointment'
  },
  'appointment-cancel-to-user': {
    name: 'Appointment has been canceled',
    subject: 'Cancellation Request',
    description: 'Email to user when appointment has been canceled',
    path: 'appointment/cancel-user.html',
    group: 'appointment'
  },
  'appointment-cancel-to-admin': {
    name: 'Appointment has been canceled',
    subject: 'Cancellation Request',
    description: 'Email to admin when appointment has been canceled',
    path: 'appointment/cancel-admin.html',
    group: 'appointment'
  },
  'appointment-tutor-cancel-success': {
    name: 'Appointment has been canceled by tutor',
    subject: 'You have successfully cancelled your lesson',
    description: 'Email to tutor when appointment has been canceled',
    path: 'appointment/tutor-cancel-success.html',
    group: 'appointment'
  },
  'appointment-student-cancel-success': {
    name: 'Appointment has been canceled by student',
    subject: 'You have successfully cancelled your lesson',
    description: 'Email to student when appointment has been canceled',
    path: 'appointment/student-cancel-success.html',
    group: 'appointment'
  },
  'tutor-not-start-meeting-to-admin': {
    name: 'Tutor did not start meeting for the class',
    subject: 'Tutor did not start meeting for the class',
    description: 'Email to admin when tutor did not start meeting',
    path: 'appointment/tutor-not-start-meeting-to-admin.html',
    group: 'appointment'
  },
  'tutor-not-start-meeting-to-tutor': {
    name: 'Tutor did not start meeting for the class',
    subject: 'You did not start meeting for the class',
    description: 'Email to tutor when he/she did not start meeting',
    path: 'appointment/tutor-not-start-meeting.html',
    group: 'appointment'
  },
  'appointment-group-class-notification-user': {
    name: 'Notify user for group class meeting start time',
    subject: '[Notification] Booking #groupClassName at #startTime',
    description: 'Email to user for group class meeting start time',
    path: 'appointment/notification-user.html',
    group: 'appointment',
    subject_replace_fields: ['groupClassName', 'startTime']
  },
  'appointment-class-notification-user': {
    name: 'Notify class start time',
    subject: '[Notify] Appointment #appointmentCode at #startTime',
    description: 'Email to user for class start time',
    path: 'appointment/notification-user-class.html',
    group: 'appointment',
    subject_replace_fields: ['appointmentCode', 'startTime']
  },
  'appointment-class-notification-tutor': {
    name: 'Notify class start time',
    subject: '[Notify] Appointment #appointmentCode at #startTime',
    description: 'Email to tutor for class start time',
    path: 'appointment/notification-tutor-class.html',
    group: 'appointment',
    subject_replace_fields: ['appointmentCode', 'startTime']
  },
  'appointment-notify-review-to-user': {
    name: 'New review',
    subject: 'Appointment #appointmentCode has been completed',
    description: 'Email to user new review',
    path: 'review/notify-review.html',
    group: 'review',
    subject_replace_fields: ['appointmentCode']
  },
  'appointment-group-class-notify-review-to-tutor': {
    name: 'New review',
    subject: 'Appointment #groupClassName has been completed',
    description: 'Email to tutor for new review',
    path: 'review/notify-review-tutor.html',
    group: 'review',
    subject_replace_fields: ['groupClassName']
  },
  'appointment-notify-meeting-start': {
    name: 'Meeting started',
    subject: '[Notification] Appointment #appointmentCode has been started',
    description: 'Email to user when meeting started',
    path: 'appointment/notify-meeting-start.html',
    group: 'appointment',
    subject_replace_fields: ['appointmentCode']
  },
  'confirm-book-free-tutor': {
    name: 'User booked a slot free',
    subject: 'User #userName booked a slot free!',
    description: 'Email to tutor when user booked a slot free',
    path: 'appointment/confirm-book-free-tutor.html',
    group: 'appointment',
    subject_replace_fields: ['userName']
  },
  'confirm-book-free-user': {
    name: 'User booked a slot free',
    subject: 'Successfully booked 1 free slot with tutor #tutorName',
    description: 'Email to user when booked a slot free',
    path: 'appointment/confirm-book-free-user.html',
    group: 'appointment',
    subject_replace_fields: ['tutorName']
  },
  'new-course-create-to-admin': {
    name: 'New course created',
    subject: 'New Course Created',
    description: 'Email to admin when new course created',
    path: 'course/new-course-create.html',
    group: 'course'
  },
  'complete-course': {
    name: 'Completed course',
    subject: 'Congratulations! - You have completed your course !',
    description: 'Email to user when completed the course',
    path: 'course/complete-course.html',
    group: 'course'
  },
  'reject-course': {
    name: 'Admin reject a course',
    subject: 'Your course has been rejected!',
    description: 'Email to tutor when course has been rejected',
    path: 'course/reject.html',
    group: 'course'
  },
  'approve-course': {
    name: 'Admin approve a course',
    subject: 'Your course has been approved!',
    description: 'Email to tutor when course has been approved',
    path: 'course/approve.html',
    group: 'course'
  },
  'disable-course': {
    name: 'Admin disable a course',
    subject: 'Disable course temporarily.',
    description: 'Email to tutor when course has been disabled',
    path: 'course/disable.html',
    group: 'course'
  },
  'enable-course': {
    name: 'Admin enable a course',
    subject: 'Your course has been enabled!',
    description: 'Email to tutor when course has been enabled',
    path: 'course/enable.html',
    group: 'course'
  },
  'new-message': {
    name: 'New message',
    subject: 'New Message',
    description: 'Email to user when received new message',
    path: 'message/new-message.html',
    group: 'other'
  },
  'invite-friend': {
    name: 'Invite friend',
    subject: '#userName invites you to join #appName',
    description: 'Email to user when ',
    path: 'newsletter/invite-friend.html',
    group: 'other',
    subject_replace_fields: ['userName', 'appName']
  },
  'verify-email': {
    name: 'Verify email',
    subject: 'Verify email address',
    description: 'Email to user to verify email',
    path: 'verify-email.html',
    group: 'auth'
  },
  'forgot-password': {
    name: 'Forgot password?',
    subject: 'Forgot your password?',
    description: 'Email to user when forgot password',
    path: 'forgot-password.html',
    group: 'auth'
  },
  'notify-tutor-new-booking-webinar': {
    name: 'New booking webinar',
    subject: 'New user booking with you!',
    description: 'Email to tutor when user booked webinar',
    path: 'appointment/notify-tutor-new-booking-webinar.html',
    group: 'payment'
  },
  'payment-success': {
    name: 'Payment successfully',
    subject: 'Payment successfully made for the reservation #transactionCode',
    description: 'Email to tutor when user booked successfully',
    path: 'payment/book-appointment-success.html',
    group: 'payment',
    subject_replace_fields: ['transactionCode']
  },
  'send-gift': {
    name: 'Send gift',
    subject: '#userName gave you a gift',
    description: 'User gives their friend a gift',
    path: 'appointment/send-gift.html',
    group: 'payment',
    subject_replace_fields: ['userName']
  },
  'payout-request-to-admin': {
    name: 'Payout request',
    subject: 'Payment request from #tutorName',
    description: 'Email to admin when tutor created payout request',
    path: 'payout/request-to-admin.html',
    group: 'payout',
    subject_replace_fields: ['tutorName']
  },
  'payout-approve-notify-to-tutor': {
    name: 'Admin approved payout request',
    subject: 'Payout request #payoutRequestCode has been approved',
    description: 'Email to tutor when admin approved payout request',
    path: 'payout/approve-notify-to-tutor.html',
    group: 'payout',
    subject_replace_fields: ['payoutRequestCode']
  },
  'payout-reject-notify-to-tutor': {
    name: 'Admin rejected payout request',
    subject: 'Payout request #payoutRequestCode was rejected',
    description: 'Email to tutor when admin rejected payout request',
    path: 'payout/reject-notify-to-tutor.html',
    group: 'payout',
    subject_replace_fields: ['payoutRequestCode']
  },
  'refund-request-to-admin': {
    name: 'Refund request',
    subject: 'Refund request from #userName',
    description: 'Email to admin when user created refund request',
    path: 'refund/request-notify-to-tutor.html',
    group: 'refund',
    subject_replace_fields: ['userName']
  },
  'refund-approve-notify-to-user': {
    name: 'Admin approved refund request',
    subject: 'Refund request #refundRequestCode has been approved',
    description: 'Email to user when admin aprroved refund request',
    path: 'refund/approve-notify-to-user.html',
    group: 'refund',
    subject_replace_fields: ['refundRequestCode']
  },
  'refund-approve-notify-to-tutor': {
    name: 'Admin approved refund request',
    subject: 'Approved a refund request #refundRequestCode',
    description: 'Email to tutor when admin aprroved refund request',
    path: 'refund/approve-notify-to-tutor.html',
    group: 'refund',
    subject_replace_fields: ['refundRequestCode']
  },
  'refund-reject-notify-to-user': {
    name: 'Admin rejected refund request',
    subject: 'Refund request #refundRequestCode has been rejected',
    description: 'Email to user when admin rejected refund request',
    path: 'refund/reject-notify-to-user.html',
    group: 'refund',
    subject_replace_fields: ['refundRequestCode']
  },
  'refund-refund-notify-to-user': {
    name: 'Admin refund to user',
    subject: 'Refund #refundRequestCode to you',
    description: 'Email to user when admin refund to user',
    path: 'refund/refund-notify-to-user.html',
    group: 'refund',
    subject_replace_fields: ['refundRequestCode']
  },
  'review-removed-by-admin': {
    name: 'Review removed by admin',
    subject: 'Your review has been removed',
    description: 'Your review has been removed',
    path: 'review/review-removed-by-admin.html',
    group: 'review'
  },
  'new-review-tutor': {
    name: 'Notify new review',
    subject: '#userName rated your meeting #appointmentCode',
    description: 'Notify new review to tutor',
    path: 'review/new-review-tutor.html',
    group: 'review',
    subject_replace_fields: ['userName', 'appointmentCode']
  },
  'new-review-user': {
    name: 'Notify new review',
    subject: '#userName rated your meeting #appointmentCode',
    description: 'Notify new review to user',
    path: 'review/new-review-user.html',
    group: 'review',
    subject_replace_fields: ['userName', 'appointmentCode']
  },
  'contact-new-message': {
    name: 'New contact',
    subject: 'New contact from #userName',
    description: 'Notify to admin new contact',
    path: 'contact/message.html',
    group: 'system',
    subject_replace_fields: ['userName']
  },
  'tutor-new-account-register': {
    name: 'New Registered Teacher',
    subject: 'New Registered Teacher',
    description: 'Notify to admin registered teacher',
    path: 'tutor/new-account-register.html',
    group: 'tutor'
  },
  'tutor-reject': {
    name: 'Reject tutor',
    subject: 'Your profile has been rejected!',
    description: 'Notify when admin rejected tutor',
    path: 'tutor/reject.html',
    group: 'tutor'
  },
  'tutor-approve': {
    name: 'Approve tutor',
    subject: 'Your profile has been approved!',
    description: 'Notify when admin approved tutor',
    path: 'tutor/approve.html',
    group: 'tutor'
  },
  'tutor-deleted-on-zoom': {
    name: 'Delete tutor on zoom',
    subject: "Temporarily suspending the tutor's activities!",
    description: 'Notify when tutor has been deleted on zoom',
    path: 'tutor/deleted-on-zoom.html',
    group: 'tutor'
  },
  'new-password-create': {
    name: 'New password created',
    subject: 'New password has been created',
    description: 'Notify to use when password created',
    path: 'user/new-password-create.html',
    group: 'user'
  },
  'appointment-notify-tutor-new-booking': {
    name: 'Appointment has been canceled',
    subject: 'New user booking with you!',
    description: 'Email to tutor when new user booking',
    path: 'appointment/notify-tutor-new-booking.html',
    group: 'appointment'
  },
  'appointment-notification-reschedule-tutor': {
    name: 'Reschedule class',
    subject: 'Reschedule class notification!',
    description: 'Email to tutor when user reschedule class',
    path: 'appointment/notification-reschedule-tutor.html',
    group: 'appointment'
  },
  'appointment-notification-reschedule-user': {
    name: 'Reschedule class',
    subject: 'Reschedule class successfully!',
    description: 'Email to user when reschedule class successfully',
    path: 'appointment/notification-reschedule-user.html',
    group: 'appointment'
  },
  'appointment-send-gift': {
    name: 'Send gift',
    subject: '#userName gave you a gift',
    description: 'Email to user when received a gift from friend',
    path: 'appointment/send-gift.html',
    group: 'appointment',
    subject_replace_fields: ['userName']
  },
  'appointment-remind-gift': {
    name: 'Remind gift',
    subject: '[Notification] Remind your friend',
    description: "Email to user to remind user's friend recieve gift",
    path: 'appointment/remind-gift.html',
    group: 'appointment'
  },
  'appointment-notification-tutor-groupclass': {
    name: 'Remind gift',
    subject: '[Notification] Appointment #groupClassName at #startTime',
    description: 'Email to tutor for groupclass start time ',
    path: 'appointment/notification-tutor.html',
    group: 'appointment',
    subject_replace_fields: ['startTime', 'groupClassName']
  },
  'tutor-invite-to-join-zoom': {
    name: 'Invite tutor to join zoom',
    subject: 'Welcome back to our system.!',
    description: 'Email to tutor for join our zoom',
    path: 'tutor/invite-to-join-zoom.html',
    group: 'tutor'
  },
  'admin-delete-course': {
    name: 'Admin deleted course',
    subject: 'Admin deleted your course',
    description: 'Email to tutor when admin delete the course',
    group: 'course'
  },
  'admin-delete-student': {
    name: 'Admin deleted student',
    subject: 'Admin deleted your profile',
    description: 'Email to student when admin delete student profile',
    group: 'user'
  },
  'admin-disable-groupclass': {
    name: 'Admin disabled groupclass',
    subject: 'Admin disabled your groupclass',
    description: 'Email to tutor when admin disabled groupclass',
    group: 'groupclass'
  },
  'admin-active-tutor': {
    name: 'Admin active tutor',
    subject: 'Admin activated your profile',
    description: 'Email to tutor when admin activated tutor',
    group: 'tutor'
  },
  'admin-inactive-tutor': {
    name: 'Admin inactive tutor',
    subject: 'Admin inactivated your profile',
    description: 'Email to tutor when admin inactivated tutor',
    group: 'tutor'
  },
  'material-groupclass-uploaded-to-user': {
    name: 'New groupclass material uploaded for student',
    subject: 'New material uploaded',
    description: 'Email to student when tutor upload new material in groupclass',
    group: 'material'
  },
  'new-review-course': {
    name: 'Notify new review to course',
    subject: '#userName rated your course #courseName',
    description: 'Notify new review course',
    path: 'review/new-review-course.html',
    group: 'review',
    subject_replace_fields: ['userName', 'courseName']
  }
};

module.exports.up = async function (next) {
  const templateKeys = Object.keys(templates);
  for (const key of templateKeys) {
    const content = templates[key].path ? readFileSync(join(TEMPLATE_DIR, templates[key].path)).toString() : '<p>This is email content</>';
    const exist = await DB.EmailTemplate.findOne({ key });

    if (!exist) {
      const newTemplate = new DB.EmailTemplate({ ...templates[key], content, key });
      await newTemplate.save();
    }
  }
  console.log('Mirgate email templates success');
  next();
};

module.exports.down = function (next) {
  next();
};
