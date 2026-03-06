/**
 * Credit Service Proxy Module
 * Routes billing/compliance requests from Angular frontend to Credit Service.
 * Added: 2026-03-06
 */
exports.router = function(router) {
  require('./routes/creditProxy.route')(router);
};
