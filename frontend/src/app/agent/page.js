"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUI } from "../layout";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";

const APP_ICONS = {
  taobao: "/marketplace/taobao.png",
  pinduoduo: "/marketplace/pinduoudo.png",
  "1688": "/marketplace/1688.jpg",
  dewu: "/marketplace/poizon.png",
  any: "/marketplace/taobao.png",
};

const STATUS_LABEL = {
  PUBLISHED: "Нээлттэй",
  AGENT_LOCKED: "Түгжсэн",
  AGENT_RESEARCHING: "Судалгаанд",
  REPORT_SUBMITTED: "Тайлан ирсэн",
  WAITING_USER_REVIEW: "Хэрэглэгч шийдвэрлэж байна",
  WAITING_PAYMENT: "Төлбөр хүлээж",
  COMPLETED: "Дууссан",
};

const STATUS_TONE = {
  PUBLISHED: "bg-slate-600",
  AGENT_LOCKED: "bg-amber-600",
  AGENT_RESEARCHING: "bg-indigo-600",
  REPORT_SUBMITTED: "bg-sky-600",
  WAITING_USER_REVIEW: "bg-sky-600",
  WAITING_PAYMENT: "bg-amber-600",
  COMPLETED: "bg-emerald-600",
};

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("mn", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "-";

export default function AgentPage() {
  const { theme, view } = useUI();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const mainClass =
    theme === "night"
      ? "bg-slate-950 text-slate-50"
      : theme === "mid"
        ? "bg-slate-200 text-slate-900"
        : "bg-slate-100 text-slate-900";

  const widthClass =
    view === "mobile"
      ? "max-w-md"
      : view === "tablet"
        ? "max-w-3xl"
        : "max-w-6xl";

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setError("");
      try {
        const data = await api("/api/agent/orders/available");
        if (!alive) return;
        setOrders(data);
      } catch (err) {
        if (!alive) return;
        setError(err.message || "Нээлттэй захиалга татахад алдаа гарлаа");
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
  }, []);

  const manualRefresh = async () => {
    setRefreshing(true);
    setError("");
    try {
      const data = await api("/api/agent/orders/available");
      setOrders(data);
    } catch (err) {
      setError(err.message || "Нээлттэй захиалга татахад алдаа гарлаа");
    } finally {
      setRefreshing(false);
    }
  };

  const lockOrder = async (orderId) => {
    setActionId(orderId);
    setError("");
    try {
      await api(`/api/agent/orders/${orderId}/lock`, { method: "POST" });
      const data = await api("/api/agent/orders/available");
      setOrders(data);
    } catch (err) {
      setError(err.message || "Түгжихэд алдаа гарлаа");
    } finally {
      setActionId("");
    }
  };

  const mapped = useMemo(
    () =>
      orders.map((o) => {
        const totalQty = o.items?.reduce((s, it) => s + (it.quantity || 0), 0) || 0;
        const firstItem = o.items?.[0] || {};
        const firstTitle = firstItem.title || "Барааны нэр ороогүй";
        const thumb = firstItem.images?.[0] || firstItem.imageUrl || "/marketplace/taobao.png";
        const platformIcon = APP_ICONS[firstItem.app] || APP_ICONS.any;
        const totalCny = o.report?.pricing?.grandTotalCny;
        return { ...o, totalQty, firstTitle, thumb, platformIcon, totalCny };
      }),
    [orders]
  );

  const cardBg = "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white";

  return (
    <main className={`${mainClass} min-h-screen`}>
      <div className={`${widthClass} mx-auto px-4 py-10 space-y-6`}>
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm opacity-70 hover:text-emerald-600">
            ← Буцах
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={manualRefresh}
              disabled={refreshing}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:border-emerald-300 disabled:opacity-60"
            >
              {refreshing ? "Шинэчилж..." : "Шинэчлэх"}
            </button>
            <Link href="/agent/history" className="text-xs md:text-sm text-emerald-600 hover:text-emerald-500">
              Миний захиалгууд
            </Link>
          </div>
        </div>

        <h1 className="text-2xl font-semibold">Нээлттэй захиалгууд</h1>
        <p className="text-sm opacity-70">
          Агент түгжээгүй, ажиллахад бэлэн байгаа хэрэглэгчийн захиалгууд.
        </p>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm opacity-70">
            Уншиж байна...
          </div>
        ) : mapped.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm opacity-70">
            Одоогоор нээлттэй захиалга алга.
          </div>
        ) : (
          <div className="space-y-3">
            {mapped.map((order) => {
              const statusInfo = {
                label: STATUS_LABEL[order.status] || order.status,
                tone: STATUS_TONE[order.status] || STATUS_TONE.PUBLISHED,
              };
              return (
                <article
                  key={order._id}
                  className={`rounded-3xl p-4 shadow-md ${cardBg} border border-slate-700/40 min-h-[180px] flex flex-col gap-3`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-200">
                        <img src={order.platformIcon} alt="app" className="h-5 w-5 rounded" />
                        <span className="font-semibold tracking-wide">AGENTBUY</span>
                        <span className="text-[11px] opacity-80">#{order._id.slice(-6)}</span>
                      </div>
                      <div className="text-xs text-slate-200">Order Card</div>
                      <div className="text-[11px] text-slate-300">
                        Карго: {order.cargoId?.name || order.cargoId || "Тодорхойгүй"}
                      </div>
                    </div>
                    <div className="h-24 w-28 rounded-xl overflow-hidden bg-slate-700 border border-slate-600">
                      <img
                        src={order.thumb}
                        alt={order.firstTitle}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-slate-200">
                    <div className="flex items-center gap-2">
                      <span>📅</span>
                      <span>{formatDate(order.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🛒</span>
                      <span className="line-clamp-1 text-sm font-semibold text-white">
                        {order.firstTitle}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] opacity-80">
                        Нийт мөр: {order.items?.length || 0} • Тоо ширхэг: {order.totalQty}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full px-2 py-1 text-[11px] text-white">
                        <span className={`${statusInfo.tone} px-2 py-1 rounded-full`}>
                          {statusInfo.label}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-lg font-semibold">
                      {order.totalCny ? `${order.totalCny} ¥` : ""}{" "}
                      <span className="text-xs opacity-80">({order.totalQty} ширхэг)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/agent/orders/${order._id}`}
                        className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20 border border-white/20"
                      >
                        Дэлгэрэнгүй
                      </Link>
                      <button
                        disabled={actionId === order._id}
                        onClick={() => lockOrder(order._id)}
                        className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-400 disabled:opacity-70"
                      >
                        {actionId === order._id ? "Түгжиж..." : "Түгжих"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
