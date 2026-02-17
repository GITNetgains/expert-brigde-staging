exports.stats = async (req, res, next) => {
  try {
    const totalStudents = await DB.User.count({
      role: 'user',
      type: 'student'
      // emailVerified: true
    });

    // Match tutor list API: count by type only (no role filter)
    const totalTutors = await DB.User.count({ type: 'tutor' });

    // Pending: not yet approved and not rejected (mutually exclusive with approved/rejected)
    const totalTutorPendingApproved = await DB.User.count({
      type: 'tutor',
      pendingApprove: true,
      rejected: false
    });

    const payoutRequestPendingByTutor = await DB.PayoutRequest.aggregate([
      {
        $match: {
          status: 'pending'
        }
      },
      {
        $group: {
          _id: '$_id',
          total: { $sum: '$balance' }
        }
      }
    ]);

    const totalWebinars = await DB.Webinar.count({
      isOpen: true
    });

    const totalPricePaidByUser = await DB.Transaction.aggregate([
      {
        $match: {
          isRefund: false,
          paid: true
        }
      },
      {
        $group: {
          _id: '$_id',
          total: { $sum: '$price' }
        }
      }
    ]);

    let totalRevenue = 0;
    let payoutRequestPending = 0;
    if (totalPricePaidByUser && totalPricePaidByUser.length) {
      totalPricePaidByUser.map(item => {
        totalRevenue += item.total;
      });
    }
    if (payoutRequestPendingByTutor && payoutRequestPendingByTutor.length) {
      payoutRequestPendingByTutor.map(item => {
        payoutRequestPending += item.total;
      });
    }

    const totalCourses = await DB.Course.count();

    const totalTutorApproved = await DB.User.count({
      type: 'tutor',
      rejected: false,
      pendingApprove: false
    });

    // Activated = approved and isActive true (matches expert list filter "activated")
    const totalTutorActive = await DB.User.count({
      type: 'tutor',
      rejected: false,
      pendingApprove: false,
      isActive: true
    });

    // Inactivated = approved and isActive false (matches expert list filter "inactivated")
    const totalTutorInActive = await DB.User.count({
      type: 'tutor',
      rejected: false,
      pendingApprove: false,
      isActive: false
    });

    // Rejected: explicitly rejected (mutually exclusive with pending/approved)
    const totalTutorRejected = await DB.User.count({
      type: 'tutor',
      rejected: true
    });

    const totalLanguages = await DB.I18nLanguage.count();

    const totalPendingRefundRequest = await DB.RefundRequest.count({ status: 'pending' });

    const totalAppointments = await DB.Appointment.count();

    const totalCoursePendingApproved = await DB.Course.count({ approved: false });
    const totalContacts = await DB.Contact.count();

    res.locals.stats = {
      totalStudents,
      totalTutors,
      totalTutorPendingApproved,
      payoutRequestPending,
      totalWebinars,
      totalRevenue,
      totalCourses,
      totalTutorActive,
      totalTutorInActive,
      totalTutorApproved,
      totalLanguages,
      totalPendingRefundRequest,
      totalAppointments,
      totalTutorRejected,
      totalCoursePendingApproved,
      totalCoursesPendingForApproval: totalCoursePendingApproved,
      totalContacts
    };
    return next();
  } catch (e) {
    return next();
  }
};
