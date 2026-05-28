import { useState } from "react";
import { closeCashSession, getMyCashSession, openCashSession, withdrawCashSession } from "../../lib/api";

export default function useCashFlow({ token, setStatus }) {
  const emptyInfo = { hasOpenSession: false, session: null, summary: null, movements: [], recentSessions: [] };
  const [cashSessionInfo, setCashSessionInfo] = useState({ hasOpenSession: false, session: null, summary: null, movements: [], recentSessions: [] });
  const [showCashPrompt, setShowCashPrompt] = useState(false);
  const [openAmountInput, setOpenAmountInput] = useState("0");
  const [showOpenCashModal, setShowOpenCashModal] = useState(false);
  const [closeAmountInput, setCloseAmountInput] = useState("");
  const [showCloseCashModal, setShowCloseCashModal] = useState(false);
  const [showWithdrawCashModal, setShowWithdrawCashModal] = useState(false);
  const [withdrawAmountInput, setWithdrawAmountInput] = useState("");
  const [withdrawAdminPassword, setWithdrawAdminPassword] = useState("");

  async function refreshCashSession(authToken = token) {
    if (!authToken) {
      setCashSessionInfo(emptyInfo);
      return emptyInfo;
    }
    try {
      const result = await getMyCashSession(authToken);
      const info = {
        hasOpenSession: Boolean(result?.hasOpenSession),
        session: result?.session || null,
        summary: result?.summary || null,
        movements: result?.movements || [],
        recentSessions: result?.recentSessions || [],
      };
      setCashSessionInfo(info);
      return info;
    } catch (error) {
      if (error.status === 404) {
        setCashSessionInfo(emptyInfo);
        return emptyInfo;
      }
      throw error;
    }
  }

  function resetCashState() {
    setCashSessionInfo(emptyInfo);
    setShowCashPrompt(false);
    setOpenAmountInput("0");
    setShowOpenCashModal(false);
    setCloseAmountInput("");
    setShowCloseCashModal(false);
    setShowWithdrawCashModal(false);
    setWithdrawAmountInput("");
    setWithdrawAdminPassword("");
  }

  async function handleOpenCashSession() {
    try {
      const amount = Number(openAmountInput);
      if (!Number.isFinite(amount) || amount < 0) {
        setStatus({ type: "error", text: "Monto de apertura invalido" });
        return false;
      }
      const opened = await openCashSession({ openingAmount: amount }, token);
      setCashSessionInfo((prev) => ({
        hasOpenSession: true,
        session: opened?.session || null,
        summary: opened?.summary || null,
        movements: opened?.movements || [],
        recentSessions: opened?.session ? [opened.session, ...(prev.recentSessions || [])] : (prev.recentSessions || []),
      }));
      await refreshCashSession(token);
      setShowCashPrompt(false);
      setCloseAmountInput("");
      setStatus({ type: "ok", text: "Caja abierta correctamente" });
      return true;
    } catch (error) {
      setStatus({ type: "error", text: error.message });
      return false;
    }
  }

  async function handleCloseCashSession() {
    try {
      const amount = Number(closeAmountInput);
      if (!Number.isFinite(amount) || amount < 0) {
        setStatus({ type: "error", text: "Monto de cierre invalido" });
        return false;
      }
      await closeCashSession({ closingAmount: amount }, token);
      await refreshCashSession(token);
      setCloseAmountInput("");
      setStatus({ type: "ok", text: "Caja cerrada correctamente" });
      return true;
    } catch (error) {
      try {
        await refreshCashSession(token);
      } catch (_syncError) {}
      setStatus({ type: "error", text: error.message });
      return false;
    }
  }

  function openOpenCashModal() {
    setOpenAmountInput("0");
    setShowOpenCashModal(true);
  }

  function closeOpenCashModal() {
    setShowOpenCashModal(false);
  }

  function openCloseCashModal() {
    setShowCloseCashModal(true);
  }

  function closeCloseCashModal() {
    setShowCloseCashModal(false);
  }

  function openWithdrawCashModal() {
    setWithdrawAmountInput("");
    setWithdrawAdminPassword("");
    setShowWithdrawCashModal(true);
  }

  function closeWithdrawCashModal() {
    setShowWithdrawCashModal(false);
  }

  async function confirmCloseCashSession() {
    const ok = await handleCloseCashSession();
    if (ok) closeCloseCashModal();
  }

  async function confirmOpenCashSession() {
    const ok = await handleOpenCashSession();
    if (ok) setShowOpenCashModal(false);
  }

  async function confirmWithdrawCashSession() {
    try {
      const amount = Number(withdrawAmountInput);
      if (!Number.isFinite(amount) || amount <= 0) {
        setStatus({ type: "error", text: "Monto de retiro invalido" });
        return;
      }
      if (!withdrawAdminPassword.trim()) {
        setStatus({ type: "error", text: "Debes ingresar una contrasena de administrador" });
        return;
      }

      await withdrawCashSession({ amount, adminPassword: withdrawAdminPassword }, token);
      await refreshCashSession(token);
      setShowWithdrawCashModal(false);
      setWithdrawAmountInput("");
      setWithdrawAdminPassword("");
      setStatus({ type: "ok", text: "Retiro de caja registrado correctamente" });
    } catch (error) {
      setStatus({ type: "error", text: error.message });
    }
  }

  return {
    cashSessionInfo,
    showCashPrompt,
    setShowCashPrompt,
    openAmountInput,
    setOpenAmountInput,
    showOpenCashModal,
    closeAmountInput,
    setCloseAmountInput,
    showCloseCashModal,
    showWithdrawCashModal,
    withdrawAmountInput,
    setWithdrawAmountInput,
    withdrawAdminPassword,
    setWithdrawAdminPassword,
    refreshCashSession,
    handleOpenCashSession,
    openOpenCashModal,
    closeOpenCashModal,
    openCloseCashModal,
    closeCloseCashModal,
    openWithdrawCashModal,
    closeWithdrawCashModal,
    confirmCloseCashSession,
    confirmOpenCashSession,
    confirmWithdrawCashSession,
    resetCashState,
  };
}
