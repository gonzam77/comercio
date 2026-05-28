export default function HeaderAndTabs({
  sessionUser,
  roles,
  tab,
  tabList,
  canOperate,
  isAdmin,
  setTab,
  setConfigTab,
  handleLogout,
}) {
  return (
    <>
      <div className="header" style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "end", flexWrap: "wrap" }}>
        <div>
          <h1>Panel Comercial</h1>
          <p>Usuario: {sessionUser.name} ({roles.join(", ")})</p>
        </div>
        <button className="secondary" onClick={handleLogout}>Cerrar sesion</button>
      </div>

      <div className="tabs" style={{ marginBottom: 12 }}>
        {tabList.map(([id, label]) => (
          <button
            key={id}
            className={`tab ${tab === id ? "active" : ""}`}
            onClick={() => {
              setTab(id);
              if (id === "config") {
                if (canOperate) {
                  setConfigTab("contacts");
                } else if (isAdmin) {
                  setConfigTab("sales-points");
                }
              }
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </>
  );
}
