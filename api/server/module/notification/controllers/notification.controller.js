const Joi = require('joi');
exports.list = async (req, res, next) => {
  try {
    const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
    const take = parseInt(req.query.take, 10) || 10;
    const query = {
      notifyTo: req.user._id
    };
    const sort = Helper.App.populateDBSort(req.query);
    const count = await DB.Notification.countDocuments(query);
    let items = await DB.Notification.find(query)
      .sort(sort)
      .skip(page * take)
      .limit(take)
      .exec();
    items = await Promise.all(
      items.map(async item => {
        let i = null;
        const type = item.type;
        if (item.itemId) {
          if (type === 'payment') {
            i = await DB.Transaction.findOne({ _id: item.itemId });
          } else if (type === 'payout') {
            i = await DB.PayoutRequest.findOne({ _id: item.itemId });
          } else if (type === 'refund') {
            i = await DB.RefundRequest.findOne({ _id: item.itemId });
          } else if (type === 'booking') {
            i = await DB.Appointment.findOne({ _id: item.itemId });
          } else if (type === 'course') {
            i = await DB.Course.findOne({ _id: item.itemId });
          } else if (type === 'webinar') {
            i = await DB.Webinar.findOne({ _id: item.itemId });
          }
        }
        const data = item.toObject();
        data.item = i;
        return data;
      })
    );
    const notificationMeta = await DB.Notification.aggregate([
      {
        $match: {
          notifyTo: Helper.App.toObjectId(req.user._id)
        }
      },
      {
        $group: {
          _id: '$_id',
          unreadNotification: { $sum: '$unreadNotification' }
        }
      }
    ]);
    let unreadNotification = 0;
    if (notificationMeta && notificationMeta.length > 0) {
      await Promise.all(
        notificationMeta.map(item => {
          unreadNotification += item.unreadNotification;
        })
      );
    }
    res.locals.listNotifications = {
      count,
      unreadNotification: unreadNotification >= 0 ? unreadNotification : 0,
      items
    };
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.read = async (req, res, next) => {
  try {
    const notificationId = req.params.notificationId;
    if (!notificationId) {
      return next(
        PopulateResponse.error({
          message: 'Missing params'
        })
      );
    }
    const notification = await DB.Notification.findOne({ _id: notificationId });
    if (!notification) {
      return next(PopulateResponse.notFound());
    }
    notification.unreadNotification = 0;
    await notification.save();
    res.locals.read = { success: true };
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const notificationId = req.params.notificationId;
    if (!notificationId) {
      return next(
        PopulateResponse.error({
          message: 'Missing params'
        })
      );
    }
    const notification = await DB.Notification.findOne({ _id: notificationId });
    if (!notification) {
      return next(PopulateResponse.notFound());
    }

    await notification.remove();
    res.locals.remove = {
      success: true,
      message: 'Notification is deleted'
    };
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.readAll = async (req, res, next) => {
  try {
    // await DB.Notification.updateMany(
    //   {
    //     notifyTo: req.user._id,
    //     unreadNotification: { $gte: 0 }
    //   },
    //   {
    //     $set: {
    //       unreadNotification: 0
    //     }
    //   }
    // );
    res.locals.readAll = { success: true };
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.countUnreadNotification = async (req, res, next) => {
  try {
    const notificationMeta = await DB.Notification.aggregate([
      {
        $match: {
          notifyTo: Helper.App.toObjectId(req.user._id)
        }
      },
      {
        $group: {
          _id: '$_id',
          unreadNotification: { $sum: '$unreadNotification' }
        }
      }
    ]);
    let unreadNotification = 0;
    if (notificationMeta && notificationMeta.length > 0) {
      await Promise.all(
        notificationMeta.map(item => {
          unreadNotification += item.unreadNotification;
        })
      );
    }
    res.locals.count = { count: unreadNotification };
    return next();
  } catch (e) {
    return next(e);
  }
};
