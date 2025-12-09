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
  { key: "draft", label: "Ноорог", match: (s) => ["DRAFT"].includes(s) },
  { key: "published", label: "Нийтэлсэн", match: (s) => ["PUBLISHED"].includes(s) },
  { key: "research", label: "Судалж байна", match: (s) => ["AGENT_LOCKED", "AGENT_RESEARCHING", "REPORT_SUBMITTED", "WAITING_USER_REVIEW"].includes(s) },
  { key: "payment", label: "Төлбөр хүлээж байна", match: (s) => ["WAITING_PAYMENT"].includes(s) },
  { key: "success", label: "Амжилттай захиалга", match: (s) => ["PAYMENT_CONFIRMED", "ORDER_PLACED", "CARGO_IN_TRANSIT", "ARRIVED_AT_CARGO", "COMPLETED"].includes(s) },
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
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingOrderId, setDeletingOrderId] = useState("");
  const [cancellingOrderId, setCancellingOrderId] = useState("");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setError("");
      setLoading(true);
      try {
        // Limit нэмэх - хамгийн сүүлийн 50 захиалга л татана
        const data = await api("/api/orders?limit=50");
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
    
    // Real-time order updates - refresh хийхгүйгээр шууд шинэчлэх
    const handleOrderUpdate = (data) => {
      if (!alive) return;
      if (data.orderId) {
        // Шинэчлэгдсэн захиалгыг олох эсвэл нэмэх
        setOrders((prev) => {
          const existingIndex = prev.findIndex((o) => o._id === data.orderId);
          if (existingIndex >= 0) {
            // Захиалга байвал шинэчлэх
            const updated = [...prev];
            if (data.order) {
              // Order object ирсэн бол бүрэн шинэчлэх
              updated[existingIndex] = data.order;
            } else if (data.status) {
              // Зөвхөн status ирсэн бол status шинэчлэх
              updated[existingIndex] = { ...updated[existingIndex], status: data.status };
            }
            return updated;
          } else if (data.order) {
            // Шинэ захиалга байвал нэмэх
            return [data.order, ...prev];
          }
          return prev;
        });
      } else {
        // Order ID байхгүй бол бүх захиалгыг дахин ачаалах
        load();
      }
    };
    
    socket.on("order:new", handleOrderUpdate);
    socket.on("order:update", handleOrderUpdate);
    // order:comment event дээр бүх захиалгыг дахин ачаалахгүй, зөвхөн тухайн захиалгыг шинэчлэх
    socket.on("order:comment", handleOrderUpdate);
    
    // Захиалга устгагдсаны дараа жагсаалтаас хасах
    const handleOrderDelete = (data) => {
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

  const manualRefresh = async () => {
    setRefreshing(true);
    setError("");
    try {
      const data = await api("/api/orders?limit=50");
      setOrders(data);
    } catch (err) {
      setError(err.message || "Алдаа гарлаа.");
    } finally {
      setRefreshing(false);
    }
  };

  const sendComment = async (orderId, message, attachments = []) => {
    setChatLoading(orderId);
    try {
      const updated = await api(`/api/orders/${orderId}/comment`, {
        method: "POST",
        body: JSON.stringify({ message, attachments }),
      });
      setOrders(prev => prev.map(o => o._id === orderId ? updated : o));
    } catch (err) {
      setError("Мессеж илгээхэд алдаа");
    } finally {
      setChatLoading("");
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm("Та энэ захиалгыг цуцлахдаа итгэлтэй байна уу?")) {
      return;
    }

    setCancellingOrderId(orderId);
    setError("");
    try {
      const updated = await api(`/api/orders/${orderId}/cancel-before-agent`, {
        method: "POST",
      });
      // Захиалгыг шинэчлэх
      setOrders(prev => prev.map(o => o._id === orderId ? updated : o));
    } catch (err) {
      setError(err.message || "Захиалга цуцлахад алдаа гарлаа");
    } finally {
      setCancellingOrderId("");
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!confirm("Та энэ захиалгыг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.")) {
      return;
    }

    setDeletingOrderId(orderId);
    setError("");
    try {
      console.log("[Delete] Attempting to delete order:", orderId);
      const result = await api(`/api/orders/${orderId}`, {
        method: "DELETE",
      });
      // 204 response буцаана (body байхгүй)
      console.log("[Delete] Success - order deleted, result:", result);
      // Захиалгыг жагсаалтаас хасах
      setOrders(prev => prev.filter(o => o._id !== orderId));
      setError(""); // Алдааг арилгах
    } catch (err) {
      console.error("[Delete] Error:", err, "Status:", err.status);
      const errorMessage = err.status === 401 
        ? "Нэвтрэх шаардлагатай. Дахин нэвтрэнэ үү."
        : err.message || "Захиалга устгахад алдаа гарлаа";
      setError(errorMessage);
      // Алдаа гарсан ч захиалга байгаа бол жагсаалтаас хасна (optimistic update)
      // setOrders(prev => prev.filter(o => o._id !== orderId));
    } finally {
      setDeletingOrderId("");
    }
  };

  const handleDeleteAll = async () => {
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
      // Бүх цуцлагдсан захиалгыг дарааллаар устгах
      for (const order of cancelledOrders) {
        try {
          await api(`/api/orders/${order._id}`, {
            method: "DELETE",
          });
        } catch (err) {
          console.error(`[Delete All] Failed to delete ${order._id}:`, err);
          // Алдаа гарсан ч үргэлжлүүлэх
        }
      }
      // Бүх захиалгыг жагсаалтаас хасах
      setOrders(prev => prev.filter(o => !canDelete(o.status)));
    } catch (err) {
      console.error("[Delete All] Error:", err);
      setError(err.message || "Захиалгуудыг устгахад алдаа гарлаа");
    } finally {
      setDeletingOrderId("");
    }
  };

  // Устгах боломжтой статусууд - зөвхөн цуцлагдсан захиалгууд
  const canDelete = (status) => {
    return [
      "CANCELLED_BY_USER",
      "CANCELLED_BY_ADMIN",
      "CANCELLED_NO_AGENT",
      "USER_REJECTED",
      "PAYMENT_EXPIRED",
    ].includes(status);
  };

  const mappedOrders = useMemo(
    () =>
      orders.map((o) => {
        const totalQty = o.items?.reduce((s, it) => s + (it.quantity || 0), 0) || 0;
        const firstTitle = o.items?.[0]?.title || "Бараа";
        // Зургийн URL-ийг шалгах - base64 биш, Cloudinary URL эсвэл default image
        const firstImage = o.items?.[0]?.images?.[0] || o.items?.[0]?.imageUrl;
        // Base64 string байвал (Cloudinary upload хийгдээгүй) default image ашиглах
        // Мөн хоосон эсвэл буруу URL байвал default image ашиглах
        const thumb = (firstImage && 
                       typeof firstImage === "string" && 
                       firstImage.trim() !== "" && 
                       !firstImage.startsWith("data:") &&
                       (firstImage.startsWith("http://") || firstImage.startsWith("https://"))) 
          ? firstImage 
          : "/marketplace/taobao.png";
        
        // Base64 string байвал console-д мэдэгдэх
        if (firstImage && firstImage.startsWith("data:")) {
          console.warn("⚠️ Image still in base64 format (not uploaded to Cloudinary):", o._id);
        }
        const isPaid = ["PAYMENT_CONFIRMED", "ORDER_PLACED", "CARGO_IN_TRANSIT", "ARRIVED_AT_CARGO", "COMPLETED"].includes(o.status);
        const tracking = o.tracking?.code || "";
        const cargoName = (typeof o.cargoId === "object" && o.cargoId?.name) || "Карго";
        const agentCommentCount = (o.comments || []).filter(c => c.senderRole === "agent").length;
        // Үнийг тооцоолох
        const priceCny = o.report?.pricing?.grandTotalCny || o.report?.priceCny || null;
        return { ...o, totalQty, firstTitle, thumb, isPaid, tracking, cargoName, agentCommentCount, priceCny };
      }),
    [orders]
  );

  // Хуучин захиалга тодорхойлох (30 хоногийн өмнө үүссэн)
  const isOldOrder = (createdAt) => {
    if (!createdAt) return false;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(createdAt) < thirtyDaysAgo;
  };

  const filtered = useMemo(() => {
    const rule = categoryFilters.find((c) => c.key === filterKey) || categoryFilters[0];
    let result = mappedOrders.filter((o) => rule.match(o.status));
    
    // Search query-аар шүүх
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

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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

        {/* Filter Tabs */}
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
          {/* Delete All товч - зөвхөн "Цуцалсан" category-д харагдана */}
          {filterKey === "cancelled" && filtered.filter(o => canDelete(o.status)).length > 0 && (
            <Button
              onClick={handleDeleteAll}
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
            {filtered.slice(0, 50).map((order, idx) => {
              const statusConfig = STATUS_CONFIG[order.status] || { label: order.status, color: "chip" };
              const isOld = isOldOrder(order.createdAt);
              
              return (
                <article
                  key={order._id}
                  className={`surface-card rounded-2xl sm:rounded-3xl card-padding ${
                    isOld ? "bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800" : ""
                  }`}
                >
                  {/* Main Content Row - Зураг, мэдээлэл, үйлдлүүд */}
                  <div className="flex gap-3 sm:gap-4">
                    {/* Thumbnail - Илүү том зураг, click-ээр дэлгэрэнгүй руу очих */}
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
                          console.error("Thumbnail load error:", order.thumb);
                          e.target.src = "/marketplace/taobao.png";
                        }}
                      />
                    </Link>
                    
                    {/* Content - Мэдээлэл */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      {/* Header - ID, огноо */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-[10px] sm:text-xs font-mono text-muted">#{order._id?.slice(-6)}</span>
                        <span className="text-[10px] sm:text-xs text-muted">{formatDate(order.createdAt)}</span>
                      </div>
                      
                      {/* Баарааны нэр - click-ээр дэлгэрэнгүй руу очих */}
                      <Link 
                        href={`/user/requests/${order._id}`}
                        className="text-sm sm:text-base font-semibold mb-2 hover:text-primary transition-colors line-clamp-2"
                      >
                        {order.items?.map((it) => `${it.title || "Бараа"} ×${it.quantity || 1}`).join(" · ") || "Захиалга"}
                      </Link>
                      
                      {/* Тайлбар - userNote болон agentNote харуулах */}
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
                      
                      {/* Status & Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-3">
                        <span className={`status-badge ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                        <span className="chip text-[10px]">{order.cargoName}</span>
                        {order.tracking && (
                          <span className="chip-success text-[10px] px-1.5 py-0.5 rounded-full">
                            📦 {order.tracking}
                          </span>
                        )}
                        {isOld && (
                          <span className="chip-warning text-[10px] px-1.5 py-0.5 rounded-full">
                            ⏰ Хуучин
                          </span>
                        )}
                      </div>
                      
                      {/* Bottom Row - Үнэ & Үйлдлүүд */}
                      <div className="flex items-center justify-between gap-2 mt-auto">
                        {/* Үнэ - Илүү том, тодорхой */}
                        <div className="flex flex-col">
                          {order.priceCny ? (
                            <>
                              <span className="text-lg sm:text-xl font-bold text-primary">
                                {order.priceCny} ¥
                              </span>
                              {order.isPaid && (
                                <span className="chip-success text-[10px] px-1.5 py-0.5 rounded-full font-semibold inline-block w-fit mt-1">
                                  ✅ Төлсөн
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-sm text-muted">Үнэ тодорхойгүй</span>
                          )}
                        </div>
                        
                        {/* Үйлдлүүд - Icon buttons, илүү компакт */}
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
