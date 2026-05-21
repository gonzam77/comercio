import { Fragment, useState } from "react";

export default function SalesListTab(props) {
  const {
    showNewSaleForm, setShowNewSaleForm, openNewSaleForm, handleSale,
    saleForm, setSaleForm, sessionUser, data, updateSaleDetail, removeSaleDetail,
    addSaleDetail, saleTotal, money, salesListRows, expandedSaleId,
    handleToggleSaleDetail, saleDetailById, qty, isSeller,
  } = props;

  const [productSearchByRow, setProductSearchByRow] = useState({});

  function getFilteredProductsForRow(index) {
    const query = String(productSearchByRow[index] || "").trim().toLowerCase();
    const productsWithStock = data.products.filter((p) => {
      const stock = data.inventories
        .filter((inv) => inv.productId === p.id)
        .reduce((acc, inv) => acc + Number(inv.stock || 0), 0);
      return stock > 0;
    });
    if (!query) return productsWithStock;
    return productsWithStock.filter((p) => {
      const name = String(p.name || "").toLowerCase();
      const sku = String(p.sku || "").toLowerCase();
      return name.includes(query) || sku.includes(query);
    });
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h2>Listado de ventas</h2>
        <button type="button" style={{ marginBottom: 8 }} onClick={() => (showNewSaleForm ? setShowNewSaleForm(false) : openNewSaleForm())}>{showNewSaleForm ? "Cancelar" : "Nueva venta"}</button>
      </div>
      {showNewSaleForm ? (
        <div className="panel section sectionBlock">
          <h3 className="sectionTitle">Nueva venta</h3>
          <form className="grid" onSubmit={handleSale}>
            <div className="row">
              <select required value={saleForm.clientId} onChange={(e) => setSaleForm((s) => ({ ...s, clientId: e.target.value }))}><option value="">Cliente</option>{data.clients.map((x) => <option key={x.id} value={x.id}>{x.fullName}</option>)}</select>
              <input value={sessionUser.name} disabled />
              <select required disabled={isSeller} value={saleForm.warehouseId} onChange={(e) => setSaleForm((s) => ({ ...s, warehouseId: e.target.value }))}><option value="">Deposito</option>{data.warehouses.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
              <select required value={saleForm.paymentMethodId} onChange={(e) => setSaleForm((s) => ({ ...s, paymentMethodId: e.target.value }))}><option value="">Metodo de pago</option>{data.paymentMethods.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
              <input type="date" required value={saleForm.saleDate} onChange={(e) => setSaleForm((s) => ({ ...s, saleDate: e.target.value }))} />
              <input placeholder="Factura" value={saleForm.invoiceNumber} onChange={(e) => setSaleForm((s) => ({ ...s, invoiceNumber: e.target.value }))} />
            </div>

            <div className="tableWrap">
              <table style={{ minWidth: 920 }}>
                <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th><th>Accion</th></tr></thead>
                <tbody>
                  {saleForm.details.map((d, index) => {
                    const filteredProducts = getFilteredProductsForRow(index);
                    return (
                      <tr key={`sale-${index}`}>
                        <td>
                          <input
                            type="text"
                            placeholder="Buscar por nombre o SKU"
                            value={productSearchByRow[index] || ""}
                            onChange={(e) => setProductSearchByRow((prev) => ({ ...prev, [index]: e.target.value }))}
                            style={{ marginBottom: 6 }}
                          />
                          <select required value={d.productId} onChange={(e) => updateSaleDetail(index, "productId", e.target.value)}>
                            <option value="">Producto</option>
                            {filteredProducts.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.sku})</option>)}
                          </select>
                        </td>
                        <td><input type="number" min="0.001" step="any" required value={d.quantity} onChange={(e) => updateSaleDetail(index, "quantity", e.target.value)} /></td>
                        <td><input type="number" min="0" step="0.01" value={d.unitPrice} readOnly /></td>
                        <td>{money.format(Number(d.quantity || 0) * Number(d.unitPrice || 0))}</td>
                        <td><button type="button" className="secondary" onClick={() => removeSaleDetail(index)}>Quitar</button></td>
                      </tr>
                    );
                  })}
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
        </div>
      ) : null}
      <div className="panel section sectionBlock"><h3 className="sectionTitle">Historial de ventas</h3><div className="tableWrap"><table><thead><tr><th>Fecha</th><th>Comprobante</th><th>Cliente</th><th>Vendedor</th><th>Deposito</th><th>Pago</th><th>Total</th><th>Detalle</th></tr></thead><tbody>{salesListRows.map((sale) => <Fragment key={`sale-list-${sale.id}`}><tr><td>{sale.saleDate}</td><td>{sale.invoiceNumber}</td><td>{sale.clientName}</td><td>{sale.userName}</td><td>{sale.warehouseName}</td><td>{sale.paymentMethodName}</td><td>{money.format(sale.total)}</td><td><button type="button" className="secondary" onClick={() => handleToggleSaleDetail(sale.id)}>{expandedSaleId === sale.id ? "Ocultar detalle" : "Ver detalle"}</button></td></tr>{expandedSaleId === sale.id ? <tr><td colSpan={8}><div className="tableWrap"><table style={{ minWidth: 500 }}><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr></thead><tbody>{(saleDetailById[sale.id]?.SaleDetails || []).map((d, i) => <tr key={`sale-list-${sale.id}-${i}`}><td>{d.Product?.name || `Producto ${d.productId}`}</td><td>{qty.format(Number(d.quantity || 0))}</td><td>{money.format(Number(d.unitPrice || 0))}</td><td>{money.format(Number(d.quantity || 0) * Number(d.unitPrice || 0))}</td></tr>)}</tbody></table></div></td></tr> : null}</Fragment>)}</tbody></table></div></div>
    </>
  );
}

