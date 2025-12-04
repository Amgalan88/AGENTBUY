"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useUI } from "../../layout";

const statusLabel = {
  DRAFT: "Ноорог",
  PUBLISHED: "Нийтэлсэн",
  AGENT_LOCKED: "Агент түгжсэн",
  AGENT_RESEARCHING: "Агент судалж байна",
  REPORT_SUBMITTED: "Тайлан ирсэн",
  WAITING_USER_REVIEW: "Таны шийдвэр хүлээж байна",
  USER_REJECTED: "Цуцлагдсан",
  WAITING_PAYMENT: "Төлбөр хүлээж байна",
  PAYMENT_EXPIRED: "Төлбөрийн хугацаа дууссан",
  PAYMENT_CONFIRMED: "Төлбөр баталгаажсан",
  ORDER_PLACED: "Захиалга хийгдсэн",
  CARGO_IN_TRANSIT: "Тээвэрлэлж байна",
  ARRIVED_AT_CARGO: "Каргонд ирсэн",
  COMPLETED: "Дууссан",
  CANCELLED_BY_USER: "Цуцлагдсан",
  CANCELLED_BY_ADMIN: "Цуцлагдсан",
  CANCELLED_NO_AGENT: "Агентгүй хаагдсан",
};

const categoryFilters = [
  { key: "all", label: "Бүгд", match: () => true },
  { key: "published", label: "Нийтэлсэн", match: (s) => ["PUBLISHED"].includes(s) },
  { key: "research", label: "Агент судалж", match: (s) => ["AGENT_LOCKED", "AGENT_RESEARCHING", "REPORT_SUBMITTED", "WAITING_USER_REVIEW"].includes(s) },
  { key: "payment", label: "Төлбөр", match: (s) => ["WAITING_PAYMENT", "PAYMENT_CONFIRMED", "ORDER_PLACED"].includes(s) },
  { key: "cancelled", label: "Цуцлагдсан", match: (s) => ["USER_REJECTED", "CANCELLED_BY_USER", "CANCELLED_BY_ADMIN", "CANCELLED_NO_AGENT", "PAYMENT_EXPIRED"].includes(s) },
  { key: "done", label: "Амжилттай", match: (s) => ["CARGO_IN_TRANSIT", "ARRIVED_AT_CARGO", "COMPLETED"].includes(s) },
];

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

export default function UserRequestsPage() {
  const { theme, view } = useUI();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [filterKey, setFilterKey] = useState("all");

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

  const widthClass = view === "mobile" ? "max-w-md" : view === "tablet" ? "max-w-3xl" : "max-w-6xl";

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setError("");
      try {
        const data = await api("/api/orders");
        if (!alive) return;
        setOrders(data);
      } catch (err) {
        if (!alive) return;
        if (err.status === 401) {
          setError("Нэвтрээгүй байна. Дахин нэвтэрч орно уу.");
        } else {
          setError(err.message || "Системийн алдаа гарлаа.");
        }
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
      const data = await api("/api/orders");
      setOrders(data);
    } catch (err) {
      setError(err.message || "Системийн алдаа гарлаа.");
    } finally {
      setRefreshing(false);
    }
  };

  const mappedOrders = useMemo(
    () =>
      orders.map((o) => {
        const totalQty = o.items?.reduce((s, it) => s + (it.quantity || 0), 0) || 0;
        const firstTitle = o.items?.[0]?.title || "Бараа";
        const thumb = o.items?.[0]?.images?.[0] || o.items?.[0]?.imageUrl || "/marketplace/taobao.png";
        const isPaid = ["PAYMENT_CONFIRMED", "ORDER_PLACED", "CARGO_IN_TRANSIT", "ARRIVED_AT_CARGO", "COMPLETED"].includes(o.status);
        const tracking = o.tracking?.code || "";
        const cargoName = o.cargoId?.name || "Карго сонгоогүй";
        return { ...o, totalQty, firstTitle, thumb, isPaid, tracking, cargoName };
      }),
    [orders]
  );

  const filtered = useMemo(() => {
    const rule = categoryFilters.find((c) => c.key === filterKey) || categoryFilters[0];
    const uniq = [];
    const seen = new Set();
    mappedOrders.forEach((o) => {
      if (seen.has(o._id)) return;
      if (!rule.match(o.status)) return;
      seen.add(o._id);
      uniq.push(o);
    });
    return uniq;
  }, [filterKey, mappedOrders]);

  return (
    <main className={`${mainClass} min-h-screen`}>
      <div className={`${widthClass} mx-auto px-4 py-10 space-y-6`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-70">Таны нийтэлсэн захиалгууд</p>
            <h1 className="text-2xl font-semibold">Миний захиалгууд</h1>
          </div>
          <button
            type="button"
            onClick={manualRefresh}
            disabled={refreshing}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:border-emerald-300 disabled:opacity-60"
          >
            {refreshing ? "Шинэчилж..." : "Шинэчлэх"}
          </button>
          <Link href="/user" className="text-sm opacity-70 hover:text-emerald-600">
            Самбар руу буцах
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {categoryFilters.map((c) => (
            <button
              key={c.key}
              onClick={() => setFilterKey(c.key)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                filterKey === c.key ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>}

        {loading ? (
          <p className="text-sm text-slate-600">Уншиж байна...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-600">Энд харагдах захиалга алга.</p>
        ) : (
          <div className="grid gap-4">
            {filtered.map((order) => (
              <article key={order._id} className={`rounded-3xl border ${cardClass} p-4 shadow-sm`}>
                <div className="flex items-start gap-3">
                  <div className="h-14 w-14 rounded-full overflow-hidden bg-slate-200 border border-slate-300">
                    <img src={order.thumb} alt={order.firstTitle} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-slate-900">Order Card</span>
                      <span className="text-[11px] opacity-70">#{order._id?.slice(-6)}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span className="rounded-full bg-slate-100 px-2 py-1 border border-slate-200">{statusLabel[order.status] || order.status}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-1 border border-slate-200">{order.cargoName}</span>
                      {order.tracking && <span className="rounded-full bg-emerald-50 px-2 py-1 border border-emerald-200 text-emerald-700">Tracking: {order.tracking}</span>}
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span>Огноо:</span>
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Бараа:</span>
                    <span className="line-clamp-1">
                      {order.items?.map((it) => `${it.title || "Бараа"} x ${it.quantity || 1}`).join(" · ")}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-lg font-semibold text-slate-900">
                    {order.report?.pricing?.grandTotalCny ? `${order.report.pricing.grandTotalCny} CNY` : "Нийт үнэ хараахан байхгүй"}
                  </div>
                  <div className="flex items-center gap-2">
                    {order.isPaid && <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">Paid</span>}
                    <Link
                      href={`/user/requests/${order._id}`}
                      className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      Дэлгэрэнгүй
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
