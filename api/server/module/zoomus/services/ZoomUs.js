const request = require('request');
const jwt = require('jsonwebtoken');
const KJUR = require('jsrsasign');
const { getZoomRequestHeader } = require('../utils/token');

exports.generateSignature = async meetingPayload => {
  try {
    const config = await this.getCredentials();
    const { clientId, clientSecret } = config.sdk;

    const iat = Math.round(new Date().getTime() / 1000) - 30;
    const exp = iat + 60 * 60 * 2;

    const oHeader = { alg: 'HS256', typ: 'JWT' };

    const oPayload = {
      sdkKey: clientId,
      mn: meetingPayload.meetingNumber,
      role: meetingPayload.role,
      iat: iat,
      exp: exp,
      appKey: clientId,
      tokenExp: iat + 60 * 60 * 2
    };

    const sHeader = JSON.stringify(oHeader);
    const sPayload = JSON.stringify(oPayload);
    const signature = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, clientSecret);
    return signature;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

exports.createUser = async options => {
  try {
    const headers = await getZoomRequestHeader();
    return new Promise((resolve, reject) =>
      request(
        {
          uri: 'https://api.zoom.us/v2/users',
          method: 'POST',
          json: {
            action: options.action || 'create',
            user_info: {
              email: options.email,
              type: 1,
              first_name: options.firstName || '',
              last_name: options.lastName || ''
            }
          },
          headers
        },
        async (error, response, body) => { 
          if (error) {
            console.error('Zoom API Error:', error);
            return reject(error);
          }

          console.log('[ZOOM-CREATE-USERC] Result:', response.statusCode, JSON.stringify(body));

          if (response.statusCode === 201 || (body && body.id)) {
            try {
              await DB.User.updateOne(
                { email: options.email },
                { 
                  $set: { 
                    isZoomAccount: true,
                    zoomAccountInfo: body 
                  } 
                }
              );
              console.log(`Database updated: ${options.email} is now a Zoom account.`);
            } catch (dbErr) {
              console.error('DB Update Error:', dbErr);
            }
          }

          return resolve(body);
        }
      )
    );
  } catch (e) {
    throw e;
  }
};

exports.getUser = async email => {
  try {
    const headers = await getZoomRequestHeader();
    return new Promise((resolve, reject) =>
      request(
        {
          uri: `https://api.zoom.us/v2/users/${email}`,
          method: 'GET',
          json: {},
          headers
        },
        (error, response, body) => {
          if (error) {
            return reject(error);
          }
          return resolve(body);
        }
      )
    );
  } catch (e) {
    throw e;
  }
};

exports.createMeeting = async options => {
  try {
    const headers = await getZoomRequestHeader();
    
    // Build anonymous booking reference for topic
    const bookingRef = options.appointmentId
      ? options.appointmentId.toString().slice(-8)
      : Math.random().toString(16).slice(2, 10);

    // Build meeting payload — NO participant names or emails
    const meetingPayload = {
      topic: `ExpertBridge Consultation | Booking #${bookingRef}`,
      type: 2, // Scheduled meeting
      start_time: options.startTime,
      duration: options.duration || 60,
      timezone: options.timezone || 'Asia/Calcutta',
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: true,
        jbh_time: 0,
        mute_upon_entry: false,
        waiting_room: false,
        auto_recording: 'cloud',
        approval_type: 0,
        audio: 'both',
        meeting_authentication: false,
        meeting_invitees: [],
        registrants_email_notification: false,
      }
    };

    console.log('Creating Zoom meeting with payload:', JSON.stringify(meetingPayload, null, 2));

    return new Promise((resolve, reject) =>
      request(
        {
          uri: 'https://api.zoom.us/v2/users/me/meetings',
          method: 'POST',
          json: meetingPayload,
          headers
        },
        (error, response, body) => {
          if (error) {
            console.error('Zoom createMeeting error:', error);
            return reject(error);
          }
          
          if (response.statusCode !== 201 && body.code) {
            console.error('Zoom API error:', body);
            return reject(new Error(body.message || 'Failed to create meeting'));
          }
          
          console.log('Zoom meeting created successfully:', body.id);
          return resolve(body);
        }
      )
    );
  } catch (e) {
    console.error('createMeeting exception:', e);
    throw e;
  }
};

exports.getPastDetailMeeting = async meetingUUID => {
  try {
    const headers = await getZoomRequestHeader();

    return new Promise((resolve, reject) =>
      request(
        {
          uri: `https://api.zoom.us/v2/past_meetings/${meetingUUID}`,
          method: 'GET',
          headers
        },
        (error, response, body) => {
          if (error) {
            return reject(error);
          }
          return resolve(JSON.parse(body));
        }
      )
    );
  } catch (e) {
    throw e;
  }
};

exports.getDetailMeeting = async meetingId => {
  try {
    const headers = await getZoomRequestHeader();

    return new Promise((resolve, reject) =>
      request(
        {
          uri: `https://api.zoom.us/v2/meetings/${meetingId}`,
          method: 'GET',
          headers
        },
        (error, response, body) => {
          if (error) {
            return reject(error);
          }
          return resolve(JSON.parse(body));
        }
      )
    );
  } catch (e) {
    throw e;
  }
};

exports.getRecordings = async meetingId => {
  try {
    const headers = await getZoomRequestHeader();

    return new Promise((resolve, reject) =>
      request(
        {
          uri: `https://api.zoom.us/v2/meetings/${meetingId}/recordings`,
          method: 'GET',
          headers
        },
        (error, response, body) => {
          if (error) {
            return reject(error);
          }
          return resolve(JSON.parse(body));
        }
      )
    );
  } catch (e) {
    throw e;
  }
};

exports.changeUserStatus = async email => {
  // change status activate || deactivate
  try {
    const headers = await getZoomRequestHeader();
    return new Promise((resolve, reject) =>
      request(
        {
          uri: `https://api.zoom.us/v2/users/${email}/status`,
          method: 'PUT',
          json: {},
          headers
        },
        (error, response, body) => {
          if (error) {
            return reject(error);
          }
          return resolve(body);
        }
      )
    );
  } catch (e) {
    throw e;
  }
};

exports.deleteUser = async options => {
  try {
    const headers = await getZoomRequestHeader();
    return new Promise((resolve, reject) =>
      request(
        {
          uri: `https://api.zoom.us/v2/users/${options.email}`,
          method: 'DELETE',
          // https://zoom.github.io/api/#create-a-user
          json: {
            action: options.action || 'disassociate',
            transfer_email: false,
            transfer_meeting: false,
            transfer_webinar: false,
            transfer_recording: false
          },
          headers
        },
        (error, response, body) => {
          if (error) {
            return reject(error);
          }
          return resolve(body);
        }
      )
    );
  } catch (e) {
    throw e;
  }
};

exports.getCredentials = async () => {
  const config = await DB.Config.findOne({ key: 'platformOnline' });
  if (!config || !config.value || !config.value.zoomus) throw new Error('Zoomus has not been setup');
  return config.value.zoomus;
};
