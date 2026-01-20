exports.model = {
  Earning: require('./models/earning'),
  Transaction: require('./models/transaction')
};

exports.services = {
  Earning: require('./services/Earning'),
  Paydunya: require('./services/Paydunya'),
  
  Payment: require('./services/Payment')
};

exports.router = router => {
  require('./routes/transaction.route')(router);
  require('./routes/paydunya.route')(router);
 
  require('./routes/razorpay.route')(router);

};
