"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";

const STATUS_CONFIG = {
  PUBLISHED: { label: "Нээлттэй", color: "chip-info" },
  AGENT_LOCKED: { label: "Түгжсэн", color: "chip-warning" },
  AGENT_RESEARCHING: { label: "Судалгаанд", color: "chip-info" },
  REPORT_SUBMITTED: { label: "Тайлан", color: "chip-success" },
  WAITING_USER_REVIEW: { label: "Шийдвэрлэж байна", color: "chip-warning" },
  WAITING_PAYMENT: { label: "Төлбөр", color: "chip-warning" },
  COMPLETED: { label: "Дууссан", color: "chip-success" },
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

export default function AgentPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");
  const [refreshing, setRefreshing] = useState(false);

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
        setError(err.message || "Захиалга татахад алдаа");
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
      setError(err.message || "Татахад алдаа");
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
      setError(err.message || "Түгжихэд алдаа");
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
        // Base64 string-уудыг filter хийх (зөвхөн URL-уудыг харуулах)
        const rawImages = firstItem.images || (firstItem.imageUrl ? [firstItem.imageUrl] : []);
        const validImages = rawImages.filter(img => 
          img && 
          typeof img === "string" && 
          img.trim() !== "" && 
          !img.startsWith("data:") &&
          (img.startsWith("http://") || img.startsWith("https://"))
        );
        const thumb = validImages[0] || "/marketplace/taobao.png";
        return { ...o, totalQty, firstTitle, thumb };
      }),
    [orders]
  );

  return (
    <main className="page-container has-mobile-nav">
      <div className="container-responsive py-responsive space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link href="/" className="back-link">← Буцах</Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button onClick={manualRefresh} loading={refreshing} variant="outline" size="sm" className="flex-1 sm:flex-none">
              🔄 Шинэчлэх
            </Button>
            <Link href="/agent/history" className="link-primary text-xs sm:text-sm font-medium whitespace-nowrap">
              Миний захиалгууд
            </Link>
          </div>
        </div>

        <header className="page-header">
          <h1 className="page-title flex items-center gap-2 sm:gap-3">
            <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl surface-muted flex items-center justify-center text-lg sm:text-xl">🔍</span>
            <span>Нээлттэй захиалгууд</span>
          </h1>
          <p className="page-subtitle">
            Түгжээгүй, ажиллахад бэлэн захиалгууд.
          </p>
        </header>

        {error && <div className="error-box">{error}</div>}

        {loading ? (
          <div className="space-y-3 sm:space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-32 sm:h-40 rounded-xl sm:rounded-2xl" />
            ))}
          </div>
        ) : mapped.length === 0 ? (
          <div className="empty-state animate-fade-in">
            <p className="text-3xl sm:text-4xl mb-2 sm:mb-3">📭</p>
            <p className="text-sm sm:text-base">Одоогоор нээлттэй захиалга алга.</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {mapped.map((order, idx) => {
              const statusConfig = STATUS_CONFIG[order.status] || { label: order.status, color: "chip" };
              return (
                <article 
                  key={order._id} 
                  className="order-card-dark rounded-2xl sm:rounded-3xl p-4 sm:p-5 card-interactive animate-slide-up"
                  style={{animationDelay: `${idx * 0.05}s`}}
                >
                  <div className="flex gap-3 sm:gap-4">
                    {/* Thumbnail */}
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-white/10 shrink-0">
                      <img 
                        src={order.thumb} 
                        alt={order.firstTitle} 
                        className="img-cover"
                        onError={(e) => {
                          console.error("Thumbnail load error:", order.thumb);
                          e.target.src = "/marketplace/taobao.png";
                        }}
                      />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="text-[10px] sm:text-xs font-mono opacity-70">#{order._id.slice(-6)}</span>
                          <span className={`status-badge ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                        <span className="text-[10px] sm:text-xs opacity-60 whitespace-nowrap">{formatDate(order.createdAt)}</span>
                      </div>
                      
                      <h3 className="font-semibold text-white text-sm sm:text-base line-clamp-1 mb-1.5 sm:mb-2">{order.firstTitle}</h3>
                      
                      <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs opacity-70 mb-2 sm:mb-3 flex-wrap">
                        <span>📦 {order.items?.length || 0}</span>
                        <span>🔢 {order.totalQty}</span>
                        <span className="hidden sm:inline">🚚 {order.cargoId?.name || "Карго"}</span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <Link href={`/agent/orders/${order._id}`} className="block sm:inline">
                          <Button variant="outline" size="sm" fullWidth className="border-white/20 text-white hover:bg-white/10 text-xs sm:text-sm">
                            Дэлгэрэнгүй
                          </Button>
                        </Link>
                        <Button 
                          onClick={() => lockOrder(order._id)} 
                          loading={actionId === order._id}
                          size="sm"
                          fullWidth
                          className="text-xs sm:text-sm sm:w-auto"
                        >
                          🔒 Түгжих
                        </Button>
                      </div>
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
        <Link href="/agent" className="mobile-nav-item active">
          <span>🏠</span>
          <span>Нүүр</span>
        </Link>
        <Link href="/agent/history" className="mobile-nav-item">
          <span>📋</span>
          <span>Түүх</span>
        </Link>
        <Link href="/agent/profile" className="mobile-nav-item">
          <span>👤</span>
          <span>Профайл</span>
        </Link>
      </nav>
    </main>
  );
}
