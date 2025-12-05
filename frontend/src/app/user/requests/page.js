"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import Button from "@/components/ui/Button";
import OrderChat from "@/components/OrderChat";

const STATUS_CONFIG = {
  DRAFT: { label: "Ноорог", color: "chip" },
  PUBLISHED: { label: "Нээлттэй", color: "chip-info" },
  AGENT_LOCKED: { label: "Агент түгжсэн", color: "chip-warning" },
  AGENT_RESEARCHING: { label: "Судалж байна", color: "chip-info" },
  REPORT_SUBMITTED: { label: "Тайлан ирсэн", color: "chip-success" },
  WAITING_USER_REVIEW: { label: "Шийдвэр хүлээж", color: "chip-warning" },
  USER_REJECTED: { label: "Цуцалсан", color: "chip-danger" },
  WAITING_PAYMENT: { label: "Төлбөр хүлээж", color: "chip-warning" },
  PAYMENT_CONFIRMED: { label: "Төлөгдсөн", color: "chip-success" },
  ORDER_PLACED: { label: "Захиалсан", color: "chip-success" },
  CARGO_IN_TRANSIT: { label: "Тээвэрт", color: "chip-info" },
  ARRIVED_AT_CARGO: { label: "Каргонд ирсэн", color: "chip-success" },
  COMPLETED: { label: "Дууссан", color: "chip-success" },
  CANCELLED_BY_USER: { label: "Цуцалсан", color: "chip-danger" },
};

const categoryFilters = [
  { key: "all", label: "Бүгд", match: () => true },
  { key: "published", label: "Нийтэлсэн", match: (s) => ["PUBLISHED"].includes(s) },
  { key: "research", label: "Судалж байна", match: (s) => ["AGENT_LOCKED", "AGENT_RESEARCHING", "REPORT_SUBMITTED", "WAITING_USER_REVIEW"].includes(s) },
  { key: "payment", label: "Төлбөр", match: (s) => ["WAITING_PAYMENT", "PAYMENT_CONFIRMED", "ORDER_PLACED"].includes(s) },
  { key: "done", label: "Дууссан", match: (s) => ["CARGO_IN_TRANSIT", "ARRIVED_AT_CARGO", "COMPLETED"].includes(s) },
  { key: "cancelled", label: "Цуцалсан", match: (s) => ["USER_REJECTED", "CANCELLED_BY_USER", "CANCELLED_BY_ADMIN", "PAYMENT_EXPIRED"].includes(s) },
];

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("mn", {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "-";

export default function UserRequestsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [filterKey, setFilterKey] = useState("all");
  const [chatLoading, setChatLoading] = useState("");

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
          setError("Нэвтрээгүй байна.");
        } else {
          setError(err.message || "Алдаа гарлаа.");
        }
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const socket = getSocket();
    socket.on("order:new", load);
    socket.on("order:update", load);
    socket.on("order:comment", load);
    return () => {
      alive = false;
      socket.off("order:new", load);
      socket.off("order:update", load);
      socket.off("order:comment", load);
    };
  }, []);

  const manualRefresh = async () => {
    setRefreshing(true);
    setError("");
    try {
      const data = await api("/api/orders");
      setOrders(data);
    } catch (err) {
      setError(err.message || "Алдаа гарлаа.");
    } finally {
      setRefreshing(false);
    }
  };

  const sendComment = async (orderId, message) => {
    setChatLoading(orderId);
    try {
      const updated = await api(`/api/orders/${orderId}/comment`, {
        method: "POST",
        body: JSON.stringify({ message }),
      });
      setOrders(prev => prev.map(o => o._id === orderId ? updated : o));
    } catch (err) {
      setError("Мессеж илгээхэд алдаа");
    } finally {
      setChatLoading("");
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
        const cargoName = o.cargoId?.name || "Карго";
        const agentCommentCount = (o.comments || []).filter(c => c.senderRole === "agent").length;
        return { ...o, totalQty, firstTitle, thumb, isPaid, tracking, cargoName, agentCommentCount };
      }),
    [orders]
  );

  const filtered = useMemo(() => {
    const rule = categoryFilters.find((c) => c.key === filterKey) || categoryFilters[0];
    return mappedOrders.filter((o) => rule.match(o.status));
  }, [filterKey, mappedOrders]);

  return (
    <main className="page-container has-mobile-nav">
      <div className="container-responsive py-responsive space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Link href="/user" className="back-link">← Самбар руу</Link>
            <h1 className="page-title mt-2">Миний захиалгууд</h1>
            <p className="page-subtitle">Таны нийтэлсэн бүх захиалгууд</p>
          </div>
          <Button onClick={manualRefresh} loading={refreshing} variant="outline" size="sm">
            🔄 Шинэчлэх
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {categoryFilters.map((c) => (
            <Button
              key={c.key}
              onClick={() => setFilterKey(c.key)}
              variant={filterKey === c.key ? "primary" : "outline"}
              size="sm"
              className="rounded-full"
            >
              {c.label}
            </Button>
          ))}
        </div>

        {error && <div className="error-box">{error}</div>}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-28 sm:h-32 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p className="text-3xl mb-2">📭</p>
            <p>Энэ ангилалд захиалга алга.</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filtered.map((order, idx) => {
              const statusConfig = STATUS_CONFIG[order.status] || { label: order.status, color: "chip" };
              return (
                <article
                  key={order._id}
                  className="surface-card rounded-xl sm:rounded-2xl card-padding card-interactive animate-slide-up"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  {/* Main Content Row */}
                  <div className="flex gap-3 sm:gap-4">
                    {/* Thumbnail */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden surface-muted shrink-0">
                      <img src={order.thumb} alt={order.firstTitle} className="img-cover" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-[10px] sm:text-xs font-mono text-muted">#{order._id?.slice(-6)}</span>
                        <span className="text-[10px] sm:text-xs text-muted">{formatDate(order.createdAt)}</span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <span className={`status-badge ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                        <span className="chip text-[10px]">{order.cargoName}</span>
                        {order.tracking && (
                          <span className="chip-success text-[10px] px-1.5 py-0.5 rounded-full">
                            📦 {order.tracking}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs sm:text-sm text-secondary line-clamp-1 mb-2">
                        {order.items?.map((it) => `${it.title || "Бараа"} ×${it.quantity || 1}`).join(" · ")}
                      </p>
                      
                      {/* Price & Action */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm sm:text-base font-semibold">
                            {order.report?.pricing?.grandTotalCny
                              ? `${order.report.pricing.grandTotalCny} ¥`
                              : "—"}
                          </span>
                          {order.isPaid && (
                            <span className="chip-success text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                              Paid
                            </span>
                          )}
                        </div>
                        <Link href={`/user/requests/${order._id}`}>
                          <Button variant="secondary" size="sm">
                            Дэлгэрэнгүй
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Chat Section - Full Width at Bottom */}
                  {order.report && (
                    <OrderChat
                      orderId={order._id}
                      comments={order.comments || []}
                      currentRole="user"
                      onSend={sendComment}
                      loading={chatLoading === order._id}
                    />
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav">
        <Link href="/user" className="mobile-nav-item">
          <span>🏠</span>
          <span>Нүүр</span>
        </Link>
        <Link href="/user/requests" className="mobile-nav-item active">
          <span>📋</span>
          <span>Захиалга</span>
        </Link>
        <Link href="/user/single" className="mobile-nav-item">
          <span>➕</span>
          <span>Шинэ</span>
        </Link>
      </nav>
    </main>
  );
}
