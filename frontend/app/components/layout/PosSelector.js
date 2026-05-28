export default function PosSelector({
  usesPosSelection,
  data,
  selectedPosWarehouseId,
  showPosSelectionModal,
  setSelectedPosWarehouseId,
  setShowPosSelectionModal,
  confirmPosSelection,
}) {
  if (!usesPosSelection) return null;

  return (
    <>
      <div className="panel card" style={{ marginBottom: 12 }}>
        <div className="label">Punto de venta activo</div>
        <div className="value" style={{ fontSize: "1rem" }}>
          {data.warehouses.find((w) => String(w.id) === String(selectedPosWarehouseId))?.name || "No seleccionado"}
        </div>
        <button type="button" className="secondary" style={{ marginTop: 8 }} onClick={() => setShowPosSelectionModal(true)}>
          Cambiar punto de venta
        </button>
      </div>

      {showPosSelectionModal ? (
        <div className="modalOverlay">
          <div className="panel section modalCard">
            <h2>Seleccionar punto de venta</h2>
            <p className="label">Debes elegir el deposito/punto de venta para operar y usar su caja correspondiente.</p>
            <div className="row" style={{ marginBottom: 12 }}>
              <select value={selectedPosWarehouseId} onChange={(e) => setSelectedPosWarehouseId(e.target.value)}>
                <option value="">Seleccionar punto de venta</option>
                {data.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div className="modalActions">
              <button type="button" className="secondary" onClick={() => setShowPosSelectionModal(false)}>Cancelar</button>
              <button type="button" onClick={confirmPosSelection}>Confirmar</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
