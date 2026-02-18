// const HttpStatus = require('http-status-codes');
const { StatusCodes } = require('http-status-codes');
const { PLATFORM_ONLINE } = require('..');

exports.startMeeting = async (req, res, next) => {
  try {
    const appointmentId = req.params.appointmentId;
    if (req.user.type !== 'tutor') {
      return next(PopulateResponse.forbidden());
    }
    const tutorId = req.user._id;
    const appointment = await DB.Appointment.findOne({ _id: appointmentId, tutorId, status: { $in: ['booked', 'pending', 'progressing'] } }).populate(
      {
        path: 'transaction',
        select: req.user.role !== 'admin' ? '-commission -balance' : ''
      }
    );
    console.log('appointment',appointment);
    if (!appointment) {
      return next(
        PopulateResponse.error(
          {
            message: "Can't start this meeting"
          },
          'ERR_CAN_NOT_START_MEETING'
        )
      );
    }
    const isBeforeStartTime = await Service.Appointment.isBeforeStartTime(appointment);
    console.log('isBeforeStartTime',isBeforeStartTime);
        if (isBeforeStartTime) {
      return next(
        PopulateResponse.error({
          message: 'You can join the meeting 15 minutes before the specified time'
        })
      );
    }
    const isZoomPlatform = await Service.Meeting.isPlatform(PLATFORM_ONLINE.ZOOM_US);
    const platformOnline = isZoomPlatform ? PLATFORM_ONLINE.ZOOM_US : PLATFORM_ONLINE.LESSON_SPACE;
    const data = {
      platform: platformOnline,
      zoomus: {
        url: '',
        signature: '',
        meetingNumber: '',
        password: ''
      },
      lessonspace: {
        url: ''
      }
    };
    if (isZoomPlatform) {
      if (!appointment.zoomData || (appointment.zoomData && !appointment.zoomData.start_url)) {
        const tutorDisplayName = req.user.showPublicIdOnly === true
          ? (req.user.userId || req.user._id.toString())
          : req.user.name;
        // ✅ UPDATED: Added startTime, duration, topic, timezone
        const zoomData = await Service.ZoomUs.createMeeting({
          email: req.user.email,
          topic: appointment.description || `${tutorDisplayName}'s Tutoring Session`,
          startTime: appointment.startTime.toISOString(),
          duration: Math.ceil((new Date(appointment.toTime) - new Date(appointment.startTime)) / (1000 * 60)),
          timezone: 'Asia/Calcutta'
        });
        if (zoomData || zoomData.start_url) {
          appointment.zoomData = zoomData;
          appointment.meetingId = zoomData.id;
          appointment.platform = platformOnline;
          appointment.status = 'progressing';
          appointment.meetingStart = true;
          appointment.meetingStartAt = new Date();
          await appointment.save();
          data.zoomus.url = zoomData.start_url;
          data.zoomus.signature = await Service.ZoomUs.generateSignature({
            meetingNumber: appointment.meetingId,
            role: 1
          });
          data.zoomus.meetingNumber = appointment.meetingId;
          data.zoomus.password = zoomData.password;
        } else {
          return next(
            PopulateResponse.error({
              message: "Can't not start meeting."
            })
          );
        }
        if (appointment.targetType === 'webinar') {
          const slotAppointments = await DB.Appointment.find({
            status: { $in: ['booked', 'pending', 'progressing'] },
            slotId: appointment.slotId
          });
          if (slotAppointments && slotAppointments.length) {
            for (const a of slotAppointments) {
              a.zoomData = zoomData;
              a.meetingId = zoomData.id;
              a.platform = platformOnline;
              a.status = 'progressing';
              a.meetingStart = true;
              a.meetingStartAt = new Date();
              await a.save();
            }
          }
        }
      } else if (appointment.zoomData && appointment.zoomData.start_url) {
        let zoomData = await Service.ZoomUs.getDetailMeeting(appointment.zoomData.id);
        if (!zoomData || !zoomData.start_url) {
          const tutorDisplayName = req.user.showPublicIdOnly === true
            ? (req.user.userId || req.user._id.toString())
            : req.user.name;
          // ✅ UPDATED: Added startTime, duration, topic, timezone
          zoomData = await Service.ZoomUs.createMeeting({
            email: req.user.email,
            topic: appointment.description || `${tutorDisplayName}'s Tutoring Session`,
            startTime: appointment.startTime.toISOString(),
            duration: Math.ceil((new Date(appointment.toTime) - new Date(appointment.startTime)) / (1000 * 60)),
            timezone: 'Asia/Calcutta'
          });
          if (zoomData || zoomData.start_url) {
            appointment.zoomData = zoomData;
            appointment.meetingId = zoomData.id;
            appointment.platform = platformOnline;
            appointment.status = 'progressing';
            appointment.meetingStart = true;
            appointment.meetingStartAt = new Date();
            await appointment.save();
            data.zoomus.url = zoomData.start_url;
            data.zoomus.signature = await Service.ZoomUs.generateSignature({
              meetingNumber: appointment.meetingId,
              role: 1
            });
            data.zoomus.meetingNumber = appointment.meetingId;
            data.zoomus.password = zoomData.password;
          } else {
            return next(
              PopulateResponse.error({
                message: "Can't not restart meeting."
              })
            );
          }
        }
        appointment.status = 'progressing';
        appointment.meetingStart = true;
        appointment.meetingStartAt = appointment.meetingStartAt || new Date();
        await appointment.save();
        data.zoomus.url = zoomData.start_url;
        data.zoomus.signature = await Service.ZoomUs.generateSignature({
          meetingNumber: zoomData.id,
          role: 1
        });
        data.zoomus.meetingNumber = zoomData.id;
        data.zoomus.password = zoomData.password;
        if (appointment.targetType === 'webinar') {
          const restartAppointments = await DB.Appointment.find({
            status: { $in: ['booked', 'pending', 'progressing'] },
            slotId: appointment.slotId
          });
          if (restartAppointments && restartAppointments.length) {
            for (const a of restartAppointments) {
              a.zoomData = zoomData;
              a.meetingId = zoomData.id;
              a.platform = platformOnline;
              a.status = 'progressing';
              a.meetingStart = true;
              a.meetingStartAt = new Date();
              await a.save();
            }
          }
        }
      }
    } else {
      let id = '';
      if (appointment.targetType === 'webinar') {
        const webinar = await DB.Webinar.findOne({ _id: appointment.webinarId });
        if (!webinar) {
          return next(
            PopulateResponse.error(
              {
                message: 'Webinar not found'
              },
              'ITEM_NOT_FOUND'
            )
          );
        }
        id = webinar._id;
      } else {
        const student = await DB.User.findOne({ _id: appointment.userId });
        if (!student) {
          return next(
            PopulateResponse.error(
              {
                message: 'Client not found'
              },
              'ITEM_NOT_FOUND'
            )
          );
        }
        id = `${req.user._id}-${student._id}`;
      }
      const tutorDisplayName = req.user.showPublicIdOnly === true
        ? (req.user.userId || req.user._id.toString())
        : req.user.name;
      const spaceData = await Service.LessonSpace.launchSpace(req.user, {
        id,
        name: `${tutorDisplayName}'s Space`,
        leader: true
      });

      if (spaceData && spaceData.client_url) {
        appointment.spaceSessionId = spaceData.session_id;
        appointment.platform = platformOnline;
        appointment.status = 'progressing';
        appointment.meetingStart = true;
        appointment.meetingStartAt = new Date();
        await appointment.save();
        if (appointment.targetType === 'webinar') {
          const spaceAppointments = await DB.Appointment.find({
            status: { $in: ['booked', 'pending', 'progressing'] },
            slotId: appointment.slotId
          });
          if (spaceAppointments && spaceAppointments.length) {
            for (const a of spaceAppointments) {
              a.spaceSessionId = spaceData.session_id;
              a.platform = platformOnline;
              a.status = 'progressing';
              a.meetingStart = true;
              a.meetingStartAt = new Date();
              await a.save();
            }
          }
        }
        data.lessonspace.url = spaceData.client_url;
      }
    }
    res.locals.signature = data;
    return next();
  } catch (error) {
    return next(error);
  }
};

