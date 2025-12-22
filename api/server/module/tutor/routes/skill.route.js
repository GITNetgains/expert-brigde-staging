const skillController = require('../controllers/skill.controller');

module.exports = router => {
  router.post('/v1/skills', Middleware.isAuthenticated, skillController.create, Middleware.Response.success('create'));
  router.put('/v1/skills/:skillId', Middleware.hasRole('admin'), skillController.update, Middleware.Response.success('update'));
  router.delete('/v1/skills/:skillId', Middleware.hasRole('admin'), skillController.remove, Middleware.Response.success('remove'));
  router.get('/v1/skills/:skillId', skillController.findOne, Middleware.Response.success('skill'));
  router.get('/v1/skills', skillController.list, Middleware.Response.success('list'));
};
