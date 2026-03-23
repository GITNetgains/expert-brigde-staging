/**
 * Atlas Assessment Proxy Module
 * Proxies interview frontend requests to Atlas API (NEW EC2).
 * Keeps API key server-side — never exposed to browser.
 * Added: 2026-03-23
 */
exports.router = function(router) {
  require('./routes/atlasProxy.route')(router);
};
