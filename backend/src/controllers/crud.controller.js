function buildCrudController(Model, include = []) {
  return {
    async list(_req, res, next) {
      try {
        const rows = await Model.findAll({ include });
        res.json(rows);
      } catch (error) {
        next(error);
      }
    },
    async getById(req, res, next) {
      try {
        const row = await Model.findByPk(req.params.id, { include });
        if (!row) return res.status(404).json({ message: 'No encontrado' });
        res.json(row);
      } catch (error) {
        next(error);
      }
    },
    async create(req, res, next) {
      try {
        const row = await Model.create(req.body);
        res.status(201).json(row);
      } catch (error) {
        next(error);
      }
    },
    async update(req, res, next) {
      try {
        const row = await Model.findByPk(req.params.id);
        if (!row) return res.status(404).json({ message: 'No encontrado' });
        await row.update(req.body);
        res.json(row);
      } catch (error) {
        next(error);
      }
    },
    async remove(req, res, next) {
      try {
        const row = await Model.findByPk(req.params.id);
        if (!row) return res.status(404).json({ message: 'No encontrado' });
        await row.destroy();
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = buildCrudController;
