import { useState } from "react";
import {
  createClient,
  createInventoryAdjustment,
  createProduct,
  createPurchase,
  createSale,
  createSupplier,
  createUser,
  createWarehouse,
  getPurchaseById,
  getSaleById,
  updateClient,
  updateProduct,
  updateSupplier,
  updateUser,
  updateWarehouse,
} from "../../lib/api";

function emptyDetail() {
  return { productId: "", quantity: "1", unitPrice: "" };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function useCommerceActions({
  token,
  data,
  load,
  setStatus,
  usesPosSelection,
  selectedPosWarehouseId,
  defaultConsumerClientId,
}) {
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
  const [cartProductModal, setCartProductModal] = useState({ open: false, product: null, quantity: "1" });

  function resetAfterLogout() {
    setSaleDetailById({});
    setPurchaseDetailById({});
    setShowNewSaleForm(false);
    setShowNewPurchaseForm(false);
    setProductQuery("");
    setProductOnlyStock(false);
    setProductStockOrder("none");
    setCartProductModal({ open: false, product: null, quantity: "1" });
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
    } catch (e) {
      setStatus({ type: "error", text: e.message });
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
    } catch (e) {
      setStatus({ type: "error", text: e.message });
    }
  }

  function updateSaleDetail(index, key, value) {
    setSaleForm((s) => {
      const details = [...s.details];
      details[index] = { ...details[index], [key]: value };
      if (key === "productId") {
        const product = data.products.find((p) => String(p.id) === String(value));
        if (product) details[index].unitPrice = String(product.salePrice || 0);
      }
      return { ...s, details };
    });
  }

  function updatePurchaseDetail(index, key, value) {
    setPurchaseForm((s) => {
      const details = [...s.details];
      details[index] = { ...details[index], [key]: value };
      return { ...s, details };
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
        ? s.details.map((d) => (String(d.productId) === String(product.id) ? { ...d, quantity: String(Number(d.quantity || 0) + quantityToAdd) } : d))
        : [...s.details, { productId: String(product.id), quantity: String(quantityToAdd), unitPrice: String(product.salePrice ?? 0) }],
    }));
    setStatus({ type: "ok", text: `${product.name}: se agregaron ${quantityToAdd} unidad(es) al carrito` });
    closeAddToCartModal();
  }

  function openNewSaleForm(setTab) {
    if (showNewSaleForm) {
      setTab("sales-list");
      return;
    }
    const defaultPaymentMethod = data.paymentMethods.find((p) => String(p.name || "").toUpperCase() === "EFECTIVO");
    const firstClient = data.clients[0];
    const defaultConsumer = defaultConsumerClientId || (() => {
      const match = data.clients.find((c) => String(c.fullName || "").toLowerCase().includes("consumidor final"));
      return match ? String(match.id) : "";
    })();
    const firstWarehouse = data.warehouses[0];
    const firstPaymentMethod = data.paymentMethods[0];
    setShowNewSaleForm(true);
    setTab("sales-list");
    setSaleForm((s) => ({
      ...s,
      clientId: defaultConsumer || s.clientId || (firstClient ? String(firstClient.id) : ""),
      warehouseId: usesPosSelection ? (selectedPosWarehouseId || (firstWarehouse ? String(firstWarehouse.id) : "")) : (s.warehouseId || (firstWarehouse ? String(firstWarehouse.id) : "")),
      saleDate: today(),
      invoiceNumber: "",
      paymentMethodId: defaultPaymentMethod ? String(defaultPaymentMethod.id) : (s.paymentMethodId || (firstPaymentMethod ? String(firstPaymentMethod.id) : "")),
      details: [emptyDetail()],
    }));
  }

  function openNewPurchaseForm(setTab) {
    const defaultPaymentMethod = data.paymentMethods.find((p) => String(p.name || "").toUpperCase() === "EFECTIVO");
    const firstSupplier = data.suppliers[0];
    const firstWarehouse = data.warehouses[0];
    const firstPaymentMethod = data.paymentMethods[0];
    setShowNewPurchaseForm(true);
    setTab("purchases-list");
    setPurchaseForm((s) => ({
      ...s,
      supplierId: s.supplierId || (firstSupplier ? String(firstSupplier.id) : ""),
      warehouseId: usesPosSelection ? (selectedPosWarehouseId || (firstWarehouse ? String(firstWarehouse.id) : "")) : (s.warehouseId || (firstWarehouse ? String(firstWarehouse.id) : "")),
      purchaseDate: today(),
      invoiceNumber: "",
      paymentMethodId: defaultPaymentMethod ? String(defaultPaymentMethod.id) : (s.paymentMethodId || (firstPaymentMethod ? String(firstPaymentMethod.id) : "")),
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
    return details.map((d) => ({ productId: Number(d.productId), quantity: Number(d.quantity), unitPrice: Number(d.unitPrice) }))
      .filter((d) => d.productId && Number.isFinite(d.quantity) && d.quantity > 0 && Number.isFinite(d.unitPrice) && d.unitPrice >= 0);
  }

  function sanitizePurchaseDetails(details) {
    return details.map((d) => ({ productId: Number(d.productId), quantity: Number(d.quantity), unitPrice: Number(d.unitPrice) }))
      .filter((d) => d.productId && Number.isFinite(d.quantity) && d.quantity > 0 && Number.isFinite(d.unitPrice) && d.unitPrice >= 0);
  }

  async function handleSale(e) {
    e.preventDefault();
    const details = sanitizeSaleDetails(saleForm.details);
    if (details.length === 0) {
      setStatus({ type: "error", text: "Debes agregar al menos un producto valido en el detalle." });
      return;
    }
    try {
      await createSale({ clientId: Number(saleForm.clientId), warehouseId: Number(saleForm.warehouseId), saleDate: saleForm.saleDate, invoiceNumber: saleForm.invoiceNumber, paymentMethodId: Number(saleForm.paymentMethodId), details }, token);
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
      await createPurchase({ supplierId: Number(purchaseForm.supplierId), warehouseId: Number(purchaseForm.warehouseId), purchaseDate: purchaseForm.purchaseDate, invoiceNumber: purchaseForm.invoiceNumber, paymentMethodId: Number(purchaseForm.paymentMethodId), details }, token);
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
      await createProduct({ sku: payload.sku, name: payload.name, brandId: Number(payload.brandId) || null, costPrice: Number(payload.costPrice || 0), salePrice: Number(payload.salePrice || 0) }, token);
      setStatus({ type: "ok", text: "Producto creado" });
      await load(token);
    } catch (e2) {
      setStatus({ type: "error", text: e2.message });
      throw e2;
    }
  }

  async function handleUpdateProduct(productId, payload) {
    try {
      await updateProduct(productId, { sku: payload.sku, name: payload.name, brandId: Number(payload.brandId) || null, costPrice: Number(payload.costPrice || 0), salePrice: Number(payload.salePrice || 0), active: payload.active }, token);
      setStatus({ type: "ok", text: "Producto actualizado" });
      await load(token);
    } catch (e2) {
      setStatus({ type: "error", text: e2.message });
      throw e2;
    }
  }

  async function handleCreateClient(payload) {
    try {
      await createClient({ fullName: payload.fullName, taxId: payload.taxId || null, phone: payload.phone || null, address: payload.address || null }, token);
      setStatus({ type: "ok", text: "Cliente creado correctamente" });
      await load(token);
    } catch (e2) {
      setStatus({ type: "error", text: e2.message });
      throw e2;
    }
  }

  async function handleUpdateClient(clientId, payload) {
    try {
      await updateClient(clientId, { fullName: payload.fullName, taxId: payload.taxId || null, phone: payload.phone || null, address: payload.address || null }, token);
      setStatus({ type: "ok", text: "Cliente actualizado correctamente" });
      await load(token);
    } catch (e2) {
      setStatus({ type: "error", text: e2.message });
      throw e2;
    }
  }

  async function handleCreateSupplier(payload) {
    try {
      await createSupplier({ businessName: payload.businessName, taxId: payload.taxId || null, phone: payload.phone || null, address: payload.address || null }, token);
      setStatus({ type: "ok", text: "Proveedor creado correctamente" });
      await load(token);
    } catch (e2) {
      setStatus({ type: "error", text: e2.message });
      throw e2;
    }
  }

  async function handleUpdateSupplier(supplierId, payload) {
    try {
      await updateSupplier(supplierId, { businessName: payload.businessName, taxId: payload.taxId || null, phone: payload.phone || null, address: payload.address || null }, token);
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

  async function handleCreateWarehouse(payload) {
    try {
      await createWarehouse(payload, token);
      setStatus({ type: "ok", text: "Punto de venta creado correctamente" });
      await load(token);
    } catch (e2) {
      setStatus({ type: "error", text: e2.message });
      throw e2;
    }
  }

  async function handleUpdateWarehouse(warehouseId, payload) {
    try {
      await updateWarehouse(warehouseId, payload, token);
      setStatus({ type: "ok", text: "Punto de venta actualizado correctamente" });
      await load(token);
    } catch (e2) {
      setStatus({ type: "error", text: e2.message });
      throw e2;
    }
  }

  return {
    saleForm,
    setSaleForm,
    purchaseForm,
    setPurchaseForm,
    expandedMovementId,
    setExpandedMovementId,
    expandedSaleId,
    expandedPurchaseId,
    saleDetailById,
    purchaseDetailById,
    showNewSaleForm,
    setShowNewSaleForm,
    showNewPurchaseForm,
    setShowNewPurchaseForm,
    productQuery,
    setProductQuery,
    productOnlyStock,
    setProductOnlyStock,
    productStockOrder,
    setProductStockOrder,
    cartProductModal,
    setCartProductModal,
    resetAfterLogout,
    handleToggleSaleDetail,
    handleTogglePurchaseDetail,
    updateSaleDetail,
    updatePurchaseDetail,
    addSaleDetail,
    addProductToSaleCart,
    closeAddToCartModal,
    confirmAddProductToSaleCart,
    openNewSaleForm,
    openNewPurchaseForm,
    addPurchaseDetail,
    removeSaleDetail,
    removePurchaseDetail,
    handleSale,
    handlePurchase,
    handleCreateProduct,
    handleUpdateProduct,
    handleCreateClient,
    handleUpdateClient,
    handleCreateSupplier,
    handleUpdateSupplier,
    handleCreateInventoryAdjustment,
    handleCreateUser,
    handleUpdateUser,
    handleCreateWarehouse,
    handleUpdateWarehouse,
  };
}