exports.joinMeeting = async (req, res, next) => {
  try {
    const appointmentId = req.params.appointmentId;
    const appointment = await DB.Appointment.findOne({ _id: appointmentId, status: { $in: ['pending', 'progressing'] } }).populate({
      path: 'transaction',
      select: req.user.role !== 'admin' ? '-commission -balance -paymentInfo' : ''
    });
    if (req.user.type !== 'student' && req.user._id.toString() !== appointment.userId.toString()) {
      return next(PopulateResponse.forbidden());
    }
    if (!appointment) {
      return next(
        PopulateResponse.error(
          {
            message: "Can't start this meeting"
          },
          'ERR_CAN_NOT_START_MEETING'
        )
      );
    }

    const isBeforeStartTime = await Service.Appointment.isBeforeStartTime(appointment);
    if (isBeforeStartTime) {
      return next(
        PopulateResponse.error({
          message: 'You can join the meeting 15 minutes before the specified time.'
        })
      );
    }
    const isZoomPlatform = await Service.Meeting.isPlatform(PLATFORM_ONLINE.ZOOM_US);
    const data = {
      platform: isZoomPlatform ? PLATFORM_ONLINE.ZOOM_US : PLATFORM_ONLINE.LESSON_SPACE,
      zoomus: {
        url: '',
        signature: '',
        meetingNumber: '',
        password: ''
      },
      lessonspace: {
        url: ''
      }
    };

    if (isZoomPlatform) {
      if (!appointment.zoomData || !appointment.zoomData.start_url) {
        return next(
          PopulateResponse.error({
            message: "The expert hasn't started meeting yet."
          })
        );
      }
      const zoomData = await Service.ZoomUs.getDetailMeeting(appointment.zoomData.id);
      if (!zoomData || !zoomData.start_url) {
        return next(
          PopulateResponse.error({
            message: 'The lesson has ended or there is a problem, please wait for the expert to start and try again later'
          })
        );
      }
      data.zoomus.url = appointment.zoomData.join_url;
      data.zoomus.signature = await Service.ZoomUs.generateSignature({
        meetingNumber: appointment.meetingId,
        role: 0
      });
      data.zoomus.meetingNumber = appointment.meetingId;
      data.zoomus.password = appointment.zoomData.password;
    } else {
      if (!appointment.spaceSessionId) {
        return next(
          PopulateResponse.error({
            message: "The expert hasn't started meeting yet."
          })
        );
      }
      const tutor = await DB.User.findOne({ _id: appointment.tutorId }).select('_id userId showPublicIdOnly name');
      if (!tutor) return next(PopulateResponse.notFound());
      const tutorDisplayName = tutor.showPublicIdOnly === true
        ? (tutor.userId || tutor._id.toString())
        : tutor.name;
      let id = tutor._id;
      if (appointment.targetType === 'webinar') {
        const webinar = await DB.Webinar.findOne({ _id: appointment.webinarId });
        if (!webinar) {
          return next(
            PopulateResponse.error(
              {
                message: 'Webinar not found'
              },
              'ITEM_NOT_FOUND'
            )
          );
        }
        id = webinar._id;
      } else {
        id = `${id}-${req.user._id}`;
      }

      const spaceData = await Service.LessonSpace.launchSpace(req.user, {
        id,
        name: `${tutorDisplayName}'s Space`,
        leader: false
      });

      if (spaceData && spaceData.client_url) {
        data.lessonspace.url = spaceData.client_url;
      }
    }
    res.locals.signature = data;
    return next();
  } catch (error) {
    return next(error);
  }
};

exports.permissionCheck = async (req, res, next) => {
  try {
    console.log('check-permission', req.user.name);
    const valid = true;
    res.sendStatus(valid ? StatusCodes.OK : StatusCodes.UNAUTHORIZED);
  } catch (e) {
    console.log(e);
    return next(e);
  }
};