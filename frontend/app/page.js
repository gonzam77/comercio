"use client";

import { useState } from "react";
import { getInitialData } from "../lib/api";
import LoginScreen from "./components/layout/LoginScreen";
import HeaderAndTabs from "./components/layout/HeaderAndTabs";
import PosSelector from "./components/layout/PosSelector";
import CashModals from "./components/layout/CashModals";
import CartModal from "./components/layout/CartModal";
import DashboardMetrics from "./components/layout/DashboardMetrics";
import MainContent from "./components/layout/MainContent";
import useDashboardDerived from "./hooks/useDashboardDerived";
import useAuthSession from "./hooks/useAuthSession";
import useCashFlow from "./hooks/useCashFlow";
import useCommerceActions from "./hooks/useCommerceActions";

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 });
const qty = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 3 });

function emptyData() {
  return {
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
  };
}

export default function DashboardPage() {
  const [tab, setTab] = useState("dashboard");
  const [configTab, setConfigTab] = useState("contacts");
  const [selectedPosWarehouseId, setSelectedPosWarehouseId] = useState("");
  const [showPosSelectionModal, setShowPosSelectionModal] = useState(false);
  const [data, setData] = useState(emptyData());
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [dashboardRange, setDashboardRange] = useState("all");

  async function load(authToken, handleLogout) {
    if (!authToken) return null;
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

  function resolveAndSetOperatorPos(user, warehouses) {
    const userRoles = user?.roles || [];
    const isOperatorUser = userRoles.includes("ADMIN") || userRoles.includes("VENDEDOR");
    if (!isOperatorUser) {
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

  const {
    token,
    sessionUser,
    loginForm,
    setLoginForm,
    handleLogin,
    handleLogout,
  } = useAuthSession({
    onAuthBootstrap: async ({ user, token: authToken }) => {
      const loaded = await load(authToken, handleLogout);
      const warehouses = loaded?.warehouses || [];
      const selected = resolveAndSetOperatorPos(user, warehouses);
      const userRoles = user?.roles || [];
      const isOperatorUser = userRoles.includes("ADMIN") || userRoles.includes("VENDEDOR");
      const shouldLoadCash = !isOperatorUser || Boolean(selected);
      if (shouldLoadCash) {
        const info = await refreshCashSession(authToken);
        setShowCashPrompt(Boolean(info && !info.hasOpenSession));
      } else {
        setShowCashPrompt(false);
      }
    },
    onLogoutReset: () => {
      setSelectedPosWarehouseId("");
      setShowPosSelectionModal(false);
      resetCashState();
      resetCommerceState();
      setData(emptyData());
    },
    setStatus,
  });

  const {
    cashSessionInfo,
    showCashPrompt,
    setShowCashPrompt,
    openAmountInput,
    setOpenAmountInput,
    showOpenCashModal,
    closeAmountInput,
    setCloseAmountInput,
    showCloseCashModal,
    showWithdrawCashModal,
    withdrawAmountInput,
    setWithdrawAmountInput,
    withdrawAdminPassword,
    setWithdrawAdminPassword,
    refreshCashSession,
    handleOpenCashSession,
    openOpenCashModal,
    closeOpenCashModal,
    openCloseCashModal,
    closeCloseCashModal,
    openWithdrawCashModal,
    closeWithdrawCashModal,
    confirmCloseCashSession,
    confirmOpenCashSession,
    confirmWithdrawCashSession,
    resetCashState,
  } = useCashFlow({ token, setStatus });

  const roles = sessionUser?.roles || [];
  const isAdmin = roles.includes("ADMIN");
  const isSeller = roles.includes("VENDEDOR");
  const canOperate = isAdmin || isSeller;
  const usesPosSelection = canOperate;

  const {
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
    resetAfterLogout: resetCommerceState,
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
  } = useCommerceActions({
    token,
    data,
    load: (authToken) => load(authToken, handleLogout),
    setStatus,
    usesPosSelection,
    selectedPosWarehouseId,
    defaultConsumerClientId: "",
  });

  const derived = useDashboardDerived({
    data,
    dashboardRange,
    cashSessionInfo,
    productQuery,
    productOnlyStock,
    productStockOrder,
    saleForm,
    purchaseForm,
  });

  const {
    metrics,
    topProducts,
    stockByProduct,
    movementSummaryRows,
    salesListRows,
    purchasesListRows,
    lowStockProducts,
    filteredProducts,
    saleTotal,
    purchaseTotal,
    defaultConsumerClientId,
  } = derived;

  async function confirmPosSelection() {
    if (!selectedPosWarehouseId) {
      setStatus({ type: "error", text: "Debes seleccionar un punto de venta" });
      return;
    }
    persistSelectedPosWarehouse(selectedPosWarehouseId);
    setSaleForm((s) => ({ ...s, warehouseId: String(selectedPosWarehouseId) }));
    setPurchaseForm((s) => ({ ...s, warehouseId: String(selectedPosWarehouseId) }));
    setShowPosSelectionModal(false);
    const info = await refreshCashSession(token);
    setShowCashPrompt(Boolean(info && !info.hasOpenSession));
    setStatus({ type: "ok", text: "Punto de venta seleccionado correctamente" });
  }

  if (!token || !sessionUser) {
    return <LoginScreen loginForm={loginForm} setLoginForm={setLoginForm} handleLogin={handleLogin} status={status} />;
  }

  const tabList = [["dashboard", "Dashboard"], ["cash", "Caja"], ["sales-list", "Ventas"], ["purchases-list", "Compras"], ["operations", "Inventario y movimientos"]];
  if (canOperate || isAdmin) tabList.push(["config", "Configuracion"]);

  return (
    <main>
      <HeaderAndTabs sessionUser={sessionUser} roles={roles} tab={tab} tabList={tabList} canOperate={canOperate} isAdmin={isAdmin} setTab={setTab} setConfigTab={setConfigTab} handleLogout={handleLogout} />
      <PosSelector usesPosSelection={usesPosSelection} data={data} selectedPosWarehouseId={selectedPosWarehouseId} showPosSelectionModal={showPosSelectionModal} setSelectedPosWarehouseId={setSelectedPosWarehouseId} setShowPosSelectionModal={setShowPosSelectionModal} confirmPosSelection={confirmPosSelection} />
      <CashModals showCashPrompt={showCashPrompt} isAdmin={isAdmin} openAmountInput={openAmountInput} setOpenAmountInput={setOpenAmountInput} handleOpenCashSession={handleOpenCashSession} setShowCashPrompt={setShowCashPrompt} showCloseCashModal={showCloseCashModal} closeAmountInput={closeAmountInput} setCloseAmountInput={setCloseAmountInput} closeCloseCashModal={closeCloseCashModal} confirmCloseCashSession={confirmCloseCashSession} cashSessionInfo={cashSessionInfo} money={money} showOpenCashModal={showOpenCashModal} closeOpenCashModal={closeOpenCashModal} confirmOpenCashSession={confirmOpenCashSession} showWithdrawCashModal={showWithdrawCashModal} withdrawAmountInput={withdrawAmountInput} setWithdrawAmountInput={setWithdrawAmountInput} withdrawAdminPassword={withdrawAdminPassword} setWithdrawAdminPassword={setWithdrawAdminPassword} closeWithdrawCashModal={closeWithdrawCashModal} confirmWithdrawCashSession={confirmWithdrawCashSession} />
      <CartModal cartProductModal={cartProductModal} setCartProductModal={setCartProductModal} closeAddToCartModal={closeAddToCartModal} confirmAddProductToSaleCart={confirmAddProductToSaleCart} />
      <DashboardMetrics money={money} qty={qty} metrics={metrics} dashboardRange={dashboardRange} setDashboardRange={setDashboardRange} />
      {status.text ? <div className={`alert ${status.type}`}>{status.text}</div> : null}

      <MainContent
        loading={loading}
        tab={tab}
        canOperate={canOperate}
        data={data}
        topProducts={topProducts}
        lowStockProducts={lowStockProducts}
        qty={qty}
        cashSessionInfo={cashSessionInfo}
        openOpenCashModal={openOpenCashModal}
        openCloseCashModal={openCloseCashModal}
        openWithdrawCashModal={openWithdrawCashModal}
        cashSessionMovements={cashSessionInfo.movements || []}
        money={money}
        showNewSaleForm={showNewSaleForm}
        setShowNewSaleForm={setShowNewSaleForm}
        openNewSaleForm={() => openNewSaleForm(setTab)}
        handleSale={handleSale}
        saleForm={saleForm}
        setSaleForm={setSaleForm}
        sessionUser={sessionUser}
        updateSaleDetail={updateSaleDetail}
        removeSaleDetail={removeSaleDetail}
        addSaleDetail={addSaleDetail}
        saleTotal={saleTotal}
        salesListRows={salesListRows}
        expandedSaleId={expandedSaleId}
        handleToggleSaleDetail={handleToggleSaleDetail}
        saleDetailById={saleDetailById}
        usesPosSelection={usesPosSelection}
        selectedPosWarehouseId={selectedPosWarehouseId}
        showNewPurchaseForm={showNewPurchaseForm}
        setShowNewPurchaseForm={setShowNewPurchaseForm}
        openNewPurchaseForm={() => openNewPurchaseForm(setTab)}
        handlePurchase={handlePurchase}
        purchaseForm={purchaseForm}
        setPurchaseForm={setPurchaseForm}
        updatePurchaseDetail={updatePurchaseDetail}
        removePurchaseDetail={removePurchaseDetail}
        addPurchaseDetail={addPurchaseDetail}
        purchaseTotal={purchaseTotal}
        purchasesListRows={purchasesListRows}
        expandedPurchaseId={expandedPurchaseId}
        handleTogglePurchaseDetail={handleTogglePurchaseDetail}
        purchaseDetailById={purchaseDetailById}
        movementSummaryRows={movementSummaryRows}
        expandedMovementId={expandedMovementId}
        setExpandedMovementId={setExpandedMovementId}
        configTab={configTab}
        setConfigTab={setConfigTab}
        isAdmin={isAdmin}
        handleCreateClient={handleCreateClient}
        handleUpdateClient={handleUpdateClient}
        handleCreateSupplier={handleCreateSupplier}
        handleUpdateSupplier={handleUpdateSupplier}
        handleCreateProduct={handleCreateProduct}
        handleUpdateProduct={handleUpdateProduct}
        handleCreateInventoryAdjustment={handleCreateInventoryAdjustment}
        productQuery={productQuery}
        setProductQuery={setProductQuery}
        productOnlyStock={productOnlyStock}
        setProductOnlyStock={setProductOnlyStock}
        productStockOrder={productStockOrder}
        setProductStockOrder={setProductStockOrder}
        filteredProducts={filteredProducts}
        stockByProduct={stockByProduct}
        addProductToSaleCart={addProductToSaleCart}
        setProductOnlyStockAndQuery={() => { setProductQuery(""); setProductOnlyStock(false); }}
        handleCreateWarehouse={handleCreateWarehouse}
        handleUpdateWarehouse={handleUpdateWarehouse}
        handleCreateUser={handleCreateUser}
        handleUpdateUser={handleUpdateUser}
      />

      {canOperate ? <button type="button" className="floatingSaleButton" onClick={() => openNewSaleForm(setTab)}>Nueva venta</button> : null}
    </main>
  );
}
