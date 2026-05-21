import { useState } from "react";

function emptyProductForm() {
  return { sku: "", name: "", brandId: "", costPrice: "", salePrice: "", active: true };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function emptyAdjustmentRow() {
  return { productId: "", countedStock: "" };
}

export default function ProductsTab({ isAdmin, onCreateProduct, onUpdateProduct, onCreateInventoryAdjustment, data, productQuery, setProductQuery, productOnlyStock, setProductOnlyStock, productStockOrder, setProductStockOrder, filteredProducts, stockByProduct, addProductToSaleCart, money, qty, setProductOnlyStockAndQuery }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [createForm, setCreateForm] = useState(emptyProductForm());
  const [editForm, setEditForm] = useState(emptyProductForm());
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState({
    warehouseId: data.warehouses?.[0] ? String(data.warehouses[0].id) : "",
    movementDate: today(),
    notes: "",
    details: [emptyAdjustmentRow()],
  });

  async function submitCreate(e) {
    e.preventDefault();
    await onCreateProduct(createForm);
    setShowCreateModal(false);
    setCreateForm(emptyProductForm());
  }

  function openEditModal(product) {
    setEditingProduct(product);
    setEditForm({
      sku: product.sku || "",
      name: product.name || "",
      brandId: product.brandId ? String(product.brandId) : "",
      costPrice: String(product.costPrice ?? ""),
      salePrice: String(product.salePrice ?? ""),
      active: Boolean(product.active),
    });
  }

  async function submitEdit(e) {
    e.preventDefault();
    if (!editingProduct) return;
    await onUpdateProduct(editingProduct.id, editForm);
    setEditingProduct(null);
    setEditForm(emptyProductForm());
  }

  function openAdjustmentModal() {
    setAdjustmentForm({
      warehouseId: data.warehouses?.[0] ? String(data.warehouses[0].id) : "",
      movementDate: today(),
      notes: "",
      details: [emptyAdjustmentRow()],
    });
    setShowAdjustmentModal(true);
  }

  function updateAdjustmentDetail(index, key, value) {
    setAdjustmentForm((s) => {
      const next = [...s.details];
      next[index] = { ...next[index], [key]: value };
      return { ...s, details: next };
    });
  }

  function addAdjustmentDetail() {
    setAdjustmentForm((s) => ({ ...s, details: [...s.details, emptyAdjustmentRow()] }));
  }

  function removeAdjustmentDetail(index) {
    setAdjustmentForm((s) => ({ ...s, details: s.details.length > 1 ? s.details.filter((_, i) => i !== index) : s.details }));
  }

  function currentStockForWarehouse(productId, warehouseId) {
    const inv = data.inventories.find((i) => Number(i.productId) === Number(productId) && Number(i.warehouseId) === Number(warehouseId));
    return Number(inv?.stock || 0);
  }

  async function submitAdjustment(e) {
    e.preventDefault();
    const normalized = adjustmentForm.details
      .map((d) => ({
        productId: Number(d.productId),
        countedStock: Number(d.countedStock),
      }))
      .filter((d) => d.productId && Number.isFinite(d.countedStock) && d.countedStock >= 0);

    await onCreateInventoryAdjustment({
      warehouseId: Number(adjustmentForm.warehouseId),
      movementDate: adjustmentForm.movementDate,
      notes: adjustmentForm.notes,
      details: normalized,
    });

    setShowAdjustmentModal(false);
  }

  return (
    <>
      {isAdmin ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h2>Catalogo de productos</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="secondary" onClick={openAdjustmentModal}>Ajuste de inventario</button>
            <button type="button" onClick={() => setShowCreateModal(true)}>Nuevo producto</button>
          </div>
        </div>
      ) : <h2 style={{ marginTop: 18 }}>Catalogo</h2>}

      <div className="row" style={{ marginBottom: 10 }}>
        <input placeholder="Buscar por nombre o SKU" value={productQuery} onChange={(e) => setProductQuery(e.target.value)} />
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" checked={productOnlyStock} onChange={(e) => setProductOnlyStock(e.target.checked)} />Solo con stock</label>
        <select value={productStockOrder} onChange={(e) => setProductStockOrder(e.target.value)}><option value="none">Ordenar por stock</option><option value="asc">Stock ascendente</option><option value="desc">Stock descendente</option></select>
        <button type="button" className="secondary" onClick={setProductOnlyStockAndQuery}>Limpiar filtros</button>
      </div>

      <div className="tableWrap"><table><thead><tr><th>ID</th><th>SKU</th><th>Nombre</th><th>Marca</th><th>Costo</th><th>Venta</th><th>Stock disponible</th><th>Activo</th><th>Accion</th></tr></thead><tbody>{filteredProducts.map((p) => <tr key={p.id}><td>{p.id}</td><td>{p.sku}</td><td>{p.name}</td><td>{data.brands.find((b) => b.id === p.brandId)?.name || "-"}</td><td>{money.format(Number(p.costPrice || 0))}</td><td>{money.format(Number(p.salePrice || 0))}</td><td>{qty.format(stockByProduct.get(p.id) || 0)}</td><td>{p.active ? "Si" : "No"}</td><td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{isAdmin ? <button type="button" className="secondary" onClick={() => openEditModal(p)}>Editar</button> : null}<button type="button" className="secondary" onClick={() => addProductToSaleCart(p)}>Agregar al carrito</button></td></tr>)}</tbody></table></div>

      {showCreateModal ? (
        <div className="modalOverlay">
          <div className="panel section modalCard">
            <h2>Nuevo producto</h2>
            <form className="grid" onSubmit={submitCreate}>
              <input required placeholder="SKU" value={createForm.sku} onChange={(e) => setCreateForm((s) => ({ ...s, sku: e.target.value }))} />
              <input required placeholder="Nombre" value={createForm.name} onChange={(e) => setCreateForm((s) => ({ ...s, name: e.target.value }))} />
              <select required value={createForm.brandId} onChange={(e) => setCreateForm((s) => ({ ...s, brandId: e.target.value }))}><option value="">Marca</option>{data.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
              <input type="number" min="0" step="0.01" placeholder="Costo" value={createForm.costPrice} onChange={(e) => setCreateForm((s) => ({ ...s, costPrice: e.target.value }))} />
              <input type="number" min="0" step="0.01" placeholder="Precio venta" value={createForm.salePrice} onChange={(e) => setCreateForm((s) => ({ ...s, salePrice: e.target.value }))} />
              <div className="modalActions">
                <button type="button" className="secondary" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                <button type="submit">Crear</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {editingProduct ? (
        <div className="modalOverlay">
          <div className="panel section modalCard">
            <h2>Editar producto</h2>
            <form className="grid" onSubmit={submitEdit}>
              <input required placeholder="SKU" value={editForm.sku} onChange={(e) => setEditForm((s) => ({ ...s, sku: e.target.value }))} />
              <input required placeholder="Nombre" value={editForm.name} onChange={(e) => setEditForm((s) => ({ ...s, name: e.target.value }))} />
              <select required value={editForm.brandId} onChange={(e) => setEditForm((s) => ({ ...s, brandId: e.target.value }))}><option value="">Marca</option>{data.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
              <input type="number" min="0" step="0.01" placeholder="Costo" value={editForm.costPrice} onChange={(e) => setEditForm((s) => ({ ...s, costPrice: e.target.value }))} />
              <input type="number" min="0" step="0.01" placeholder="Precio venta" value={editForm.salePrice} onChange={(e) => setEditForm((s) => ({ ...s, salePrice: e.target.value }))} />
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" checked={editForm.active} onChange={(e) => setEditForm((s) => ({ ...s, active: e.target.checked }))} />Producto activo</label>
              <div className="modalActions">
                <button type="button" className="secondary" onClick={() => setEditingProduct(null)}>Cancelar</button>
                <button type="submit">Guardar cambios</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showAdjustmentModal ? (
        <div className="modalOverlay">
          <div className="panel section modalCard" style={{ maxWidth: 980 }}>
            <h2>Ajuste de inventario</h2>
            <form className="grid" onSubmit={submitAdjustment}>
              <div className="row">
                <select required value={adjustmentForm.warehouseId} onChange={(e) => setAdjustmentForm((s) => ({ ...s, warehouseId: e.target.value }))}>
                  <option value="">Deposito</option>
                  {data.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                <input type="date" required value={adjustmentForm.movementDate} onChange={(e) => setAdjustmentForm((s) => ({ ...s, movementDate: e.target.value }))} />
                <input placeholder="Motivo / nota del ajuste" value={adjustmentForm.notes} onChange={(e) => setAdjustmentForm((s) => ({ ...s, notes: e.target.value }))} />
              </div>

              <div className="tableWrap">
                <table style={{ minWidth: 920 }}>
                  <thead><tr><th>Producto</th><th>Stock actual</th><th>Stock contado</th><th>Diferencia</th><th>Accion</th></tr></thead>
                  <tbody>
                    {adjustmentForm.details.map((d, index) => {
                      const currentStock = d.productId && adjustmentForm.warehouseId ? currentStockForWarehouse(d.productId, adjustmentForm.warehouseId) : 0;
                      const counted = Number(d.countedStock || 0);
                      const diff = counted - currentStock;
                      return (
                        <tr key={`adjust-${index}`}>
                          <td>
                            <select required value={d.productId} onChange={(e) => updateAdjustmentDetail(index, "productId", e.target.value)}>
                              <option value="">Producto</option>
                              {data.products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                            </select>
                          </td>
                          <td>{qty.format(currentStock)}</td>
                          <td><input type="number" min="0" step="any" required value={d.countedStock} onChange={(e) => updateAdjustmentDetail(index, "countedStock", e.target.value)} /></td>
                          <td>{qty.format(diff)}</td>
                          <td><button type="button" className="secondary" onClick={() => removeAdjustmentDetail(index)}>Quitar</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="row">
                <button type="button" className="secondary" onClick={addAdjustmentDetail}>Agregar producto</button>
                <button type="button" className="secondary" onClick={() => setShowAdjustmentModal(false)}>Cancelar</button>
                <button type="submit">Guardar ajuste</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
