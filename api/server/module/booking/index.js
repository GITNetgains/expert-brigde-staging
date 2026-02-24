exports.model = {
  Appointment: require('./models/appointment')
};

exports.mongoosePlugin = require('../booking/mongoosePlugin');

exports.services = {
  Appointment: require('./services/Appointment'),
  Booking: require('./services/Booking')
};

exports.router = router => {
  require('./routes/appointment.route')(router);
  require('./routes/booking.route')(router);
};

exports.agendaJobs = [
  {
    name: 'notify-appointment',
    interval: '5 minutes',
    job: require('./agenda/notify-appointment')
  },
  {
    name: 'complete-appointment',
    interval: '10 minutes',
    job: require('./agenda/complete-appointment')
  },
  {
    name: 'notify-appointment-not-start',
    interval: '10 minutes',
    job: require('./agenda/notify-appointment-not-start')
  },
  {
    name: 'get-zoom-recording',
    interval: '5 minutes',
    job: require('./agenda/get-zoom-recording')
  },
  {
    name: 'session-reminder',
    interval: '2 minutes',
    job: require('./agenda/session-reminder')
  },
  {
    name: 'session-harvester',
    interval: '15 minutes',
    job: require('./agenda/session-harvester')
  }
];
