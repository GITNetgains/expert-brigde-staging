const aiController = require("../controllers/ai.controller");
const { aiLimiter } = require("../middlewares/throttle");
const { verifyCaptcha } = require("../middlewares/verifyCaptcha");

module.exports = (router) => {
  /**
   * @apiGroup AI
   * @apiVersion 1.0.0
   * @apiName AI Search
   * @api {post} /v1/ai/search  Search AI talent pitch
   */
  router.post(
    "/v1/ai/search",
    Middleware.loadUser,
    aiLimiter,
    aiController.search,
    Middleware.Response.success("searchResult")
  );

  /** GET AI system prompt (admin) */
  router.get(
    "/v1/ai/prompt",
    Middleware.hasRole("admin"),
    aiController.getPrompt,
    Middleware.Response.success("aiPrompt")
  );

  /** PUT AI system prompt (admin) */
  router.put(
    "/v1/ai/prompt",
    Middleware.hasRole("admin"),
    aiController.updatePrompt,
    Middleware.Response.success("aiPrompt")
  );
};
