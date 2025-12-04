"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUI } from "../../layout";
import { api } from "@/lib/api";

const TABS = [
  { value: "all", label: "Бүгд" },
  { value: "AGENT_LOCKED", label: "Түгжсэн" },
  { value: "AGENT_RESEARCHING", label: "Судалгаанд" },
  { value: "WAITING_USER_REVIEW", label: "Хэрэглэгч шийдвэрлэж байна" },
  { value: "WAITING_PAYMENT", label: "Төлбөр хүлээж" },
  { value: "COMPLETED", label: "Дууссан" },
];

const statusLabel = {
  DRAFT: "Ноорог",
  PUBLISHED: "Нийтэлсэн",
  AGENT_LOCKED: "Агент түгжсэн",
  AGENT_RESEARCHING: "Судалгаанд",
  REPORT_SUBMITTED: "Тайлан ирсэн",
  WAITING_USER_REVIEW: "Хэрэглэгчийн шийдвэр",
  USER_REJECTED: "Хэрэглэгч татгалзсан",
  WAITING_PAYMENT: "Төлбөр хүлээж байна",
  PAYMENT_EXPIRED: "Төлбөрийн хугацаа дууссан",
  PAYMENT_CONFIRMED: "Төлбөр баталгаажсан",
  ORDER_PLACED: "Захиалга өгсөн",
  CARGO_IN_TRANSIT: "Карго явж байна",
  ARRIVED_AT_CARGO: "Каргонд ирсэн",
  COMPLETED: "Дууссан",
  CANCELLED_BY_USER: "Хэрэглэгч цуцалсан",
  CANCELLED_BY_ADMIN: "Админ цуцалсан",
  CANCELLED_NO_AGENT: "Агент олдоогүй",
};

const appIcon = {
  taobao: "/marketplace/taobao.png",
  pinduoduo: "/marketplace/pinduoudo.png",
  "1688": "/marketplace/1688.jpg",
  dewu: "/marketplace/poizon.png",
  any: "/marketplace/taobao.png",
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

export default function AgentHistoryPage() {
  const { theme, view } = useUI();
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const mainClass =
    theme === "night"
      ? "bg-slate-950 text-slate-50"
      : theme === "mid"
        ? "bg-slate-200 text-slate-900"
        : "bg-slate-100 text-slate-900";

  const cardClass =
    theme === "night"
      ? "bg-slate-900 border-slate-700"
      : theme === "mid"
        ? "bg-slate-100 border-slate-300"
        : "bg-white border-slate-200";

  const widthClass =
    view === "mobile"
      ? "max-w-md"
      : view === "tablet"
        ? "max-w-3xl"
        : "max-w-6xl";

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await api("/api/agent/orders");
        if (!alive) return;
        setOrders(data);
      } catch (err) {
        if (!alive) return;
        setError(err.message || "Миний захиалгуудыг татахад алдаа гарлаа");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const mapped = orders.map((o) => {
      const totalQty = o.items?.reduce((s, it) => s + (it.quantity || 0), 0) || 0;
      const firstItem = o.items?.[0] || {};
      const firstTitle = firstItem.title || "Барааны нэр ороогүй";
      const thumb = firstItem.images?.[0] || firstItem.imageUrl || "/marketplace/taobao.png";
      const platformIcon = appIcon[firstItem.app] || appIcon.any;
      return { ...o, totalQty, firstTitle, thumb, platformIcon };
    });
    if (activeTab === "all") return mapped;
    return mapped.filter((o) => o.status === activeTab);
  }, [orders, activeTab]);

  return (
    <main className={`${mainClass} min-h-screen`}>
      <div className={`${widthClass} mx-auto px-4 py-10 space-y-6`}>
        <div className="flex items-center justify-between">
          <Link href="/agent" className="text-sm opacity-70 hover:text-emerald-600">
            ← Нээлттэй захиалгууд
          </Link>
          <p className="text-xs opacity-70">Миний бүх захиалгууд</p>
        </div>

        <h1 className="text-2xl font-semibold">Агент — миний захиалгууд</h1>

        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`rounded-full border px-3 py-1 text-xs ${
                activeTab === tab.value
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm opacity-70">
            Уншиж байна...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm opacity-70">
            Энэ ангилалд захиалга алга.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => (
              <article
                key={order._id}
                className="rounded-3xl p-4 shadow-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-700/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-200">
                      <img src={order.platformIcon} alt="app" className="h-5 w-5 rounded" />
                      <span className="font-semibold tracking-wide">AGENTBUY</span>
                      <span className="text-[11px] opacity-80">#{order._id.slice(-6)}</span>
                    </div>
                    <div className="text-xs text-slate-200">Order Card</div>
                  </div>
                  <div className="h-20 w-24 rounded-xl overflow-hidden bg-slate-700 border border-slate-600">
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
                    <span>📌</span>
                    <span>{statusLabel[order.status] || order.status}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-lg font-semibold">
                    {order.report?.pricing?.grandTotalCny
                      ? `${order.report.pricing.grandTotalCny} ¥`
                      : "Дүн байхгүй"}{" "}
                    <span className="text-xs opacity-80">({order.totalQty} ширхэг)</span>
                  </div>
                  <Link
                    href={`/agent/orders/${order._id}`}
                    className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20 border border-white/20"
                  >
                    Дэлгэрэнгүй
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
