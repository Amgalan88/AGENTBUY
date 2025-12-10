"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import Button from "@/components/ui/Button";
import ImageLightbox from "@/components/ImageLightbox";
import OrderChat from "@/components/OrderChat";
import type { Order } from "@/types/order";
import type { Status } from "@/types/common";

interface StatusConfig {
  label: string;
  color: string;
}

const STATUS_CONFIG: Partial<Record<Status, StatusConfig>> = {
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

const formatDate = (v: string | Date | undefined): string => {
  if (!v) return "-";
  return new Intl.DateTimeFormat("mn", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(v));
};

interface Settings {
  bankName?: string;
  bankAccount?: string;
  bankOwner?: string;
  cnyRate?: number;
  [key: string]: unknown;
}

export default function UserOrderDetailPage(): React.JSX.Element {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [showItems, setShowItems] = useState<boolean>(true);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [commentLoading, setCommentLoading] = useState<boolean>(false);

  useEffect(() => {
    let alive = true;
    (async (): Promise<void> => {
      setLoading(true);
      try {
        const [ord, st] = await Promise.all([
          api<Order>(`/api/orders/${id}`),
          api<Settings>("/api/settings"),
        ]);
        if (!alive) return;
        setOrder(ord);
        setSettings((st as Settings) || {});
      } catch (err) {
        if (!alive) return;
        const error = err as Error;
        setError(error.message || "Алдаа гарлаа.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    const socket = getSocket();
    if (!socket) return;
    
    interface CommentData {
      orderId?: string;
    }
    
    const handleComment = (data: CommentData): void => {
      if (data?.orderId === id) {
        api<Order>(`/api/orders/${id}`).then(setOrder).catch(() => {});
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
  const totalQty = useMemo<number>(() => items.reduce((s, it) => s + (it.quantity || 0), 0), [items]);
  const totalPriceCny = useMemo<number>(() => {
    if (order?.report?.pricing?.grandTotalCny) return order.report.pricing.grandTotalCny;
    return reportItems.reduce((s, it) => s + (it.agentTotal || 0), 0);
  }, [order, reportItems]);
  const rate = Number(settings?.cnyRate) || 0;
  const totalPriceMnt = rate ? Math.round(totalPriceCny * rate) : null;
  const showPaymentInfo = useMemo<boolean>(
    () => ["WAITING_PAYMENT", "PAYMENT_CONFIRMED", "ORDER_PLACED", "CARGO_IN_TRANSIT", "ARRIVED_AT_CARGO", "COMPLETED"].includes(order?.status || ""),
    [order?.status]
  );
  const paymentStatus = order?.payment?.status || (order?.status === "WAITING_PAYMENT" ? "pending" : order?.status === "PAYMENT_CONFIRMED" ? "confirmed" : "");
  const trackingCode = (typeof order?.tracking === "object" && order?.tracking?.code) || (typeof order?.tracking === "string" ? order.tracking : "") || "";
  const statusConfig = STATUS_CONFIG[order?.status || "DRAFT"] || { label: order?.status || "", color: "chip" };

  const doAction = async (path: string): Promise<void> => {
    setActionLoading(true);
    setError("");
    try {
      const updated = await api<Order>(path, { method: "POST" });
      setOrder(updated);
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Үйлдэл амжилтгүй.");
    } finally {
      setActionLoading(false);
    }
  };

  const sendComment = async (orderId: string, message: string, attachments: string[] = []): Promise<void> => {
    setCommentLoading(true);
    setError("");
    try {
      const updated = await api<Order>(`/api/orders/${id}/comment`, {
        method: "POST",
        body: { message, attachments },
      });
      setOrder(updated);
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Сэтгэгдэл илгээхэд алдаа гарлаа.");
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

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.6fr,1fr]">
            <div className="space-y-4 sm:space-y-6">
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
                      const rawImgs = item.images || (item.imageUrl ? [item.imageUrl] : []);
                      const imgs = rawImgs.filter((img): img is string => 
                        img && 
                        typeof img === "string" && 
                        img.trim() !== "" && 
                        !img.startsWith("data:") &&
                        (img.startsWith("http://") || img.startsWith("https://"))
                      );
                      // Report-ийн item-level tracking код олох (агентын оруулсан)
                      const itemTrackingCode = order?.report?.items?.[idx]?.trackingCode;
                      return (
                        <div key={idx} className="surface-muted rounded-xl p-3 flex justify-between gap-3">
                          <div className="space-y-1 flex-1 min-w-0">
                            <p className="font-semibold text-sm">#{idx + 1} {item.title || "Бараа"}</p>
                            <p className="text-xs text-secondary">Тоо: {item.quantity || 1}</p>
                            {item.userNotes && <p className="text-xs text-secondary">📝 {item.userNotes}</p>}
                            {itemTrackingCode && (
                              <div className="mt-1">
                                <span className="text-xs text-muted">Tracking: </span>
                                <button
                                  onClick={async (e) => {
                                    try {
                                      await navigator.clipboard.writeText(itemTrackingCode);
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
                                  className="chip-success text-xs font-semibold px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity cursor-pointer"
                                  title="Tracking код хуулах"
                                >
                                  📦 {itemTrackingCode}
                                </button>
                              </div>
                            )}
                            {item.sourceUrl && (
                              <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="link-primary text-xs">
                                🔗 Линк
                              </a>
                            )}
                          </div>
                          {imgs.length > 0 && (
                            <div className="flex gap-1 flex-wrap shrink-0">
                              {imgs.map((img, imgIdx) => (
                                <div
                                  key={imgIdx}
                                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden surface-card cursor-pointer"
                                  onClick={() => setPreviewImage(img)}
                                >
                                  <img
                                    src={img}
                                    alt={`${item.title} ${imgIdx + 1}`}
                                    className="img-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      if (img && img.startsWith("data:")) {
                                        target.src = "/marketplace/taobao.png";
                                      } else {
                                        target.style.display = "none";
                                      }
                                    }}
                                  />
                                </div>
                              ))}
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

              {order.report ? (
                <section className="surface-card rounded-xl sm:rounded-2xl card-padding">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Агентийн тайлан</h3>
                    <span className="text-xs text-muted">{formatDate(order.report.submittedAt)}</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 mb-4">
                    <div className="surface-muted rounded-xl p-3">
                      <p className="text-xs text-muted">Нийт дүн</p>
                      <p className="text-lg font-semibold">{totalPriceCny ?? "-"} CNY</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {reportItems.map((rItem, idx) => {
                      const rawImgs = rItem.images || (rItem.imageUrl ? [rItem.imageUrl] : []);
                      const imgs = rawImgs.filter((img): img is string => 
                        img && 
                        typeof img === "string" && 
                        img.trim() !== "" && 
                        !img.startsWith("data:") &&
                        (img.startsWith("http://") || img.startsWith("https://"))
                      );
                      const total = rItem.agentTotal ?? (rItem.agentPrice || 0) * (rItem.quantity || 1);
                      const itemTrackingCode = (rItem as { trackingCode?: string }).trackingCode;
                      // Барааны нэрийг олох - эхлээд report item-аас, дараа нь order items-аас
                      const itemTitle = rItem.title || items[idx]?.title || "Бараа";
                      return (
                        <div key={idx} className="surface-muted rounded-xl p-3 flex justify-between gap-3">
                          <div className="space-y-1 flex-1 min-w-0">
                            <p className="font-semibold text-sm">#{idx + 1} {itemTitle}</p>
                            <p className="text-xs text-secondary">{rItem.agentPrice} × {rItem.quantity} = {total} CNY</p>
                            {(rItem as { note?: string }).note && <p className="text-xs text-secondary">📝 {(rItem as { note?: string }).note}</p>}
                            {itemTrackingCode && (
                              <div className="mt-1">
                                <span className="text-xs text-muted">Tracking: </span>
                                <button
                                  onClick={async (e) => {
                                    try {
                                      await navigator.clipboard.writeText(itemTrackingCode);
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
                                  className="chip-success text-xs font-semibold px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity cursor-pointer"
                                  title="Tracking код хуулах"
                                >
                                  📦 {itemTrackingCode}
                                </button>
                              </div>
                            )}
                          </div>
                          {imgs.length > 0 && (
                            <div className="flex gap-1 flex-wrap shrink-0">
                              {imgs.map((img, imgIdx) => (
                                <div
                                  key={imgIdx}
                                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden surface-card cursor-pointer"
                                  onClick={() => setPreviewImage(img)}
                                >
                                  <img 
                                    src={img} 
                                    alt={`${itemTitle} ${imgIdx + 1}`} 
                                    className="img-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      if (img && img.startsWith("data:")) {
                                        target.src = "/marketplace/taobao.png";
                                      } else {
                                        target.style.display = "none";
                                      }
                                    }}
                                  />
                                </div>
                              ))}
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

            <div className="space-y-4 sm:space-y-6">
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
                      <button
                        onClick={async (e) => {
                          try {
                            await navigator.clipboard.writeText(trackingCode);
                            // Show feedback
                            const btn = e.target as HTMLElement;
                            const originalText = btn.textContent;
                            btn.textContent = "✓ Хуулсан!";
                            btn.className = "chip-success text-xs font-semibold px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity";
                            setTimeout(() => {
                              btn.textContent = originalText;
                              btn.className = "chip-success text-xs font-semibold px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity cursor-pointer";
                            }, 2000);
                          } catch (err) {
                            alert("Хуулах боломжгүй");
                          }
                        }}
                        className="chip-success text-xs font-semibold px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity cursor-pointer"
                        title="Tracking код хуулах"
                      >
                        📦 {trackingCode}
                      </button>
                    ) : (
                      <span className="text-muted text-xs">Байхгүй</span>
                    )}
                  </div>
                </div>
              </section>

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

