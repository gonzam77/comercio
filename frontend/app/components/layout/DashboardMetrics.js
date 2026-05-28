export default function DashboardMetrics({ money, qty, metrics, dashboardRange, setDashboardRange }) {
  return (
    <>
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
    </>
  );
}
