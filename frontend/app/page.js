"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { closeCashSession, createProduct, createPurchase, createSale, getInitialData, getMyCashSession, getPurchaseById, getSaleById, login, openCashSession } from "../lib/api";

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
  const [cashSessionInfo, setCashSessionInfo] = useState({ hasOpenSession: false, session: null });
  const [showCashPrompt, setShowCashPrompt] = useState(false);
  const [openAmountInput, setOpenAmountInput] = useState("0");
  const [closeAmountInput, setCloseAmountInput] = useState("");

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

  useEffect(() => {
    const savedToken = localStorage.getItem("comercio_token") || "";
    const savedUser = localStorage.getItem("comercio_user");
    if (savedToken && savedUser) {
      const user = JSON.parse(savedUser);
      setToken(savedToken);
      setSessionUser(user);
      load(savedToken);
      refreshCashSession(savedToken);
    }
  }, []);

  const metrics = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOf30Days = new Date(now);
    startOf30Days.setDate(now.getDate() - 30);
    const startOf12Months = new Date(now);
    startOf12Months.setFullYear(now.getFullYear() - 1);

    function inRange(dateText) {
      if (dashboardRange === "all") return true;
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
    const cashIn = data.cashflows.filter((c) => c.type === "COLLECTION").reduce((a, b) => a + Number(b.amount || 0), 0);
    const cashOut = data.cashflows.filter((c) => c.type === "PAYMENT").reduce((a, b) => a + Number(b.amount || 0), 0);
    return { salesTotal, purchasesTotal, stockTotal, cashBalance: cashIn - cashOut };
  }, [data, dashboardRange]);

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
    setCashSessionInfo({ hasOpenSession: false, session: null });
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
      await openCashSession({ openingAmount: amount }, token);
      await refreshCashSession(token);
      setShowCashPrompt(false);
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
    const inputQty = window.prompt(`¿Cuántas unidades de "${product.name}" querés agregar?`, "1");
    if (inputQty === null) return;
    const quantityToAdd = Number(inputQty);
    if (!Number.isFinite(quantityToAdd) || quantityToAdd <= 0) {
      setStatus({ type: "error", text: "Cantidad inválida. Debe ser mayor a 0." });
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

  const tabList = [["dashboard", "Dashboard"], ["sales-list", "Listado ventas"], ["purchases-list", "Listado compras"], ["operations", "Inventario y movimientos"]];
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

      <div className="panel section" style={{ marginBottom: 12 }}>
        <div className="row">
          <div>
            <strong>Estado de caja</strong>
            <div className="label">
              {cashSessionInfo.hasOpenSession
                ? `Abierta desde ${new Date(cashSessionInfo.session?.openedAt).toLocaleString()}`
                : "Sin caja abierta"}
            </div>
          </div>
          {cashSessionInfo.hasOpenSession ? (
            <>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Monto de cierre"
                value={closeAmountInput}
                onChange={(e) => setCloseAmountInput(e.target.value)}
              />
              <button type="button" className="secondary" onClick={handleCloseCashSession}>Cerrar caja</button>
            </>
          ) : null}
        </div>
      </div>

      {showCashPrompt ? (
        <div className="panel section" style={{ marginBottom: 12 }}>
          <h2>Apertura de caja</h2>
          <p className="label">Para ventas o compras en efectivo, primero abrí la caja con monto inicial.</p>
          <div className="row">
            <input type="number" min="0" step="0.01" value={openAmountInput} onChange={(e) => setOpenAmountInput(e.target.value)} />
            <button type="button" onClick={handleOpenCashSession}>Abrir caja</button>
            <button type="button" className="secondary" onClick={() => setShowCashPrompt(false)}>Continuar sin abrir</button>
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

        {!loading && tab === "dashboard" ? (
          <>
            <h2>Resumen operativo</h2>
            <div className="grid kpis">
              <div className="panel card"><div className="label">Clientes</div><div className="value">{data.clients.length}</div></div>
              <div className="panel card"><div className="label">Proveedores</div><div className="value">{data.suppliers.length}</div></div>
              <div className="panel card"><div className="label">Productos</div><div className="value">{data.products.length}</div></div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", marginTop: 18 }}>
              <div>
                <h2>Top stock por producto</h2>
                <div className="grid">
                  {topProducts.map((p) => {
                    const max = topProducts[0]?.stock || 1;
                    return (
                      <div key={p.productId} className="panel card">
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                          <strong>{p.product}</strong>
                          <span className="badge">{qty.format(p.stock)}</span>
                        </div>
                        <div className="bar"><span style={{ width: `${(p.stock / max) * 100}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h2>Alertas de stock</h2>
                <div className="grid">
                  {lowStockProducts.length === 0 ? (
                    <div className="panel card">
                      <div className="label">Sin alertas</div>
                      <div className="value" style={{ fontSize: "1.1rem" }}>Stock saludable</div>
                    </div>
                  ) : lowStockProducts.map((p) => (
                    <div key={`low-${p.id}`} className="panel card">
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <strong>{p.name}</strong>
                        <span className="badge" style={{ background: p.stock === 0 ? "#fde9e9" : "#fff4e5", color: p.stock === 0 ? "#b91c1c" : "#b45309" }}>
                          {p.stock === 0 ? "Sin stock" : `Stock bajo: ${qty.format(p.stock)}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : null}

        {!loading && tab === "sales" && canOperate ? (
          <>
            <h2>Registrar venta</h2>
            <form className="grid" onSubmit={handleSale}>
              <div className="row">
                <select required value={saleForm.clientId} onChange={(e) => setSaleForm((s) => ({ ...s, clientId: e.target.value }))}><option value="">Cliente</option>{data.clients.map((x) => <option key={x.id} value={x.id}>{x.fullName}</option>)}</select>
                <input value={sessionUser.name} disabled />
                <select required value={saleForm.warehouseId} onChange={(e) => setSaleForm((s) => ({ ...s, warehouseId: e.target.value }))}><option value="">Deposito</option>{data.warehouses.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
                <input type="date" required value={saleForm.saleDate} onChange={(e) => setSaleForm((s) => ({ ...s, saleDate: e.target.value }))} />
                <input placeholder="Factura" value={saleForm.invoiceNumber} onChange={(e) => setSaleForm((s) => ({ ...s, invoiceNumber: e.target.value }))} />
              </div>

              <div className="tableWrap">
                <table style={{ minWidth: 920 }}>
                  <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th><th>Accion</th></tr></thead>
                  <tbody>
                    {saleForm.details.map((d, index) => (
                      <tr key={`sale-${index}`}>
                        <td><select required value={d.productId} onChange={(e) => updateSaleDetail(index, "productId", e.target.value)}><option value="">Producto</option>{data.products.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></td>
                        <td><input type="number" min="0.001" step="0.001" required value={d.quantity} onChange={(e) => updateSaleDetail(index, "quantity", e.target.value)} /></td>
                        <td><input type="number" min="0" step="0.01" value={d.unitPrice} readOnly /></td>
                        <td>{money.format(Number(d.quantity || 0) * Number(d.unitPrice || 0))}</td>
                        <td><button type="button" className="secondary" onClick={() => removeSaleDetail(index)}>Quitar</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="row">
                <button type="button" className="secondary" onClick={addSaleDetail}>Agregar producto</button>
                <div className="panel card"><div className="label">Total venta</div><div className="value">{money.format(saleTotal)}</div></div>
                <button type="submit">Guardar venta</button>
              </div>
            </form>
          </>
        ) : null}

        {!loading && tab === "purchases" && canOperate ? (
          <>
            <h2>Registrar compra</h2>
            <form className="grid" onSubmit={handlePurchase}>
              <div className="row">
                <select required value={purchaseForm.supplierId} onChange={(e) => setPurchaseForm((s) => ({ ...s, supplierId: e.target.value }))}><option value="">Proveedor</option>{data.suppliers.map((x) => <option key={x.id} value={x.id}>{x.businessName}</option>)}</select>
                <input value={sessionUser.name} disabled />
                <select required value={purchaseForm.warehouseId} onChange={(e) => setPurchaseForm((s) => ({ ...s, warehouseId: e.target.value }))}><option value="">Deposito</option>{data.warehouses.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
                <select required value={purchaseForm.paymentMethodId} onChange={(e) => setPurchaseForm((s) => ({ ...s, paymentMethodId: e.target.value }))}><option value="">Metodo de pago</option>{data.paymentMethods.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
                <input type="date" required value={purchaseForm.purchaseDate} onChange={(e) => setPurchaseForm((s) => ({ ...s, purchaseDate: e.target.value }))} />
                <input placeholder="Factura" value={purchaseForm.invoiceNumber} onChange={(e) => setPurchaseForm((s) => ({ ...s, invoiceNumber: e.target.value }))} />
              </div>

              <div className="tableWrap">
                <table style={{ minWidth: 920 }}>
                  <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th><th>Accion</th></tr></thead>
                  <tbody>
                    {purchaseForm.details.map((d, index) => (
                      <tr key={`purchase-${index}`}>
                        <td><select required value={d.productId} onChange={(e) => updatePurchaseDetail(index, "productId", e.target.value)}><option value="">Producto</option>{data.products.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></td>
                        <td><input type="number" min="0.001" step="0.001" required value={d.quantity} onChange={(e) => updatePurchaseDetail(index, "quantity", e.target.value)} /></td>
                        <td><input type="number" min="0" step="0.01" required value={d.unitPrice} onChange={(e) => updatePurchaseDetail(index, "unitPrice", e.target.value)} /></td>
                        <td>{money.format(Number(d.quantity || 0) * Number(d.unitPrice || 0))}</td>
                        <td><button type="button" className="secondary" onClick={() => removePurchaseDetail(index)}>Quitar</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="row">
                <button type="button" className="secondary" onClick={addPurchaseDetail}>Agregar producto</button>
                <div className="panel card"><div className="label">Total compra</div><div className="value">{money.format(purchaseTotal)}</div></div>
                <button type="submit">Guardar compra</button>
              </div>
            </form>
          </>
        ) : null}

        {!loading && tab === "sales-list" && canOperate ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h2>Listado de ventas</h2>
              <button type="button" style={{ marginBottom: 8 }} onClick={() => (showNewSaleForm ? setShowNewSaleForm(false) : openNewSaleForm())}>
                {showNewSaleForm ? "Cancelar" : "Nueva venta"}
              </button>
            </div>

            {showNewSaleForm ? (
              <form className="grid" onSubmit={handleSale} style={{ marginBottom: 14 }}>
                <div className="row">
                  <select required value={saleForm.clientId} onChange={(e) => setSaleForm((s) => ({ ...s, clientId: e.target.value }))}><option value="">Cliente</option>{data.clients.map((x) => <option key={x.id} value={x.id}>{x.fullName}</option>)}</select>
                  <input value={sessionUser.name} disabled />
                  <select required value={saleForm.warehouseId} onChange={(e) => setSaleForm((s) => ({ ...s, warehouseId: e.target.value }))}><option value="">Deposito</option>{data.warehouses.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
                  <select required value={saleForm.paymentMethodId} onChange={(e) => setSaleForm((s) => ({ ...s, paymentMethodId: e.target.value }))}><option value="">Metodo de pago</option>{data.paymentMethods.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
                  <input type="date" required value={saleForm.saleDate} onChange={(e) => setSaleForm((s) => ({ ...s, saleDate: e.target.value }))} />
                  <input placeholder="Factura" value={saleForm.invoiceNumber} onChange={(e) => setSaleForm((s) => ({ ...s, invoiceNumber: e.target.value }))} />
                </div>
                <div className="tableWrap">
                  <table style={{ minWidth: 920 }}>
                    <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th><th>Accion</th></tr></thead>
                    <tbody>
                      {saleForm.details.map((d, index) => (
                        <tr key={`sale-${index}`}>
                          <td><select required value={d.productId} onChange={(e) => updateSaleDetail(index, "productId", e.target.value)}><option value="">Producto</option>{data.products.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></td>
                          <td><input type="number" min="0.001" step="0.001" required value={d.quantity} onChange={(e) => updateSaleDetail(index, "quantity", e.target.value)} /></td>
                          <td><input type="number" min="0" step="0.01" value={d.unitPrice} readOnly /></td>
                          <td>{money.format(Number(d.quantity || 0) * Number(d.unitPrice || 0))}</td>
                          <td><button type="button" className="secondary" onClick={() => removeSaleDetail(index)}>Quitar</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="row">
                  <button type="button" className="secondary" onClick={addSaleDetail}>Agregar producto</button>
                  <div className="panel card"><div className="label">Total venta</div><div className="value">{money.format(saleTotal)}</div></div>
                  <button type="submit">Guardar venta</button>
                  <button type="button" className="secondary" onClick={() => setShowNewSaleForm(false)}>Cancelar</button>
                </div>
              </form>
            ) : null}

            <div className="tableWrap">
              <table>
                <thead><tr><th>Fecha</th><th>Comprobante</th><th>Cliente</th><th>Vendedor</th><th>Deposito</th><th>Pago</th><th>Total</th><th>Detalle</th></tr></thead>
                <tbody>
                  {salesListRows.map((sale) => (
                    <Fragment key={`sale-list-${sale.id}`}>
                      <tr>
                        <td>{sale.saleDate}</td>
                        <td>{sale.invoiceNumber}</td>
                        <td>{sale.clientName}</td>
                        <td>{sale.userName}</td>
                        <td>{sale.warehouseName}</td>
                        <td>{saleDetailById[sale.id]?.SalePayments?.[0]?.PaymentMethod?.name || "-"}</td>
                        <td>{money.format(sale.total)}</td>
                        <td>
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => handleToggleSaleDetail(sale.id)}
                          >
                            {expandedSaleId === sale.id ? "Ocultar detalle" : "Ver detalle"}
                          </button>
                        </td>
                      </tr>
                      {expandedSaleId === sale.id ? (
                        <tr>
                          <td colSpan={8}>
                            <div className="tableWrap">
                              <table style={{ minWidth: 500 }}>
                                <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr></thead>
                                <tbody>
                                  {(saleDetailById[sale.id]?.SaleDetails || []).map((d, i) => (
                                    <tr key={`sale-list-${sale.id}-${i}`}>
                                      <td>{d.Product?.name || `Producto ${d.productId}`}</td>
                                      <td>{qty.format(Number(d.quantity || 0))}</td>
                                      <td>{money.format(Number(d.unitPrice || 0))}</td>
                                      <td>{money.format(Number(d.quantity || 0) * Number(d.unitPrice || 0))}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}

        {!loading && tab === "purchases-list" && canOperate ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h2>Listado de compras</h2>
              <button type="button" style={{ marginBottom: 8 }} onClick={() => (showNewPurchaseForm ? setShowNewPurchaseForm(false) : openNewPurchaseForm())}>
                {showNewPurchaseForm ? "Cancelar" : "Nueva compra"}
              </button>
            </div>

            {showNewPurchaseForm ? (
              <form className="grid" onSubmit={handlePurchase} style={{ marginBottom: 14 }}>
                <div className="row">
                  <select required value={purchaseForm.supplierId} onChange={(e) => setPurchaseForm((s) => ({ ...s, supplierId: e.target.value }))}><option value="">Proveedor</option>{data.suppliers.map((x) => <option key={x.id} value={x.id}>{x.businessName}</option>)}</select>
                  <input value={sessionUser.name} disabled />
                  <select required value={purchaseForm.warehouseId} onChange={(e) => setPurchaseForm((s) => ({ ...s, warehouseId: e.target.value }))}><option value="">Deposito</option>{data.warehouses.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
                  <select required value={purchaseForm.paymentMethodId} onChange={(e) => setPurchaseForm((s) => ({ ...s, paymentMethodId: e.target.value }))}><option value="">Metodo de pago</option>{data.paymentMethods.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
                  <input type="date" required value={purchaseForm.purchaseDate} onChange={(e) => setPurchaseForm((s) => ({ ...s, purchaseDate: e.target.value }))} />
                  <input placeholder="Factura" value={purchaseForm.invoiceNumber} onChange={(e) => setPurchaseForm((s) => ({ ...s, invoiceNumber: e.target.value }))} />
                </div>
                <div className="tableWrap">
                  <table style={{ minWidth: 920 }}>
                    <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th><th>Accion</th></tr></thead>
                    <tbody>
                      {purchaseForm.details.map((d, index) => (
                        <tr key={`purchase-${index}`}>
                          <td><select required value={d.productId} onChange={(e) => updatePurchaseDetail(index, "productId", e.target.value)}><option value="">Producto</option>{data.products.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></td>
                          <td><input type="number" min="0.001" step="0.001" required value={d.quantity} onChange={(e) => updatePurchaseDetail(index, "quantity", e.target.value)} /></td>
                          <td><input type="number" min="0" step="0.01" required value={d.unitPrice} onChange={(e) => updatePurchaseDetail(index, "unitPrice", e.target.value)} /></td>
                          <td>{money.format(Number(d.quantity || 0) * Number(d.unitPrice || 0))}</td>
                          <td><button type="button" className="secondary" onClick={() => removePurchaseDetail(index)}>Quitar</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="row">
                  <button type="button" className="secondary" onClick={addPurchaseDetail}>Agregar producto</button>
                  <div className="panel card"><div className="label">Total compra</div><div className="value">{money.format(purchaseTotal)}</div></div>
                  <button type="submit">Guardar compra</button>
                  <button type="button" className="secondary" onClick={() => setShowNewPurchaseForm(false)}>Cancelar</button>
                </div>
              </form>
            ) : null}

            <div className="tableWrap">
              <table>
                <thead><tr><th>Fecha</th><th>Comprobante</th><th>Proveedor</th><th>Usuario</th><th>Deposito</th><th>Total</th><th>Detalle</th></tr></thead>
                <tbody>
                  {purchasesListRows.map((purchase) => (
                    <Fragment key={`purchase-list-${purchase.id}`}>
                      <tr>
                        <td>{purchase.purchaseDate}</td>
                        <td>{purchase.invoiceNumber}</td>
                        <td>{purchase.supplierName}</td>
                        <td>{purchase.userName}</td>
                        <td>{purchase.warehouseName}</td>
                        <td>{money.format(purchase.total)}</td>
                        <td><button type="button" className="secondary" onClick={() => handleTogglePurchaseDetail(purchase.id)}>{expandedPurchaseId === purchase.id ? "Ocultar detalle" : "Ver detalle"}</button></td>
                      </tr>
                      {expandedPurchaseId === purchase.id ? (
                        <tr>
                          <td colSpan={7}>
                            <div className="tableWrap">
                              <table style={{ minWidth: 500 }}>
                                <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr></thead>
                                <tbody>
                                  {(purchaseDetailById[purchase.id]?.PurchaseDetails || []).map((d, i) => (
                                    <tr key={`purchase-list-${purchase.id}-${i}`}>
                                      <td>{d.Product?.name || `Producto ${d.productId}`}</td><td>{qty.format(Number(d.quantity || 0))}</td><td>{money.format(Number(d.unitPrice || 0))}</td><td>{money.format(Number(d.quantity || 0) * Number(d.unitPrice || 0))}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}

        {!loading && tab === "products" && canOperate ? (
          <>
            {isAdmin ? (
              <>
                <h2>Alta rapida de producto</h2>
                <form className="row" onSubmit={handleProduct}>
                  <input required placeholder="SKU" value={productForm.sku} onChange={(e) => setProductForm((s) => ({ ...s, sku: e.target.value }))} />
                  <input required placeholder="Nombre" value={productForm.name} onChange={(e) => setProductForm((s) => ({ ...s, name: e.target.value }))} />
                  <select required value={productForm.brandId} onChange={(e) => setProductForm((s) => ({ ...s, brandId: e.target.value }))}>
                    <option value="">Marca</option>
                    {data.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  <input type="number" min="0" step="0.01" placeholder="Costo" value={productForm.costPrice} onChange={(e) => setProductForm((s) => ({ ...s, costPrice: e.target.value }))} />
                  <input type="number" min="0" step="0.01" placeholder="Precio venta" value={productForm.salePrice} onChange={(e) => setProductForm((s) => ({ ...s, salePrice: e.target.value }))} />
                  <button type="submit">Crear</button>
                </form>
              </>
            ) : null}

            <h2 style={{ marginTop: 18 }}>Catalogo</h2>
            <div className="row" style={{ marginBottom: 10 }}>
              <input
                placeholder="Buscar por nombre o SKU"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
              />
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={productOnlyStock}
                  onChange={(e) => setProductOnlyStock(e.target.checked)}
                />
                Solo con stock
              </label>
              <select value={productStockOrder} onChange={(e) => setProductStockOrder(e.target.value)}>
                <option value="none">Ordenar por stock</option>
                <option value="asc">Stock ascendente</option>
                <option value="desc">Stock descendente</option>
              </select>
              <button type="button" className="secondary" onClick={() => { setProductQuery(""); setProductOnlyStock(false); }}>
                Limpiar filtros
              </button>
            </div>
            <div className="tableWrap">
              <table>
                <thead><tr><th>ID</th><th>SKU</th><th>Nombre</th><th>Marca</th><th>Costo</th><th>Venta</th><th>Stock disponible</th><th>Activo</th><th>Accion</th></tr></thead>
                <tbody>
                  {filteredProducts.map((p) => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>{p.sku}</td>
                      <td>{p.name}</td>
                      <td>{data.brands.find((b) => b.id === p.brandId)?.name || "-"}</td>
                      <td>{money.format(Number(p.costPrice || 0))}</td>
                      <td>{money.format(Number(p.salePrice || 0))}</td>
                      <td>{qty.format(stockByProduct.get(p.id) || 0)}</td>
                      <td>{p.active ? "Si" : "No"}</td>
                      <td>
                        <button type="button" className="secondary" onClick={() => addProductToSaleCart(p)}>
                          Agregar al carrito
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}

        {!loading && tab === "operations" ? (
          <>
            <h2>Inventario actual</h2>
            <div className="tableWrap">
              <table>
                <thead><tr><th>Producto</th><th>Deposito</th><th>Stock</th></tr></thead>
                <tbody>
                  {data.inventories.map((inv) => {
                    const product = data.products.find((p) => p.id === inv.productId);
                    const warehouse = data.warehouses.find((w) => w.id === inv.warehouseId);
                    return (
                      <tr key={inv.id}>
                        <td>{product?.name || `Producto ${inv.productId}`}</td>
                        <td>{warehouse?.name || `Deposito ${inv.warehouseId}`}</td>
                        <td>{qty.format(Number(inv.stock || 0))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <h2 style={{ marginTop: 18 }}>Movimientos comerciales</h2>
            <div className="tableWrap">
              <table>
                <thead><tr><th>Fecha</th><th>Tipo</th><th>Comprobante</th><th>Cliente/Proveedor</th><th>Realizado por</th><th>Origen</th><th>Destino</th><th>Total</th><th>Detalle</th></tr></thead>
                <tbody>
                  {movementSummaryRows.map((m) => (
                    <Fragment key={m.id}>
                      <tr>
                        <td>{m.movementDate}</td>
                        <td>{m.typeName}</td>
                        <td>{m.document}</td>
                        <td>{m.counterparty}</td>
                        <td>{m.userName}</td>
                        <td>{m.fromName}</td>
                        <td>{m.toName}</td>
                        <td>{money.format(m.total)}</td>
                        <td>
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => setExpandedMovementId((prev) => (prev === m.id ? null : m.id))}
                          >
                            {expandedMovementId === m.id ? "Ocultar detalle" : "Ver detalle"}
                          </button>
                        </td>
                      </tr>
                      {expandedMovementId === m.id ? (
                        <tr key={`${m.id}-detail`}>
                          <td colSpan={9}>
                            <div className="tableWrap">
                              <table style={{ minWidth: 500 }}>
                                <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr></thead>
                                <tbody>
                                  {m.detailRows.map((d, i) => (
                                    <tr key={`${m.id}-item-${i}`}>
                                      <td>{d.productName}</td>
                                      <td>{qty.format(d.quantity)}</td>
                                      <td>{money.format(d.unitPrice)}</td>
                                      <td>{money.format(d.quantity * d.unitPrice)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
