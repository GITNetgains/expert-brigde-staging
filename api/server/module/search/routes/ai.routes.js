const aiController = require("../controllers/ai.controller");
const { aiLimiter } = require("../middlewares/throttle");
const {verifyCaptcha} = require("../middlewares/verifyCaptcha");

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
    aiLimiter,                 // throttling
    verifyCaptcha,  
    aiController.search,       // controller
    Middleware.Response.success("searchResult")  // send JSON response
  );
};
