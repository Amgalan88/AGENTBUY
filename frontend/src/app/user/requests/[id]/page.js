"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import Button from "@/components/ui/Button";
import ImageLightbox from "@/components/ImageLightbox";
import OrderChat from "@/components/OrderChat";

const STATUS_CONFIG = {
  DRAFT: { label: "Ноорог", color: "chip" },
  PUBLISHED: { label: "Нээлттэй", color: "chip-info" },
  AGENT_LOCKED: { label: "Агент түгжсэн", color: "chip-warning" },
  AGENT_RESEARCHING: { label: "Судалж байна", color: "chip-info" },
  REPORT_SUBMITTED: { label: "Тайлан ирсэн", color: "chip-success" },
  WAITING_USER_REVIEW: { label: "Таны шийдвэр хүлээж", color: "chip-warning" },
  USER_REJECTED: { label: "Цуцалсан", color: "chip-danger" },
  WAITING_PAYMENT: { label: "Төлбөр хүлээж", color: "chip-warning" },
  PAYMENT_CONFIRMED: { label: "Төлөгдсөн", color: "chip-success" },
  ORDER_PLACED: { label: "Захиалсан", color: "chip-success" },
  CARGO_IN_TRANSIT: { label: "Тээвэрт", color: "chip-info" },
  ARRIVED_AT_CARGO: { label: "Каргонд ирсэн", color: "chip-success" },
  COMPLETED: { label: "Дууссан", color: "chip-success" },
  CANCELLED_BY_USER: { label: "Цуцалсан", color: "chip-danger" },
};

