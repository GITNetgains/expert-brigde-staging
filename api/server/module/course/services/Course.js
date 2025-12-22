exports.reject = async (courseId, reason) => {
  try {
    const course = courseId instanceof DB.Course ? courseId : await DB.Course.findOne({ _id: courseId });
    if (!course) {
      throw new Error('Course not found!');
    }

    await DB.Course.update(
      { _id: course._id },
      {
        $set: {
          approved: false,
          rejectReason: reason || ''
        }
      }
    );

    const tutor = await DB.User.findOne({ _id: course.tutorId });

    if (!tutor) {
      throw new Error('Tutor not found!');
    }

    await Service.Mailer.send('reject-course', tutor.email, {
      subject: 'Your course has been rejected!',
      course: course.toObject(),
      reason,
      tutor: tutor.getPublicProfile(),
      appName: process.env.APP_NAME
    });
    const notificationTutor = {
      title: `Administrator rejected your course`,
      description: `Your course has been rejected!`,
      itemId: course._id,
      notifyTo: tutor._id,
      type: 'course'
    };
    await Service.Notification.create(notificationTutor);

    return true;
  } catch (e) {
    throw e;
  }
};

exports.approve = async courseId => {
  try {
    const course = courseId instanceof DB.Course ? courseId : await DB.Course.findOne({ _id: courseId });
    if (!course) {
      throw new Error('Course not found!');
    }

    await DB.Course.update(
      { _id: course._id },
      {
        $set: {
          approved: true
        }
      }
    );

    const tutor = await DB.User.findOne({ _id: course.tutorId });

    if (!tutor) {
      throw new Error('Tutor not found!');
    }

    await Service.Mailer.send('approve-course', tutor.email, {
      subject: 'Congratulations! - Your course has been approved !',
      course: course.toObject(),
      tutor: tutor.getPublicProfile(),
      appName: process.env.APP_NAME
    });
    const notificationTutor = {
      title: `Administrator approved your course`,
      description: `Congratulations! - Your course has been approved !`,
      itemId: course._id,
      notifyTo: tutor._id,
      type: 'course'
    };
    await Service.Notification.create(notificationTutor);

    return true;
  } catch (e) {
    throw e;
  }
};

exports.disable = async courseId => {
  try {
    const course = courseId instanceof DB.Course ? courseId : await DB.Course.findOne({ _id: courseId });
    if (!course) {
      throw new Error('Course not found!');
    }
    course.disabled = true;
    await course.save();
    const tutor = await DB.User.findOne({ _id: course.tutorId });
    if (!tutor) {
      throw new Error('Tutor not found!');
    }

    await Service.Mailer.send('disable-course', tutor.email, {
      subject: 'Disable course temporarily.',
      course: course.toObject(),
      tutor: tutor.getPublicProfile()
    });
    const notificationTutor = {
      title: `Administrator disabled your course`,
      description: `Your course has been disabled!`,
      itemId: course._id,
      notifyTo: tutor._id,
      type: 'course'
    };
    await Service.Notification.create(notificationTutor);

    return true;
  } catch (e) {
    throw e;
  }
};

exports.enable = async courseId => {
  try {
    const course = courseId instanceof DB.Course ? courseId : await DB.Course.findOne({ _id: courseId });
    if (!course) {
      throw new Error('Course not found!');
    }
    course.disabled = false;
    await course.save();
    const tutor = await DB.User.findOne({ _id: course.tutorId });
    if (!tutor) {
      throw new Error('Tutor not found!');
    }

    await Service.Mailer.send('enable-course', tutor.email, {
      subject: 'Re-open your course.',
      course: course.toObject(),
      tutor: tutor.getPublicProfile()
    });
    const notificationTutor = {
      title: `Administrator re-open your course`,
      description: `Your course has been enabled!`,
      itemId: course._id,
      notifyTo: tutor._id,
      type: 'course'
    };
    await Service.Notification.create(notificationTutor);

    return true;
  } catch (e) {
    throw e;
  }
};
