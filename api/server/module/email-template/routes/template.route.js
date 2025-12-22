const emailTemplateCtr = require('../controllers/template.controller');

module.exports = router => {
  /**
   * @apiDefine emailTemplateRequest
   * @apiParam {String}   subject        EmailTemplate subject
   * @apiParam {String}   content    EmailTemplate content
   */

  /**
   * @apiDefine emailTemplateResponse
   * @apiParam {String}   subject        EmailTemplate subject
   * @apiParam {String}   content    EmailTemplate content
   */

  // /**
  //  * @apiGroup  EmailTemplate
  //  * @apiVersion 4.0.0
  //  * @api {post} /v1/email-templates  Create new  emailTemplate
  //  * @apiDescription Create new emailTemplate
  //  * @apiUse authRequest
  //  * @apiUse emailTemplateRequest
  //  * @apiUse emailTemplateResponse
  //  * @apiPermission admin
  //  */
  router.post('/v1/email-templates', Middleware.hasRole('admin'), emailTemplateCtr.create, Middleware.Response.success('emailTemplate'));

  /**
   * @apiGroup  EmailTemplate
   * @apiVersion 4.0.0
   * @api {put} /v1/email-templates/:id  Update a emailTemplate
   * @apiDescription Update a emailTemplate
   * @apiUse authRequest
   * @apiParam {String}   id        EmailTemplate id
   * @apiUse emailTemplateRequest
   * @apiUse emailTemplateResponse
   * @apiPermission admin
   */
  router.put(
    '/v1/email-templates/:id',
    Middleware.hasRole('admin'),
    emailTemplateCtr.findOne,
    emailTemplateCtr.update,
    Middleware.Response.success('update')
  );

  // /**
  //  * @apiGroup  EmailTemplate
  //  * @apiVersion 4.0.0
  //  * @api {delete} /v1/email-templates/:id Remove a emailTemplate
  //  * @apiDescription Remove a emailTemplate
  //  * @apiUse authRequest
  //  * @apiParam {String}   id        EmailTemplate id
  //  * @apiPermission admin
  //  */
  router.delete(
    '/v1/email-templates/:id',
    Middleware.hasRole('admin'),
    emailTemplateCtr.findOne,
    emailTemplateCtr.remove,
    Middleware.Response.success('remove')
  );

  /**
   * @apiGroup  EmailTemplate
   * @apiVersion 4.0.0
   * @api {get} /v1/email-templates/:id Get emailTemplate details
   * @apiDescription Get emailTemplate details
   * @apiParam {String}   id        EmailTemplate id
   * @apiPermission all
   */
  router.get('/v1/email-templates/:id', Middleware.isAuthenticated, emailTemplateCtr.findOne, Middleware.Response.success('emailTemplate'));

  /**
   * @apiGroup  EmailTemplate
   * @apiVersion 4.0.0
   * @api {get} /v1/email-templates?:name&:alias  Get list email-templates
   * @apiDescription Get list email-templates
   * @apiParam {String}   [name]      emailTemplate name
   * @apiParam {String}   [alias]     emailTemplate alias
   * @apiPermission all
   */
  router.get(
    '/v1/email-templates',
    // Middleware.isAuthenticated,
    emailTemplateCtr.list,
    Middleware.Response.success('list')
  );
};