const formatDate = (v) =>
  v
    ? new Intl.DateTimeFormat("mn", {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(v))
    : "-";

export default function UserOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showItems, setShowItems] = useState(true);
  const [previewImage, setPreviewImage] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [ord, st] = await Promise.all([
          api(`/api/orders/${id}`),
          api("/api/settings"),
        ]);
        if (!alive) return;
        setOrder(ord);
        setSettings(st || {});
      } catch (err) {
        if (!alive) return;
        setError(err.message || "Алдаа гарлаа.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    const socket = getSocket();
    const handleComment = (data) => {
      if (data?.orderId === id) {
        api(`/api/orders/${id}`).then(setOrder).catch(() => {});
      }
    };
    socket.on("order:comment", handleComment);
    return () => {
      alive = false;
      socket.off("order:comment", handleComment);
    };
  }, [id]);

  const items = order?.items || [];
  const reportItems = order?.report?.items || [];
  const totalQty = useMemo(() => items.reduce((s, it) => s + (it.quantity || 0), 0), [items]);
  const totalPriceCny = useMemo(() => {
    if (order?.report?.pricing?.grandTotalCny) return order.report.pricing.grandTotalCny;
    if (order?.report?.priceCny) return order.report.priceCny;
    return reportItems.reduce((s, it) => s + (it.agentTotal || 0), 0);
  }, [order, reportItems]);
  const rate = Number(settings?.cnyRate) || 0;
  const totalPriceMnt = rate ? Math.round(totalPriceCny * rate) : null;
  const showPaymentInfo = useMemo(
    () => ["WAITING_PAYMENT", "PAYMENT_CONFIRMED", "ORDER_PLACED", "CARGO_IN_TRANSIT", "ARRIVED_AT_CARGO", "COMPLETED"].includes(order?.status || ""),
    [order?.status]
  );
  const paymentStatus = order?.payment?.status || (order?.status === "WAITING_PAYMENT" ? "pending" : order?.status === "PAYMENT_CONFIRMED" ? "confirmed" : "");
  const trackingCode = order?.tracking?.code || "";
  const statusConfig = STATUS_CONFIG[order?.status] || { label: order?.status, color: "chip" };

  const doAction = async (path) => {
    setActionLoading(true);
    setError("");
    try {
      const updated = await api(path, { method: "POST" });
      setOrder(updated);
    } catch (err) {
      setError(err.message || "Үйлдэл амжилтгүй.");
    } finally {
      setActionLoading(false);
    }
  };

  const sendComment = async (orderId, message, attachments = []) => {
    setCommentLoading(true);
    setError("");
    try {
      const updated = await api(`/api/orders/${id}/comment`, {
        method: "POST",
        body: JSON.stringify({ message, attachments }),
      });
      setOrder(updated);
    } catch (err) {
      setError(err.message || "Сэтгэгдэл илгээхэд алдаа гарлаа.");
    } finally {
      setCommentLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="page-container flex items-center justify-center min-h-screen">
        <div className="space-y-3 text-center">
          <div className="skeleton w-16 h-16 rounded-full mx-auto" />
          <p className="text-sm text-muted">Ачааллаж байна...</p>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="page-container flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <p className="text-3xl">📭</p>
          <p className="text-[var(--accent-danger)]">{error || "Олдсонгүй"}</p>
          <Link href="/user/requests" className="link-primary text-sm">← Жагсаалт руу</Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="page-container">
        <div className="container-responsive py-responsive space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <button onClick={() => router.back()} className="back-link mb-2">← Буцах</button>
              <h1 className="page-title flex items-center gap-2 flex-wrap">
                #{order._id?.slice(-6)}
                <span className={`status-badge ${statusConfig.color}`}>{statusConfig.label}</span>
              </h1>
              <p className="page-subtitle">{formatDate(order.updatedAt)}</p>
            </div>
          </div>

          {error && <div className="error-box">{error}</div>}

          {/* Main Grid */}
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.6fr,1fr]">
            {/* Left Column */}
            <div className="space-y-4 sm:space-y-6">
              {/* Items Card */}
              <section className="surface-card rounded-xl sm:rounded-2xl card-padding">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Оруулсан бараа</h3>
                  <div className="flex items-center gap-2">
                    <span className="chip">{items.length} төрөл • {totalQty} ширхэг</span>
                    <Button variant="ghost" size="xs" onClick={() => setShowItems((v) => !v)}>
                      {showItems ? "Нуух" : "Харах"}
                    </Button>
                  </div>
                </div>
                {showItems ? (
                  <div className="space-y-2">
                    {items.map((item, idx) => {
                      const imgs = item.images || (item.imageUrl ? [item.imageUrl] : []);
                      return (
                        <div key={idx} className="surface-muted rounded-xl p-3 flex justify-between gap-3">
                          <div className="space-y-1 flex-1 min-w-0">
                            <p className="font-semibold text-sm">#{idx + 1} {item.title || "Бараа"}</p>
                            <p className="text-xs text-secondary">Тоо: {item.quantity || 1}</p>
                            {item.userNotes && <p className="text-xs text-secondary">📝 {item.userNotes}</p>}
                            {item.sourceUrl && (
                              <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="link-primary text-xs">
                                🔗 Линк
                              </a>
                            )}
                          </div>
                          {imgs[0] && (
                            <div
                              className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden surface-card cursor-pointer shrink-0"
                              onClick={() => setPreviewImage(imgs[0])}
                            >
                              <img src={imgs[0]} alt={item.title} className="img-cover" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted">Дэлгэрэнгүй харахад "Харах" дарна уу.</p>
                )}
              </section>

              {/* Report Card */}
              {order.report ? (
                <section className="surface-card rounded-xl sm:rounded-2xl card-padding">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Агентийн тайлан</h3>
                    <span className="text-xs text-muted">{formatDate(order.report.submittedAt)}</span>
                  </div>
                  <div className="surface-muted rounded-xl p-3 mb-4">
                    <p className="text-xs text-muted">Нийт дүн</p>
                    <p className="text-lg font-semibold">{totalPriceCny ?? "-"} CNY</p>
                  </div>
                  <div className="space-y-2">
                    {reportItems.map((rItem, idx) => {
                      const imgs = rItem.images || (rItem.imageUrl ? [rItem.imageUrl] : []);
                      const total = rItem.agentTotal ?? (rItem.agentPrice || 0) * (rItem.quantity || 1);
                      return (
                        <div key={idx} className="surface-muted rounded-xl p-3 flex justify-between gap-3">
                          <div className="space-y-1 flex-1 min-w-0">
                            <p className="font-semibold text-sm">#{idx + 1} {rItem.title}</p>
                            <p className="text-xs text-secondary">{rItem.agentPrice} × {rItem.quantity} = {total} CNY</p>
                            {rItem.note && <p className="text-xs text-secondary">📝 {rItem.note}</p>}
                          </div>
                          {imgs[0] && (
                            <div
                              className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden surface-card cursor-pointer shrink-0"
                              onClick={() => setPreviewImage(imgs[0])}
                            >
                              <img src={imgs[0]} alt={rItem.title} className="img-cover" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {order.status === "WAITING_USER_REVIEW" && (
                    <div className="surface-muted rounded-xl p-3 mt-4 text-xs text-secondary">
                      Та "Авах" дарсны дараа төлбөрийн мэдээлэл идэвхжинэ.
                    </div>
                  )}
                </section>
              ) : (
                <section className="surface-card rounded-xl sm:rounded-2xl card-padding">
                  <h3 className="font-semibold mb-3">Агентийн тайлан</h3>
                  <div className="empty-state py-6">
                    <p className="text-sm">Тайлан хараахан ирээгүй байна.</p>
                  </div>
                </section>
              )}

              {/* Comments Section */}
              {order.report && (
                <section className="surface-card rounded-xl sm:rounded-2xl card-padding">
                  <h3 className="font-semibold mb-2">💬 Асуулт / Сэтгэгдэл</h3>
                  <OrderChat
                    orderId={order._id}
                    comments={order.comments || []}
                    currentRole="user"
                    onSend={sendComment}
                    loading={commentLoading}
                  />
                </section>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4 sm:space-y-6">
              {/* Action Card */}
              <section className="surface-card rounded-xl sm:rounded-2xl card-padding">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Үйлдэл</h3>
                  <span className="text-xs text-muted">Үүссэн: {formatDate(order.createdAt)}</span>
                </div>
                {order.status === "WAITING_USER_REVIEW" ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={() => doAction(`/api/orders/${order._id}/request-order`)} loading={actionLoading} fullWidth size="lg" className="touch-target">
                      ✅ Авах
                    </Button>
                    <Button onClick={() => doAction(`/api/orders/${order._id}/cancel-after-report`)} loading={actionLoading} variant="danger" fullWidth size="lg" className="touch-target">
                      ❌ Цуцлах
                    </Button>
                  </div>
                ) : order.status === "PUBLISHED" ? (
                  <Button onClick={() => doAction(`/api/orders/${order._id}/cancel-before-agent`)} loading={actionLoading} variant="danger" fullWidth className="touch-target">
                    Цуцлах
                  </Button>
                ) : order.status === "ARRIVED_AT_CARGO" ? (
                  <Button onClick={() => doAction(`/api/orders/${order._id}/complete`)} loading={actionLoading} fullWidth size="lg" className="touch-target">
                    📦 Бараагаа авлаа
                  </Button>
                ) : (
                  <p className="text-sm text-muted">Одоогоор нэмэлт үйлдэл байхгүй.</p>
                )}
              </section>

              {/* Payment & Tracking Card */}
              <section className="surface-card rounded-xl sm:rounded-2xl card-padding">
                <h3 className="font-semibold mb-4">Төлбөр / Tracking</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted">Төлбөр:</span>
                    <span className={`status-badge ${paymentStatus === "confirmed" ? "chip-success" : paymentStatus === "pending" ? "chip-warning" : "chip"}`}>
                      {paymentStatus === "confirmed" ? "Баталгаажсан" : paymentStatus === "pending" ? "Хүлээж байна" : "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted">Tracking:</span>
                    {trackingCode ? (
                      <span className="chip-success text-xs font-semibold px-2 py-0.5 rounded-full">{trackingCode}</span>
                    ) : (
                      <span className="text-muted text-xs">Байхгүй</span>
                    )}
                  </div>
                </div>
              </section>

              {/* Payment Info Card */}
              <section className="surface-card rounded-xl sm:rounded-2xl card-padding">
                <h3 className="font-semibold mb-4">Нийт дүн ба данс</h3>
                {showPaymentInfo ? (
                  <div className="space-y-3">
                    <div className="surface-muted rounded-xl p-3">
                      <p className="text-xs text-muted">Нийт үнэ</p>
                      <p className="text-lg font-semibold">
                        {totalPriceCny ? `${totalPriceCny} CNY` : "-"}
                        {totalPriceMnt ? ` · ${totalPriceMnt.toLocaleString()}₮` : ""}
                      </p>
                    </div>
                    <div className="surface-muted rounded-xl p-3 space-y-1 text-sm text-secondary">
                      <p className="text-xs text-muted">Данс</p>
                      <p>{settings.bankName || "Банк тохируулаагүй"}</p>
                      <p>{settings.bankAccount || "Дансны дугаар тохируулаагүй"}</p>
                      {settings.bankOwner && <p>{settings.bankOwner}</p>}
                      <p className="text-xs text-muted mt-2">Ханш: {rate ? `${rate}₮/CNY` : "—"}</p>
                    </div>
                    {order?.report?.paymentLink && (
                      <div className="surface-muted rounded-xl p-3">
                        <p className="text-xs text-muted">Төлбөрийн холбоос</p>
                        <a href={order.report.paymentLink} target="_blank" rel="noreferrer" className="link-primary text-sm break-all">
                          {order.report.paymentLink}
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted">Төлбөрийн мэдээлэл зөвхөн "Авах" дарсны дараа харагдана.</p>
                )}
              </section>
            </div>
          </div>
        </div>
      </main>
      <ImageLightbox src={previewImage} alt="Зураг" onClose={() => setPreviewImage("")} />
    </>
  );
}
