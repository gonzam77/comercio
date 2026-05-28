import { useEffect, useRef, useState } from "react";
import { login } from "../../lib/api";

const SESSION_IDLE_TIMEOUT_MS = 24 * 60 * 60 * 1000;
const LAST_ACTIVITY_STORAGE_KEY = "comercio_last_activity_at";

export default function useAuthSession({ onAuthBootstrap, onLogoutReset, setStatus }) {
  const [token, setToken] = useState("");
  const [sessionUser, setSessionUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  const bootstrapRef = useRef(onAuthBootstrap);
  const logoutResetRef = useRef(onLogoutReset);

  useEffect(() => {
    bootstrapRef.current = onAuthBootstrap;
    logoutResetRef.current = onLogoutReset;
  }, [onAuthBootstrap, onLogoutReset]);

  function markSessionActivity() {
    localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, String(Date.now()));
  }

  function isSessionExpiredByInactivity() {
    const lastActivityRaw = localStorage.getItem(LAST_ACTIVITY_STORAGE_KEY);
    if (!lastActivityRaw) return false;
    const lastActivity = Number(lastActivityRaw);
    if (!Number.isFinite(lastActivity)) return false;
    return (Date.now() - lastActivity) >= SESSION_IDLE_TIMEOUT_MS;
  }

  function handleLogout(reasonText = "") {
    const safeReasonText = typeof reasonText === "string" ? reasonText : "";
    localStorage.removeItem("comercio_token");
    localStorage.removeItem("comercio_user");
    localStorage.removeItem("comercio_pos_warehouse_id");
    localStorage.removeItem(LAST_ACTIVITY_STORAGE_KEY);
    setToken("");
    setSessionUser(null);
    if (safeReasonText) {
      setStatus({ type: "error", text: safeReasonText });
    }
    if (logoutResetRef.current) {
      logoutResetRef.current();
    }
  }

  useEffect(() => {
    const savedToken = localStorage.getItem("comercio_token") || "";
    const savedUser = localStorage.getItem("comercio_user");
    if (savedToken && savedUser) {
      if (isSessionExpiredByInactivity()) {
        handleLogout("Sesion expirada por inactividad. Inicia sesion nuevamente.");
        return;
      }
      const user = JSON.parse(savedUser);
      markSessionActivity();
      setToken(savedToken);
      setSessionUser(user);
      if (bootstrapRef.current) {
        bootstrapRef.current({ user, token: savedToken });
      }
    }
  }, []);

  useEffect(() => {
    if (!token) return undefined;

    const activityEvents = ["click", "keydown", "mousemove", "scroll", "touchstart"];
    const onActivity = () => {
      markSessionActivity();
    };

    const interval = setInterval(() => {
      if (isSessionExpiredByInactivity()) {
        handleLogout("Sesion expirada por inactividad. Inicia sesion nuevamente.");
      }
    }, 60 * 1000);

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, onActivity, { passive: true });
    });

    return () => {
      clearInterval(interval);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, onActivity);
      });
    };
  }, [token]);

  async function handleLogin(e) {
    e.preventDefault();
    setStatus({ type: "", text: "" });
    try {
      const res = await login(loginForm);
      localStorage.setItem("comercio_token", res.token);
      localStorage.setItem("comercio_user", JSON.stringify(res.user));
      markSessionActivity();
      setToken(res.token);
      setSessionUser(res.user);
      setStatus({ type: "ok", text: `Bienvenido ${res.user.name}` });
      if (bootstrapRef.current) {
        await bootstrapRef.current({ user: res.user, token: res.token });
      }
    } catch (e2) {
      setStatus({ type: "error", text: e2.message });
    }
  }

  return {
    token,
    sessionUser,
    loginForm,
    setLoginForm,
    handleLogin,
    handleLogout,
  };
}
