const crypto = require('crypto');

exports.hook = async (req, res, next) => {
  try {
    const config = await Service.ZoomUs.getCredentials();
    const { secretToken } = config.oauthServerToServer;

    const message = `v0:${req.headers['x-zm-request-timestamp']}:${JSON.stringify(req.body)}`;

    const hashForVerify = crypto.createHmac('sha256', secretToken).update(message).digest('hex');

    const signature = `v0=${hashForVerify}`;

    if (req.headers['x-zm-signature'] === signature) {
      const { event, payload } = req.body;
      switch (event) {
        case 'endpoint.url_validation':
          const hashForValidate = crypto.createHmac('sha256', secretToken).update(payload.plainToken).digest('hex');

          res.status(200).send({
            plainToken: payload.plainToken,
            encryptedToken: hashForValidate
          });
          break;
        case 'meeting.started':
          await Service.Appointment.startMeeting(payload.object);
          break;
        case 'meeting.ended':
          await Service.Appointment.endMeeting(payload.object);
          break;
        case 'recording.completed':
          await Service.Appointment.getRecording(payload.object.id, payload.object);
          break;
        case 'user.invitation_accepted':
          await Service.Tutor.zoomAccountCreated(payload.object);
          break;
        case 'user.disassociated':
          await Service.Tutor.zoomAccountDeleted(payload.object);
          break;
        case 'user.deleted':
          await Service.Tutor.zoomAccountDeleted(payload.object);
          break;
        case 'user.activated':
          await Service.Tutor.zoomAccountChangeStatus(payload.object, event);
          break;
        case 'user.deactivated':
          await Service.Tutor.zoomAccountChangeStatus(payload.object, event);
          break;

        default:
          break;
      }

      res.locals.hook = {
        success: true
      };
    }

    return next();
  } catch (e) {
    next(e);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await Service.ZoomUs.getUser(req.params.email);
    res.locals.getUser = user;
    return next();
  } catch (e) {
    next(e);
  }
};

exports.inviteUser = async (req, res, next) => {
  try {
    const zoomUser = await Service.ZoomUs.getUser(req.params.email);
    const tutor = await DB.User.findOne({ email: req.params.email });
    if (!tutor) {
      throw new Error('Tutor not found!');
    }
    if (zoomUser && zoomUser.id) {
      if (zoomUser.status === 'active') {
        tutor.isZoomAccount = true;
        tutor.zoomAccountInfo = zoomUser;
        await tutor.save();
      }
    } else {
      await Service.ZoomUs.createUser({ email: tutor.email });
    }
    await Service.Mailer.send('tutor/invite-to-join-zoom.html', tutor.email, {
      subject: `Welcome back to our system.!`,
      tutor: tutor.toObject(),
      appName: process.env.APP_NAME,
      adminEmail: process.env.ADMIN_EMAIL
    });
    res.locals.invite = {
      success: true
    };
    return next();
  } catch (e) {
    next(e);
  }
};
