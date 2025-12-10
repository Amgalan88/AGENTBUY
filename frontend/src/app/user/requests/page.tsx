"use client";

import { useEffect, useMemo, useState, ChangeEvent } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import Button from "@/components/ui/Button";
import OrderChat from "@/components/OrderChat";
import type { Order } from "@/types/order";
import type { Status } from "@/types/common";
import { Socket } from "socket.io-client";

interface StatusConfig {
  label: string;
  color: string;
}

const STATUS_CONFIG: Record<Status, StatusConfig> = {
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
  CANCELLED_BY_ADMIN: { label: "Админ цуцалсан", color: "chip-danger" },
  CANCELLED_NO_AGENT: { label: "Агент олдсонгүй", color: "chip-danger" },
  PAYMENT_EXPIRED: { label: "Төлбөр дууссан", color: "chip-danger" },
};

interface CategoryFilter {
  key: string;
  label: string;
  match: (status: Status) => boolean;
}

const categoryFilters: CategoryFilter[] = [
  { key: "all", label: "Бүгд", match: () => true },
  { key: "draft", label: "Ноорог", match: (s) => ["DRAFT"].includes(s) },
  { key: "published", label: "Нийтэлсэн", match: (s) => ["PUBLISHED"].includes(s) },
  { key: "research", label: "Судалж байна", match: (s) => ["AGENT_LOCKED", "AGENT_RESEARCHING", "REPORT_SUBMITTED", "WAITING_USER_REVIEW"].includes(s) },
  { key: "payment", label: "Төлбөр хүлээж байна", match: (s) => ["WAITING_PAYMENT"].includes(s) },
  { key: "success", label: "Амжилттай захиалга", match: (s) => ["PAYMENT_CONFIRMED", "ORDER_PLACED", "CARGO_IN_TRANSIT", "ARRIVED_AT_CARGO", "COMPLETED"].includes(s) },
  { key: "cancelled", label: "Цуцалсан", match: (s) => ["USER_REJECTED", "CANCELLED_BY_USER", "CANCELLED_BY_ADMIN", "PAYMENT_EXPIRED"].includes(s) },
];

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
  isPaid: boolean;
  tracking: string;
  cargoName: string;
  agentCommentCount: number;
  priceCny: number | null;
}

