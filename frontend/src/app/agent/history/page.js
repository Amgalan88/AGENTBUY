"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import Button from "@/components/ui/Button";
import OrderChat from "@/components/OrderChat";

const TABS = [
  { value: "all", label: "Бүгд" },
  { value: "AGENT_LOCKED", label: "Түгжсэн" },
  { value: "AGENT_RESEARCHING", label: "Судалгаанд" },
  { value: "WAITING_USER_REVIEW", label: "Хэрэглэгч шийдвэрлэж" },
  { value: "WAITING_PAYMENT", label: "Төлбөр хүлээж" },
  { value: "COMPLETED", label: "Дууссан" },
];

const STATUS_CONFIG = {
  DRAFT: { label: "Ноорог", color: "chip" },
  PUBLISHED: { label: "Нээлттэй", color: "chip-info" },
  AGENT_LOCKED: { label: "Түгжсэн", color: "chip-warning" },
  AGENT_RESEARCHING: { label: "Судалгаанд", color: "chip-info" },
  REPORT_SUBMITTED: { label: "Тайлан", color: "chip-success" },
  WAITING_USER_REVIEW: { label: "Хэрэглэгчийн шийдвэр", color: "chip-warning" },
  USER_REJECTED: { label: "Татгалзсан", color: "chip-danger" },
  WAITING_PAYMENT: { label: "Төлбөр хүлээж", color: "chip-warning" },
  PAYMENT_CONFIRMED: { label: "Төлөгдсөн", color: "chip-success" },
  ORDER_PLACED: { label: "Захиалсан", color: "chip-success" },
  CARGO_IN_TRANSIT: { label: "Тээвэрт", color: "chip-info" },
  ARRIVED_AT_CARGO: { label: "Каргонд ирсэн", color: "chip-success" },
  COMPLETED: { label: "Дууссан", color: "chip-success" },
  CANCELLED_BY_USER: { label: "Цуцалсан", color: "chip-danger" },
  CANCELLED_BY_ADMIN: { label: "Админ цуцалсан", color: "chip-danger" },
};

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("mn", {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "-";

export default function AgentHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chatLoading, setChatLoading] = useState("");

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
        setError(err.message || "Захиалгуудыг татахад алдаа");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    const socket = getSocket();
    socket.on("order:comment", load);
    socket.on("order:update", load);
    return () => {
      alive = false;
      socket.off("order:comment", load);
      socket.off("order:update", load);
    };
  }, []);

  const filtered = useMemo(() => {
    const mapped = orders.map((o) => {
      const totalQty = o.items?.reduce((s, it) => s + (it.quantity || 0), 0) || 0;
      const firstItem = o.items?.[0] || {};
      const firstTitle = firstItem.title || "Барааны нэр ороогүй";
      const thumb = firstItem.images?.[0] || firstItem.imageUrl || "/marketplace/taobao.png";
      const userCommentCount = (o.comments || []).filter(c => c.senderRole === "user").length;
      return { ...o, totalQty, firstTitle, thumb, userCommentCount };
    });
    if (activeTab === "all") return mapped;
    return mapped.filter((o) => o.status === activeTab);
  }, [orders, activeTab]);

  const sendComment = async (orderId, message) => {
    setChatLoading(orderId);
    try {
      const updated = await api(`/api/agent/orders/${orderId}/comment`, {
        method: "POST",
        body: JSON.stringify({ message }),
      });
      setOrders(prev => prev.map(o => o._id === orderId ? updated : o));
    } catch {
      setError("Хариулт илгээхэд алдаа");
    } finally {
      setChatLoading("");
    }
  };

  return (
    <main className="page-container has-mobile-nav">
      <div className="container-responsive py-responsive space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Link href="/agent" className="back-link">← Нээлттэй захиалгууд</Link>
            <h1 className="page-title mt-2">Миний захиалгууд</h1>
            <p className="page-subtitle">Таны авч ажилласан бүх захиалгууд</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <Button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              variant={activeTab === tab.value ? "primary" : "outline"}
              size="sm"
              className="rounded-full"
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {error && <div className="error-box">{error}</div>}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-32 sm:h-36 rounded-xl sm:rounded-2xl" />
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
                  className="surface-card rounded-2xl sm:rounded-3xl card-padding card-interactive animate-slide-up"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="flex gap-3 sm:gap-4">
                    {/* Thumbnail */}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden surface-muted shrink-0">
                      <img src={order.thumb} alt={order.firstTitle} className="img-cover" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] sm:text-xs font-mono text-muted">#{order._id.slice(-6)}</span>
                          <span className={`status-badge ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                          {order.userCommentCount > 0 && (
                            <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium animate-pulse">
                              💬 {order.userCommentCount}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] sm:text-xs text-muted whitespace-nowrap">{formatDate(order.createdAt)}</span>
                      </div>
                      
                      <h3 className="font-semibold text-sm sm:text-base line-clamp-1 mb-1">{order.firstTitle}</h3>
                      
                      <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted mb-2 sm:mb-3">
                        <span>📦 {order.items?.length || 0} бараа</span>
                        <span>🔢 {order.totalQty} ширхэг</span>
                      </div>
                      
                      {/* Price & Action */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm sm:text-base font-semibold">
                          {order.report?.pricing?.grandTotalCny
                            ? `${order.report.pricing.grandTotalCny} ¥`
                            : "—"}
                        </div>
                        <Link href={`/agent/orders/${order._id}`}>
                          <Button variant="secondary" size="sm">
                            Дэлгэрэнгүй
                          </Button>
                        </Link>
                      </div>

                      {/* Chat Section */}
                      <OrderChat
                        orderId={order._id}
                        comments={order.comments || []}
                        currentRole="agent"
                        onSend={sendComment}
                        loading={chatLoading === order._id}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav">
        <Link href="/agent" className="mobile-nav-item">
          <span>🏠</span>
          <span>Нүүр</span>
        </Link>
        <Link href="/agent/history" className="mobile-nav-item active">
          <span>📋</span>
          <span>Түүх</span>
        </Link>
      </nav>
    </main>
  );
}
