"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import Button from "@/components/ui/Button";
import OrderChat from "@/components/OrderChat";
import type { Order } from "@/types/order";
import type { Status } from "@/types/common";

interface Tab {
  value: string;
  label: string;
  statuses?: string[];
}

const TABS: Tab[] = [
  { value: "all", label: "Бүгд" },
  { value: "locked", label: "Түгжсэн", statuses: ["AGENT_LOCKED"] },
  { value: "research", label: "Судалж байна", statuses: ["AGENT_LOCKED", "AGENT_RESEARCHING", "REPORT_SUBMITTED", "WAITING_USER_REVIEW"] },
  { value: "payment", label: "Төлбөр хүлээж байна", statuses: ["WAITING_PAYMENT"] },
  { value: "success", label: "Амжилттай захиалга", statuses: ["PAYMENT_CONFIRMED", "ORDER_PLACED", "CARGO_IN_TRANSIT", "ARRIVED_AT_CARGO", "COMPLETED"] },
  { value: "cancelled", label: "Цуцалсан", statuses: ["USER_REJECTED", "CANCELLED_BY_USER", "CANCELLED_BY_ADMIN", "PAYMENT_EXPIRED"] },
];

interface StatusConfig {
  label: string;
  color: string;
}

const STATUS_CONFIG: Partial<Record<Status, StatusConfig>> = {
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

const formatDate = (value: string | Date | undefined): string => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("mn", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

interface MappedOrder extends Order {
  totalQty: number;
  firstTitle: string;
  thumb: string;
  userCommentCount: number;
}

export default function AgentHistoryPage(): React.JSX.Element {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [chatLoading, setChatLoading] = useState<string>("");

  useEffect(() => {
    let alive = true;
    async function load(): Promise<void> {
      setLoading(true);
      setError("");
      try {
        const data = await api<Order[]>("/api/agent/orders");
        if (!alive) return;
        setOrders(data || []);
      } catch (err) {
        if (!alive) return;
        const error = err as Error;
        setError(error.message || "Захиалгуудыг татахад алдаа");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    const socket = getSocket();
    if (!socket) return;
    socket.on("order:comment", load);
    socket.on("order:update", load);
    return () => {
      alive = false;
      socket.off("order:comment", load);
      socket.off("order:update", load);
    };
  }, []);

  const filtered = useMemo<MappedOrder[]>(() => {
    const mapped = orders.map((o) => {
      const totalQty = o.items?.reduce((s, it) => s + (it.quantity || 0), 0) || 0;
      const firstItem = o.items?.[0];
      
      // Бүх барааны нэрийг нэгтгэх
      const itemTitles = (o.items || [])
        .map((it) => it.title || "Бараа")
        .filter((title) => title && title.trim() !== "");
      const firstTitle = itemTitles.length > 0 
        ? (itemTitles.length > 1 ? itemTitles.join(" · ") : itemTitles[0])
        : "Барааны нэр ороогүй";
      
      const rawImages = firstItem?.images || (firstItem?.imageUrl ? [firstItem.imageUrl] : []);
      const validImages = rawImages.filter((img): img is string => 
        img && 
        typeof img === "string" && 
        img.trim() !== "" && 
        !img.startsWith("data:") &&
        (img.startsWith("http://") || img.startsWith("https://"))
      );
      const thumb = validImages[0] || "/marketplace/taobao.png";
      const userCommentCount = (o.comments || []).filter(c => c.senderRole === "user").length;
      return { ...o, totalQty, firstTitle, thumb, userCommentCount } as MappedOrder;
    });
    if (activeTab === "all") return mapped;
    const selectedTab = TABS.find(tab => tab.value === activeTab);
    if (selectedTab && selectedTab.statuses) {
      return mapped.filter((o) => selectedTab.statuses!.includes(o.status));
    }
    return mapped.filter((o) => o.status === activeTab);
  }, [orders, activeTab]);

  const sendComment = async (orderId: string, message: string, attachments: string[] = []): Promise<void> => {
    setChatLoading(orderId);
    try {
      const updated = await api<Order>(`/api/agent/orders/${orderId}/comment`, {
        method: "POST",
        body: { message, attachments },
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Link href="/agent" className="back-link">← Нээлттэй захиалгууд</Link>
            <h1 className="page-title mt-2">Миний захиалгууд</h1>
            <p className="page-subtitle">Таны авч ажилласан бүх захиалгууд</p>
          </div>
        </div>

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
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden surface-muted shrink-0">
                      <img 
                        src={order.thumb} 
                        alt={order.firstTitle} 
                        className="img-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/marketplace/taobao.png";
                        }}
                      />
                    </div>
                    
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
                      
                      {/* Tracking Code Display - Only show tracking codes entered in detail page */}
                      {["PAYMENT_CONFIRMED", "ORDER_PLACED", "CARGO_IN_TRANSIT", "ARRIVED_AT_CARGO", "COMPLETED"].includes(order.status) && (
                        <div className="mb-2">
                          {/* Order-level tracking код */}
                          {typeof order.tracking === "object" && order.tracking?.code ? (
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-muted">
                                <span className="font-medium">Tracking код:</span> {order.tracking.code}
                              </p>
                            </div>
                          ) : (
                            /* Item-level tracking код-ууд (report-ийн items-аас) */
                            order.report?.items && Array.isArray(order.report.items) && (() => {
                              const itemTrackings = order.report.items
                                .map((rItem: { trackingCode?: string }) => rItem.trackingCode)
                                .filter((tc: string | undefined): tc is string => !!tc && tc.trim() !== "");
                              if (itemTrackings.length > 0) {
                                return (
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs text-muted">
                                      <span className="font-medium">Tracking код:</span> {itemTrackings.join(", ")}
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            })()
                          )}
                        </div>
                      )}
                      
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

