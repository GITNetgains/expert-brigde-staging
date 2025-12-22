const conservationController = require('../controllers/conversation.controller');

module.exports = router => {
  /**
   * @apiGroup Message
   * @apiVersion 4.0.0
   * @api {post} /v1/messages/conversations Create or get message conservation
   * @apiDescription Create or get message conservation
   * @apiParam {String}   [type] `private`
   * @apiParam {String}   recipientId
   * @apiPermission Authenticated user
   */
  router.post('/v1/messages/conversations', Middleware.isAuthenticated, conservationController.create, Middleware.Response.success('conversation'));

  /**
   * @apiGroup Message
   * @apiVersion 4.0.0
   * @api {get} /v1/messages/conversations&take&type&sort&sortType Get list
   * @apiDescription Get list conversations
   * @apiPermission Authenticated user
   */
  router.get('/v1/messages/conversations', Middleware.isAuthenticated, conservationController.list, Middleware.Response.success('list'));
};
