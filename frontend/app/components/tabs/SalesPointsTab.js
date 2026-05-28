import { useMemo, useState } from "react";

function emptySalesPointForm() {
  return { name: "" };
}

export default function SalesPointsTab({ warehouses, onCreateWarehouse, onUpdateWarehouse }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [form, setForm] = useState(emptySalesPointForm());

  const sortedWarehouses = useMemo(
    () => [...warehouses].sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))),
    [warehouses]
  );

  async function submitCreate(e) {
    e.preventDefault();
    await onCreateWarehouse({ name: form.name.trim(), active: true });
    setShowCreateModal(false);
    setForm(emptySalesPointForm());
  }

  function openEditModal(warehouse) {
    setEditingWarehouse(warehouse);
    setForm({ name: warehouse.name || "" });
  }

  async function submitEdit(e) {
    e.preventDefault();
    if (!editingWarehouse) return;
    await onUpdateWarehouse(editingWarehouse.id, { name: form.name.trim() });
    setEditingWarehouse(null);
    setForm(emptySalesPointForm());
  }

  async function toggleWarehouseActive(warehouse) {
    await onUpdateWarehouse(warehouse.id, { active: !isWarehouseActive(warehouse) });
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <h2>Puntos de venta</h2>
        <button type="button" className="secondary" onClick={() => setShowCreateModal(true)}>Agregar</button>
      </div>

      <div className="tableWrap">
        <table>
          <thead><tr><th>ID</th><th>Nombre</th><th>Estado</th><th>Accion</th></tr></thead>
          <tbody>
            {sortedWarehouses.map((warehouse) => (
              <tr key={`warehouse-${warehouse.id}`}>
                <td>{warehouse.id}</td>
                <td>{warehouse.name}</td>
                <td>{isWarehouseActive(warehouse) ? "Activo" : "Inactivo"}</td>
                <td>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button type="button" className="secondary" onClick={() => openEditModal(warehouse)}>Editar</button>
                    <button type="button" className={isWarehouseActive(warehouse) ? "danger" : "secondary"} onClick={() => toggleWarehouseActive(warehouse)}>
                      {isWarehouseActive(warehouse) ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreateModal ? (
        <div className="modalOverlay">
          <div className="panel section modalCard">
            <h2>Nuevo punto de venta</h2>
            <form className="grid" onSubmit={submitCreate}>
              <input
                required
                placeholder="Nombre del punto de venta"
                value={form.name}
                onChange={(e) => setForm({ name: e.target.value })}
              />
              <div className="modalActions">
                <button type="button" className="secondary" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                <button type="submit">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {editingWarehouse ? (
        <div className="modalOverlay">
          <div className="panel section modalCard">
            <h2>Editar punto de venta</h2>
            <form className="grid" onSubmit={submitEdit}>
              <input
                required
                placeholder="Nombre del punto de venta"
                value={form.name}
                onChange={(e) => setForm({ name: e.target.value })}
              />
              <div className="modalActions">
                <button type="button" className="secondary" onClick={() => setEditingWarehouse(null)}>Cancelar</button>
                <button type="submit">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
  function isWarehouseActive(warehouse) {
    return warehouse.active !== false;
  }
