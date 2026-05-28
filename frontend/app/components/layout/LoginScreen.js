export default function LoginScreen({ loginForm, setLoginForm, handleLogin, status }) {
  return (
    <main>
      <div className="header" style={{ textAlign: "center", marginTop: "20px" }}>
        <h1>Panel Comercial</h1>
      </div>
      <div className="panel section" style={{ maxWidth: 500, margin: "12vh auto 0" }}>
        <h2>Acceso</h2>
        <form className="grid" onSubmit={handleLogin}>
          <input
            type="email"
            required
            placeholder="Email"
            value={loginForm.email}
            onChange={(e) => setLoginForm((s) => ({ ...s, email: e.target.value }))}
          />
          <input
            type="password"
            required
            placeholder="Contrasena"
            value={loginForm.password}
            onChange={(e) => setLoginForm((s) => ({ ...s, password: e.target.value }))}
          />
          <button type="submit">Ingresar</button>
        </form>
        <p className="label" style={{ marginTop: 10 }}>Admin demo: admin@comercio.local / admin123</p>
        <p className="label">Vendedor demo: vendedor@comercio.local / vendedor123</p>
        {status.text ? <div className={`alert ${status.type}`}>{status.text}</div> : null}
      </div>
    </main>
  );
}
