import { useMemo, useState } from "react";

function emptyUserForm() {
  return { name: "", email: "", password: "", active: true, roleIds: [] };
}

export default function UsersTab({ users, roles, onCreateUser, onUpdateUser }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [createForm, setCreateForm] = useState(emptyUserForm());
  const [editForm, setEditForm] = useState(emptyUserForm());

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))),
    [users]
  );

  async function submitCreate(e) {
    e.preventDefault();
    await onCreateUser({
      name: createForm.name,
      email: createForm.email,
      password: createForm.password,
      active: createForm.active,
      roleIds: createForm.roleIds,
    });
    setShowCreateModal(false);
    setCreateForm(emptyUserForm());
  }

  function openEditModal(user) {
    setEditingUser(user);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      active: Boolean(user.active),
      roleIds: (user.Roles || []).map((r) => r.id),
    });
  }

  async function submitEdit(e) {
    e.preventDefault();
    if (!editingUser) return;
    const payload = {
      name: editForm.name,
      email: editForm.email,
      active: editForm.active,
      roleIds: editForm.roleIds,
    };
    if (editForm.password.trim()) {
      payload.password = editForm.password;
    }
    await onUpdateUser(editingUser.id, payload);
    setEditingUser(null);
    setEditForm(emptyUserForm());
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h2>Administracion de usuarios</h2>
        <button type="button" onClick={() => setShowCreateModal(true)}>Agregar usuario</button>
      </div>

      <div className="tableWrap">
        <table>
          <thead><tr><th>Nombre</th><th>Email</th><th>Estado</th><th>Roles</th><th>Accion</th></tr></thead>
          <tbody>
            {sortedUsers.map((u) => (
              <tr key={`user-${u.id}`}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.active ? "Activo" : "Inactivo"}</td>
                <td>{(u.Roles || []).map((r) => r.name).join(", ") || "-"}</td>
                <td>
                  <button type="button" className="secondary" onClick={() => openEditModal(u)}>
                    Editar usuario
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreateModal ? (
        <div className="modalOverlay">
          <div className="panel section modalCard">
            <h2>Nuevo usuario</h2>
            <form className="grid" onSubmit={submitCreate}>
              <input required placeholder="Nombre" value={createForm.name} onChange={(e) => setCreateForm((s) => ({ ...s, name: e.target.value }))} />
              <input required type="email" placeholder="Email" value={createForm.email} onChange={(e) => setCreateForm((s) => ({ ...s, email: e.target.value }))} />
              <input required type="password" placeholder="Contrasena" value={createForm.password} onChange={(e) => setCreateForm((s) => ({ ...s, password: e.target.value }))} />
              <select
                multiple
                value={createForm.roleIds.map(String)}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions).map((o) => Number(o.value));
                  setCreateForm((s) => ({ ...s, roleIds: values }));
                }}
              >
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" checked={createForm.active} onChange={(e) => setCreateForm((s) => ({ ...s, active: e.target.checked }))} />Usuario activo</label>
              <div className="modalActions">
                <button type="button" className="secondary" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                <button type="submit">Guardar usuario</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {editingUser ? (
        <div className="modalOverlay">
          <div className="panel section modalCard">
            <h2>Editar usuario</h2>
            <form className="grid" onSubmit={submitEdit}>
              <input required placeholder="Nombre" value={editForm.name} onChange={(e) => setEditForm((s) => ({ ...s, name: e.target.value }))} />
              <input required type="email" placeholder="Email" value={editForm.email} onChange={(e) => setEditForm((s) => ({ ...s, email: e.target.value }))} />
              <input type="password" placeholder="Nueva contrasena (opcional)" value={editForm.password} onChange={(e) => setEditForm((s) => ({ ...s, password: e.target.value }))} />
              <select
                multiple
                value={editForm.roleIds.map(String)}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions).map((o) => Number(o.value));
                  setEditForm((s) => ({ ...s, roleIds: values }));
                }}
              >
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" checked={editForm.active} onChange={(e) => setEditForm((s) => ({ ...s, active: e.target.checked }))} />Usuario activo</label>
              <div className="modalActions">
                <button type="button" className="secondary" onClick={() => setEditingUser(null)}>Cancelar</button>
                <button type="submit">Guardar cambios</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
