"use client";

import { useEffect, useMemo, useState } from "react";
import { closeCashSession, createClient, createInventoryAdjustment, createProduct, createPurchase, createSale, createSupplier, createUser, getInitialData, getMyCashSession, getPurchaseById, getSaleById, login, openCashSession, updateClient, updateProduct, updateSupplier, updateUser, withdrawCashSession } from "../lib/api";
import DashboardTab from "./components/tabs/DashboardTab";
import CashTab from "./components/tabs/CashTab";
import SalesListTab from "./components/tabs/SalesListTab";
import PurchasesListTab from "./components/tabs/PurchasesListTab";
import ProductsTab from "./components/tabs/ProductsTab";
import OperationsTab from "./components/tabs/OperationsTab";
import ContactsTab from "./components/tabs/ContactsTab";
import UsersTab from "./components/tabs/UsersTab";

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 });
const qty = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 3 });

function today() {
  return new Date().toISOString().slice(0, 10);
}

function sumTotal(rows, field = "total") {
  return rows.reduce((a, b) => a + Number(b[field] || 0), 0);
}

function emptyDetail() {
  return { productId: "", quantity: "1", unitPrice: "" };
}

export default function DashboardPage() {
  const [tab, setTab] = useState("dashboard");
  const [token, setToken] = useState("");
  const [sessionUser, setSessionUser] = useState(null);
  const [selectedPosWarehouseId, setSelectedPosWarehouseId] = useState("");
  const [showPosSelectionModal, setShowPosSelectionModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  const [data, setData] = useState({
    products: [],
    brands: [],
    clients: [],
    suppliers: [],
    roles: [],
    users: [],
    warehouses: [],
    paymentMethods: [],
    movementTypes: [],
    movements: [],
    sales: [],
    purchases: [],
    saleDetails: [],
    purchaseDetails: [],
    inventories: [],
    cashflows: [],
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });

  const [saleForm, setSaleForm] = useState({
    clientId: "",
    warehouseId: "",
    saleDate: today(),
    invoiceNumber: "",
    paymentMethodId: "",
    details: [emptyDetail()],
  });

  const [purchaseForm, setPurchaseForm] = useState({
    supplierId: "",
    warehouseId: "",
    purchaseDate: today(),
    invoiceNumber: "",
    paymentMethodId: "",
    details: [emptyDetail()],
  });

  const [expandedMovementId, setExpandedMovementId] = useState(null);
  const [expandedSaleId, setExpandedSaleId] = useState(null);
  const [expandedPurchaseId, setExpandedPurchaseId] = useState(null);
  const [saleDetailById, setSaleDetailById] = useState({});
  const [purchaseDetailById, setPurchaseDetailById] = useState({});
  const [showNewSaleForm, setShowNewSaleForm] = useState(false);
  const [showNewPurchaseForm, setShowNewPurchaseForm] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [productOnlyStock, setProductOnlyStock] = useState(false);
  const [productStockOrder, setProductStockOrder] = useState("none");
  const [dashboardRange, setDashboardRange] = useState("all");
  const [cashSessionInfo, setCashSessionInfo] = useState({ hasOpenSession: false, session: null, summary: null, movements: [], recentSessions: [] });
  const [showCashPrompt, setShowCashPrompt] = useState(false);
  const [openAmountInput, setOpenAmountInput] = useState("0");
  const [showOpenCashModal, setShowOpenCashModal] = useState(false);
  const [closeAmountInput, setCloseAmountInput] = useState("");
  const [showCloseCashModal, setShowCloseCashModal] = useState(false);
  const [showWithdrawCashModal, setShowWithdrawCashModal] = useState(false);
  const [withdrawAmountInput, setWithdrawAmountInput] = useState("");
  const [withdrawAdminPassword, setWithdrawAdminPassword] = useState("");
  const [cartProductModal, setCartProductModal] = useState({ open: false, product: null, quantity: "1" });

  const roles = sessionUser?.roles || [];
  const isAdmin = roles.includes("ADMIN");
  const isSeller = roles.includes("VENDEDOR");
  const canOperate = isAdmin || isSeller;

  async function load(authToken) {
    if (!authToken) return;
    setLoading(true);
    try {
      const res = await getInitialData(authToken);
      setData(res);
      return res;
    } catch (e) {
      if (e.status === 401) {
        handleLogout();
        setStatus({ type: "error", text: "Sesion expirada. Inicia sesion nuevamente." });
      } else {
        setStatus({ type: "error", text: e.message });
      }
      return null;
    } finally {
      setLoading(false);
    }
  }

  function persistSelectedPosWarehouse(warehouseId) {
    const value = String(warehouseId || "");
    localStorage.setItem("comercio_pos_warehouse_id", value);
    setSelectedPosWarehouseId(value);
  }

  function resolveAndSetSellerPos(user, warehouses) {
    const isSellerUser = (user?.roles || []).includes("VENDEDOR");
    if (!isSellerUser) {
      setShowPosSelectionModal(false);
      return "";
    }

    const saved = localStorage.getItem("comercio_pos_warehouse_id") || "";
    const exists = warehouses.some((w) => String(w.id) === String(saved));
    if (exists) {
      setSelectedPosWarehouseId(String(saved));
      setShowPosSelectionModal(false);
      return String(saved);
    }

    if (warehouses.length === 1) {
      const onlyId = String(warehouses[0].id);
      persistSelectedPosWarehouse(onlyId);
      setShowPosSelectionModal(false);
      return onlyId;
    }

    setSelectedPosWarehouseId(warehouses[0] ? String(warehouses[0].id) : "");
    setShowPosSelectionModal(true);
    return "";
  }

  async function refreshCashSession(authToken) {
    if (!authToken) {
      const emptyInfo = { hasOpenSession: false, session: null, summary: null, movements: [], recentSessions: [] };
      setCashSessionInfo(emptyInfo);
      return emptyInfo;
    }
    try {
      const result = await getMyCashSession(authToken);
      const info = {
        hasOpenSession: Boolean(result?.hasOpenSession),
        session: result?.session || null,
        summary: result?.summary || null,
        movements: result?.movements || [],
        recentSessions: result?.recentSessions || [],
      };
      setCashSessionInfo(info);
      return info;
    } catch (error) {
      if (error.status === 404) {
        const emptyInfo = { hasOpenSession: false, session: null, summary: null, movements: [], recentSessions: [] };
        setCashSessionInfo(emptyInfo);
        return emptyInfo;
      }
      throw error;
    }
  }

  useEffect(() => {
    const savedToken = localStorage.getItem("comercio_token") || "";
    const savedUser = localStorage.getItem("comercio_user");
    if (savedToken && savedUser) {
      const user = JSON.parse(savedUser);
      setToken(savedToken);
      setSessionUser(user);
      load(savedToken).then((loaded) => {
        const warehouses = loaded?.warehouses || [];
        const selected = resolveAndSetSellerPos(user, warehouses);
        const shouldLoadCash = !(user.roles || []).includes("VENDEDOR") || Boolean(selected);
        if (shouldLoadCash) {
          refreshCashSession(savedToken).then((info) => {
            setShowCashPrompt(Boolean(info && !info.hasOpenSession));
          }).catch(() => {});
        }
      });
    }
  }, []);

  const metrics = useMemo(() => {
    const now = new Date();
    const todayDate = today();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOf30Days = new Date(now);
    startOf30Days.setDate(now.getDate() - 30);
    const startOf12Months = new Date(now);
    startOf12Months.setFullYear(now.getFullYear() - 1);

    function inRange(dateText) {
      if (dashboardRange === "all") return true;
      if (dashboardRange === "today") return String(dateText || "") === todayDate;
      const date = new Date(`${dateText}T00:00:00`);
      if (dashboardRange === "month") return date >= startOfMonth;
      if (dashboardRange === "30d") return date >= startOf30Days;
      if (dashboardRange === "12m") return date >= startOf12Months;
      return true;
    }

    const salesFiltered = data.sales.filter((s) => inRange(s.saleDate));
    const purchasesFiltered = data.purchases.filter((p) => inRange(p.purchaseDate));

    const salesTotal = sumTotal(salesFiltered);
    const purchasesTotal = sumTotal(purchasesFiltered);
    const stockTotal = data.inventories.reduce((acc, i) => acc + Number(i.stock || 0), 0);
    const cashBalance = cashSessionInfo.hasOpenSession
      ? Number(cashSessionInfo.summary?.expectedBalance || 0)
      : 0;

    return { salesTotal, purchasesTotal, stockTotal, cashBalance };
  }, [data, dashboardRange, cashSessionInfo]);

  const topProducts = useMemo(() => {
    const map = new Map();
    for (const i of data.inventories) {
      map.set(i.productId, (map.get(i.productId) || 0) + Number(i.stock || 0));
    }
    return [...map.entries()]
      .map(([productId, stock]) => ({
        productId,
        stock,
        product: data.products.find((p) => p.id === productId)?.name || `Producto ${productId}`,
      }))
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 5);
  }, [data]);

  const stockByProduct = useMemo(() => {
    const stockMap = new Map();
    for (const inv of data.inventories) {
      stockMap.set(inv.productId, (stockMap.get(inv.productId) || 0) + Number(inv.stock || 0));
    }
    return stockMap;
  }, [data.inventories]);

  const movementSummaryRows = useMemo(() => {
    const userById = new Map(data.users.map((u) => [u.id, u]));
    const warehouseById = new Map(data.warehouses.map((w) => [w.id, w]));
    const movementTypeById = new Map(data.movementTypes.map((mt) => [mt.id, mt]));
    const saleRows = data.sales.map((sale) => {
      const client = data.clients.find((c) => c.id === sale.clientId);
      const userName = userById.get(sale.userId)?.name || `Usuario ${sale.userId}`;
      const fromName = warehouseById.get(sale.warehouseId)?.name || `Deposito ${sale.warehouseId}`;
      const detailRows = data.saleDetails.filter((d) => d.saleId === sale.id).map((d) => {
        const product = data.products.find((p) => p.id === d.productId);
        return { productName: product?.name || `Producto ${d.productId}`, quantity: Number(d.quantity || 0), unitPrice: Number(d.unitPrice || 0) };
      });
      return {
        id: `sale-${sale.id}`,
        typeName: "Venta",
        movementDate: sale.saleDate,
        userName,
        fromName,
        toName: "-",
        counterparty: client?.fullName || `Cliente ${sale.clientId}`,
        document: sale.invoiceNumber || `Venta ${sale.id}`,
        total: Number(sale.total || 0),
        detailRows,
      };
    });

    const purchaseRows = data.purchases.map((purchase) => {
      const supplier = data.suppliers.find((s) => s.id === purchase.supplierId);
      const userName = userById.get(purchase.userId)?.name || `Usuario ${purchase.userId}`;
      const toName = warehouseById.get(purchase.warehouseId)?.name || `Deposito ${purchase.warehouseId}`;
      const detailRows = data.purchaseDetails.filter((d) => d.purchaseId === purchase.id).map((d) => {
        const product = data.products.find((p) => p.id === d.productId);
        return { productName: product?.name || `Producto ${d.productId}`, quantity: Number(d.quantity || 0), unitPrice: Number(d.unitPrice || 0) };
      });
      return {
        id: `purchase-${purchase.id}`,
        typeName: "Compra",
        movementDate: purchase.purchaseDate,
        userName,
        fromName: "-",
        toName,
        counterparty: supplier?.businessName || `Proveedor ${purchase.supplierId}`,
        document: purchase.invoiceNumber || `Compra ${purchase.id}`,
        total: Number(purchase.total || 0),
        detailRows,
      };
    });

    const adjustmentRows = data.movements
      .filter((m) => {
        const type = movementTypeById.get(m.movementTypeId);
        const code = String(type?.code || "").toUpperCase();
        const name = String(type?.name || "").toUpperCase();
        return code === "AJUSTE" || name === "AJUSTE";
      })
      .map((movement) => {
        const userName = userById.get(movement.userId)?.name || `Usuario ${movement.userId}`;
        const warehouseName = warehouseById.get(movement.warehouseFromId)?.name
          || warehouseById.get(movement.warehouseToId)?.name
          || "-";
        const detailRows = data.movementDetails
          .filter((d) => d.movementId === movement.id)
          .map((d) => {
            const product = data.products.find((p) => p.id === d.productId);
            return {
              productName: product?.name || `Producto ${d.productId}`,
              quantity: Number(d.quantity || 0),
              unitPrice: Number(d.unitCost || 0),
            };
          });

        return {
          id: `adjustment-${movement.id}`,
          typeName: "Ajuste",
          movementDate: movement.movementDate,
          userName,
          fromName: warehouseName,
          toName: "-",
          counterparty: "-",
          document: movement.docNumber || `Ajuste ${movement.id}`,
          total: 0,
          detailRows,
        };
      });

    return [...saleRows, ...purchaseRows, ...adjustmentRows]
      .sort((a, b) => String(b.movementDate).localeCompare(String(a.movementDate)));
  }, [data]);

  const salesListRows = useMemo(() => {
    const clientById = new Map(data.clients.map((c) => [c.id, c]));
    const userById = new Map(data.users.map((u) => [u.id, u]));
    const warehouseById = new Map(data.warehouses.map((w) => [w.id, w]));

    return data.sales
      .map((sale) => {
        const client = clientById.get(sale.clientId);
        const user = userById.get(sale.userId);
        const warehouse = warehouseById.get(sale.warehouseId);
        const details = data.saleDetails
          .filter((d) => d.saleId === sale.id)
          .map((d) => {
            const product = data.products.find((p) => p.id === d.productId);
            return {
              productName: product?.name || `Producto ${d.productId}`,
              quantity: Number(d.quantity || 0),
              unitPrice: Number(d.unitPrice || 0),
            };
          });

        return {
          id: sale.id,
          saleDate: sale.saleDate,
          invoiceNumber: sale.invoiceNumber || `Venta ${sale.id}`,
          clientName: client?.fullName || `Cliente ${sale.clientId}`,
          userName: user?.name || `Usuario ${sale.userId}`,
          warehouseName: warehouse?.name || `Deposito ${sale.warehouseId}`,
          paymentMethodName: sale?.SalePayments?.[0]?.PaymentMethod?.name || "-",
          total: Number(sale.total || 0),
          details,
        };
      })
      .sort((a, b) => String(b.saleDate).localeCompare(String(a.saleDate)));
  }, [data]);

  const purchasesListRows = useMemo(() => {
    const supplierById = new Map(data.suppliers.map((s) => [s.id, s]));
    const userById = new Map(data.users.map((u) => [u.id, u]));
    const warehouseById = new Map(data.warehouses.map((w) => [w.id, w]));
    return data.purchases
      .map((purchase) => {
        const supplier = supplierById.get(purchase.supplierId);
        const user = userById.get(purchase.userId);
        const warehouse = warehouseById.get(purchase.warehouseId);
        const details = data.purchaseDetails.filter((d) => d.purchaseId === purchase.id).map((d) => {
          const product = data.products.find((p) => p.id === d.productId);
          return { productName: product?.name || `Producto ${d.productId}`, quantity: Number(d.quantity || 0), unitPrice: Number(d.unitPrice || 0) };
        });
        return {
          id: purchase.id,
          purchaseDate: purchase.purchaseDate,
          invoiceNumber: purchase.invoiceNumber || `Compra ${purchase.id}`,
          supplierName: supplier?.businessName || `Proveedor ${purchase.supplierId}`,
          userName: user?.name || `Usuario ${purchase.userId}`,
          warehouseName: warehouse?.name || `Deposito ${purchase.warehouseId}`,
          paymentMethodName: purchase?.PaymentMethod?.name || "-",
          total: Number(purchase.total || 0),
          details,
        };
      })
      .sort((a, b) => String(b.purchaseDate).localeCompare(String(a.purchaseDate)));
  }, [data]);

  const lowStockProducts = useMemo(() => {
    return data.products
      .map((p) => ({
        id: p.id,
        name: p.name,
        stock: Number(stockByProduct.get(p.id) || 0),
      }))
      .filter((p) => p.stock <= 5)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 8);
  }, [data.products, stockByProduct]);

  const cashSessionMovements = useMemo(
    () => cashSessionInfo.movements || [],
    [cashSessionInfo.movements]
  );

  const defaultConsumerClientId = useMemo(() => {
    const match = data.clients.find((c) => String(c.fullName || "").toLowerCase().includes("consumidor final"));
    return match ? String(match.id) : "";
  }, [data.clients]);

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    const rows = data.products.filter((p) => {
      const brandName = data.brands.find((b) => b.id === p.brandId)?.name || "";
      const matchesQuery = !q
        || String(p.name || "").toLowerCase().includes(q)
        || String(p.sku || "").toLowerCase().includes(q)
        || String(brandName).toLowerCase().includes(q);
      const stock = Number(stockByProduct.get(p.id) || 0);
      const matchesStock = productOnlyStock ? stock > 0 : true;
      return matchesQuery && matchesStock;
    });

    if (productStockOrder === "asc") {
      rows.sort((a, b) => Number(stockByProduct.get(a.id) || 0) - Number(stockByProduct.get(b.id) || 0));
    } else if (productStockOrder === "desc") {
      rows.sort((a, b) => Number(stockByProduct.get(b.id) || 0) - Number(stockByProduct.get(a.id) || 0));
    }
    return rows;
  }, [data.products, data.brands, productQuery, productOnlyStock, productStockOrder, stockByProduct]);

  const saleTotal = useMemo(
    () => saleForm.details.reduce((acc, d) => acc + Number(d.quantity || 0) * Number(d.unitPrice || 0), 0),
    [saleForm.details]
  );

  const purchaseTotal = useMemo(
    () => purchaseForm.details.reduce((acc, d) => acc + Number(d.quantity || 0) * Number(d.unitPrice || 0), 0),
    [purchaseForm.details]
  );

  async function handleLogin(e) {
    e.preventDefault();
    setStatus({ type: "", text: "" });
    try {
      const res = await login(loginForm);
      localStorage.setItem("comercio_token", res.token);
      localStorage.setItem("comercio_user", JSON.stringify(res.user));
      setToken(res.token);
      setSessionUser(res.user);
      setStatus({ type: "ok", text: `Bienvenido ${res.user.name}` });
      const loaded = await load(res.token);
      const warehouses = loaded?.warehouses || [];
      const selected = resolveAndSetSellerPos(res.user, warehouses);
      const shouldLoadCash = !(res.user.roles || []).includes("VENDEDOR") || Boolean(selected);
      if (shouldLoadCash) {
        const info = await refreshCashSession(res.token);
        setShowCashPrompt(Boolean(info && !info.hasOpenSession));
      } else {
        setShowCashPrompt(false);
      }
    } catch (e2) {
      setStatus({ type: "error", text: e2.message });
    }
  }

  function handleLogout() {
    localStorage.removeItem("comercio_token");
    localStorage.removeItem("comercio_user");
    localStorage.removeItem("comercio_pos_warehouse_id");
    setToken("");
    setSessionUser(null);
    setSelectedPosWarehouseId("");
    setShowPosSelectionModal(false);
    setCashSessionInfo({ hasOpenSession: false, session: null, summary: null, movements: [], recentSessions: [] });
    setShowCashPrompt(false);
    setSaleDetailById({});
    setPurchaseDetailById({});
    setData({
      products: [],
      brands: [],
      clients: [],
      suppliers: [],
      roles: [],
      users: [],
      warehouses: [],
      paymentMethods: [],
      movementTypes: [],
      movements: [],
      sales: [],
      purchases: [],
      saleDetails: [],
      purchaseDetails: [],
      inventories: [],
      cashflows: [],
    });
  }

  async function handleOpenCashSession() {
    try {
      const amount = Number(openAmountInput);
      if (!Number.isFinite(amount) || amount < 0) {
        setStatus({ type: "error", text: "Monto de apertura invalido" });
        return;
      }
      const opened = await openCashSession({ openingAmount: amount }, token);
      setCashSessionInfo((prev) => ({
        hasOpenSession: true,
        session: opened?.session || null,
        summary: opened?.summary || null,
        movements: opened?.movements || [],
        recentSessions: opened?.session ? [opened.session, ...(prev.recentSessions || [])] : (prev.recentSessions || []),
      }));
      await refreshCashSession(token);
      setShowCashPrompt(false);
      setCloseAmountInput("");
      setStatus({ type: "ok", text: "Caja abierta correctamente" });
      return true;
    } catch (error) {
      setStatus({ type: "error", text: error.message });
      return false;
    }
  }

  async function confirmPosSelection() {
    if (!selectedPosWarehouseId) {
      setStatus({ type: "error", text: "Debes seleccionar un punto de venta" });
      return;
    }
    persistSelectedPosWarehouse(selectedPosWarehouseId);
    setShowPosSelectionModal(false);
    const info = await refreshCashSession(token);
    setShowCashPrompt(Boolean(info && !info.hasOpenSession));
    setStatus({ type: "ok", text: "Punto de venta seleccionado correctamente" });
  }

  function openOpenCashModal() {
    setOpenAmountInput("0");
    setShowOpenCashModal(true);
  }

  function closeOpenCashModal() {
    setShowOpenCashModal(false);
  }

  async function handleCloseCashSession() {
    try {
      const amount = Number(closeAmountInput);
      if (!Number.isFinite(amount) || amount < 0) {
        setStatus({ type: "error", text: "Monto de cierre invalido" });
        return;
      }
      await closeCashSession({ closingAmount: amount }, token);
      await refreshCashSession(token);
      setCloseAmountInput("");
      setStatus({ type: "ok", text: "Caja cerrada correctamente" });
      return true;
    } catch (error) {
      try {
        await refreshCashSession(token);
      } catch (_syncError) {}
      setStatus({ type: "error", text: error.message });
      return false;
    }
  }

  function openCloseCashModal() {
    setShowCloseCashModal(true);
  }

  function closeCloseCashModal() {
    setShowCloseCashModal(false);
  }

  function openWithdrawCashModal() {
    setWithdrawAmountInput("");
    setWithdrawAdminPassword("");
    setShowWithdrawCashModal(true);
  }

  function closeWithdrawCashModal() {
    setShowWithdrawCashModal(false);
  }

  async function confirmCloseCashSession() {
    const ok = await handleCloseCashSession();
    if (ok) closeCloseCashModal();
  }

  async function confirmOpenCashSession() {
    const ok = await handleOpenCashSession();
    if (ok) setShowOpenCashModal(false);
  }

  async function confirmWithdrawCashSession() {
    try {
      const amount = Number(withdrawAmountInput);
      if (!Number.isFinite(amount) || amount <= 0) {
        setStatus({ type: "error", text: "Monto de retiro invalido" });
        return;
      }
      if (!withdrawAdminPassword.trim()) {
        setStatus({ type: "error", text: "Debes ingresar una contrasena de administrador" });
        return;
      }

      await withdrawCashSession({ amount, adminPassword: withdrawAdminPassword }, token);
      await refreshCashSession(token);
      setShowWithdrawCashModal(false);
      setWithdrawAmountInput("");
      setWithdrawAdminPassword("");
      setStatus({ type: "ok", text: "Retiro de caja registrado correctamente" });
    } catch (error) {
      setStatus({ type: "error", text: error.message });
    }
  }

  async function handleToggleSaleDetail(saleId) {
    if (expandedSaleId === saleId) {
      setExpandedSaleId(null);
      return;
    }
    try {
      if (!saleDetailById[saleId]) {
        const fullSale = await getSaleById(saleId, token);
        setSaleDetailById((prev) => ({ ...prev, [saleId]: fullSale }));
      }
      setExpandedSaleId(saleId);
    } catch (error) {
      setStatus({ type: "error", text: error.message });
    }
  }

  async function handleTogglePurchaseDetail(purchaseId) {
    if (expandedPurchaseId === purchaseId) {
      setExpandedPurchaseId(null);
      return;
    }
    try {
      if (!purchaseDetailById[purchaseId]) {
        const fullPurchase = await getPurchaseById(purchaseId, token);
        setPurchaseDetailById((prev) => ({ ...prev, [purchaseId]: fullPurchase }));
      }
      setExpandedPurchaseId(purchaseId);
    } catch (error) {
      setStatus({ type: "error", text: error.message });
    }
  }

  function updateSaleDetail(index, key, value) {
    setSaleForm((s) => {
      const next = [...s.details];
      const row = { ...next[index], [key]: value };
      if (key === "productId") {
        const product = data.products.find((p) => String(p.id) === String(value));
        row.unitPrice = product ? String(product.salePrice ?? 0) : "";
      }
      next[index] = row;
      return { ...s, details: next };
    });
  }

  function updatePurchaseDetail(index, key, value) {
    setPurchaseForm((s) => {
      const next = [...s.details];
      next[index] = { ...next[index], [key]: value };
      return { ...s, details: next };
    });
  }

  function addSaleDetail() {
    setSaleForm((s) => ({ ...s, details: [...s.details, emptyDetail()] }));
  }

  function addProductToSaleCart(product) {
    setCartProductModal({ open: true, product, quantity: "1" });
  }

  function closeAddToCartModal() {
    setCartProductModal({ open: false, product: null, quantity: "1" });
  }

  function confirmAddProductToSaleCart() {
    const product = cartProductModal.product;
    const quantityToAdd = Number(cartProductModal.quantity);
    if (!product) return;
    if (!Number.isFinite(quantityToAdd) || quantityToAdd <= 0) {
      setStatus({ type: "error", text: "Cantidad invalida. Debe ser mayor a 0." });
      return;
    }

    setSaleForm((s) => ({
      ...s,
      details: s.details.some((d) => String(d.productId) === String(product.id))
        ? s.details.map((d) => (
          String(d.productId) === String(product.id)
            ? { ...d, quantity: String(Number(d.quantity || 0) + quantityToAdd) }
            : d
        ))
        : [
          ...s.details,
          {
            productId: String(product.id),
            quantity: String(quantityToAdd),
            unitPrice: String(product.salePrice ?? 0),
          },
        ],
    }));
    setStatus({ type: "ok", text: `${product.name}: se agregaron ${quantityToAdd} unidad(es) al carrito` });
    closeAddToCartModal();
  }

  function openNewSaleForm() {
    if (showNewSaleForm) {
      setTab("sales-list");
      return;
    }

    const defaultPaymentMethod = data.paymentMethods.find((p) => String(p.name || "").toUpperCase() === "EFECTIVO");
    const firstClient = data.clients[0];
    const firstWarehouse = data.warehouses[0];
    const firstPaymentMethod = data.paymentMethods[0];
    setShowNewSaleForm(true);
    setTab("sales-list");
    setSaleForm((s) => ({
      ...s,
      clientId: defaultConsumerClientId || s.clientId || (firstClient ? String(firstClient.id) : ""),
      warehouseId: isSeller
        ? (selectedPosWarehouseId || (firstWarehouse ? String(firstWarehouse.id) : ""))
        : (s.warehouseId || (firstWarehouse ? String(firstWarehouse.id) : "")),
      saleDate: today(),
      invoiceNumber: "",
      paymentMethodId: defaultPaymentMethod
        ? String(defaultPaymentMethod.id)
        : (s.paymentMethodId || (firstPaymentMethod ? String(firstPaymentMethod.id) : "")),
      details: [emptyDetail()],
    }));
  }

  function openNewPurchaseForm() {
    const defaultPaymentMethod = data.paymentMethods.find((p) => String(p.name || "").toUpperCase() === "EFECTIVO");
    const firstSupplier = data.suppliers[0];
    const firstWarehouse = data.warehouses[0];
    const firstPaymentMethod = data.paymentMethods[0];
    setShowNewPurchaseForm(true);
    setTab("purchases-list");
    setPurchaseForm((s) => ({
      ...s,
      supplierId: s.supplierId || (firstSupplier ? String(firstSupplier.id) : ""),
      warehouseId: isSeller
        ? (selectedPosWarehouseId || (firstWarehouse ? String(firstWarehouse.id) : ""))
        : (s.warehouseId || (firstWarehouse ? String(firstWarehouse.id) : "")),
      purchaseDate: today(),
      invoiceNumber: "",
      paymentMethodId: defaultPaymentMethod
        ? String(defaultPaymentMethod.id)
        : (s.paymentMethodId || (firstPaymentMethod ? String(firstPaymentMethod.id) : "")),
      details: [emptyDetail()],
    }));
  }

  function addPurchaseDetail() {
    setPurchaseForm((s) => ({ ...s, details: [...s.details, emptyDetail()] }));
  }

  function removeSaleDetail(index) {
    setSaleForm((s) => ({ ...s, details: s.details.length > 1 ? s.details.filter((_, i) => i !== index) : s.details }));
  }

  function removePurchaseDetail(index) {
    setPurchaseForm((s) => ({ ...s, details: s.details.length > 1 ? s.details.filter((_, i) => i !== index) : s.details }));
  }

  function sanitizeSaleDetails(details) {
    return details
      .map((d) => ({
        productId: Number(d.productId),
        quantity: Number(d.quantity),
      }))
      .filter((d) => d.productId && d.quantity > 0);
  }

  function sanitizePurchaseDetails(details) {
    return details
      .map((d) => ({
        productId: Number(d.productId),
        quantity: Number(d.quantity),
        unitPrice: Number(d.unitPrice),
      }))
      .filter((d) => d.productId && d.quantity > 0 && d.unitPrice >= 0);
  }

  async function handleSale(e) {
    e.preventDefault();
    const details = sanitizeSaleDetails(saleForm.details);
    if (details.length === 0) {
      setStatus({ type: "error", text: "Debes agregar al menos un producto valido en el detalle." });
      return;
    }

    const hasOutOfStockProduct = details.some((d) => Number(stockByProduct.get(d.productId) || 0) <= 0);
    if (hasOutOfStockProduct) {
      setStatus({ type: "error", text: "No puedes vender productos sin stock disponible." });
      return;
    }

    try {
      await createSale(
        {
          clientId: Number(saleForm.clientId),
          warehouseId: Number(saleForm.warehouseId),
          saleDate: saleForm.saleDate,
          invoiceNumber: saleForm.invoiceNumber,
          paymentMethodId: Number(saleForm.paymentMethodId),
          details,
        },
        token
      );
      setStatus({ type: "ok", text: "Venta registrada correctamente" });
      setShowNewSaleForm(false);
      setSaleForm((s) => ({ ...s, invoiceNumber: "", paymentMethodId: "", details: [emptyDetail()] }));
      await load(token);
    } catch (e2) {
      setStatus({ type: "error", text: e2.message });
    }
  }

  async function handlePurchase(e) {
    e.preventDefault();
    const details = sanitizePurchaseDetails(purchaseForm.details);
    if (details.length === 0) {
      setStatus({ type: "error", text: "Debes agregar al menos un producto valido en el detalle." });
      return;
    }

    try {
      await createPurchase(
        {
          supplierId: Number(purchaseForm.supplierId),
          warehouseId: Number(purchaseForm.warehouseId),
          purchaseDate: purchaseForm.purchaseDate,
          invoiceNumber: purchaseForm.invoiceNumber,
          paymentMethodId: Number(purchaseForm.paymentMethodId),
          details,
        },
        token
      );
      setStatus({ type: "ok", text: "Compra registrada correctamente" });
      setShowNewPurchaseForm(false);
      setPurchaseForm((s) => ({ ...s, invoiceNumber: "", paymentMethodId: "", details: [emptyDetail()] }));
      await load(token);
    } catch (e2) {
      setStatus({ type: "error", text: e2.message });
    }
  }

  async function handleCreateProduct(payload) {
    try {
      await createProduct(
        {
          sku: payload.sku,
          name: payload.name,
          brandId: Number(payload.brandId) || null,
          costPrice: Number(payload.costPrice || 0),
          salePrice: Number(payload.salePrice || 0),
        },
        token
      );
      setStatus({ type: "ok", text: "Producto creado" });
      await load(token);
    } catch (e2) {
      setStatus({ type: "error", text: e2.message });
      throw e2;
    }
  }

  async function handleUpdateProduct(productId, payload) {
    try {
      await updateProduct(productId, {
        sku: payload.sku,
        name: payload.name,
        brandId: Number(payload.brandId) || null,
        costPrice: Number(payload.costPrice || 0),
        salePrice: Number(payload.salePrice || 0),
        active: payload.active,
      }, token);
      setStatus({ type: "ok", text: "Producto actualizado" });
      await load(token);
    } catch (e2) {
      setStatus({ type: "error", text: e2.message });
      throw e2;
    }
  }

  async function handleCreateClient(payload) {
    try {
      await createClient(
        {
          fullName: payload.fullName,
          taxId: payload.taxId || null,
          phone: payload.phone || null,
          address: payload.address || null,
        },
        token
      );
      setStatus({ type: "ok", text: "Cliente creado correctamente" });
      await load(token);
    } catch (e2) {
      setStatus({ type: "error", text: e2.message });
      throw e2;
    }
  }

  async function handleUpdateClient(clientId, payload) {
    try {
      await updateClient(clientId, {
        fullName: payload.fullName,
        taxId: payload.taxId || null,
        phone: payload.phone || null,
        address: payload.address || null,
      }, token);
      setStatus({ type: "ok", text: "Cliente actualizado correctamente" });
      await load(token);
    } catch (e2) {
      setStatus({ type: "error", text: e2.message });
      throw e2;
    }
  }

  async function handleCreateSupplier(payload) {
    try {
      await createSupplier(
        {
          businessName: payload.businessName,
          taxId: payload.taxId || null,
          phone: payload.phone || null,
          address: payload.address || null,
        },
        token
      );
      setStatus({ type: "ok", text: "Proveedor creado correctamente" });
      await load(token);
    } catch (e2) {
      setStatus({ type: "error", text: e2.message });
      throw e2;
    }
  }

  async function handleUpdateSupplier(supplierId, payload) {
    try {
      await updateSupplier(supplierId, {
        businessName: payload.businessName,
        taxId: payload.taxId || null,
        phone: payload.phone || null,
        address: payload.address || null,
      }, token);
      setStatus({ type: "ok", text: "Proveedor actualizado correctamente" });
      await load(token);
    } catch (e2) {
      setStatus({ type: "error", text: e2.message });
      throw e2;
    }
  }

  async function handleCreateInventoryAdjustment(payload) {
    try {
      await createInventoryAdjustment(payload, token);
      setStatus({ type: "ok", text: "Ajuste de inventario registrado correctamente" });
      await load(token);
    } catch (e2) {
      setStatus({ type: "error", text: e2.message });
      throw e2;
    }
  }

  async function handleCreateUser(payload) {
    try {
      await createUser(payload, token);
      setStatus({ type: "ok", text: "Usuario creado correctamente" });
      await load(token);
    } catch (e2) {
      setStatus({ type: "error", text: e2.message });
      throw e2;
    }
  }

  async function handleUpdateUser(userId, payload) {
    try {
      await updateUser(userId, payload, token);
      setStatus({ type: "ok", text: "Usuario actualizado correctamente" });
      await load(token);
    } catch (e2) {
      setStatus({ type: "error", text: e2.message });
      throw e2;
    }
  }

  if (!token || !sessionUser) {
    return (
      <main>
        <div className="header">
          <h1>Panel Comercial</h1>
          <p>Inicia sesion para operar con permisos por rol.</p>
        </div>
        <div className="panel section" style={{ maxWidth: 500, margin: "0 auto" }}>
          <h2>Acceso</h2>
          <form className="grid" onSubmit={handleLogin}>
            <input
              type="email"
              required
              placeholder="Email"
              value={loginForm.email}
              onChange={(e) => setLoginForm((s) => ({ ...s, email: e.target.value }))}
            />
            <input
              type="password"
              required
              placeholder="Contrasena"
              value={loginForm.password}
              onChange={(e) => setLoginForm((s) => ({ ...s, password: e.target.value }))}
            />
            <button type="submit">Ingresar</button>
          </form>
          <p className="label" style={{ marginTop: 10 }}>Admin demo: admin@comercio.local / admin123</p>
          <p className="label">Vendedor demo: vendedor@comercio.local / vendedor123</p>
          {status.text ? <div className={`alert ${status.type}`}>{status.text}</div> : null}
        </div>
      </main>
    );
  }

  const tabList = [["dashboard", "Dashboard"], ["cash", "Caja"], ["sales-list", "Ventas"], ["purchases-list", "Compras"], ["operations", "Inventario y movimientos"]];
  if (canOperate) tabList.push(["contacts", "Clientes y proveedores"]);
  if (canOperate) tabList.push(["products", "Productos"]);
  if (isAdmin) tabList.push(["users", "Usuarios"]);

  return (
    <main>
      <div className="header" style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "end", flexWrap: "wrap" }}>
        <div>
          <h1>Panel Comercial</h1>
          <p>Usuario: {sessionUser.name} ({roles.join(", ")})</p>
        </div>
        <button className="secondary" onClick={handleLogout}>Cerrar sesion</button>
      </div>

      {isSeller ? (
        <div className="panel card" style={{ marginBottom: 12 }}>
          <div className="label">Punto de venta activo</div>
          <div className="value" style={{ fontSize: "1rem" }}>
            {data.warehouses.find((w) => String(w.id) === String(selectedPosWarehouseId))?.name || "No seleccionado"}
          </div>
          <button type="button" className="secondary" style={{ marginTop: 8 }} onClick={() => setShowPosSelectionModal(true)}>
            Cambiar punto de venta
          </button>
        </div>
      ) : null}

      {showPosSelectionModal ? (
        <div className="modalOverlay">
          <div className="panel section modalCard">
            <h2>Seleccionar punto de venta</h2>
            <p className="label">Debes elegir el deposito/punto de venta para operar y usar su caja correspondiente.</p>
            <div className="row" style={{ marginBottom: 12 }}>
              <select value={selectedPosWarehouseId} onChange={(e) => setSelectedPosWarehouseId(e.target.value)}>
                <option value="">Seleccionar punto de venta</option>
                {data.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div className="modalActions">
              <button type="button" className="secondary" onClick={() => setShowPosSelectionModal(false)}>Cancelar</button>
              <button type="button" onClick={confirmPosSelection}>Confirmar</button>
            </div>
          </div>
        </div>
      ) : null}

      {showCashPrompt ? (
        <div className="modalOverlay">
          <div className="panel section modalCard">
            <h2>Apertura de caja</h2>
            <p className="label">Ingresa el monto inicial de caja chica para comenzar a operar.</p>
            <div className="row">
              <input type="number" min="0" step="0.01" value={openAmountInput} onChange={(e) => setOpenAmountInput(e.target.value)} />
              <button type="button" onClick={handleOpenCashSession}>Abrir caja</button>
              {isAdmin ? <button type="button" className="secondary" onClick={() => setShowCashPrompt(false)}>Entrar en modo administrativo</button> : null}
            </div>
            {!isAdmin ? <p className="label">Tu perfil requiere abrir caja para continuar.</p> : null}
          </div>
        </div>
      ) : null}

      {showCloseCashModal ? (
        <div className="modalOverlay">
          <div className="panel section modalCard">
            <h2>Confirmar cierre de caja</h2>
            <p className="label">Esta accion cerrara la caja actual con el monto de cierre ingresado.</p>
            <div className="row" style={{ marginBottom: 12 }}>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Monto de cierre"
                value={closeAmountInput}
                onChange={(e) => setCloseAmountInput(e.target.value)}
              />
            </div>
            <div className="modalActions">
              <button type="button" className="secondary" onClick={closeCloseCashModal}>Cancelar</button>
              <button type="button" className="danger" onClick={confirmCloseCashSession}>Confirmar cierre</button>
            </div>

            {!cashSessionInfo.hasOpenSession && cashSessionInfo.session?.status === "CLOSED" ? (
              <div className="panel card" style={{ marginBottom: 12 }}>
                <div className="label">Ultimo cierre registrado</div>
                <div className="label">
                  {cashSessionInfo.session.closedAt
                    ? `Cerrada el ${new Date(cashSessionInfo.session.closedAt).toLocaleString()}`
                    : "-"}
                </div>
                <div className="label">
                  Esperado: {money.format(Number(cashSessionInfo.session.expectedClosingAmount || 0))} | Contado: {money.format(Number(cashSessionInfo.session.closingAmount || 0))} | Diferencia: {money.format(Number(cashSessionInfo.session.closingDifferenceAmount || 0))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {showOpenCashModal ? (
        <div className="modalOverlay">
          <div className="panel section modalCard">
            <h2>Abrir caja</h2>
            <p className="label">Ingresa el monto de apertura para iniciar la sesion de caja.</p>
            <div className="row" style={{ marginBottom: 12 }}>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Monto de apertura"
                value={openAmountInput}
                onChange={(e) => setOpenAmountInput(e.target.value)}
              />
            </div>
            <div className="modalActions">
              <button type="button" className="secondary" onClick={closeOpenCashModal}>Cancelar</button>
              <button type="button" onClick={confirmOpenCashSession}>Confirmar apertura</button>
            </div>
          </div>
        </div>
      ) : null}

      {showWithdrawCashModal ? (
        <div className="modalOverlay">
          <div className="panel section modalCard">
            <h2>Retiro de caja</h2>
            <p className="label">Ingresa el monto y una contrasena de administrador para autorizar el retiro.</p>
            <div className="grid" style={{ marginBottom: 12 }}>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Monto a retirar"
                value={withdrawAmountInput}
                onChange={(e) => setWithdrawAmountInput(e.target.value)}
              />
              <input
                type="password"
                placeholder="Contrasena de administrador"
                value={withdrawAdminPassword}
                onChange={(e) => setWithdrawAdminPassword(e.target.value)}
              />
            </div>
            <div className="modalActions">
              <button type="button" className="secondary" onClick={closeWithdrawCashModal}>Cancelar</button>
              <button type="button" className="danger" onClick={confirmWithdrawCashSession}>Confirmar retiro</button>
            </div>
          </div>
        </div>
      ) : null}

      {cartProductModal.open ? (
        <div className="modalOverlay">
          <div className="panel section modalCard">
            <h2>Agregar al carrito</h2>
            <p className="label">Producto: <strong>{cartProductModal.product?.name}</strong></p>
            <div className="row">
              <input
                type="number"
                min="0.001"
                step="0.001"
                value={cartProductModal.quantity}
                onChange={(e) => setCartProductModal((prev) => ({ ...prev, quantity: e.target.value }))}
              />
            </div>
            <div className="modalActions">
              <button type="button" className="secondary" onClick={closeAddToCartModal}>Cancelar</button>
              <button type="button" onClick={confirmAddProductToSaleCart}>Agregar</button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid stats">
        <div className="panel card"><div className="label">Ventas acumuladas</div><div className="value">{money.format(metrics.salesTotal)}</div></div>
        <div className="panel card"><div className="label">Compras acumuladas</div><div className="value">{money.format(metrics.purchasesTotal)}</div></div>
        <div className="panel card"><div className="label">Stock total</div><div className="value">{qty.format(metrics.stockTotal)}</div></div>
        <div className="panel card"><div className="label">Saldo de caja</div><div className="value">{money.format(metrics.cashBalance)}</div></div>
      </div>
      <div className="row" style={{ marginBottom: 10 }}>
        <select value={dashboardRange} onChange={(e) => setDashboardRange(e.target.value)} style={{ maxWidth: 280 }}>
          <option value="today">Metricas: Hoy</option>
          <option value="all">Metricas: Todo el historial</option>
          <option value="month">Metricas: Este mes</option>
          <option value="30d">Metricas: Ultimos 30 dias</option>
          <option value="12m">Metricas: Ultimos 12 meses</option>
        </select>
      </div>

      <div className="tabs">
        {tabList.map(([id, label]) => (
          <button key={id} className={`tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {status.text ? <div className={`alert ${status.type}`}>{status.text}</div> : null}

      <div className="panel section">
        {loading ? <p>Cargando datos...</p> : null}

        {!loading && tab === "dashboard" ? (<DashboardTab data={data} topProducts={topProducts} lowStockProducts={lowStockProducts} qty={qty} />) : null}

        {!loading && tab === "cash" ? (<CashTab cashSessionInfo={cashSessionInfo} openOpenCashModal={openOpenCashModal} openCloseCashModal={openCloseCashModal} openWithdrawCashModal={openWithdrawCashModal} cashSessionMovements={cashSessionMovements} money={money} />) : null}

        {!loading && tab === "sales-list" && canOperate ? (<SalesListTab showNewSaleForm={showNewSaleForm} setShowNewSaleForm={setShowNewSaleForm} openNewSaleForm={openNewSaleForm} handleSale={handleSale} saleForm={saleForm} setSaleForm={setSaleForm} sessionUser={sessionUser} data={data} updateSaleDetail={updateSaleDetail} removeSaleDetail={removeSaleDetail} addSaleDetail={addSaleDetail} saleTotal={saleTotal} money={money} salesListRows={salesListRows} expandedSaleId={expandedSaleId} handleToggleSaleDetail={handleToggleSaleDetail} saleDetailById={saleDetailById} qty={qty} isSeller={isSeller} selectedPosWarehouseId={selectedPosWarehouseId} />) : null}

        {!loading && tab === "purchases-list" && canOperate ? (<PurchasesListTab showNewPurchaseForm={showNewPurchaseForm} setShowNewPurchaseForm={setShowNewPurchaseForm} openNewPurchaseForm={openNewPurchaseForm} handlePurchase={handlePurchase} purchaseForm={purchaseForm} setPurchaseForm={setPurchaseForm} sessionUser={sessionUser} data={data} updatePurchaseDetail={updatePurchaseDetail} removePurchaseDetail={removePurchaseDetail} addPurchaseDetail={addPurchaseDetail} purchaseTotal={purchaseTotal} money={money} purchasesListRows={purchasesListRows} expandedPurchaseId={expandedPurchaseId} handleTogglePurchaseDetail={handleTogglePurchaseDetail} purchaseDetailById={purchaseDetailById} qty={qty} isSeller={isSeller} selectedPosWarehouseId={selectedPosWarehouseId} />) : null}

        {!loading && tab === "products" && canOperate ? (<ProductsTab isAdmin={isAdmin} onCreateProduct={handleCreateProduct} onUpdateProduct={handleUpdateProduct} onCreateInventoryAdjustment={handleCreateInventoryAdjustment} data={data} productQuery={productQuery} setProductQuery={setProductQuery} productOnlyStock={productOnlyStock} setProductOnlyStock={setProductOnlyStock} productStockOrder={productStockOrder} setProductStockOrder={setProductStockOrder} filteredProducts={filteredProducts} stockByProduct={stockByProduct} addProductToSaleCart={addProductToSaleCart} money={money} qty={qty} setProductOnlyStockAndQuery={() => { setProductQuery(""); setProductOnlyStock(false); }} />) : null}

        {!loading && tab === "operations" ? (<OperationsTab data={data} movementSummaryRows={movementSummaryRows} expandedMovementId={expandedMovementId} setExpandedMovementId={setExpandedMovementId} qty={qty} money={money} />) : null}

        {!loading && tab === "contacts" && canOperate ? (<ContactsTab data={data} onCreateClient={handleCreateClient} onUpdateClient={handleUpdateClient} onCreateSupplier={handleCreateSupplier} onUpdateSupplier={handleUpdateSupplier} /> ) : null}
        {!loading && tab === "users" && isAdmin ? (<UsersTab users={data.users} roles={data.roles} onCreateUser={handleCreateUser} onUpdateUser={handleUpdateUser} />) : null}
      </div>

      {canOperate ? (
        <button type="button" className="floatingSaleButton" onClick={openNewSaleForm}>
          Nueva venta
        </button>
      ) : null}
    </main>
  );
}





