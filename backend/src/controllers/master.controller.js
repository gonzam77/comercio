const buildCrudController = require('./crud.controller');
const bcrypt = require('bcryptjs');
const {
  User,
  Role,
  Client,
  Supplier,
  Brand,
  UnitMeasure,
  Category,
  Product,
  Branch,
  Warehouse,
  MovementType,
  Movement,
  PurchaseDetail,
  SaleDetail,
  Inventory,
  AccountType,
  Account,
  PaymentMethod,
  Cashflow,
} = require('../models');

module.exports = {
  users: {
    async list(_req, res, next) {
      try {
        const rows = await User.findAll({
          attributes: { exclude: ['password'] },
          include: [{ model: Role, through: { attributes: [] } }],
          order: [['id', 'ASC']],
        });
        res.json(rows);
      } catch (error) {
        next(error);
      }
    },
    async getById(req, res, next) {
      try {
        const row = await User.findByPk(req.params.id, {
          attributes: { exclude: ['password'] },
          include: [{ model: Role, through: { attributes: [] } }],
        });
        if (!row) return res.status(404).json({ message: 'No encontrado' });
        res.json(row);
      } catch (error) {
        next(error);
      }
    },
    async create(req, res, next) {
      try {
        const { name, email, password, active, roleIds } = req.body || {};
        if (!name || !email || !password) {
          return res.status(400).json({ message: 'name, email y password son obligatorios' });
        }
        const passwordHash = await bcrypt.hash(String(password), 10);
        const row = await User.create({
          name,
          email,
          password: passwordHash,
          active: active !== false,
        });
        if (Array.isArray(roleIds)) {
          await row.setRoles(roleIds);
        }
        const reloaded = await User.findByPk(row.id, {
          attributes: { exclude: ['password'] },
          include: [{ model: Role, through: { attributes: [] } }],
        });
        const safe = reloaded.toJSON();
        delete safe.password;
        res.status(201).json(safe);
      } catch (error) {
        next(error);
      }
    },
    async update(req, res, next) {
      try {
        const row = await User.findByPk(req.params.id);
        if (!row) return res.status(404).json({ message: 'No encontrado' });

        const payload = {};
        if (Object.prototype.hasOwnProperty.call(req.body, 'name')) payload.name = req.body.name;
        if (Object.prototype.hasOwnProperty.call(req.body, 'email')) payload.email = req.body.email;
        if (Object.prototype.hasOwnProperty.call(req.body, 'active')) payload.active = req.body.active;
        if (req.body.password) {
          payload.password = await bcrypt.hash(String(req.body.password), 10);
        }

        await row.update(payload);
        if (Array.isArray(req.body.roleIds)) {
          await row.setRoles(req.body.roleIds);
        }
        const reloaded = await User.findByPk(row.id, {
          attributes: { exclude: ['password'] },
          include: [{ model: Role, through: { attributes: [] } }],
        });
        const safe = reloaded.toJSON();
        delete safe.password;
        res.json(safe);
      } catch (error) {
        next(error);
      }
    },
    async remove(req, res, next) {
      try {
        const row = await User.findByPk(req.params.id);
        if (!row) return res.status(404).json({ message: 'No encontrado' });
        await row.destroy();
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  },
  roles: buildCrudController(Role),
  clients: buildCrudController(Client),
  suppliers: buildCrudController(Supplier),
  brands: buildCrudController(Brand),
  unitMeasures: buildCrudController(UnitMeasure),
  categories: buildCrudController(Category),
  products: buildCrudController(Product),
  branches: buildCrudController(Branch),
  warehouses: buildCrudController(Warehouse),
  movementTypes: buildCrudController(MovementType),
  movements: buildCrudController(Movement),
  purchaseDetails: buildCrudController(PurchaseDetail),
  saleDetails: buildCrudController(SaleDetail),
  inventories: buildCrudController(Inventory),
  accountTypes: buildCrudController(AccountType),
  accounts: buildCrudController(Account),
  paymentMethods: buildCrudController(PaymentMethod),
  cashflows: buildCrudController(Cashflow),
};
