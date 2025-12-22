exports.model = {
  Notification: require('./models/notification'),
  NotificationMessage: require('./models/notification-message')
};

exports.services = {
  Notification: require('./services/Notification'),
  NotificationMessage: require('./services/NotificationMessage')
};

exports.router = router => {
  require('./routes/notification.route')(router);
};
