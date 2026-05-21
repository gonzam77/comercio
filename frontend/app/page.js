"use client";

import { useEffect, useMemo, useState } from "react";
import { closeCashSession, createClient, createProduct, createPurchase, createSale, createSupplier, getInitialData, getMyCashSession, getPurchaseById, getSaleById, login, openCashSession } from "../lib/api";
import DashboardTab from "./components/tabs/DashboardTab";
import CashTab from "./components/tabs/CashTab";
import SalesListTab from "./components/tabs/SalesListTab";
import PurchasesListTab from "./components/tabs/PurchasesListTab";
import ProductsTab from "./components/tabs/ProductsTab";
import OperationsTab from "./components/tabs/OperationsTab";
import ContactsTab from "./components/tabs/ContactsTab";

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
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  const [data, setData] = useState({
    products: [],
    brands: [],
    clients: [],
    suppliers: [],
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

  const [productForm, setProductForm] = useState({ sku: "", name: "", brandId: "", costPrice: "", salePrice: "" });
  const [clientForm, setClientForm] = useState({ fullName: "", taxId: "", phone: "", address: "" });
  const [supplierForm, setSupplierForm] = useState({ businessName: "", taxId: "", phone: "", address: "" });
  const [showClientForm, setShowClientForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
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
  const [closeAmountInput, setCloseAmountInput] = useState("");
  const [showCloseCashModal, setShowCloseCashModal] = useState(false);
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
    } catch (e) {
      if (e.status === 401) {
        handleLogout();
        setStatus({ type: "error", text: "Sesion expirada. Inicia sesion nuevamente." });
      } else {
        setStatus({ type: "error", text: e.message });
      }
    } finally {
      setLoading(false);
    }
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
      load(savedToken);
      refreshCashSession(savedToken).then((info) => {
        setShowCashPrompt(Boolean(info && !info.hasOpenSession));
      }).catch(() => {});
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

    return [...saleRows, ...purchaseRows].sort((a, b) => String(b.movementDate).localeCompare(String(a.movementDate)));
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
      await load(res.token);
      const info = await refreshCashSession(res.token);
      setShowCashPrompt(Boolean(info && !info.hasOpenSession));
    } catch (e2) {
      setStatus({ type: "error", text: e2.message });
    }
  }

  function handleLogout() {
    localStorage.removeItem("comercio_token");
    localStorage.removeItem("comercio_user");
    setToken("");
    setSessionUser(null);
    setCashSessionInfo({ hasOpenSession: false, session: null, summary: null, movements: [], recentSessions: [] });
    setShowCashPrompt(false);
    setSaleDetailById({});
    setPurchaseDetailById({});
    setData({
      products: [],
      brands: [],
      clients: [],
      suppliers: [],
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
    } catch (error) {
      setStatus({ type: "error", text: error.message });
    }
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

  async function confirmCloseCashSession() {
    const ok = await handleCloseCashSession();
    if (ok) closeCloseCashModal();
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
    const defaultPaymentMethod = data.paymentMethods.find((p) => String(p.name || "").toUpperCase() === "EFECTIVO");
    setShowNewSaleForm(true);
    setTab("sales-list");
    setSaleForm((s) => ({
      ...s,
      clientId: defaultConsumerClientId || s.clientId,
      saleDate: today(),
      invoiceNumber: "",
      paymentMethodId: defaultPaymentMethod ? String(defaultPaymentMethod.id) : s.paymentMethodId,
      details: [emptyDetail()],
    }));
  }

  function openNewPurchaseForm() {
    const defaultPaymentMethod = data.paymentMethods.find((p) => String(p.name || "").toUpperCase() === "EFECTIVO");
    setShowNewPurchaseForm(true);
    setTab("purchases-list");
    setPurchaseForm((s) => ({
      ...s,
      purchaseDate: today(),
      invoiceNumber: "",
      paymentMethodId: defaultPaymentMethod ? String(defaultPaymentMethod.id) : s.paymentMethodId,
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

  async function handleProduct(e) {
    e.preventDefault();
    try {
      await createProduct(
        {
          sku: productForm.sku,
          name: productForm.name,
          brandId: Number(productForm.brandId) || null,
          costPrice: Number(productForm.costPrice || 0),
          salePrice: Number(productForm.salePrice || 0),
        },
        token
      );
      setStatus({ type: "ok", text: "Producto creado" });
      setProductForm({ sku: "", name: "", brandId: "", costPrice: "", salePrice: "" });
      await load(token);
    } catch (e2) {
      setStatus({ type: "error", text: e2.message });
    }
  }

  async function handleClient(e) {
    e.preventDefault();
    try {
      await createClient(
        {
          fullName: clientForm.fullName,
          taxId: clientForm.taxId || null,
          phone: clientForm.phone || null,
          address: clientForm.address || null,
        },
        token
      );
      setStatus({ type: "ok", text: "Cliente creado correctamente" });
      setClientForm({ fullName: "", taxId: "", phone: "", address: "" });
      setShowClientForm(false);
      await load(token);
    } catch (e2) {
      setStatus({ type: "error", text: e2.message });
    }
  }

  async function handleSupplier(e) {
    e.preventDefault();
    try {
      await createSupplier(
        {
          businessName: supplierForm.businessName,
          taxId: supplierForm.taxId || null,
          phone: supplierForm.phone || null,
          address: supplierForm.address || null,
        },
        token
      );
      setStatus({ type: "ok", text: "Proveedor creado correctamente" });
      setSupplierForm({ businessName: "", taxId: "", phone: "", address: "" });
      setShowSupplierForm(false);
      await load(token);
    } catch (e2) {
      setStatus({ type: "error", text: e2.message });
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

  return (
    <main>
      <div className="header" style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "end", flexWrap: "wrap" }}>
        <div>
          <h1>Panel Comercial</h1>
          <p>Usuario: {sessionUser.name} ({roles.join(", ")})</p>
        </div>
        <button className="secondary" onClick={handleLogout}>Cerrar sesion</button>
      </div>

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

        {!loading && tab === "cash" ? (<CashTab cashSessionInfo={cashSessionInfo} openAmountInput={openAmountInput} setOpenAmountInput={setOpenAmountInput} closeAmountInput={closeAmountInput} setCloseAmountInput={setCloseAmountInput} handleOpenCashSession={handleOpenCashSession} openCloseCashModal={openCloseCashModal} cashSessionMovements={cashSessionMovements} money={money} />) : null}

                {!loading && tab === "sales-list" && canOperate ? (<SalesListTab showNewSaleForm={showNewSaleForm} setShowNewSaleForm={setShowNewSaleForm} openNewSaleForm={openNewSaleForm} handleSale={handleSale} saleForm={saleForm} setSaleForm={setSaleForm} sessionUser={sessionUser} data={data} updateSaleDetail={updateSaleDetail} removeSaleDetail={removeSaleDetail} addSaleDetail={addSaleDetail} saleTotal={saleTotal} money={money} salesListRows={salesListRows} expandedSaleId={expandedSaleId} handleToggleSaleDetail={handleToggleSaleDetail} saleDetailById={saleDetailById} qty={qty} />) : null}

        {!loading && tab === "purchases-list" && canOperate ? (<PurchasesListTab showNewPurchaseForm={showNewPurchaseForm} setShowNewPurchaseForm={setShowNewPurchaseForm} openNewPurchaseForm={openNewPurchaseForm} handlePurchase={handlePurchase} purchaseForm={purchaseForm} setPurchaseForm={setPurchaseForm} sessionUser={sessionUser} data={data} updatePurchaseDetail={updatePurchaseDetail} removePurchaseDetail={removePurchaseDetail} addPurchaseDetail={addPurchaseDetail} purchaseTotal={purchaseTotal} money={money} purchasesListRows={purchasesListRows} expandedPurchaseId={expandedPurchaseId} handleTogglePurchaseDetail={handleTogglePurchaseDetail} purchaseDetailById={purchaseDetailById} qty={qty} />) : null}

        {!loading && tab === "products" && canOperate ? (<ProductsTab isAdmin={isAdmin} handleProduct={handleProduct} productForm={productForm} setProductForm={setProductForm} data={data} productQuery={productQuery} setProductQuery={setProductQuery} productOnlyStock={productOnlyStock} setProductOnlyStock={setProductOnlyStock} productStockOrder={productStockOrder} setProductStockOrder={setProductStockOrder} filteredProducts={filteredProducts} stockByProduct={stockByProduct} addProductToSaleCart={addProductToSaleCart} money={money} qty={qty} setProductOnlyStockAndQuery={() => { setProductQuery(""); setProductOnlyStock(false); }} />) : null}

        {!loading && tab === "operations" ? (<OperationsTab data={data} movementSummaryRows={movementSummaryRows} expandedMovementId={expandedMovementId} setExpandedMovementId={setExpandedMovementId} qty={qty} money={money} />) : null}

        {!loading && tab === "contacts" && canOperate ? (<ContactsTab showClientForm={showClientForm} setShowClientForm={setShowClientForm} handleClient={handleClient} clientForm={clientForm} setClientForm={setClientForm} data={data} showSupplierForm={showSupplierForm} setShowSupplierForm={setShowSupplierForm} handleSupplier={handleSupplier} supplierForm={supplierForm} setSupplierForm={setSupplierForm} /> ) : null}
      </div>

      {canOperate ? (
        <button type="button" className="floatingSaleButton" onClick={openNewSaleForm}>
          Nueva venta
        </button>
      ) : null}
    </main>
  );
}





