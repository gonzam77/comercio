const { Router } = require('express');
const registerCrudRoutes = require('./crud.routes');
const master = require('../controllers/master.controller');
const { listPurchases, getPurchaseById, createPurchase } = require('../controllers/purchase.controller');
const { listSales, getSaleById, createSale } = require('../controllers/sale.controller');
const { getMyCashSession, openCashSession, closeCashSession } = require('../controllers/cash-session.controller');
const { login } = require('../controllers/auth.controller');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth.middleware');

const router = Router();
const canRead = [authenticateToken, authorizeRoles('ADMIN', 'VENDEDOR')];
const adminWrite = [authenticateToken, authorizeRoles('ADMIN')];
const commercialWrite = [authenticateToken, authorizeRoles('ADMIN', 'VENDEDOR')];

router.post('/auth/login', login);
router.get('/cash-sessions/me', ...canRead, getMyCashSession);
router.post('/cash-sessions/open', ...canRead, openCashSession);
router.post('/cash-sessions/close', ...canRead, closeCashSession);

registerCrudRoutes(router, '/users', master.users, { readMiddlewares: adminWrite, writeMiddlewares: adminWrite });
registerCrudRoutes(router, '/roles', master.roles, { readMiddlewares: adminWrite, writeMiddlewares: adminWrite });
registerCrudRoutes(router, '/clients', master.clients, { readMiddlewares: canRead, writeMiddlewares: commercialWrite });
registerCrudRoutes(router, '/suppliers', master.suppliers, { readMiddlewares: canRead, writeMiddlewares: commercialWrite });
registerCrudRoutes(router, '/brands', master.brands, { readMiddlewares: canRead, writeMiddlewares: commercialWrite });
registerCrudRoutes(router, '/unit-measures', master.unitMeasures, { readMiddlewares: canRead, writeMiddlewares: commercialWrite });
registerCrudRoutes(router, '/categories', master.categories, { readMiddlewares: canRead, writeMiddlewares: commercialWrite });
registerCrudRoutes(router, '/products', master.products, { readMiddlewares: canRead, writeMiddlewares: commercialWrite });
registerCrudRoutes(router, '/branches', master.branches, { readMiddlewares: canRead, writeMiddlewares: adminWrite });
registerCrudRoutes(router, '/warehouses', master.warehouses, { readMiddlewares: canRead, writeMiddlewares: adminWrite });
registerCrudRoutes(router, '/movement-types', master.movementTypes, { readMiddlewares: canRead, writeMiddlewares: adminWrite });
registerCrudRoutes(router, '/movements', master.movements, { readMiddlewares: canRead, writeMiddlewares: adminWrite });
registerCrudRoutes(router, '/purchase-details', master.purchaseDetails, { readMiddlewares: canRead, writeMiddlewares: adminWrite });
registerCrudRoutes(router, '/sale-details', master.saleDetails, { readMiddlewares: canRead, writeMiddlewares: adminWrite });
registerCrudRoutes(router, '/inventories', master.inventories, { readMiddlewares: canRead, writeMiddlewares: adminWrite });
registerCrudRoutes(router, '/account-types', master.accountTypes, { readMiddlewares: canRead, writeMiddlewares: adminWrite });
registerCrudRoutes(router, '/accounts', master.accounts, { readMiddlewares: canRead, writeMiddlewares: adminWrite });
registerCrudRoutes(router, '/payment-methods', master.paymentMethods, { readMiddlewares: canRead, writeMiddlewares: adminWrite });
registerCrudRoutes(router, '/cashflows', master.cashflows, { readMiddlewares: canRead, writeMiddlewares: adminWrite });

router.get('/purchases', ...canRead, listPurchases);
router.get('/purchases/:id', ...canRead, getPurchaseById);
router.post('/purchases', ...commercialWrite, createPurchase);
router.get('/sales', ...canRead, listSales);
router.get('/sales/:id', ...canRead, getSaleById);
router.post('/sales', ...commercialWrite, createSale);

module.exports = router;
