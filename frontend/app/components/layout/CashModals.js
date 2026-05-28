export default function CashModals(props) {
  const {
    showCashPrompt,
    isAdmin,
    openAmountInput,
    setOpenAmountInput,
    handleOpenCashSession,
    setShowCashPrompt,
    showCloseCashModal,
    closeAmountInput,
    setCloseAmountInput,
    closeCloseCashModal,
    confirmCloseCashSession,
    cashSessionInfo,
    money,
    showOpenCashModal,
    closeOpenCashModal,
    confirmOpenCashSession,
    showWithdrawCashModal,
    withdrawAmountInput,
    setWithdrawAmountInput,
    withdrawAdminPassword,
    setWithdrawAdminPassword,
    closeWithdrawCashModal,
    confirmWithdrawCashSession,
  } = props;

  return (
    <>
      {showCashPrompt ? (
        <div className="modalOverlay">
          <div className="panel section modalCard">
            <h2>Apertura de caja</h2>
            <p className="label">Ingresa el monto inicial de caja chica para comenzar a operar.</p>
            <div className="row">
              <input type="number" min="0" step="0.01" value={openAmountInput} onChange={(e) => setOpenAmountInput(e.target.value)} />
              <button type="button" onClick={handleOpenCashSession}>Abrir caja</button>
              {isAdmin ? <button type="button" className="secondary" onClick={() => setShowCashPrompt(false)}>Entrar en modo administrativo</button> : null}
            </div>
            {!isAdmin ? <p className="label">Tu perfil requiere abrir caja para continuar.</p> : null}
          </div>
        </div>
      ) : null}

      {showCloseCashModal ? (
        <div className="modalOverlay">
          <div className="panel section modalCard">
            <h2>Confirmar cierre de caja</h2>
            <p className="label">Esta accion cerrara la caja actual con el monto de cierre ingresado.</p>
            <div className="row" style={{ marginBottom: 12 }}>
              <input type="number" min="0" step="0.01" placeholder="Monto de cierre" value={closeAmountInput} onChange={(e) => setCloseAmountInput(e.target.value)} />
            </div>
            <div className="modalActions">
              <button type="button" className="secondary" onClick={closeCloseCashModal}>Cancelar</button>
              <button type="button" className="danger" onClick={confirmCloseCashSession}>Confirmar cierre</button>
            </div>
            {!cashSessionInfo.hasOpenSession && cashSessionInfo.session?.status === "CLOSED" ? (
              <div className="panel card" style={{ marginBottom: 12 }}>
                <div className="label">Ultimo cierre registrado</div>
                <div className="label">
                  {cashSessionInfo.session.closedAt ? `Cerrada el ${new Date(cashSessionInfo.session.closedAt).toLocaleString()}` : "-"}
                </div>
                <div className="label">
                  Esperado: {money.format(Number(cashSessionInfo.session.expectedClosingAmount || 0))} | Contado: {money.format(Number(cashSessionInfo.session.closingAmount || 0))} | Diferencia: {money.format(Number(cashSessionInfo.session.closingDifferenceAmount || 0))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {showOpenCashModal ? (
        <div className="modalOverlay">
          <div className="panel section modalCard">
            <h2>Abrir caja</h2>
            <p className="label">Ingresa el monto de apertura para iniciar la sesion de caja.</p>
            <div className="row" style={{ marginBottom: 12 }}>
              <input type="number" min="0" step="0.01" placeholder="Monto de apertura" value={openAmountInput} onChange={(e) => setOpenAmountInput(e.target.value)} />
            </div>
            <div className="modalActions">
              <button type="button" className="secondary" onClick={closeOpenCashModal}>Cancelar</button>
              <button type="button" onClick={confirmOpenCashSession}>Confirmar apertura</button>
            </div>
          </div>
        </div>
      ) : null}

      {showWithdrawCashModal ? (
        <div className="modalOverlay">
          <div className="panel section modalCard">
            <h2>Retiro de caja</h2>
            <p className="label">Ingresa el monto y una contrasena de administrador para autorizar el retiro.</p>
            <div className="grid" style={{ marginBottom: 12 }}>
              <input type="number" min="0.01" step="0.01" placeholder="Monto a retirar" value={withdrawAmountInput} onChange={(e) => setWithdrawAmountInput(e.target.value)} />
              <input type="password" placeholder="Contrasena de administrador" value={withdrawAdminPassword} onChange={(e) => setWithdrawAdminPassword(e.target.value)} />
            </div>
            <div className="modalActions">
              <button type="button" className="secondary" onClick={closeWithdrawCashModal}>Cancelar</button>
              <button type="button" className="danger" onClick={confirmWithdrawCashSession}>Confirmar retiro</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
