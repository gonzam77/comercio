import DashboardTab from "../tabs/DashboardTab";
import CashTab from "../tabs/CashTab";
import SalesListTab from "../tabs/SalesListTab";
import PurchasesListTab from "../tabs/PurchasesListTab";
import OperationsTab from "../tabs/OperationsTab";
import ConfigPanel from "./ConfigPanel";

export default function MainContent(props) {
  const {
    loading,
    tab,
    canOperate,
    data,
    topProducts,
    lowStockProducts,
    qty,
    cashSessionInfo,
    openOpenCashModal,
    openCloseCashModal,
    openWithdrawCashModal,
    cashSessionMovements,
    money,
    showNewSaleForm,
    setShowNewSaleForm,
    openNewSaleForm,
    handleSale,
    saleForm,
    setSaleForm,
    sessionUser,
    updateSaleDetail,
    removeSaleDetail,
    addSaleDetail,
    saleTotal,
    salesListRows,
    expandedSaleId,
    handleToggleSaleDetail,
    saleDetailById,
    usesPosSelection,
    selectedPosWarehouseId,
    showNewPurchaseForm,
    setShowNewPurchaseForm,
    openNewPurchaseForm,
    handlePurchase,
    purchaseForm,
    setPurchaseForm,
    updatePurchaseDetail,
    removePurchaseDetail,
    addPurchaseDetail,
    purchaseTotal,
    purchasesListRows,
    expandedPurchaseId,
    handleTogglePurchaseDetail,
    purchaseDetailById,
    movementSummaryRows,
    expandedMovementId,
    setExpandedMovementId,
    configTab,
    setConfigTab,
    isAdmin,
    handleCreateClient,
    handleUpdateClient,
    handleCreateSupplier,
    handleUpdateSupplier,
    handleCreateProduct,
    handleUpdateProduct,
    handleCreateInventoryAdjustment,
    productQuery,
    setProductQuery,
    productOnlyStock,
    setProductOnlyStock,
    productStockOrder,
    setProductStockOrder,
    filteredProducts,
    stockByProduct,
    addProductToSaleCart,
    setProductOnlyStockAndQuery,
    handleCreateWarehouse,
    handleUpdateWarehouse,
    handleCreateUser,
    handleUpdateUser,
  } = props;

  return (
    <div className="panel section">
      {loading ? <p>Cargando datos...</p> : null}

      {!loading && tab === "dashboard" ? (<DashboardTab data={data} topProducts={topProducts} lowStockProducts={lowStockProducts} qty={qty} />) : null}
      {!loading && tab === "cash" ? (<CashTab cashSessionInfo={cashSessionInfo} openOpenCashModal={openOpenCashModal} openCloseCashModal={openCloseCashModal} openWithdrawCashModal={openWithdrawCashModal} cashSessionMovements={cashSessionMovements} money={money} />) : null}
      {!loading && tab === "sales-list" && canOperate ? (<SalesListTab showNewSaleForm={showNewSaleForm} setShowNewSaleForm={setShowNewSaleForm} openNewSaleForm={openNewSaleForm} handleSale={handleSale} saleForm={saleForm} setSaleForm={setSaleForm} sessionUser={sessionUser} data={data} updateSaleDetail={updateSaleDetail} removeSaleDetail={removeSaleDetail} addSaleDetail={addSaleDetail} saleTotal={saleTotal} money={money} salesListRows={salesListRows} expandedSaleId={expandedSaleId} handleToggleSaleDetail={handleToggleSaleDetail} saleDetailById={saleDetailById} qty={qty} isSeller={usesPosSelection} selectedPosWarehouseId={selectedPosWarehouseId} />) : null}
      {!loading && tab === "purchases-list" && canOperate ? (<PurchasesListTab showNewPurchaseForm={showNewPurchaseForm} setShowNewPurchaseForm={setShowNewPurchaseForm} openNewPurchaseForm={openNewPurchaseForm} handlePurchase={handlePurchase} purchaseForm={purchaseForm} setPurchaseForm={setPurchaseForm} sessionUser={sessionUser} data={data} updatePurchaseDetail={updatePurchaseDetail} removePurchaseDetail={removePurchaseDetail} addPurchaseDetail={addPurchaseDetail} purchaseTotal={purchaseTotal} money={money} purchasesListRows={purchasesListRows} expandedPurchaseId={expandedPurchaseId} handleTogglePurchaseDetail={handleTogglePurchaseDetail} purchaseDetailById={purchaseDetailById} qty={qty} isSeller={usesPosSelection} selectedPosWarehouseId={selectedPosWarehouseId} />) : null}
      {!loading && tab === "operations" ? (<OperationsTab data={data} movementSummaryRows={movementSummaryRows} expandedMovementId={expandedMovementId} setExpandedMovementId={setExpandedMovementId} qty={qty} money={money} />) : null}
      {!loading && tab === "config" ? (
        <ConfigPanel
          canOperate={canOperate}
          isAdmin={isAdmin}
          configTab={configTab}
          setConfigTab={setConfigTab}
          data={data}
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
          money={money}
          qty={qty}
          setProductOnlyStockAndQuery={setProductOnlyStockAndQuery}
          handleCreateWarehouse={handleCreateWarehouse}
          handleUpdateWarehouse={handleUpdateWarehouse}
          handleCreateUser={handleCreateUser}
          handleUpdateUser={handleUpdateUser}
        />
      ) : null}
    </div>
  );
}
