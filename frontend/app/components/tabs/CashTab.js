export default function CashTab({
  cashSessionInfo,
  openOpenCashModal,
  openCloseCashModal,
  openWithdrawCashModal,
  cashSessionMovements,
  money,
}) {
  return (
    <>
      <h2>Gestion de caja</h2>
      <div className="row" style={{ marginBottom: 12 }}>
        <div className="panel card"><div className="label">Estado</div><div className="value" style={{ fontSize: "1.1rem" }}>{cashSessionInfo.hasOpenSession ? "Caja abierta" : "Sin caja abierta"}</div><div className="label">{cashSessionInfo.hasOpenSession ? `Abierta desde ${new Date(cashSessionInfo.session?.openedAt).toLocaleString()}` : "Debes abrir una caja para registrar operaciones en efectivo"}</div></div>
        <div className="panel card"><div className="label">Apertura actual</div><div className="value">{cashSessionInfo.hasOpenSession ? money.format(Number(cashSessionInfo.summary?.openingAmount || 0)) : "-"}</div></div>
        <div className="panel card"><div className="label">Saldo actual</div><div className="value">{cashSessionInfo.hasOpenSession ? money.format(Number(cashSessionInfo.summary?.expectedBalance || 0)) : "-"}</div></div>
        <div className="panel card"><div className="label">Diferencia arqueo</div><div className="value">{cashSessionInfo.summary?.difference == null ? "-" : money.format(Number(cashSessionInfo.summary.difference || 0))}</div></div>
      </div>
      <div className="row" style={{ marginBottom: 12 }}>
        {!cashSessionInfo.hasOpenSession ? (
          <>
            <button type="button" onClick={openOpenCashModal}>Abrir caja</button>
          </>
        ) : (
          <>
            <button type="button" className="secondary" onClick={openWithdrawCashModal}>Retiro de caja</button>
            <button type="button" className="danger" onClick={openCloseCashModal}>Cerrar caja</button>
          </>
        )}
      </div>
      <h2>Movimientos en efectivo</h2>
      <div className="tableWrap"><table><thead><tr><th>Fecha y hora</th><th>Concepto</th><th>Tipo</th><th>Medio</th><th>Importe</th></tr></thead><tbody>{cashSessionMovements.length === 0 ? <tr><td colSpan={5}>No hay movimientos en efectivo para esta sesion.</td></tr> : cashSessionMovements.map((m) => <tr key={`cashflow-${m.id}`}><td>{m.movementAt ? new Date(m.movementAt).toLocaleString() : m.movementDate}</td><td>{m.concept}</td><td>{m.type === "COLLECTION" ? "Ingreso" : "Egreso"}</td><td>{m.PaymentMethod?.name || "-"}</td><td>{money.format(Number(m.amount || 0))}</td></tr>)}</tbody></table></div>
      <h2 style={{ marginTop: 16 }}>Historial de arqueos</h2>
      <div className="tableWrap"><table><thead><tr><th>Apertura</th><th>Cierre</th><th>Apertura declarada</th><th>Esperado al cierre</th><th>Contado al cierre</th><th>Diferencia</th><th>Estado</th></tr></thead><tbody>{(cashSessionInfo.recentSessions || []).length === 0 ? <tr><td colSpan={7}>Sin sesiones registradas.</td></tr> : (cashSessionInfo.recentSessions || []).map((s) => <tr key={`session-${s.id}`}><td>{s.openedAt ? new Date(s.openedAt).toLocaleString() : "-"}</td><td>{s.closedAt ? new Date(s.closedAt).toLocaleString() : "-"}</td><td>{money.format(Number(s.openingAmount || 0))}</td><td>{s.expectedClosingAmount == null ? "-" : money.format(Number(s.expectedClosingAmount || 0))}</td><td>{s.closingAmount == null ? "-" : money.format(Number(s.closingAmount || 0))}</td><td>{s.closingDifferenceAmount == null ? "-" : money.format(Number(s.closingDifferenceAmount || 0))}</td><td>{s.status === "OPEN" ? "Abierta" : "Cerrada"}</td></tr>)}</tbody></table></div>
    </>
  );
}
