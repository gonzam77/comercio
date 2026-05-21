import { Fragment } from "react";

export default function OperationsTab({ data, movementSummaryRows, expandedMovementId, setExpandedMovementId, qty, money }) {
  return (
    <>
      <h2>Inventario actual</h2>
      <div className="tableWrap"><table><thead><tr><th>Producto</th><th>Deposito</th><th>Stock</th></tr></thead><tbody>{data.inventories.map((inv) => { const product = data.products.find((p) => p.id === inv.productId); const warehouse = data.warehouses.find((w) => w.id === inv.warehouseId); return <tr key={inv.id}><td>{product?.name || `Producto ${inv.productId}`}</td><td>{warehouse?.name || `Deposito ${inv.warehouseId}`}</td><td>{qty.format(Number(inv.stock || 0))}</td></tr>; })}</tbody></table></div>
      <h2 style={{ marginTop: 18 }}>Movimientos comerciales</h2>
      <div className="tableWrap"><table><thead><tr><th>Fecha</th><th>Tipo</th><th>Comprobante</th><th>Cliente/Proveedor</th><th>Realizado por</th><th>Origen</th><th>Destino</th><th>Total</th><th>Detalle</th></tr></thead><tbody>{movementSummaryRows.map((m) => <Fragment key={m.id}><tr><td>{m.movementDate}</td><td>{m.typeName}</td><td>{m.document}</td><td>{m.counterparty}</td><td>{m.userName}</td><td>{m.fromName}</td><td>{m.toName}</td><td>{money.format(m.total)}</td><td><button type="button" className="secondary" onClick={() => setExpandedMovementId((prev) => (prev === m.id ? null : m.id))}>{expandedMovementId === m.id ? "Ocultar detalle" : "Ver detalle"}</button></td></tr>{expandedMovementId === m.id ? <tr key={`${m.id}-detail`}><td colSpan={9}><div className="tableWrap"><table style={{ minWidth: 500 }}><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr></thead><tbody>{m.detailRows.map((d, i) => <tr key={`${m.id}-item-${i}`}><td>{d.productName}</td><td>{qty.format(d.quantity)}</td><td>{money.format(d.unitPrice)}</td><td>{money.format(d.quantity * d.unitPrice)}</td></tr>)}</tbody></table></div></td></tr> : null}</Fragment>)}</tbody></table></div>
    </>
  );
}