export default function UserRequestsPage(): React.JSX.Element {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filterKey, setFilterKey] = useState<string>("all");
  const [chatLoading, setChatLoading] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [deletingOrderId, setDeletingOrderId] = useState<string>("");
  const [cancellingOrderId, setCancellingOrderId] = useState<string>("");

  useEffect(() => {
    let alive = true;
    const load = async (): Promise<void> => {
      setError("");
      setLoading(true);
      try {
        const data = await api<Order[]>("/api/orders?limit=50");
        if (!alive) return;
        setOrders(data || []);
      } catch (err) {
        if (!alive) return;
        const error = err as Error & { status?: number };
        if (error.status === 401) {
          setError("Нэвтрээгүй байна.");
        } else {
          setError(error.message || "Алдаа гарлаа.");
        }
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const socket = getSocket();
    if (!socket) return;
    
    interface OrderUpdateData {
      orderId?: string;
      order?: Order;
      status?: Status;
    }
    
    const handleOrderUpdate = (data: OrderUpdateData): void => {
      if (!alive) return;
      if (data.orderId) {
        setOrders((prev) => {
          const existingIndex = prev.findIndex((o) => o._id === data.orderId);
          if (existingIndex >= 0) {
            const updated = [...prev];
            if (data.order) {
              updated[existingIndex] = data.order;
            } else if (data.status) {
              updated[existingIndex] = { ...updated[existingIndex], status: data.status };
            }
            return updated;
          } else if (data.order) {
            return [data.order, ...prev];
          }
          return prev;
        });
      } else {
        load();
      }
    };
    
    socket.on("order:new", handleOrderUpdate);
    socket.on("order:update", handleOrderUpdate);
    socket.on("order:comment", handleOrderUpdate);
    
    const handleOrderDelete = (data: { orderId?: string }): void => {
      if (!alive) return;
      if (data.orderId) {
        setOrders(prev => prev.filter(o => o._id !== data.orderId));
      }
    };
    socket.on("order:delete", handleOrderDelete);
    
    return () => {
      alive = false;
      socket.off("order:new", handleOrderUpdate);
      socket.off("order:update", handleOrderUpdate);
      socket.off("order:comment", handleOrderUpdate);
      socket.off("order:delete", handleOrderDelete);
    };
  }, []);

  const manualRefresh = async (): Promise<void> => {
    setRefreshing(true);
    setError("");
    try {
      const data = await api<Order[]>("/api/orders?limit=50");
      setOrders(data || []);
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Алдаа гарлаа.");
    } finally {
      setRefreshing(false);
    }
  };

  const sendComment = async (orderId: string, message: string, attachments: string[] = []): Promise<void> => {
    setChatLoading(orderId);
    try {
      const updated = await api<Order>(`/api/orders/${orderId}/comment`, {
        method: "POST",
        body: { message, attachments },
      });
      setOrders(prev => prev.map(o => o._id === orderId ? updated : o));
    } catch (err) {
      setError("Мессеж илгээхэд алдаа");
    } finally {
      setChatLoading("");
    }
  };

  const handleCancelOrder = async (orderId: string): Promise<void> => {
    if (!confirm("Та энэ захиалгыг цуцлахдаа итгэлтэй байна уу?")) {
      return;
    }

    setCancellingOrderId(orderId);
    setError("");
    try {
      const updated = await api<Order>(`/api/orders/${orderId}/cancel-before-agent`, {
        method: "POST",
      });
      setOrders(prev => prev.map(o => o._id === orderId ? updated : o));
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Захиалга цуцлахад алдаа гарлаа");
    } finally {
      setCancellingOrderId("");
    }
  };

  const handleDeleteOrder = async (orderId: string): Promise<void> => {
    if (!confirm("Та энэ захиалгыг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.")) {
      return;
    }

    setDeletingOrderId(orderId);
    setError("");
    try {
      await api(`/api/orders/${orderId}`, {
        method: "DELETE",
      });
      setOrders(prev => prev.filter(o => o._id !== orderId));
      setError("");
    } catch (err) {
      const error = err as Error & { status?: number };
      const errorMessage = error.status === 401 
        ? "Нэвтрэх шаардлагатай. Дахин нэвтрэнэ үү."
        : error.message || "Захиалга устгахад алдаа гарлаа";
      setError(errorMessage);
    } finally {
      setDeletingOrderId("");
    }
  };

  const canDelete = (status: Status): boolean => {
    return [
      "CANCELLED_BY_USER",
      "CANCELLED_BY_ADMIN",
      "CANCELLED_NO_AGENT",
      "USER_REJECTED",
      "PAYMENT_EXPIRED",
    ].includes(status);
  };

  const mappedOrders = useMemo<MappedOrder[]>(
    () =>
      orders.map((o) => {
        const totalQty = o.items?.reduce((s, it) => s + (it.quantity || 0), 0) || 0;
        const firstTitle = o.items?.[0]?.title || "Бараа";
        const firstImage = o.items?.[0]?.images?.[0] || o.items?.[0]?.imageUrl;
        
        const thumb = (firstImage && 
                       typeof firstImage === "string" && 
                       firstImage.trim() !== "" && 
                       !firstImage.startsWith("data:") &&
                       (firstImage.startsWith("http://") || firstImage.startsWith("https://"))) 
          ? firstImage 
          : "/marketplace/taobao.png";
        
        const isPaid = ["PAYMENT_CONFIRMED", "ORDER_PLACED", "CARGO_IN_TRANSIT", "ARRIVED_AT_CARGO", "COMPLETED"].includes(o.status);
        const tracking = (typeof o.tracking === "object" && o.tracking?.code) || (typeof o.tracking === "string" ? o.tracking : "") || "";
        const cargoName = (typeof o.cargoId === "object" && o.cargoId?.name) || "Карго";
        const agentCommentCount = (o.comments || []).filter(c => c.senderRole === "agent").length;
        const priceCny = o.report?.pricing?.grandTotalCny || null;
        
        return { 
          ...o, 
          totalQty, 
          firstTitle, 
          thumb, 
          isPaid, 
          tracking, 
          cargoName, 
          agentCommentCount, 
          priceCny 
        } as MappedOrder;
      }),
    [orders]
  );

  const isOldOrder = (createdAt: string | Date | undefined): boolean => {
    if (!createdAt) return false;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(createdAt) < thirtyDaysAgo;
  };

  const filtered = useMemo<MappedOrder[]>(() => {
    const rule = categoryFilters.find((c) => c.key === filterKey) || categoryFilters[0];
    let result = mappedOrders.filter((o) => rule.match(o.status));
    
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter((o) => {
        const customName = (o.customName || "").toLowerCase();
        const itemTitles = (o.items || [])
          .map((it) => (it.title || "").toLowerCase())
          .join(" ");
        const orderId = (o._id || "").toLowerCase();
        return (
          customName.includes(query) ||
          itemTitles.includes(query) ||
          orderId.includes(query)
        );
      });
    }
    
    return result;
  }, [filterKey, mappedOrders, searchQuery]);

  return (
    <main className="page-container has-mobile-nav">
      <div className="container-responsive py-responsive space-y-4 sm:space-y-6">
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

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            placeholder="🔍 Нэрээр хайх..."
            className="w-full input-field pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
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
          {filterKey === "cancelled" && filtered.filter(o => canDelete(o.status)).length > 0 && (
            <Button
              onClick={async () => {
                const cancelledOrders = filtered.filter(o => canDelete(o.status));
                if (cancelledOrders.length === 0) {
                  setError("Цуцлагдсан захиалга олдсонгүй");
                  return;
                }

                if (!confirm(`Та ${cancelledOrders.length} захиалгыг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.`)) {
                  return;
                }

                setDeletingOrderId("all");
                setError("");
                try {
                  for (const order of cancelledOrders) {
                    try {
                      await api(`/api/orders/${order._id}`, {
                        method: "DELETE",
                      });
                    } catch (err) {
                      console.error(`[Delete All] Failed to delete ${order._id}:`, err);
                    }
                  }
                  setOrders(prev => prev.filter(o => !canDelete(o.status)));
                } catch (err) {
                  const error = err as Error;
                  setError(error.message || "Захиалгуудыг устгахад алдаа гарлаа");
                } finally {
                  setDeletingOrderId("");
                }
              }}
              variant="danger"
              size="sm"
              loading={deletingOrderId === "all"}
              className="rounded-full ml-auto"
            >
              🗑️ Бүгдийг устгах ({filtered.filter(o => canDelete(o.status)).length})
            </Button>
          )}
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
            {filtered.slice(0, 50).map((order) => {
              const statusConfig = STATUS_CONFIG[order.status] || { label: order.status, color: "chip" };
              const isOld = isOldOrder(order.createdAt);
              
              return (
                <article
                  key={order._id}
                  className={`surface-card rounded-2xl sm:rounded-3xl card-padding ${
                    isOld ? "bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800" : ""
                  }`}
                >
                  <div className="flex gap-3 sm:gap-4">
                    <Link 
                      href={`/user/requests/${order._id}`}
                      className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden surface-muted shrink-0 hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      <img 
                        src={order.thumb} 
                        alt={order.firstTitle} 
                        className="img-cover w-full h-full"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/marketplace/taobao.png";
                        }}
                      />
                    </Link>
                    
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-[10px] sm:text-xs font-mono text-muted">#{order._id?.slice(-6)}</span>
                        <span className="text-[10px] sm:text-xs text-muted">{formatDate(order.createdAt)}</span>
                      </div>
                      
                      <Link 
                        href={`/user/requests/${order._id}`}
                        className="text-sm sm:text-base font-semibold mb-2 hover:text-primary transition-colors line-clamp-2"
                      >
                        {order.items?.map((it) => `${it.title || "Бараа"} ×${it.quantity || 1}`).join(" · ") || "Захиалга"}
                      </Link>
                      
                      {(order.userNote || order.agentNote) && (
                        <div className="mb-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs line-clamp-2">
                          {order.userNote && (
                            <p className="text-secondary mb-1">
                              <span className="font-medium">📝 Тайлбар:</span> {order.userNote}
                            </p>
                          )}
                          {order.agentNote && (
                            <p className="text-secondary">
                              <span className="font-medium">💼 Агентын тайлбар:</span> {order.agentNote}
                            </p>
                          )}
                        </div>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-1.5 mb-3">
                        <span className={`status-badge ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                        <span className="chip text-[10px]">{order.cargoName}</span>
                        {isOld && (
                          <span className="chip-warning text-[10px] px-1.5 py-0.5 rounded-full">
                            ⏰ Хуучин
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between gap-2 mt-auto">
                        <div className="flex flex-col gap-1">
                          {order.priceCny ? (
                            <>
                              <span className="text-lg sm:text-xl font-bold text-primary">
                                {order.priceCny} ¥
                              </span>
                              {order.isPaid && (
                                <span className="chip-success text-[10px] px-1.5 py-0.5 rounded-full font-semibold inline-block w-fit">
                                  ✅ Төлсөн
                                </span>
                              )}
                              {order.tracking && (
                                <button
                                  onClick={async (e) => {
                                    try {
                                      await navigator.clipboard.writeText(order.tracking);
                                      // Show feedback
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
                                  className="text-xs text-accent-primary hover:underline text-left flex items-center gap-1 cursor-pointer"
                                  title="Tracking код хуулах"
                                >
                                  📦 {order.tracking}
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="text-sm text-muted">Үнэ тодорхойгүй</span>
                          )}
                          {(order.report as { paymentLink?: string })?.paymentLink && (
                            <a
                              href={(order.report as { paymentLink?: string }).paymentLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-accent-primary hover:underline line-clamp-1 max-w-[200px]"
                              title={(order.report as { paymentLink?: string }).paymentLink}
                            >
                              💳 Төлбөрийн холбоос
                            </a>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          {order.status === "DRAFT" && (
                            <Link href={`/user/${order.isPackage ? "batch" : "single"}?edit=${order._id}`}>
                              <button
                                className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors"
                                title="Засах"
                              >
                                ✏️
                              </button>
                            </Link>
                          )}
                          {order.status === "PUBLISHED" && (
                            <button
                              onClick={() => handleCancelOrder(order._id)}
                              disabled={cancellingOrderId === order._id}
                              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors disabled:opacity-50"
                              title="Цуцлах"
                            >
                              {cancellingOrderId === order._id ? "⏳" : "❌"}
                            </button>
                          )}
                          {canDelete(order.status) && (
                            <button
                              onClick={() => handleDeleteOrder(order._id)}
                              disabled={deletingOrderId === order._id}
                              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors disabled:opacity-50"
                              title="Устгах"
                            >
                              {deletingOrderId === order._id ? "⏳" : "🗑️"}
                            </button>
                          )}
                          <Link href={`/user/requests/${order._id}`} prefetch={false}>
                            <button
                              className="px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-medium text-xs sm:text-sm transition-colors"
                              title="Дэлгэрэнгүй"
                            >
                              Дэлгэрэнгүй →
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

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

