export default function ContactsTab({ showClientForm, setShowClientForm, handleClient, clientForm, setClientForm, data, showSupplierForm, setShowSupplierForm, handleSupplier, supplierForm, setSupplierForm }) {
  return (
    <>
      <h2>Clientes y proveedores</h2>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <div className="panel section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 }}><h3 style={{ margin: 0 }}>Clientes actuales</h3><button type="button" className="secondary" onClick={() => setShowClientForm((v) => !v)}>{showClientForm ? "Cancelar" : "Agregar"}</button></div>
          {showClientForm ? <form className="grid" onSubmit={handleClient} style={{ marginBottom: 12 }}><input required placeholder="Nombre completo" value={clientForm.fullName} onChange={(e) => setClientForm((s) => ({ ...s, fullName: e.target.value }))} /><input placeholder="CUIT / DNI" value={clientForm.taxId} onChange={(e) => setClientForm((s) => ({ ...s, taxId: e.target.value }))} /><input placeholder="Telefono" value={clientForm.phone} onChange={(e) => setClientForm((s) => ({ ...s, phone: e.target.value }))} /><input placeholder="Direccion" value={clientForm.address} onChange={(e) => setClientForm((s) => ({ ...s, address: e.target.value }))} /><button type="submit">Crear cliente</button></form> : null}
          <div className="tableWrap"><table style={{ minWidth: 520 }}><thead><tr><th>Nombre</th><th>CUIT/DNI</th><th>Telefono</th><th>Direccion</th></tr></thead><tbody>{data.clients.map((c) => <tr key={`client-${c.id}`}><td>{c.fullName}</td><td>{c.taxId || "-"}</td><td>{c.phone || "-"}</td><td>{c.address || "-"}</td></tr>)}</tbody></table></div>
        </div>
        <div className="panel section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 }}><h3 style={{ margin: 0 }}>Proveedores actuales</h3><button type="button" className="secondary" onClick={() => setShowSupplierForm((v) => !v)}>{showSupplierForm ? "Cancelar" : "Agregar"}</button></div>
          {showSupplierForm ? <form className="grid" onSubmit={handleSupplier} style={{ marginBottom: 12 }}><input required placeholder="Razon social" value={supplierForm.businessName} onChange={(e) => setSupplierForm((s) => ({ ...s, businessName: e.target.value }))} /><input placeholder="CUIT" value={supplierForm.taxId} onChange={(e) => setSupplierForm((s) => ({ ...s, taxId: e.target.value }))} /><input placeholder="Telefono" value={supplierForm.phone} onChange={(e) => setSupplierForm((s) => ({ ...s, phone: e.target.value }))} /><input placeholder="Direccion" value={supplierForm.address} onChange={(e) => setSupplierForm((s) => ({ ...s, address: e.target.value }))} /><button type="submit">Crear proveedor</button></form> : null}
          <div className="tableWrap"><table style={{ minWidth: 520 }}><thead><tr><th>Razon social</th><th>CUIT</th><th>Telefono</th><th>Direccion</th></tr></thead><tbody>{data.suppliers.map((s) => <tr key={`supplier-${s.id}`}><td>{s.businessName}</td><td>{s.taxId || "-"}</td><td>{s.phone || "-"}</td><td>{s.address || "-"}</td></tr>)}</tbody></table></div>
        </div>
      </div>
    </>
  );
}
