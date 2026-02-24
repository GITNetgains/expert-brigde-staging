const syncController = require('../controller');

module.exports = router => {
  /**
   * @apiGroup Sync
   * @apiVersion 1.0.0
   * @api {post} /v1/sync/expert-profile Sync expert profile from PostgreSQL to MongoDB
   * @apiDescription Receives enriched expert data from n8n pipeline and updates the MongoDB user profile
   * @apiHeader {String} x-api-key API key for authentication
   * @apiParam {String} [mongo_user_id] MongoDB user ID
   * @apiParam {String} [email] Expert email (fallback lookup)
   * @apiPermission api-key
   */
  router.post('/v1/sync/expert-profile', syncController.syncExpertProfile);
};
