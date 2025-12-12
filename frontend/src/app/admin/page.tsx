"use client";
import { useEffect, useMemo, useState, ChangeEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import Button from "@/components/ui/Button";
import type { Order } from "@/types/order";
import type { User } from "@/types/user";
import type { Cargo } from "@/types/order";

const statusTone: Record<string, string> = {
  WAITING_PAYMENT: "bg-amber-100 text-amber-700 border-amber-200",
  PAYMENT_CONFIRMED: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

interface PillProps {
  tone?: string;
  children: ReactNode;
}

const Pill = ({ tone, children }: PillProps): React.JSX.Element => (
  <span
    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
      tone || "bg-slate-100 text-slate-700 border-slate-200"
    }`}
  >
    {children}
  </span>
);

const formatDate = (v: string | Date | undefined): string => {
  if (!v) return "-";
  return new Intl.DateTimeFormat("mn", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(v));
};

interface Settings {
  cnyRate?: string | number;
  bankName?: string;
  bankAccount?: string;
  bankOwner?: string;
  updatedAt?: string | Date;
  [key: string]: unknown;
}

interface NewCargo {
  name: string;
  description: string;
  siteUrl: string;
  contactPhone: string;
}

interface Agent {
  _id: string;
  userId?: User;
  verificationStatus?: string;
}

interface CardRequest {
  _id: string;
  userId?: User;
  quantity?: number;
  totalAmount?: number;
  transactionNumber?: string;
  paymentInfo?: {
    bankName?: string;
    bankAccount?: string;
    bankOwner?: string;
  };
  status?: string;
  createdAt?: string | Date;
}

interface TrackingDraft {
  [orderId: string]: string;
}

const ADMIN_EMAIL = 'erdenebilegamgalan@gmail.com';

export default function AdminPage(): React.JSX.Element {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [settings, setSettings] = useState<Settings>({
    cnyRate: "",
    bankName: "",
    bankAccount: "",
    bankOwner: "",
  });
  const [settingsBackup, setSettingsBackup] = useState<Settings | null>(null);
  const [editingRate, setEditingRate] = useState<boolean>(false);
  const [editingBank, setEditingBank] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [actionId, setActionId] = useState<string>("");
  const [savingSettings, setSavingSettings] = useState<boolean>(false);
  const [cargoSaving, setCargoSaving] = useState<string>("");
  const [showCargoForm, setShowCargoForm] = useState<boolean>(false);
  const [newCargo, setNewCargo] = useState<NewCargo>({
    name: "",
    description: "",
    siteUrl: "",
    contactPhone: "",
  });
  const [trackingDraft, setTrackingDraft] = useState<TrackingDraft>({});
  const [trackingSaving, setTrackingSaving] = useState<string>("");
  const [paidFrom, setPaidFrom] = useState<string>("");
  const [paidTo, setPaidTo] = useState<string>("");
  const [cardRequests, setCardRequests] = useState<CardRequest[]>([]);
  const [cardRequestActionId, setCardRequestActionId] = useState<string>("");

  useEffect(() => {
    let alive = true;

    const checkAuth = async (): Promise<boolean> => {
      try {
        const me = await api<User>("/api/auth/me");
        if (!me || !me._id) {
          router.replace("/admin/login");
          return false;
        }
        const roles = me?.roles || [];
        if (!roles.includes("admin") && !(roles as string[]).includes("super_admin")) {
          router.replace("/admin/login");
          return false;
        }
        return true;
      } catch (err) {
        // 401 алдааг тусгайлан боловсруулах
        console.log("[Admin] Auth check failed, redirecting to login");
        router.replace("/admin/login");
        return false;
      }
    };

    const load = async (): Promise<void> => {
      setLoading(true);
      setError("");
      try {
        const ok = await checkAuth();
        if (!ok) return;
        const [ordersData, agentsData, cargosData, settingsData, cardRequestsData] =
          await Promise.all([
            api<Order[]>("/api/admin/orders"),
            api<Agent[]>("/api/admin/agents"),
            api<Cargo[]>("/api/admin/cargos"),
            api<Settings>("/api/admin/settings"),
            api<CardRequest[]>("/api/admin/card-requests"),
          ]);
        if (!alive) return;
        setOrders((ordersData as Order[]) || []);
        setAgents((agentsData as Agent[]) || []);
        setCargos((cargosData as Cargo[]) || []);
        setSettings((p) => ({ ...p, ...((settingsData as Settings) || {}) }));
        setSettingsBackup((settingsData as Settings) || {});
        setCardRequests((cardRequestsData as CardRequest[]) || []);
        const draft: TrackingDraft = {};
        ((ordersData as Order[]) || []).forEach((o) => {
          const tracking = typeof o.tracking === "object" ? o.tracking : null;
          if (tracking?.code) draft[o._id] = tracking.code;
        });
        setTrackingDraft(draft);
      } catch (err) {
        if (!alive) return;
        const error = err as Error;
        setError(error.message || "Системийн алдаа.");
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    const socket = getSocket();
    if (!socket) return;
    socket.on("order:new", load);
    socket.on("order:update", load);
    return () => {
      alive = false;
      socket.off("order:new", load);
      socket.off("order:update", load);
    };
  }, [router]);

  const waiting = useMemo<Order[]>(
    () => orders.filter((o) => o.status === "WAITING_PAYMENT"),
    [orders]
  );
  const pendingAgents = useMemo<Agent[]>(
    () => agents.filter((a) => a.verificationStatus === "pending"),
    [agents]
  );
  const activeAgents = useMemo<Agent[]>(
    () => agents.filter((a) => a.verificationStatus === "verified"),
    [agents]
  );
  const rate = Number(settings.cnyRate) || 0;
  const uniqueUsers = useMemo<number>(
    () =>
      new Set(orders.map((o) => {
        if (!o.userId) return "";
        const userIdObj = o.userId as User | string;
        const userId = typeof userIdObj === "object" ? userIdObj?._id : userIdObj;
        return userId?.toString() || userId || "";
      })).size,
    [orders]
  );
  const totalPaidMnt = useMemo<number>(
    () =>
      orders.reduce((sum, o) => {
        const payment = typeof o.payment === "object" ? o.payment : null;
        if (payment?.status === "confirmed" && payment?.amountMnt)
          return sum + Number(payment.amountMnt);
        return sum;
      }, 0),
    [orders]
  );
  const confirmedOrders = useMemo<Order[]>(
    () =>
      orders.filter(
        (o) => {
          const payment = typeof o.payment === "object" ? o.payment : null;
          return payment?.status === "confirmed" || o.status === "PAYMENT_CONFIRMED";
        }
      ),
    [orders]
  );
  const filteredConfirmed = useMemo<Order[]>(() => {
    if (!paidFrom && !paidTo) return confirmedOrders;
    const from = paidFrom ? new Date(paidFrom) : null;
    const to = paidTo ? new Date(paidTo) : null;
    return confirmedOrders.filter((o) => {
      const payment = typeof o.payment === "object" ? o.payment : null;
      const paidAt = payment?.paidAt ? new Date(payment.paidAt) : null;
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
  const pendingCardRequests = useMemo<CardRequest[]>(
    () => cardRequests.filter((r) => r.status === "pending"),
    [cardRequests]
  );

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-500">Ачааллаж байна...</p>
      </main>
    );
  }

  const handleConfirm = async (id: string): Promise<void> => {
    setActionId(id);
    setError("");
    try {
      const updated = await api<Order>(`/api/admin/orders/${id}/confirm-payment`, {
        method: "POST",
      });
      setOrders((prev) => prev.map((o) => (o._id === id ? updated : o)));
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Төлбөр батлахад алдаа гарлаа.");
    } finally {
      setActionId("");
    }
  };

  const handleAgentVerify = async (userId: string, status: string): Promise<void> => {
    setActionId(userId);
    setError("");
    try {
      const updated = await api<Agent>(`/api/admin/agents/${userId}/verify`, {
        method: "POST",
        body: { status },
      });
      setAgents((prev) =>
        prev.map((a) => {
          const aUserId = typeof a.userId === "object" ? a.userId?._id : a.userId;
          return aUserId === userId ? { ...a, ...updated } : a;
        })
      );
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Агентыг баталгаажуулахад алдаа гарлаа.");
    } finally {
      setActionId("");
    }
  };

  const handleAgentActive = async (userId: string, isActive: boolean): Promise<void> => {
    setActionId(userId);
    setError("");
    try {
      await api(`/api/admin/agents/${userId}/status`, {
        method: "POST",
        body: { isActive },
      });
      setAgents((prev) =>
        prev.map((a) => {
          const aUserId = typeof a.userId === "object" ? a.userId : null;
          return aUserId?._id === userId
            ? { ...a, userId: { ...aUserId, isActive } }
            : a;
        })
      );
    } catch (err) {
      const error = err as Error;
      setError(
        error.message || "Агентийг идэвхжүүлэх/идэвхгүй болгох үед алдаа гарлаа."
      );
    } finally {
      setActionId("");
    }
  };

  const saveSettings = async (patch: Partial<Settings> = {}, onDone?: () => void): Promise<void> => {
    setSavingSettings(true);
    setError("");
    try {
      const saved = await api<Settings>("/api/admin/settings", {
        method: "POST",
        body: {
          ...settings,
          ...patch,
          cnyRate:
            patch.cnyRate !== undefined
              ? Number(patch.cnyRate)
              : settings.cnyRate
              ? Number(settings.cnyRate)
              : "",
        },
      });
      setSettings((prev) => ({ ...prev, ...saved }));
      setSettingsBackup({ ...saved });
      if (onDone) onDone();
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Тохиргоо хадгалах үед алдаа гарлаа.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleBankCancel = (): void => {
    if (settingsBackup) setSettings(settingsBackup);
    setEditingBank(false);
  };

  const handleCreateCargo = async (): Promise<void> => {
    if (!newCargo.name) {
      setError("Карго нэр заавал бөглөнө үү.");
      return;
    }
    setCargoSaving("new");
    setError("");
    try {
      const created = await api<Cargo>("/api/admin/cargos", {
        method: "POST",
        body: newCargo,
      });
      setCargos((prev) => [created, ...prev]);
      setNewCargo({ name: "", description: "", siteUrl: "", contactPhone: "" });
      setShowCargoForm(false);
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Карго нэмэх үед алдаа гарлаа.");
    } finally {
      setCargoSaving("");
    }
  };

  const toggleCargo = async (id: string, isActive: boolean): Promise<void> => {
    setCargoSaving(id);
    setError("");
    try {
      const updated = await api<Cargo>(`/api/admin/cargos/${id}/status`, {
        method: "POST",
        body: { isActive },
      });
      setCargos((prev) => prev.map((c) => (c._id === id ? updated : c)));
    } catch (err) {
      const error = err as Error;
      setError(
        error.message || "Карго идэвхжүүлэх/идэвхгүй болгох үед алдаа гарлаа."
      );
    } finally {
      setCargoSaving("");
    }
  };

  const deleteCargo = async (id: string): Promise<void> => {
    setCargoSaving(id);
    setError("");
    try {
      await api(`/api/admin/cargos/${id}`, { method: "DELETE" });
      setCargos((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Карго устгах үед алдаа гарлаа.");
    } finally {
      setCargoSaving("");
    }
  };

  const handleTrackingSave = async (orderId: string): Promise<void> => {
    const code = trackingDraft[orderId] ?? "";
    setTrackingSaving(orderId);
    setError("");
    try {
      const updated = await api<Order>(`/api/admin/orders/${orderId}/tracking`, {
        method: "POST",
        body: { code },
      });
      setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)));
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Tracking код хадгалах үед алдаа гарлаа.");
    } finally {
      setTrackingSaving("");
    }
  };

  const handleConfirmCardRequest = async (requestId: string): Promise<void> => {
    setCardRequestActionId(requestId);
    setError("");
    try {
      const updated = await api<CardRequest>(`/api/admin/card-requests/${requestId}/confirm`, {
        method: "POST",
      });
      setCardRequests((prev) => prev.map((r) => (r._id === requestId ? updated : r)));
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Картын хүсэлт баталгаажуулахад алдаа гарлаа.");
    } finally {
      setCardRequestActionId("");
    }
  };

  const handleRejectCardRequest = async (requestId: string): Promise<void> => {
    const reason = prompt("Татгалзах шалтгаан:");
    if (!reason) return;
    setCardRequestActionId(requestId);
    setError("");
    try {
      const updated = await api<CardRequest>(`/api/admin/card-requests/${requestId}/reject`, {
        method: "POST",
        body: { reason },
      });
      setCardRequests((prev) => prev.map((r) => (r._id === requestId ? updated : r)));
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Картын хүсэлт татгалзахад алдаа гарлаа.");
    } finally {
      setCardRequestActionId("");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-[0.25em]">
              Admin
            </p>
            <h1 className="text-2xl font-semibold">AgentBuy админ самбар</h1>
            <p className="text-sm text-slate-600">
              Захиалга, агент, карго, төлбөрийг нэг цонхоор удирдана.
            </p>
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
            <p className="text-xl font-semibold text-slate-900">
              {orders.length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
            <p className="text-xs text-slate-500">Идэвхтэй агент</p>
            <p className="text-xl font-semibold text-slate-900">
              {activeAgents.length}{" "}
              <span className="text-xs text-slate-500">/ {agents.length}</span>
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
            <p className="text-xs text-slate-500">Давхардсан хэрэглэгч</p>
            <p className="text-xl font-semibold text-slate-900">
              {uniqueUsers}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
            <p className="text-xs text-slate-500">Баталгаажсан төлбөр (₮)</p>
            <p className="text-xl font-semibold text-slate-900">
              {totalPaidMnt ? totalPaidMnt.toLocaleString() : "0"}
            </p>
          </div>
        </section>

        <section className="grid gap-6">
          <div className="rounded-3xl border w-full border-slate-200 bg-white/80 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <h3 className="text-base font-semibold">
                Төлбөр хүлээж байгаа ({waiting.length})
              </h3>
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
                    <th className="px-4 py-3 text-left">Үйлдэл</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {waiting.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-6 text-center text-slate-500"
                      >
                        Төлбөр хүлээх захиалга алга.
                      </td>
                    </tr>
                  )}
                  {waiting.map((order) => {
                    const cargoName = typeof order.cargoId === "object" && order.cargoId?.name ? order.cargoId.name : "Карго сонгоогүй";
                    const itemCount = order.items?.length || 0;
                    const qty =
                      order.items?.reduce(
                        (s, it) => s + (it.quantity || 0),
                        0
                      ) || 0;
                    const totalCny =
                      order.report?.pricing?.grandTotalCny || 0;
                    const totalMnt = rate ? Math.round(totalCny * rate) : null;
                    return (
                      <tr key={order._id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-mono text-xs text-slate-700">
                          #{order._id?.slice(-6)}
                        </td>
                        <td className="px-4 py-3">
                          <Pill tone={statusTone[order.status] || undefined}>
                            {order.status}
                          </Pill>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {cargoName}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {itemCount} бараа / {qty} ширхэг
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {(order.report as { paymentLink?: string })?.paymentLink ? (
                            <button
                              onClick={async (e) => {
                                const link = (order.report as { paymentLink?: string }).paymentLink;
                                if (!link) return;
                                try {
                                  await navigator.clipboard.writeText(link);
                                  const btn = e.target as HTMLElement;
                                  const originalText = btn.textContent;
                                  btn.textContent = "✓ Хуулсан!";
                                  setTimeout(() => {
                                    if (btn.textContent) {
                                      btn.textContent = originalText;
                                    }
                                  }, 2000);
                                } catch (err) {
                                  alert("Хуулах боломжгүй");
                                }
                              }}
                              className="text-xs text-emerald-700 underline hover:text-emerald-800 cursor-pointer"
                              title="Хуулах"
                            >
                              Төлбөрийн холбоос
                            </button>
                          ) : (
                            <span className="text-xs text-slate-500">
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {totalCny || "-"} /{" "}
                          {totalMnt ? totalMnt.toLocaleString() : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            disabled={actionId === order._id}
                            onClick={() => handleConfirm(order._id)}
                            size="sm"
                          >
                            {actionId === order._id
                              ? "Баталгаажуулж..."
                              : "Төлбөр батлах"}
                          </Button>
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
                <h3 className="text-base font-semibold">
                  Ханш, дансны мэдээлэл
                </h3>
                <p className="text-xs text-slate-500">
                  Хэрэглэгчид харах төлбөрийн зааврыг энд шинэчилнэ.
                </p>
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
                      <Button
                        onClick={() => saveSettings({}, () => setEditingRate(false))}
                        disabled={savingSettings}
                        size="sm"
                        className="px-2 py-1 text-[11px]"
                      >
                        {savingSettings ? "Хадгалж..." : "Хадгалах"}
                      </Button>
                      <Button
                        onClick={() => {
                          if (settingsBackup) setSettings(settingsBackup);
                          setEditingRate(false);
                        }}
                        disabled={savingSettings}
                        variant="outline"
                        size="sm"
                        className="px-2 py-1 text-[11px]"
                      >
                        Цуцлах
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={() => setEditingRate(true)} variant="secondary" size="sm" className="px-2 py-1 text-[11px]">
                      Засах
                    </Button>
                  )}
                </div>
                {editingRate ? (
                  <input
                    type="number"
                    value={settings.cnyRate || ""}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setSettings((prev) => ({
                        ...prev,
                        cnyRate: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    placeholder="ж: 480"
                  />
                ) : (
                  <p className="text-base font-semibold text-slate-900">
                    {settings.cnyRate ? `${settings.cnyRate}` : "Тохируулаагүй"}
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    Банк, дансны мэдээлэл
                  </p>
                  {editingBank ? (
                    <div className="flex gap-1">
                      <Button
                        onClick={() => saveSettings({}, () => setEditingBank(false))}
                        disabled={savingSettings}
                        size="sm"
                        className="px-2 py-1 text-[11px]"
                      >
                        {savingSettings ? "Хадгалж..." : "Хадгалах"}
                      </Button>
                      <Button
                        onClick={handleBankCancel}
                        disabled={savingSettings}
                        variant="outline"
                        size="sm"
                        className="px-2 py-1 text-[11px]"
                      >
                        Цуцлах
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        setSettingsBackup({ ...settings });
                        setEditingBank(true);
                      }}
                      variant="secondary"
                      size="sm"
                      className="px-2 py-1 text-[11px]"
                    >
                      Засах
                    </Button>
                  )}
                </div>
                {editingBank ? (
                  <div className="grid gap-2">
                    <input
                      type="text"
                      value={settings.bankName || ""}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setSettings((prev) => ({
                          ...prev,
                          bankName: e.target.value,
                        }))
                      }
                      className="rounded-xl border px-3 py-2 text-sm"
                      placeholder="Банк"
                    />
                    <input
                      type="text"
                      value={settings.bankAccount || ""}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setSettings((prev) => ({
                          ...prev,
                          bankAccount: e.target.value,
                        }))
                      }
                      className="rounded-xl border px-3 py-2 text-sm"
                      placeholder="Данс"
                    />
                    <input
                      type="text"
                      value={settings.bankOwner || ""}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setSettings((prev) => ({
                          ...prev,
                          bankOwner: e.target.value,
                        }))
                      }
                      className="rounded-xl border px-3 py-2 text-sm"
                      placeholder="Эзэмшигч"
                    />
                  </div>
                ) : (
                  <div className="text-sm space-y-1">
                    <p className="font-semibold text-slate-900">
                      {settings.bankName || "Банк: тохируулаагүй"}
                    </p>
                    <p className="font-semibold text-slate-900">
                      {settings.bankAccount || "Данс: тохируулаагүй"}
                    </p>
                    <p className="font-semibold text-slate-900">
                      {settings.bankOwner || "Эзэмшигч: тохируулаагүй"}
                    </p>
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
                    <input
                      type="text"
                      value={newCargo.name}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setNewCargo((p) => ({ ...p, name: e.target.value }))
                      }
                      placeholder="Карго нэр"
                      className="rounded-xl border px-3 py-2 text-sm"
                    />
                    <input
                      type="text"
                      value={newCargo.contactPhone}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setNewCargo((p) => ({
                          ...p,
                          contactPhone: e.target.value,
                        }))
                      }
                      placeholder="Утас"
                      className="rounded-xl border px-3 py-2 text-sm"
                    />
                    <input
                      type="text"
                      value={newCargo.siteUrl}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setNewCargo((p) => ({ ...p, siteUrl: e.target.value }))
                      }
                      placeholder="Вэб/линк"
                      className="rounded-xl border px-3 py-2 text-sm"
                    />
                    <input
                      type="text"
                      value={newCargo.description}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setNewCargo((p) => ({
                          ...p,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Тайлбар"
                      className="rounded-xl border px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={() => setShowCargoForm(false)}
                      variant="outline"
                      size="sm"
                      className="px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      Цуцлах
                    </Button>
                    <Button onClick={handleCreateCargo} disabled={cargoSaving === "new"} size="sm" className="px-4 py-2 text-sm font-semibold">
                      {cargoSaving === "new" ? "Нэмж байна..." : "Нэмэх"}
                    </Button>
                  </div>
                </>
              ) : (
                <Button onClick={() => setShowCargoForm(true)} variant="outline" fullWidth className="border-slate-300 bg-white text-slate-700">
                  Карго нэмэх
                </Button>
              )}
            </div>
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {cargos.map((cargo) => (
                <div
                  key={cargo._id || `cargo-${cargo.name}`}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 px-3 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {cargo.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(cargo as { description?: string }).description || "Тайлбар оруулаагүй"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      disabled={cargoSaving === cargo._id}
                      onClick={() => toggleCargo(cargo._id, !(cargo as { isActive?: boolean }).isActive)}
                      variant="outline"
                      size="sm"
                      className={`px-3 py-2 text-xs font-semibold ${
                        (cargo as { isActive?: boolean }).isActive
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-50 text-slate-700"
                      }`}
                    >
                      {cargoSaving === cargo._id
                        ? "Шинэчилж..."
                        : (cargo as { isActive?: boolean }).isActive
                        ? "Идэвхгүй болгох"
                        : "Идэвхжүүлэх"}
                    </Button>
                    <Button
                      disabled={cargoSaving === cargo._id}
                      onClick={() => deleteCargo(cargo._id)}
                      variant="danger"
                      size="sm"
                      className="px-3 py-2 text-xs font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100"
                    >
                      Устгах
                    </Button>
                  </div>
                </div>
              ))}
              {cargos.length === 0 && (
                <p className="text-xs text-slate-500">
                  Карго бүртгэл хоосон байна.
                </p>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Карго жагсаалт идэвхтэй байж байж хэрэглэгч сонгоно.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/80 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Баталгаажсан төлбөр</h3>
              <Pill>{filteredConfirmed.length} захиалга</Pill>
            </div>
            <div className="flex gap-2 text-xs">
              <input
                type="date"
                value={paidFrom}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPaidFrom(e.target.value)}
                className="w-full rounded-lg border px-2 py-2"
              />
              <input
                type="date"
                value={paidTo}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPaidTo(e.target.value)}
                className="w-full rounded-lg border px-2 py-2"
              />
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 text-sm">
              {filteredConfirmed.length === 0 && (
                <p className="text-slate-500">
                  Баталгаажсан төлбөр одоогоор алга.
                </p>
              )}
              {filteredConfirmed.map((o) => {
                const payment = typeof o.payment === "object" ? o.payment : null;
                return (
                  <div
                    key={o._id}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-slate-600">
                        #{o._id?.slice(-6)}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatDate(payment?.paidAt || o.updatedAt)}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 mt-1">
                      {payment?.amountMnt
                        ? `${Number(payment.amountMnt).toLocaleString()} ₮`
                        : "Дүн оруулаагүй"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {typeof o.cargoId === "object" && o.cargoId?.name ? o.cargoId.name : "Карго сонгоогүй"}
                    </p>
                  </div>
                );
              })}
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
                  <h4 className="text-sm font-semibold">
                    Шинэ агент баталгаажуулах ({pendingAgents.length})
                  </h4>
                </div>
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-1">
                  {pendingAgents.length === 0 && (
                    <p className="text-xs text-slate-500">Шинэ хүсэлт алга.</p>
                  )}
                  {pendingAgents.map((agent) => {
                    const userId = typeof agent.userId === "object" ? agent.userId : null;
                    return (
                      <div
                        key={agent._id}
                        className="rounded-xl border border-slate-200 px-3 py-2"
                      >
                        <p className="text-sm font-semibold text-slate-900">
                          {userId?.fullName || "Нэргүй"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {userId?.phone}
                        </p>
                        <div className="mt-2 flex gap-2">
                          <Button
                            disabled={!userId?._id || actionId === userId._id}
                            onClick={() => handleAgentVerify(userId?._id || "", "verified")}
                            size="sm"
                          >
                            Зөвшөөрөх
                          </Button>
                          <Button
                            disabled={!userId?._id || actionId === userId._id}
                            onClick={() => handleAgentVerify(userId?._id || "", "rejected")}
                            variant="danger"
                            size="sm"
                            className="bg-rose-500 hover:bg-rose-400"
                          >
                            Татгалзах
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold">
                    Бүх агент ({agents.length})
                  </h4>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {agents.map((a) => {
                    const userId = typeof a.userId === "object" ? a.userId : null;
                    return (
                      <div
                        key={a._id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {userId?.fullName || "Нэргүй"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {userId?.phone}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Статус: {a.verificationStatus} •{" "}
                            {userId?.isActive ? "Идэвхтэй" : "Идэвхгүй"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            disabled={actionId === userId?._id}
                            onClick={() =>
                              handleAgentVerify(
                                userId?._id || "",
                                a.verificationStatus === "verified" ? "rejected" : "verified"
                              )
                            }
                            variant="outline"
                            size="sm"
                            className="px-3 py-2 text-xs font-semibold text-slate-700"
                          >
                            {a.verificationStatus === "verified" ? "Цуцлах" : "Батлах"}
                          </Button>
                          <Button
                            disabled={actionId === userId?._id}
                            onClick={() => handleAgentActive(userId?._id || "", !userId?.isActive)}
                            variant="outline"
                            size="sm"
                            className={`px-3 py-2 text-xs font-semibold ${
                              userId?.isActive
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-50 text-slate-700"
                            }`}
                          >
                            {userId?.isActive ? "Идэвхгүй болгох" : "Идэвхжүүлэх"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {agents.length === 0 && (
                    <p className="text-sm text-slate-500">
                      Агент байхгүй байна.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6">
          <div className="rounded-3xl border border-slate-200 bg-white/80 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <h3 className="text-base font-semibold">
                Картын хүсэлт ({pendingCardRequests.length})
              </h3>
            </div>
            <div className="w-full">
              {pendingCardRequests.length === 0 ? (
                <div className="px-5 py-6 text-center text-slate-500">
                  Хүлээж байгаа картын хүсэлт алга.
                </div>
              ) : (
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Хэрэглэгч</th>
                      <th className="px-4 py-3 text-left">Картын тоо</th>
                      <th className="px-4 py-3 text-left">Нийт дүн</th>
                      <th className="px-4 py-3 text-left">Гүйлгээний утга</th>
                      <th className="px-4 py-3 text-left">Дансны мэдээлэл</th>
                      <th className="px-4 py-3 text-left">Үүсгэсэн</th>
                      <th className="px-4 py-3 text-left">Үйлдэл</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {pendingCardRequests.map((req) => {
                      const userId = typeof req.userId === "object" ? req.userId : null;
                      return (
                        <tr key={req._id} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {userId?.fullName || "Нэргүй"}
                              </p>
                              <p className="text-xs text-slate-500">{userId?.phone}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{req.quantity} карт</td>
                          <td className="px-4 py-3 text-slate-700">
                            {req.totalAmount?.toLocaleString()}₮
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            <p className="font-medium">{req.transactionNumber || "—"}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            <div className="text-xs">
                              <p>{req.paymentInfo?.bankName || "—"}</p>
                              <p>{req.paymentInfo?.bankAccount || "—"}</p>
                              <p>{req.paymentInfo?.bankOwner || "—"}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {formatDate(req.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <Button
                                disabled={cardRequestActionId === req._id}
                                onClick={() => handleConfirmCardRequest(req._id)}
                                size="sm"
                              >
                                {cardRequestActionId === req._id
                                  ? "Баталгаажуулж..."
                                  : "Баталгаажуулах"}
                              </Button>
                              <Button
                                disabled={cardRequestActionId === req._id}
                                onClick={() => handleRejectCardRequest(req._id)}
                                variant="danger"
                                size="sm"
                              >
                                Татгалзах
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>

        <div className="pt-6 border-t border-slate-200">
          <Button
            onClick={() => {
              localStorage.removeItem("token");
              router.push("/admin/login");
            }}
            variant="danger"
            fullWidth
          >
            🚪 Системээс гарах
          </Button>
        </div>
      </div>
    </main>
  );
}

