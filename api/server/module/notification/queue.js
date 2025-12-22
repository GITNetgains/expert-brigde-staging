const Queue = require('../../kernel/services/queue');
const _ = require('lodash');

const notificationQ = Queue.create('notification');

notificationQ.process(async (job, done) => {
  try {
    const userId = job.data.userId;
    const notification = job.data.notification;
    const notificationMeta = await DB.Notification.aggregate([
      {
        $match: {
          notifyTo: Helper.App.toObjectId(userId)
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
    await Service.Socket.emitToUsers(userId, `notification`, { notification, unreadNotification });
  } catch (e) {
    console.log('err>>>>>>>>>', e);
    // TODO - log error here
  }
  return done();
});

exports.notification = (userId, notification) => {
  notificationQ.createJob({ userId, notification }).save();
};
