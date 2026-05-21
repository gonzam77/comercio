import { useState } from "react";

function emptyClientForm() {
  return { fullName: "", taxId: "", phone: "", address: "" };
}

function emptySupplierForm() {
  return { businessName: "", taxId: "", phone: "", address: "" };
}

export default function ContactsTab({ data, onCreateClient, onUpdateClient, onCreateSupplier, onUpdateSupplier }) {
  const [showClientCreateModal, setShowClientCreateModal] = useState(false);
  const [showSupplierCreateModal, setShowSupplierCreateModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [clientForm, setClientForm] = useState(emptyClientForm());
  const [supplierForm, setSupplierForm] = useState(emptySupplierForm());

  async function submitCreateClient(e) {
    e.preventDefault();
    await onCreateClient(clientForm);
    setShowClientCreateModal(false);
    setClientForm(emptyClientForm());
  }

  async function submitCreateSupplier(e) {
    e.preventDefault();
    await onCreateSupplier(supplierForm);
    setShowSupplierCreateModal(false);
    setSupplierForm(emptySupplierForm());
  }

  function openEditClient(client) {
    setEditingClient(client);
    setClientForm({
      fullName: client.fullName || "",
      taxId: client.taxId || "",
      phone: client.phone || "",
      address: client.address || "",
    });
  }

  function openEditSupplier(supplier) {
    setEditingSupplier(supplier);
    setSupplierForm({
      businessName: supplier.businessName || "",
      taxId: supplier.taxId || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
    });
  }

  async function submitEditClient(e) {
    e.preventDefault();
    if (!editingClient) return;
    await onUpdateClient(editingClient.id, clientForm);
    setEditingClient(null);
    setClientForm(emptyClientForm());
  }

  async function submitEditSupplier(e) {
    e.preventDefault();
    if (!editingSupplier) return;
    await onUpdateSupplier(editingSupplier.id, supplierForm);
    setEditingSupplier(null);
    setSupplierForm(emptySupplierForm());
  }

  return (
    <>
      <h2>Clientes y proveedores</h2>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <div className="panel section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <h3 style={{ margin: 0 }}>Clientes actuales</h3>
            <button type="button" className="secondary" onClick={() => setShowClientCreateModal(true)}>Agregar</button>
          </div>
          <div className="tableWrap"><table style={{ minWidth: 520 }}><thead><tr><th>Nombre</th><th>CUIT/DNI</th><th>Telefono</th><th>Direccion</th><th>Accion</th></tr></thead><tbody>{data.clients.map((c) => <tr key={`client-${c.id}`}><td>{c.fullName}</td><td>{c.taxId || "-"}</td><td>{c.phone || "-"}</td><td>{c.address || "-"}</td><td><button type="button" className="secondary" onClick={() => openEditClient(c)}>Editar</button></td></tr>)}</tbody></table></div>
        </div>

        <div className="panel section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <h3 style={{ margin: 0 }}>Proveedores actuales</h3>
            <button type="button" className="secondary" onClick={() => setShowSupplierCreateModal(true)}>Agregar</button>
          </div>
          <div className="tableWrap"><table style={{ minWidth: 520 }}><thead><tr><th>Razon social</th><th>CUIT</th><th>Telefono</th><th>Direccion</th><th>Accion</th></tr></thead><tbody>{data.suppliers.map((s) => <tr key={`supplier-${s.id}`}><td>{s.businessName}</td><td>{s.taxId || "-"}</td><td>{s.phone || "-"}</td><td>{s.address || "-"}</td><td><button type="button" className="secondary" onClick={() => openEditSupplier(s)}>Editar</button></td></tr>)}</tbody></table></div>
        </div>
      </div>

      {showClientCreateModal ? (
        <div className="modalOverlay"><div className="panel section modalCard"><h2>Nuevo cliente</h2><form className="grid" onSubmit={submitCreateClient}><input required placeholder="Nombre completo" value={clientForm.fullName} onChange={(e) => setClientForm((s) => ({ ...s, fullName: e.target.value }))} /><input placeholder="CUIT / DNI" value={clientForm.taxId} onChange={(e) => setClientForm((s) => ({ ...s, taxId: e.target.value }))} /><input placeholder="Telefono" value={clientForm.phone} onChange={(e) => setClientForm((s) => ({ ...s, phone: e.target.value }))} /><input placeholder="Direccion" value={clientForm.address} onChange={(e) => setClientForm((s) => ({ ...s, address: e.target.value }))} /><div className="modalActions"><button type="button" className="secondary" onClick={() => setShowClientCreateModal(false)}>Cancelar</button><button type="submit">Crear cliente</button></div></form></div></div>
      ) : null}

      {showSupplierCreateModal ? (
        <div className="modalOverlay"><div className="panel section modalCard"><h2>Nuevo proveedor</h2><form className="grid" onSubmit={submitCreateSupplier}><input required placeholder="Razon social" value={supplierForm.businessName} onChange={(e) => setSupplierForm((s) => ({ ...s, businessName: e.target.value }))} /><input placeholder="CUIT" value={supplierForm.taxId} onChange={(e) => setSupplierForm((s) => ({ ...s, taxId: e.target.value }))} /><input placeholder="Telefono" value={supplierForm.phone} onChange={(e) => setSupplierForm((s) => ({ ...s, phone: e.target.value }))} /><input placeholder="Direccion" value={supplierForm.address} onChange={(e) => setSupplierForm((s) => ({ ...s, address: e.target.value }))} /><div className="modalActions"><button type="button" className="secondary" onClick={() => setShowSupplierCreateModal(false)}>Cancelar</button><button type="submit">Crear proveedor</button></div></form></div></div>
      ) : null}

      {editingClient ? (
        <div className="modalOverlay"><div className="panel section modalCard"><h2>Editar cliente</h2><form className="grid" onSubmit={submitEditClient}><input required placeholder="Nombre completo" value={clientForm.fullName} onChange={(e) => setClientForm((s) => ({ ...s, fullName: e.target.value }))} /><input placeholder="CUIT / DNI" value={clientForm.taxId} onChange={(e) => setClientForm((s) => ({ ...s, taxId: e.target.value }))} /><input placeholder="Telefono" value={clientForm.phone} onChange={(e) => setClientForm((s) => ({ ...s, phone: e.target.value }))} /><input placeholder="Direccion" value={clientForm.address} onChange={(e) => setClientForm((s) => ({ ...s, address: e.target.value }))} /><div className="modalActions"><button type="button" className="secondary" onClick={() => setEditingClient(null)}>Cancelar</button><button type="submit">Guardar cambios</button></div></form></div></div>
      ) : null}

      {editingSupplier ? (
        <div className="modalOverlay"><div className="panel section modalCard"><h2>Editar proveedor</h2><form className="grid" onSubmit={submitEditSupplier}><input required placeholder="Razon social" value={supplierForm.businessName} onChange={(e) => setSupplierForm((s) => ({ ...s, businessName: e.target.value }))} /><input placeholder="CUIT" value={supplierForm.taxId} onChange={(e) => setSupplierForm((s) => ({ ...s, taxId: e.target.value }))} /><input placeholder="Telefono" value={supplierForm.phone} onChange={(e) => setSupplierForm((s) => ({ ...s, phone: e.target.value }))} /><input placeholder="Direccion" value={supplierForm.address} onChange={(e) => setSupplierForm((s) => ({ ...s, address: e.target.value }))} /><div className="modalActions"><button type="button" className="secondary" onClick={() => setEditingSupplier(null)}>Cancelar</button><button type="submit">Guardar cambios</button></div></form></div></div>
      ) : null}
    </>
  );
}
