const Queue = require('../../kernel/services/queue');
const enrollQ = Queue.create(`webinar_queue`);
const moment = require('moment');
const momentTimeZone = require('moment-timezone');
const date = require('../date');
enrollQ.process(async (job, done) => {
  const { data, command } = job.data;
  try {
    switch (command) {
      case 'new-booking-webinar': {
        const slots = await DB.Schedule.find({ webinarId: data.targetId, status: { $in: ['scheduled', 'pending'] } });

        const tutor = await DB.User.findOne({ _id: data.tutorId });
        if (!tutor) {
          throw new Error('Cannot find tutor');
        }
        const user = await DB.User.findOne({ _id: data.userId });
        if (!user) {
          throw new Error('Cannot find user');
        }
        const webinar = await DB.Webinar.findOne({ _id: data.targetId });
        if (!webinar) {
          throw new Error('Cannot find webinar');
        }

        if (slots.length) {
          await Promise.all(
            slots.map(async slot => {
              if (moment(data.createdAt).isBefore(moment(slot.startTime).add(-1 * 30, 'minutes'))) {
                const countAppointment = await DB.Appointment.findOne({
                  userId: data.userId,
                  slotId: slot._id,
                  targetType: 'webinar',
                  webinarId: webinar._id,
                  tutorId: data.tutorId,
                  status: { $in: ['booked', 'pending'] }
                });
                if (!countAppointment) {
                  const appointment = new DB.Appointment({
                    tutorId: tutor._id,
                    userId: data.userId,
                    slotId: slot._id,
                    webinarId: webinar._id,
                    startTime: slot.startTime,
                    toTime: slot.toTime,
                    transactionId: data._id,
                    targetType: data.targetType,
                    paid: data.paid || false,
                    status: 'booked',
                    description: `Appointment ${webinar.name} ${user.name} with ${tutor.name}`,
                    isFree: webinar.isFree,
                    tutorInfo: {
                      name: tutor.name,
                      username: tutor.username
                    },
                    userInfo: {
                      name: user.name,
                      username: user.username
                    },
                    webinarInfo: {
                      name: webinar.name,
                      alias: webinar.alias
                    }
                  });
                  await appointment.save();
                }
              }
            })
          );
        }
        await DB.Webinar.update(
          { _id: webinar._id },
          {
            $inc: {
              numberParticipants: 1
            }
          }
        );

        await Service.Mailer.send('notify-tutor-new-booking-webinar', tutor.email, {
          subject: `New user booking with you!`,
          user: user.getPublicProfile(),
          tutor: tutor.getPublicProfile(),
          transaction: data,
          webinar: webinar.toObject()
        });

        const notificationTutor = {
          title: `Booking`,
          description: webinar.isFree || data.price <= 0 ? 'You have a new free group class booking!' : 'You have a new group class booking!',
          itemId: webinar._id,
          notifyTo: tutor._id,
          type: 'booking'
        };
        await Service.Notification.create(notificationTutor);

        await Service.Mailer.send('payment-success', user.email, {
          subject: `Payment successfully made for the reservation #${data.code}`,
          user: user.getPublicProfile(),
          transaction: data,
          webinar: webinar.toObject(),
          subject_replace_fields: {
            transactionCode: data.code
          }
        });

        const notification = {
          title: `Payments`,
          description: `Payment successfully made for the reservation #${data.code}`,
          itemId: data._id,
          notifyTo: user._id,
          type: 'payment'
        };
        await Service.Notification.create(notification);

        break;
      }
      case 'new-gift-webinar': {
        const transactions = await DB.Transaction.find({
          emailRecipient: data.emailRecipient,
          paid: true,
          type: 'gift',
          targetType: 'webinar'
        });
        const user = await DB.User.findOne({ email: data.emailRecipient });
        if (transactions.length && user) {
          await Promise.all(
            transactions.map(async transaction => {
              const tutor = await DB.User.findOne({ _id: transaction.tutorId });
              if (!tutor) {
                throw new Error('Tutor not found');
              }
              const webinar = await DB.Webinar.findOne({ _id: transaction.targetId, isOpen: true });
              if (!webinar) {
                throw new Error('Cannot found webinar or webinar is closed');
              }

              const slots = await DB.Schedule.find({
                webinarId: webinar._id,
                $or: [{ status: 'scheduled' }, { status: 'pending' }]
              });
              if (slots.length) {
                await Promise.all(
                  slots.map(async slot => {
                    if (moment(data.createdAt).isBefore(moment(slot.startTime).add(-1 * 30, 'minutes'))) {
                      const countAppointment = await DB.Appointment.count({
                        userId: user._id,
                        slotId: slot._id
                      });
                      if (!countAppointment) {
                        const appointment = new DB.Appointment({
                          userId: user._id,
                          slotId: slot._id,
                          webinarId: webinar._id,
                          transactionId: transaction._id,
                          type: transaction.type,
                          startTime: slot.startTime,
                          toTime: slot.toTime,
                          tutorId: tutor._id,
                          paid: true,
                          status: 'booked',
                          targetType: transaction.targetType,
                          description: `Appointment ${webinar.name} ${user.name} with ${tutor.name}`
                        });
                        await appointment.save();
                      }
                    }
                  })
                );
                await DB.Webinar.update(
                  { _id: transaction.targetId },
                  {
                    $inc: {
                      numberParticipants: 1
                    }
                  }
                );
                transaction.idRecipient = user._id;
                await transaction.save();
              }
            })
          );
        }
        break;
      }
      case 'new-gift-course': {
        const transactions = await DB.Transaction.find({
          emailRecipient: data.emailRecipient,
          paid: true,
          type: 'gift',
          targetType: 'course'
        });
        const user = await DB.User.findOne({ email: data.emailRecipient });
        if (transactions.length && user) {
          await Promise.all(
            transactions.map(async transaction => {
              const course = await DB.Course.findOne({ _id: transaction.targetId });
              if (course) {
                const myCourse = new DB.MyCourse({
                  courseId: transaction.targetId,
                  userId: user._id,
                  transactionId: transaction._id,
                  name: course.name,
                  categoryIds: course.categoryIds,
                  paid: true
                });
                await myCourse.save();
              }
            })
          );
        }
        break;
      }
      case 'new-booking-solo': {
        const appointment = await DB.Appointment.findOne({ _id: data.appointmentId });
        const tutor = await DB.User.findOne({ _id: appointment.tutorId });

        if (appointment && tutor) {
          appointment.paid = true;
          appointment.status = 'booked';

          await appointment.save();
          const transaction = await DB.Transaction.findOne({
            _id: appointment.transactionId
          });

          // check is multiple booking to send emails notfiying to user
          let isMultipleBooking = false;
          if (transaction.parentTransactionId) {
            const parentTransaction = await DB.Transaction.findOne({ _id: transaction.parentTransactionId });
            isMultipleBooking = parentTransaction && parentTransaction.type === 'booking-multiple';
          }
          const user = await DB.User.findOne({ _id: appointment.userId });
          const topic = await DB.MyTopic.findOne({ _id: appointment.topicId });
          if (!topic) throw new Error('Topic not found');
          const startTimeTutor = date.formatDate(appointment.startTime, 'DD/MM/YYYY HH:mm', tutor.timezone || '');
          const toTimeTutor = date.formatDate(appointment.toTime, 'DD/MM/YYYY HH:mm', tutor.timezone || '');
          const duration = moment(appointment.toTime).diff(moment(appointment.startTime), 'minutes');

          const startTimeUser = date.formatDate(appointment.startTime, 'DD/MM/YYYY HH:mm', user.timezone || '');
          const toTimeUser = date.formatDate(appointment.toTime, 'DD/MM/YYYY HH:mm', user.timezone || '');

          if (transaction.price === 0) {
            await Service.Mailer.send('confirm-book-free-tutor', tutor.email, {
              subject: `User ${user.name} booked free trial lesson!`,
              tutor: tutor.getPublicProfile(),
              user: user.getPublicProfile(),
              appointment: appointment.toObject(),
              startTimeTutor,
              toTimeTutor,
              duration,
              subject_replace_fields: {
                userName: user.name
              }
            });

            await Service.Mailer.send('confirm-book-free-user', user.email, {
              subject: `Successfully  booked a free trial lesson with tutor ${tutor.name}`,
              tutor: tutor.getPublicProfile(),
              user: user.getPublicProfile(),
              appointment: appointment.toObject(),
              startTimeUser,
              toTimeUser,
              duration,
              subject_replace_fields: {
                tutorName: tutor.name
              }
            });

            const notificationTutor = {
              title: 'Free Session',
              description: 'You have a new free trial booking!',
              itemId: appointment._id,
              notifyTo: tutor._id,
              type: 'booking'
            };

            const notificationStudent = {
              title: 'Free Session',
              description: `Successfully booked a free trial lesson with tutor ${tutor.name}!`,
              itemId: appointment._id,
              notifyTo: user._id,
              type: 'booking'
            };
            await Service.Notification.create([notificationTutor, notificationStudent]);
          } else {
            await Service.Mailer.send('appointment-notify-tutor-new-booking', tutor.email, {
              subject: `New user booking with you!`,
              user: user.getPublicProfile(),
              tutor: tutor.getPublicProfile(),
              transaction: transaction.toObject(),
              appointment: appointment.toObject(),
              topic: topic.toObject(),
              startTime: startTimeTutor,
              toTime: toTimeTutor,
              duration
            });
            const notificationTutor = {
              title: `Booking`,
              description: `You have a new lesson booking!`,
              itemId: appointment._id,
              notifyTo: tutor._id,
              type: 'booking'
            };

            await Service.Notification.create(notificationTutor);

            if (!isMultipleBooking) {
              await Service.Mailer.send('payment-success', user.email, {
                subject: `Payment successfully made for the reservation #${transaction.code}`,
                user: user.getPublicProfile(),
                transaction: transaction.toObject(),
                subject_replace_fields: {
                  transactionCode: transaction.code
                },
                tutor: tutor.getPublicProfile()
              });
              await Service.Notification.create([
                {
                  title: `Payments`,
                  description: `Payment successfully made for the reservation #${transaction.code}`,
                  itemId: transaction._id,
                  notifyTo: user._id,
                  type: 'payment'
                },
                {
                  title: `Booked`,
                  description: `You have successfully booked a lesson!`,
                  itemId: appointment._id,
                  notifyTo: user._id,
                  type: 'booking'
                }
              ]);
            }
          }
        }
        break;
      }
      case 'reschedule-class': {
        const appointment = await DB.Appointment.findOne({ _id: data.appointmentId });
        const tutor = await DB.User.findOne({ _id: appointment.tutorId });
        if (!tutor) {
          return;
        }
        if (appointment) {
          const user = await DB.User.findOne({ _id: appointment.userId });
          const subject = await DB.MySubject.findOne({ _id: appointment.subjectId });
          if (!subject) {
            throw new Error('Subject not found');
          }
          const startTimeTutor = date.formatDate(appointment.startTime, 'DD/MM/YYYY HH:mm', tutor.timezone || '');
          const toTimeTutor = date.formatDate(appointment.toTime, 'DD/MM/YYYY HH:mm', tutor.timezone || '');

          await Service.Mailer.send('appointment-notification-reschedule-tutor', tutor.email, {
            subject: `Reschedule class notification!`,
            user: user.getPublicProfile(),
            tutor: tutor.getPublicProfile(),
            appointment: appointment.toObject(),
            subjects: subject.toObject(),
            startTime: startTimeTutor,
            toTime: toTimeTutor
          });
          const notificationTutor = {
            title: `Reschedule class notification!`,
            description: `Student rescheduled a lesson!`,
            itemId: appointment._id,
            notifyTo: tutor._id,
            type: 'booking'
          };
          await Service.Notification.create(notificationTutor);

          const startTimeUser = date.formatDate(appointment.startTime, 'DD/MM/YYYY HH:mm', user.timezone || '');
          const toTimeUser = date.formatDate(appointment.toTime, 'DD/MM/YYYY HH:mm', user.timezone || '');

          await Service.Mailer.send('appointment-notification-reschedule-user', user.email, {
            subject: `Reschedule class successfully!`,
            user: user.getPublicProfile(),
            tutor: tutor.getPublicProfile(),
            appointment: appointment.toObject(),
            subjects: subject.toObject(),
            startTime: startTimeUser,
            toTime: toTimeUser
          });
          const notificationUser = {
            title: `Reschedule class successfully!`,
            description: `You have successfully reschedule a lesson!`,
            itemId: appointment._id,
            notifyTo: user._id,
            type: 'booking'
          };
          await Service.Notification.create(notificationUser);
        }
        break;
      }
      case 'new-course-booking': {
        const tutor = await DB.User.findOne({ _id: data.tutorId });
        if (!tutor) {
          throw new Error('Cannot find tutor');
        }
        const user = await DB.User.findOne({ _id: data.userId });
        if (!user) {
          throw new Error('Cannot find user');
        }
        const course = await DB.Course.findOne({ _id: data.targetId });
        if (!course) {
          throw new Error('Cannot find course');
        }

        const myCourse = new DB.MyCourse({
          userId: user._id,
          courseId: course._id,
          transactionId: data._id,
          name: course.name,
          categoryIds: course.categoryIds,
          paid: true
        });
        await myCourse.save();

        await Service.Mailer.send('payment-success', user.email, {
          subject: `Payment successfully made for the reservation #${data.code}`,
          user: user.getPublicProfile(),
          transaction: data,
          course: course.toObject(),
          subject_replace_fields: {
            transactionCode: data.code
          }
        });

        const notificationTutor = {
          title: `Booking`,
          description: `You have a new course purchased!`,
          itemId: course._id,
          notifyTo: tutor._id,
          type: 'course'
        };
        const notificationUser = {
          title: `Payments`,
          description: `Payment successfully made for the reservation #${data.code}`,
          itemId: data._id,
          notifyTo: user._id,
          type: 'payment'
        };

        await Service.Notification.create([notificationTutor, notificationUser]);

        break;
      }
      default:
        break;
    }

    done();
  } catch (e) {
    await Service.Logger.create({
      level: 'error',
      error: e,
      path: 'webinar-error'
    });
    done();
  }
});

exports.createWebinarAppointment = transaction =>
  enrollQ
    .createJob({
      command: 'new-booking-webinar',
      data: transaction
    })
    .save();

exports.createAppointmentWithEmailRecipient = emailRecipient =>
  enrollQ
    .createJob({
      command: 'new-gift-webinar',
      data: {
        emailRecipient
      }
    })
    .save();
exports.createMyCourseWithEmailRecipient = (emailRecipient, courseId) =>
  enrollQ
    .createJob({
      command: 'new-gift-course',
      data: {
        emailRecipient
      }
    })
    .save();
exports.createAppointmentSolo = appointmentId =>
  enrollQ
    .createJob({
      command: 'new-booking-solo',
      data: {
        appointmentId
      }
    })
    .save();
exports.rescheduleClass = appointmentId =>
  enrollQ
    .createJob({
      command: 'reschedule-class',
      data: {
        appointmentId
      }
    })
    .save();

exports.createMyCourse = transaction =>
  enrollQ
    .createJob({
      command: 'new-course-booking',
      data: transaction
    })
    .save();
