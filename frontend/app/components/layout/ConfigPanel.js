import ContactsTab from "../tabs/ContactsTab";
import ProductsTab from "../tabs/ProductsTab";
import SalesPointsTab from "../tabs/SalesPointsTab";
import UsersTab from "../tabs/UsersTab";

export default function ConfigPanel(props) {
  const {
    canOperate,
    isAdmin,
    configTab,
    setConfigTab,
    data,
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
    money,
    qty,
    setProductOnlyStockAndQuery,
    handleCreateWarehouse,
    handleUpdateWarehouse,
    handleCreateUser,
    handleUpdateUser,
  } = props;

  return (
    <div className="configLayout">
      <aside className="configMenu">
        {canOperate ? (
          <button className={`configMenuButton ${configTab === "contacts" ? "active" : ""}`} onClick={() => setConfigTab("contacts")}>
            Clientes y proveedores
          </button>
        ) : null}
        {canOperate ? (
          <button className={`configMenuButton ${configTab === "products" ? "active" : ""}`} onClick={() => setConfigTab("products")}>
            Productos
          </button>
        ) : null}
        {isAdmin ? (
          <button className={`configMenuButton ${configTab === "sales-points" ? "active" : ""}`} onClick={() => setConfigTab("sales-points")}>
            Puntos de venta
          </button>
        ) : null}
        {isAdmin ? (
          <button className={`configMenuButton ${configTab === "users" ? "active" : ""}`} onClick={() => setConfigTab("users")}>
            Usuarios
          </button>
        ) : null}
      </aside>

      <div className="configContent">
        {configTab === "contacts" && canOperate ? (
          <ContactsTab data={data} onCreateClient={handleCreateClient} onUpdateClient={handleUpdateClient} onCreateSupplier={handleCreateSupplier} onUpdateSupplier={handleUpdateSupplier} />
        ) : null}
        {configTab === "products" && canOperate ? (
          <ProductsTab
            isAdmin={isAdmin}
            onCreateProduct={handleCreateProduct}
            onUpdateProduct={handleUpdateProduct}
            onCreateInventoryAdjustment={handleCreateInventoryAdjustment}
            data={data}
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
          />
        ) : null}
        {configTab === "sales-points" && isAdmin ? (
          <SalesPointsTab warehouses={data.warehouses} onCreateWarehouse={handleCreateWarehouse} onUpdateWarehouse={handleUpdateWarehouse} />
        ) : null}
        {configTab === "users" && isAdmin ? (
          <UsersTab users={data.users} roles={data.roles} onCreateUser={handleCreateUser} onUpdateUser={handleUpdateUser} />
        ) : null}
      </div>
    </div>
  );
}
