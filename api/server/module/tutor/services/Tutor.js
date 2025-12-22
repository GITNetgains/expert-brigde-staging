const url = require('url');
const nconf = require('nconf');
const { PLATFORM_ONLINE } = require('../../meeting');
exports.register = async data => {
  try {
    const count = await DB.User.count({
      email: data.email.toLowerCase()
    });
    if (count) {
      throw new Error('This email address is already taken');
    }

    const user = new DB.User(data);
    user.type = 'tutor';
    user.emailVerifiedToken = Helper.String.randomString(48);

    if (data.issueDocument && data.resumeDocument && data.certificationDocument) {
      await DB.Media.updateMany(
        {
          _id: {
            $in: [data.issueDocument, data.resumeDocument, data.certificationDocument]
          }
        },
        {
          $set: { uploaderId: user._id, ownerId: user._id }
        }
      );
    }

    let username = data.name ? Helper.String.createAlias(data.name) : Helper.String.createAlias(data.email.split('@')[0]);
    username = username.toLowerCase();

    const countUser = await DB.User.count({ username });
    if (countUser) {
      username = `${username}-${Helper.String.randomString(5)}`;
    }
    user.username = username;
    await user.save();

    // now send email verificaiton to user
    await Service.Mailer.send('verify-email', user.email, {
      userName: user.name,
      subject: 'Verify your Email',
      isSignup: true,
      emailVerifyLink: url.resolve(nconf.get('baseUrl'), `v1/auth/verifyEmail/${user.emailVerifiedToken}`)
    });

    await Service.Mailer.send('tutor-new-account-register', process.env.ADMIN_EMAIL, {
      subject: 'New Registered Teacher',
      tutor: user.toObject(),
      adminUrl: process.env.adminURL
    });

    return user;
  } catch (e) {
    throw e;
  }
};

exports.reject = async (tutorId, reason) => {
  try {
    const tutor = tutorId instanceof DB.User ? tutorId : await DB.User.findOne({ _id: tutorId });
    if (!tutor) {
      throw new Error('Tutor not found!');
    }

    await DB.User.update(
      { _id: tutor._id },
      {
        $set: {
          verified: false,
          rejected: true,
          rejectReason: reason || '',
          pendingApprove: false
        }
      }
    );

    const isZoomPlatform = await Service.Meeting.isPlatform(PLATFORM_ONLINE.ZOOM_US);
    if (isZoomPlatform) {
      const zoomUser = await Service.ZoomUs.getUser(tutor.email);
      if (zoomUser && zoomUser.id && zoomUser.status === 'active') {
        const data = await Service.ZoomUs.changeUserStatus(tutor.email);
        if (data && data.status === 'deactivate') {
          tutor.isZoomAccount = false;
          await tutor.save();
        }
      }
    }
    await Service.Mailer.send('tutor-reject', tutor.email, {
      subject: 'Your profile has been rejected!',
      tutor: tutor.toObject(),
      reason,
      appName: process.env.APP_NAME
    });

    return true;
  } catch (e) {
    throw e;
  }
};

exports.approve = async tutorId => {
  try {
    const tutor = tutorId instanceof DB.User ? tutorId : await DB.User.findOne({ _id: tutorId });
    if (!tutor) {
      throw new Error('Tutor not found!');
    }

    await DB.User.update(
      { _id: tutor._id },
      {
        $set: {
          verified: true,
          rejected: false,
          pendingApprove: false
        }
      }
    );
    const isZoomPlatform = await Service.Meeting.isPlatform(PLATFORM_ONLINE.ZOOM_US);
    if (isZoomPlatform) {
      const zoomUser = await Service.ZoomUs.getUser(tutor.email);
      if (zoomUser && zoomUser.id && zoomUser.status === 'active') {
        tutor.isZoomAccount = true;
        tutor.zoomAccountInfo = zoomUser;
        await tutor.save();
      } else {
        await Service.ZoomUs.createUser({ email: tutor.email });
      }
    }

    await Service.Mailer.send('tutor-approve', tutor.email, {
      subject: 'Congratulations! - Your profile has been approved !',
      tutor: tutor.toObject(),
      appName: process.env.APP_NAME
    });

    return true;
  } catch (e) {
    throw e;
  }
};

exports.zoomAccountCreated = async zoomInfo => {
  try {
    const tutor = await DB.User.findOne({ email: zoomInfo.email });
    if (!tutor) {
      throw new Error('Cannot found tutor');
    }
    tutor.isZoomAccount = true;
    tutor.zoomAccountInfo = zoomInfo;
    await tutor.save();
    return true;
  } catch (error) {
    throw error;
  }
};

exports.zoomAccountDeleted = async zoomInfo => {
  try {
    const tutor = await DB.User.findOne({ email: zoomInfo.email });
    if (!tutor) {
      throw new Error('Cannot found tutor');
    }
    tutor.isZoomAccount = false;
    await tutor.save();
    await Service.Mailer.send('tutor-deleted-on-zoom', tutor.email, {
      subject: `Temporarily suspending the tutor's activities!`,
      tutor: tutor.toObject(),
      appName: process.env.APP_NAME,
      adminEmail: process.env.ADMIN_EMAIL
    });
    return true;
  } catch (e) {
    throw e;
  }
};

exports.zoomAccountChangeStatus = async (zoomInfo, status) => {
  try {
    const tutor = await DB.User.findOne({ email: zoomInfo.email });
    if (!tutor) {
      throw new Error('Can not found tutor');
    }
    tutor.isZoomAccount = status === 'user.activated' ? true : false;
    await tutor.save();
    await Service.Mailer.send('tutor-deleted-on-zoom', tutor.email, {
      subject: `Temporarily suspending the tutor's activities!`,
      tutor: tutor.toObject(),
      appName: process.env.APP_NAME,
      adminEmail: process.env.ADMIN_EMAIL
    });
    return true;
  } catch (e) {
    throw e;
  }
};

exports.updatePrice = async tutorId => {
  try {
    const topic = await DB.MyTopic.find({ tutorId, isDeleted: false, isActive: true })
      .sort({
        price: 1
      })
      .skip(0)
      .limit(1);
    const price = topic && topic.length > 0 ? topic[0].price : 0;
    await DB.User.update(
      {
        _id: tutorId
      },
      {
        $set: {
          price1On1Class: price
        }
      }
    );
  } catch (e) {
    throw e;
  }
};
