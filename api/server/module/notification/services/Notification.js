const payload = {
  title: '',
  description: '',
  itemId: null,
  notifyTo: null,
  type: null
};
const Queue = require('../queue');
exports.create = async (data, message = '') => {
  try {
    const list = Array.isArray(data) ? data : [data];
    for (const item of list) {
      const notification = new DB.Notification(item);
      notification.unreadNotification = 1;
      await notification.save();
      await Queue.notification(notification.notifyTo, notification);
    }
    return true;
  } catch (e) {
    throw e;
  }
};

exports.notificationMessage = async (data = payload) => {
  try {
    let notification = await DB.Notification.findOne({ notifyTo: data.notifyTo, type: 'message' });
    if (!notification) {
      notification = new DB.Notification(data);
    }
    const userMeta = await DB.ConversationUserMeta.aggregate([
      {
        $match: {
          userId: Helper.App.toObjectId(data.notifyTo)
        }
      },
      {
        $group: {
          _id: '$_id',
          unreadMessage: { $sum: '$unreadMessage' }
        }
      }
    ]);
    let unreadMessage = 0;
    if (userMeta && userMeta.length > 0) {
      await Promise.all(
        userMeta.map(item => {
          unreadMessage += item.unreadMessage;
        })
      );
    }
    notification.unreadNotification += 1;
    notification.description = `You have ${unreadMessage} unread messages`;
    notification.updatedAt = new Date();
    await notification.save();
    await Queue.notification(notification.notifyTo, notification);
    return true;
  } catch (e) {
    console.log(e);
    throw e;
  }
};
// exports.create = async (data = payload, message = '') => {
//   try {
//     let notification = await DB.Notification.findOne({ itemId: data.itemId, notifyTo: data.notifyTo });
//     if (!notification) {
//       notification = new DB.Notification(data);
//       notification.unreadNotification = 1;
//       await notification.save();
//     } else {
//       notification.updatedAt = new Date();
//       notification.unreadNotification += 1;
//     }
//     let msg = null;
//     if (message) {
//       msg = new DB.NotificationMessage({
//         text: message,
//         notificationId: notification._id
//       });
//       await msg.save();
//       notification.lastMessageId = msg._id;
//     }
//     await notification.save();
//     await Queue.notification(notification.notifyTo, notification, msg);
//     return true;
//   } catch (e) {
//     throw e;
//   }
// };
