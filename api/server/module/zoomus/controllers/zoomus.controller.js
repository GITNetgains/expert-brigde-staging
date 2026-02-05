const crypto = require('crypto');

exports.hook = async (req, res, next) => {
  try {
    console.log('=== ZOOM WEBHOOK RECEIVED ===');
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Event Type:', req.body.event);
    console.log('============================');

    const config = await Service.ZoomUs.getCredentials();
    const { secretToken } = config.oauthServerToServer;

    const message = `v0:${req.headers['x-zm-request-timestamp']}:${JSON.stringify(req.body)}`;
    const hashForVerify = crypto.createHmac('sha256', secretToken).update(message).digest('hex');
    const signature = `v0=${hashForVerify}`;

    if (req.headers['x-zm-signature'] === signature) {
      const { event, payload } = req.body;
      
      console.log('Signature verified successfully');
      console.log('Processing event:', event);
      
      switch (event) {
        case 'endpoint.url_validation':
          const hashForValidate = crypto.createHmac('sha256', secretToken).update(payload.plainToken).digest('hex');
          res.status(200).send({
            plainToken: payload.plainToken,
            encryptedToken: hashForValidate
          });
          return; // Important: return here to prevent calling next()
          
        case 'meeting.started':
          console.log('Meeting started event received for meeting ID:', payload.object.id);
          await Service.Appointment.startMeeting(payload.object);
          console.log('Meeting started processing completed');
          break;
          
        case 'meeting.ended':
          console.log('Meeting ended event received for meeting ID:', payload.object.id);
          await Service.Appointment.endMeeting(payload.object);
          break;
          
        case 'recording.completed':
          console.log('Recording completed event received');
          await Service.Appointment.getRecording(payload.object.id, payload.object);
          break;
          
        default:
          console.log('Unhandled event type:', event);
          break;
      }

      res.locals.hook = {
        success: true
      };
    } else {
      console.error('Signature verification failed!');
      console.error('Expected:', signature);
      console.error('Received:', req.headers['x-zm-signature']);
    }

    return next();
  } catch (e) {
    console.error('Webhook processing error:', e);
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
    await Service.Mailer.send('tutor-invite-to-join-zoom', tutor.email, {
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
