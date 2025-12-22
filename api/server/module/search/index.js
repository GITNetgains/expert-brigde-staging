exports.model = {};

exports.services = {
  AI: require('./services/Ai'),
};

exports.router = (router) => {
  require('./routes/ai.routes')(router);
};
