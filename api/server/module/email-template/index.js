exports.model = {
  EmailTemplate: require('./models/template')
};

exports.router = router => {
  require('./routes/template.route')(router);
};
