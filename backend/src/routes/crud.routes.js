const { Router } = require('express');

function registerCrudRoutes(router, basePath, controller, options = {}) {
  const r = Router();
  const readMiddlewares = options.readMiddlewares || [];
  const writeMiddlewares = options.writeMiddlewares || [];

  r.get('/', ...readMiddlewares, controller.list);
  r.get('/:id', ...readMiddlewares, controller.getById);
  r.post('/', ...writeMiddlewares, controller.create);
  r.put('/:id', ...writeMiddlewares, controller.update);
  r.delete('/:id', ...writeMiddlewares, controller.remove);
  router.use(basePath, r);
}

module.exports = registerCrudRoutes;
