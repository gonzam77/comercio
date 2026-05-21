export default function DashboardTab({ data, topProducts, lowStockProducts, qty }) {
  return (
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
  );
}
