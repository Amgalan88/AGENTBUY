"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";

const statusTone = {
  WAITING_PAYMENT: "bg-amber-100 text-amber-700 border-amber-200",
  PAYMENT_CONFIRMED: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const Pill = ({ tone, children }) => (
  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tone || "bg-slate-100 text-slate-700 border-slate-200"}`}>
    {children}
  </span>
);

const formatDate = (v) =>
  v
    ? new Intl.DateTimeFormat("mn", {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(v))
    : "-";

export default function AdminPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [settings, setSettings] = useState({ cnyRate: "", bankName: "", bankAccount: "", bankOwner: "" });
  const [settingsBackup, setSettingsBackup] = useState(null);
  const [editingRate, setEditingRate] = useState(false);
  const [editingBank, setEditingBank] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [cargoSaving, setCargoSaving] = useState("");
  const [showCargoForm, setShowCargoForm] = useState(false);
  const [newCargo, setNewCargo] = useState({ name: "", description: "", siteUrl: "", contactPhone: "" });
  const [trackingDraft, setTrackingDraft] = useState({});
  const [trackingSaving, setTrackingSaving] = useState("");
  const [paidFrom, setPaidFrom] = useState("");
  const [paidTo, setPaidTo] = useState("");

  useEffect(() => {
    let alive = true;

    const checkAuth = async () => {
      try {
        const me = await api("/api/auth/me");
        const roles = me?.roles || [];
        if (!roles.includes("admin") && !roles.includes("super_admin")) {
          router.replace("/admin/login");
          return false;
        }
        return true;
      } catch {
        router.replace("/admin/login");
        return false;
      }
    };

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const ok = await checkAuth();
        if (!ok) return;
        const [ordersData, agentsData, cargosData, settingsData] = await Promise.all([
          api("/api/admin/orders"),
          api("/api/admin/agents"),
          api("/api/admin/cargos"),
          api("/api/admin/settings"),
        ]);
        if (!alive) return;
        setOrders(ordersData || []);
        setAgents(agentsData || []);
        setCargos(cargosData || []);
        setSettings((p) => ({ ...p, ...(settingsData || {}) }));
        setSettingsBackup(settingsData || {});
        const draft = {};
        (ordersData || []).forEach((o) => {
          if (o.tracking?.code) draft[o._id] = o.tracking.code;
        });
        setTrackingDraft(draft);
      } catch (err) {
        if (!alive) return;
        setError(err.message || "Системийн алдаа.");
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    const socket = getSocket();
    socket.on("order:new", load);
    socket.on("order:update", load);
    return () => {
      alive = false;
      socket.off("order:new", load);
      socket.off("order:update", load);
    };
  }, [router]);

  const waiting = useMemo(() => orders.filter((o) => o.status === "WAITING_PAYMENT"), [orders]);
  const pendingAgents = useMemo(() => agents.filter((a) => a.verificationStatus === "pending"), [agents]);
  const activeAgents = useMemo(() => agents.filter((a) => a.verificationStatus === "verified"), [agents]);
  const rate = Number(settings.cnyRate) || 0;
  const uniqueUsers = useMemo(() => new Set(orders.map((o) => o.userId?.toString() || o.userId || "")).size, [orders]);
  const totalPaidMnt = useMemo(
    () =>
      orders.reduce((sum, o) => {
        if (o.payment?.status === "confirmed" && o.payment?.amountMnt) return sum + Number(o.payment.amountMnt);
        return sum;
      }, 0),
    [orders]
  );
  const confirmedOrders = useMemo(() => orders.filter((o) => o.payment?.status === "confirmed" || o.status === "PAYMENT_CONFIRMED"), [orders]);
  const filteredConfirmed = useMemo(() => {
    if (!paidFrom && !paidTo) return confirmedOrders;
    const from = paidFrom ? new Date(paidFrom) : null;
    const to = paidTo ? new Date(paidTo) : null;
    return confirmedOrders.filter((o) => {
      const paidAt = o.payment?.paidAt ? new Date(o.payment.paidAt) : null;
      if (!paidAt) return false;
      if (from && paidAt < from) return false;
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        if (paidAt > end) return false;
      }
      return true;
    });
  }, [confirmedOrders, paidFrom, paidTo]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-500">Ачааллаж байна...</p>
      </main>
    );
  }

  const handleConfirm = async (id) => {
    setActionId(id);
    setError("");
    try {
      const updated = await api(`/api/admin/orders/${id}/confirm-payment`, { method: "POST" });
      setOrders((prev) => prev.map((o) => (o._id === id ? updated : o)));
    } catch (err) {
      setError(err.message || "Төлбөр батлахад алдаа гарлаа.");
    } finally {
      setActionId("");
    }
  };

  const handleAgentVerify = async (userId, status) => {
    setActionId(userId);
    setError("");
    try {
      const updated = await api(`/api/admin/agents/${userId}/verify`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
      setAgents((prev) => prev.map((a) => (a.userId?._id === userId ? { ...a, ...updated } : a)));
    } catch (err) {
      setError(err.message || "Агентыг баталгаажуулахад алдаа гарлаа.");
    } finally {
      setActionId("");
    }
  };

  const handleAgentActive = async (userId, isActive) => {
    setActionId(userId);
    setError("");
    try {
      await api(`/api/admin/agents/${userId}/status`, {
        method: "POST",
        body: JSON.stringify({ isActive }),
      });
      setAgents((prev) => prev.map((a) => (a.userId?._id === userId ? { ...a, userId: { ...a.userId, isActive } } : a)));
    } catch (err) {
      setError(err.message || "Агентийг идэвхжүүлэх/идэвхгүй болгох үед алдаа гарлаа.");
    } finally {
      setActionId("");
    }
  };

  const saveSettings = async (patch = {}, onDone) => {
    setSavingSettings(true);
    setError("");
    try {
      const saved = await api("/api/admin/settings", {
        method: "POST",
        body: JSON.stringify({
          ...settings,
          ...patch,
          cnyRate: patch.cnyRate !== undefined ? Number(patch.cnyRate) : settings.cnyRate ? Number(settings.cnyRate) : "",
        }),
      });
      setSettings((prev) => ({ ...prev, ...saved }));
      setSettingsBackup({ ...saved });
      if (onDone) onDone();
    } catch (err) {
      setError(err.message || "Тохиргоо хадгалах үед алдаа гарлаа.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleBankCancel = () => {
    if (settingsBackup) setSettings(settingsBackup);
    setEditingBank(false);
  };

  const handleCreateCargo = async () => {
    if (!newCargo.name) {
      setError("Карго нэр заавал бөглөнө үү.");
      return;
    }
    setCargoSaving("new");
    setError("");
    try {
      const created = await api("/api/admin/cargos", {
        method: "POST",
        body: JSON.stringify(newCargo),
      });
      setCargos((prev) => [created, ...prev]);
      setNewCargo({ name: "", description: "", siteUrl: "", contactPhone: "" });
      setShowCargoForm(false);
    } catch (err) {
      setError(err.message || "Карго нэмэх үед алдаа гарлаа.");
    } finally {
      setCargoSaving("");
    }
  };

  const toggleCargo = async (id, isActive) => {
    setCargoSaving(id);
    setError("");
    try {
      const updated = await api(`/api/admin/cargos/${id}/status`, {
        method: "POST",
        body: JSON.stringify({ isActive }),
      });
      setCargos((prev) => prev.map((c) => (c._id === id ? updated : c)));
    } catch (err) {
      setError(err.message || "Карго идэвхжүүлэх/идэвхгүй болгох үед алдаа гарлаа.");
    } finally {
      setCargoSaving("");
    }
  };

  const deleteCargo = async (id) => {
    setCargoSaving(id);
    setError("");
    try {
      await api(`/api/admin/cargos/${id}`, { method: "DELETE" });
      setCargos((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      setError(err.message || "Карго устгах үед алдаа гарлаа.");
    } finally {
      setCargoSaving("");
    }
  };

  const handleTrackingSave = async (orderId) => {
    const code = trackingDraft[orderId] ?? "";
    setTrackingSaving(orderId);
    setError("");
    try {
      const updated = await api(`/api/admin/orders/${orderId}/tracking`, {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)));
    } catch (err) {
      setError(err.message || "Tracking код хадгалах үед алдаа гарлаа.");
    } finally {
      setTrackingSaving("");
    }
  };
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-[0.25em]">Admin</p>
            <h1 className="text-2xl font-semibold">AgentBuy админ самбар</h1>
            <p className="text-sm text-slate-600">Захиалга, агент, карго, төлбөрийг нэг цонхоор удирдана.</p>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {error}
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
            <p className="text-xs text-slate-500">Нийт захиалга</p>
            <p className="text-xl font-semibold text-slate-900">{orders.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
            <p className="text-xs text-slate-500">Идэвхтэй агент</p>
            <p className="text-xl font-semibold text-slate-900">
              {activeAgents.length} <span className="text-xs text-slate-500">/ {agents.length}</span>
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
            <p className="text-xs text-slate-500">Давхардсан хэрэглэгч</p>
            <p className="text-xl font-semibold text-slate-900">{uniqueUsers}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
            <p className="text-xs text-slate-500">Баталгаажсан төлбөр (₮)</p>
            <p className="text-xl font-semibold text-slate-900">{totalPaidMnt ? totalPaidMnt.toLocaleString() : "0"}</p>
          </div>
        </section>

        <section className="grid gap-6">
          <div className="rounded-3xl border w-full border-slate-200 bg-white/80 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <h3 className="text-base font-semibold">Төлбөр хүлээж байгаа ({waiting.length})</h3>
            </div>
            <div className="w-full">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">Төлөв</th>
                    <th className="px-4 py-3 text-left">Карго</th>
                    <th className="px-4 py-3 text-left">Бараа/тоо</th>
                    <th className="px-4 py-3 text-left">Үүсгэсэн</th>
                    <th className="px-4 py-3 text-left">Төлбөрийн холбоос</th>
                    <th className="px-4 py-3 text-left">Нийт үнэ (CNY/MNT)</th>
                    <th className="px-4 py-3 text-left">Tracking</th>
                    <th className="px-4 py-3 text-left">Үйлдэл</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {waiting.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-6 text-center text-slate-500">
                        Төлбөр хүлээх захиалга алга.
                      </td>
                    </tr>
                  )}
                  {waiting.map((order) => {
                    const cargoName = order.cargoId?.name || "Карго сонгоогүй";
                    const itemCount = order.items?.length || 0;
                    const qty = order.items?.reduce((s, it) => s + (it.quantity || 0), 0) || 0;
                    const totalCny = order.report?.pricing?.grandTotalCny || order.report?.priceCny || 0;
                    const totalMnt = rate ? Math.round(totalCny * rate) : null;
                    return (
                      <tr key={order._id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-mono text-xs text-slate-700">#{order._id?.slice(-6)}</td>
                        <td className="px-4 py-3">
                          <Pill tone={statusTone[order.status] || undefined}>{order.status}</Pill>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{cargoName}</td>
                        <td className="px-4 py-3 text-slate-700">
                          {itemCount} бараа / {qty} ширхэг
                        </td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(order.createdAt)}</td>
                        <td className="px-4 py-3 text-slate-700">
                          {order.report?.paymentLink ? (
                            <a href={order.report.paymentLink} target="_blank" rel="noreferrer" className="text-xs text-emerald-700 underline">
                              Төлбөрийн холбоос
                            </a>
                          ) : (
                            <span className="text-xs text-slate-500">Одоогоор холбоосгүй</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {totalCny || "-"} / {totalMnt ? totalMnt.toLocaleString() : "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={trackingDraft[order._id] ?? order.tracking?.code ?? ""}
                              onChange={(e) => setTrackingDraft((p) => ({ ...p, [order._id]: e.target.value }))}
                              className="w-28 rounded-md border px-2 py-1 text-xs"
                              placeholder="TRK код"
                            />
                            <button
                              disabled={trackingSaving === order._id}
                              onClick={() => handleTrackingSave(order._id)}
                              className="rounded-md bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                            >
                              {trackingSaving === order._id ? "Хадгалж..." : "Хадгалах"}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            disabled={actionId === order._id}
                            onClick={() => handleConfirm(order._id)}
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                          >
                            {actionId === order._id ? "Баталгаажуулж..." : "Төлбөр батлах"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white/80 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">Ханш, дансны мэдээлэл</h3>
                <p className="text-xs text-slate-500">Хэрэглэгчид харах төлбөрийн зааврыг энд шинэчилнэ.</p>
              </div>
              <div className="flex items-center gap-2">
                <Pill>Шинэчлэл: {formatDate(settings.updatedAt)}</Pill>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">Ханш (MNT/CNY)</p>
                  {editingRate ? (
                    <div className="flex gap-1">
                      <button onClick={() => saveSettings({}, () => setEditingRate(false))} disabled={savingSettings} className="rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500 disabled:opacity-60">
                        {savingSettings ? "Хадгалж..." : "Хадгалах"}
                      </button>
                      <button
                        onClick={() => {
                          if (settingsBackup) setSettings(settingsBackup);
                          setEditingRate(false);
                        }}
                        disabled={savingSettings}
                        className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-60"
                      >
                        Цуцлах
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setEditingRate(true)} className="rounded-md bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white hover:bg-slate-700">
                      Засах
                    </button>
                  )}
                </div>
                {editingRate ? (
                  <input
                    type="number"
                    value={settings.cnyRate || ""}
                    onChange={(e) => setSettings((prev) => ({ ...prev, cnyRate: e.target.value }))}
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    placeholder="ж: 480"
                  />
                ) : (
                  <p className="text-base font-semibold text-slate-900">{settings.cnyRate ? `${settings.cnyRate}` : "Тохируулаагүй"}</p>
                )}
              </div>
              <div className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">Банк, дансны мэдээлэл</p>
                  {editingBank ? (
                    <div className="flex gap-1">
                      <button onClick={() => saveSettings({}, () => setEditingBank(false))} disabled={savingSettings} className="rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500 disabled:opacity-60">
                        {savingSettings ? "Хадгалж..." : "Хадгалах"}
                      </button>
                      <button onClick={handleBankCancel} disabled={savingSettings} className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-60">
                        Цуцлах
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSettingsBackup({ ...settings });
                        setEditingBank(true);
                      }}
                      className="rounded-md bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white hover:bg-slate-700"
                    >
                      Засах
                    </button>
                  )}
                </div>
                {editingBank ? (
                  <div className="grid gap-2">
                    <input type="text" value={settings.bankName || ""} onChange={(e) => setSettings((prev) => ({ ...prev, bankName: e.target.value }))} className="rounded-xl border px-3 py-2 text-sm" placeholder="Банк" />
                    <input type="text" value={settings.bankAccount || ""} onChange={(e) => setSettings((prev) => ({ ...prev, bankAccount: e.target.value }))} className="rounded-xl border px-3 py-2 text-sm" placeholder="Данс" />
                    <input type="text" value={settings.bankOwner || ""} onChange={(e) => setSettings((prev) => ({ ...prev, bankOwner: e.target.value }))} className="rounded-xl border px-3 py-2 text-sm" placeholder="Эзэмшигч" />
                  </div>
                ) : (
                  <div className="text-sm space-y-1">
                    <p className="font-semibold text-slate-900">{settings.bankName || "Банк: тохируулаагүй"}</p>
                    <p className="font-semibold text-slate-900">{settings.bankAccount || "Данс: тохируулаагүй"}</p>
                    <p className="font-semibold text-slate-900">{settings.bankOwner || "Эзэмшигч: тохируулаагүй"}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/80 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Карго жагсаалт</h3>
              <Pill>Нийт: {cargos.length}</Pill>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-3 space-y-2">
              {showCargoForm ? (
                <>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input type="text" value={newCargo.name} onChange={(e) => setNewCargo((p) => ({ ...p, name: e.target.value }))} placeholder="Карго нэр" className="rounded-xl border px-3 py-2 text-sm" />
                    <input type="text" value={newCargo.contactPhone} onChange={(e) => setNewCargo((p) => ({ ...p, contactPhone: e.target.value }))} placeholder="Утас" className="rounded-xl border px-3 py-2 text-sm" />
                    <input type="text" value={newCargo.siteUrl} onChange={(e) => setNewCargo((p) => ({ ...p, siteUrl: e.target.value }))} placeholder="Вэб/линк" className="rounded-xl border px-3 py-2 text-sm" />
                    <input type="text" value={newCargo.description} onChange={(e) => setNewCargo((p) => ({ ...p, description: e.target.value }))} placeholder="Тайлбар" className="rounded-xl border px-3 py-2 text-sm" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowCargoForm(false)} className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                      Цуцлах
                    </button>
                    <button onClick={handleCreateCargo} disabled={cargoSaving === "new"} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60">
                      {cargoSaving === "new" ? "Нэмж байна..." : "Нэмэх"}
                    </button>
                  </div>
                </>
              ) : (
                <button onClick={() => setShowCargoForm(true)} className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Карго нэмэх
                </button>
              )}
            </div>
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {cargos.map((cargo) => (
                <div key={cargo._id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-3 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{cargo.name}</p>
                    <p className="text-xs text-slate-500">{cargo.description || "Тайлбар оруулаагүй"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={cargoSaving === cargo._id}
                      onClick={() => toggleCargo(cargo._id, !cargo.isActive)}
                      className={`rounded-lg px-3 py-2 text-xs font-semibold ${cargo.isActive ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-700 border border-slate-200"}`}
                    >
                      {cargoSaving === cargo._id ? "Шинэчилж..." : cargo.isActive ? "Идэвхгүй болгох" : "Идэвхжүүлэх"}
                    </button>
                    <button
                      disabled={cargoSaving === cargo._id}
                      onClick={() => deleteCargo(cargo._id)}
                      className="rounded-lg bg-rose-50 text-rose-600 border border-rose-200 px-3 py-2 text-xs font-semibold hover:bg-rose-100 disabled:opacity-60"
                    >
                      Устгах
                    </button>
                  </div>
                </div>
              ))}
              {cargos.length === 0 && <p className="text-xs text-slate-500">Карго бүртгэл хоосон байна.</p>}
            </div>
            <p className="text-xs text-slate-500">Карго жагсаалт идэвхтэй байж байж хэрэглэгч сонгоно.</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/80 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Баталгаажсан төлбөр</h3>
              <Pill>{filteredConfirmed.length} захиалга</Pill>
            </div>
            <div className="flex gap-2 text-xs">
              <input type="date" value={paidFrom} onChange={(e) => setPaidFrom(e.target.value)} className="w-full rounded-lg border px-2 py-2" />
              <input type="date" value={paidTo} onChange={(e) => setPaidTo(e.target.value)} className="w-full rounded-lg border px-2 py-2" />
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 text-sm">
              {filteredConfirmed.length === 0 && <p className="text-slate-500">Баталгаажсан төлбөр одоогоор алга.</p>}
              {filteredConfirmed.map((o) => (
                <div key={o._id} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-slate-600">#{o._id?.slice(-6)}</span>
                    <span className="text-xs text-slate-500">{formatDate(o.payment?.paidAt || o.updatedAt)}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {o.payment?.amountMnt ? `${Number(o.payment.amountMnt).toLocaleString()} ₮` : "Дүн оруулаагүй"}
                  </p>
                  <p className="text-xs text-slate-500">{o.cargoId?.name || "Карго сонгоогүй"}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/80 shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Агентын удирдлага</h3>
              <Pill>{agents.length} агент</Pill>
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Шинэ агент баталгаажуулах ({pendingAgents.length})</h4>
                </div>
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-1">
                  {pendingAgents.length === 0 && <p className="text-xs text-slate-500">Шинэ хүсэлт алга.</p>}
                  {pendingAgents.map((agent) => (
                    <div key={agent._id} className="rounded-xl border border-slate-200 px-3 py-2">
                      <p className="text-sm font-semibold text-slate-900">{agent.userId?.fullName || "Нэргүй"}</p>
                      <p className="text-xs text-slate-500">{agent.userId?.phone}</p>
                      <div className="mt-2 flex gap-2">
                        <button
                          disabled={!agent.userId?._id || actionId === agent.userId?._id}
                          onClick={() => handleAgentVerify(agent.userId?._id, "verified")}
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                        >
                          Зөвшөөрөх
                        </button>
                        <button
                          disabled={!agent.userId?._id || actionId === agent.userId?._id}
                          onClick={() => handleAgentVerify(agent.userId?._id, "rejected")}
                          className="rounded-lg bg-rose-500 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-400 disabled:opacity-60"
                        >
                          Татгалзах
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold">Бүх агент ({agents.length})</h4>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {agents.map((a) => (
                    <div key={a._id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{a.userId?.fullName || "Нэргүй"}</p>
                        <p className="text-xs text-slate-500">{a.userId?.phone}</p>
                        <p className="text-[11px] text-slate-500">
                          Статус: {a.verificationStatus} • {a.userId?.isActive ? "Идэвхтэй" : "Идэвхгүй"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          disabled={actionId === a.userId?._id}
                          onClick={() => handleAgentVerify(a.userId._id, a.verificationStatus === "verified" ? "rejected" : "verified")}
                          className="rounded-lg border px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                        >
                          {a.verificationStatus === "verified" ? "Цуцлах" : "Батлах"}
                        </button>
                        <button
                          disabled={actionId === a.userId?._id}
                          onClick={() => handleAgentActive(a.userId._id, !a.userId?.isActive)}
                          className={`rounded-lg px-3 py-2 text-xs font-semibold ${a.userId?.isActive ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-700 border border-slate-200"} disabled:opacity-60`}
                        >
                          {a.userId?.isActive ? "Идэвхгүй болгох" : "Идэвхжүүлэх"}
                        </button>
                      </div>
                    </div>
                  ))}
                  {agents.length === 0 && <p className="text-sm text-slate-500">Агент байхгүй байна.</p>}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
