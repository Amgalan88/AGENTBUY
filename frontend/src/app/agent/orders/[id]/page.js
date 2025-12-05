"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Button from "@/components/ui/Button";
import ImageLightbox from "@/components/ImageLightbox";

const STATUS_CONFIG = {
  PUBLISHED: { label: "Нээлттэй", color: "chip-info" },
  AGENT_LOCKED: { label: "Түгжсэн", color: "chip-warning" },
  AGENT_RESEARCHING: { label: "Судалж байна", color: "chip-info" },
  REPORT_SUBMITTED: { label: "Тайлан илгээсэн", color: "chip-success" },
  WAITING_USER_REVIEW: { label: "Хэрэглэгчийн шийдвэр", color: "chip-warning" },
  WAITING_PAYMENT: { label: "Төлбөр хүлээж", color: "chip-warning" },
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

export default function AgentOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [paymentLink, setPaymentLink] = useState("");
  const [reportDraft, setReportDraft] = useState([]);
  const [trackingCode, setTrackingCode] = useState("");
  const [previewImage, setPreviewImage] = useState("");

  const mappedItems = useMemo(() => {
    if (!order?.items) return [];
    return order.items.map((it) => ({
      ...it,
      images: it.images || (it.imageUrl ? [it.imageUrl] : []),
    }));
  }, [order]);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await api(`/api/agent/orders/${id}`);
        if (!alive) return;
        setOrder(data);
        setReportDraft(
          (data.items || []).map((it) => ({
            price: "",
            note: "",
            images: it.images || (it.imageUrl ? [it.imageUrl] : []),
          }))
        );
        setPaymentLink(data.report?.paymentLink || "");
        setTrackingCode(data.tracking?.code || "");
      } catch (err) {
        if (!alive) return;
        setError(err.message || "Захиалга уншихад алдаа");
      } finally {
        if (alive) setLoading(false);
      }
    }
    if (id) load();
    return () => { alive = false; };
  }, [id]);

  const doAction = async (path, body) => {
    setActionLoading(true);
    setError("");
    try {
      const updated = await api(path, {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      });
      setOrder(updated);
    } catch (err) {
      setError(err.message || "Үйлдэл амжилтгүй.");
    } finally {
      setActionLoading(false);
    }
  };

  const saveTracking = async () => {
    if (!order?._id) return;
    setActionLoading(true);
    setError("");
    try {
      const updated = await api(`/api/agent/orders/${order._id}/tracking`, {
        method: "POST",
        body: JSON.stringify({ code: trackingCode }),
      });
      setOrder(updated);
    } catch (err) {
      setError(err.message || "Tracking хадгалах алдаа.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = () => doAction(`/api/agent/orders/${order._id}/start`);

  const handleReport = () => {
    const draftedItems = mappedItems.map((it, idx) => {
      const draft = reportDraft[idx] || {};
      const price = Number(draft.price) || 0;
      const qty = it.quantity || 1;
      const total = price * qty;
      const imgs = draft.images?.length ? draft.images : it.images;
      return {
        title: it.title,
        quantity: it.quantity,
        agentPrice: price,
        agentTotal: total,
        agentCurrency: "CNY",
        images: imgs,
        imageUrl: imgs?.[0] || it.imageUrl,
        note: draft.note || undefined,
        sourceUrl: it.sourceUrl,
      };
    });
    const grandTotal = draftedItems.reduce((s, it) => s + (it.agentTotal || 0), 0);
    doAction(`/api/agent/orders/${order._id}/report`, {
      items: draftedItems,
      pricing: { grandTotalCny: grandTotal },
      paymentLink: paymentLink || undefined,
    });
  };

  const status = order?.status;
  const totalQty = order?.items?.reduce((s, it) => s + (it.quantity || 0), 0) || 0;
  const reportTotalCny = order?.report?.pricing?.grandTotalCny;
  const canTrack = ["ORDER_PLACED", "CARGO_IN_TRANSIT", "ARRIVED_AT_CARGO", "COMPLETED"].includes(status);
  const statusConfig = STATUS_CONFIG[status] || { label: status, color: "chip" };

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
          <p className="text-[var(--accent-danger)]">{error || "Захиалга олдсонгүй"}</p>
          <Link href="/agent" className="link-primary text-sm">← Буцах</Link>
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
              <h1 className="page-title flex items-center gap-2">
                #{order._id?.slice(-6)}
                <span className={`status-badge ${statusConfig.color}`}>{statusConfig.label}</span>
              </h1>
              <p className="page-subtitle">Карго: {order.cargoId?.name || "Сонгоогүй"} • {formatDate(order.createdAt)}</p>
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
                  <h3 className="font-semibold">Хэрэглэгчийн бараа</h3>
                  <span className="chip">{order.items?.length || 0} мөр • {totalQty} ширхэг</span>
                </div>
                <div className="space-y-3">
                  {mappedItems.map((item, idx) => (
                    <article key={idx} className="surface-muted rounded-xl p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="font-semibold text-sm">#{idx + 1} {item.title || "Бараа"}</p>
                          <p className="text-xs text-secondary">Тоо: {item.quantity || 1}</p>
                          {item.userNotes && <p className="text-xs text-secondary">📝 {item.userNotes}</p>}
                          {item.sourceUrl && (
                            <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="link-primary text-xs">
                              🔗 Холбоос
                            </a>
                          )}
                        </div>
                        {item.images?.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {item.images.slice(0, 3).map((img, imgIdx) => (
                              <div
                                key={imgIdx}
                                className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden surface-card cursor-pointer"
                                onClick={() => setPreviewImage(img)}
                              >
                                <img src={img} alt={item.title} className="img-cover" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              {/* Report Form */}
              {status === "AGENT_RESEARCHING" && (
                <section className="surface-card rounded-xl sm:rounded-2xl card-padding">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Тайлан бэлтгэх</h3>
                    <span className="chip">CNY</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Төлбөрийн холбоос</label>
                      <input
                        type="url"
                        value={paymentLink}
                        onChange={(e) => setPaymentLink(e.target.value)}
                        className="input-field"
                        placeholder="https://pay.example.com"
                      />
                    </div>
                    {mappedItems.map((item, idx) => {
                      const draft = reportDraft[idx] || {};
                      return (
                        <div key={idx} className="surface-muted rounded-xl p-3 sm:p-4">
                          <p className="font-semibold text-sm mb-3">#{idx + 1} {item.title}</p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="block text-xs text-secondary mb-1">Нэгж үнэ (CNY)</label>
                              <input
                                type="number"
                                value={draft.price}
                                onChange={(e) =>
                                  setReportDraft((prev) =>
                                    prev.map((d, i) => (i === idx ? { ...d, price: e.target.value } : d))
                                  )
                                }
                                className="input-field"
                                placeholder="80"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-secondary mb-1">Тайлбар</label>
                              <input
                                type="text"
                                value={draft.note || ""}
                                onChange={(e) =>
                                  setReportDraft((prev) =>
                                    prev.map((d, i) => (i === idx ? { ...d, note: e.target.value } : d))
                                  )
                                }
                                className="input-field"
                                placeholder="Хэмжээ, материал..."
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Button onClick={handleReport} loading={actionLoading} fullWidth size="lg" className="mt-4 touch-target">
                    Тайлан илгээх
                  </Button>
                </section>
              )}

              {/* Submitted Report */}
              {order.report && (
                <section className="surface-card rounded-xl sm:rounded-2xl card-padding">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Илгээсэн тайлан</h3>
                    <span className="text-xs text-muted">{formatDate(order.report.submittedAt)}</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 mb-4">
                    <div className="surface-muted rounded-xl p-3">
                      <p className="text-xs text-muted">Нийт дүн</p>
                      <p className="text-lg font-semibold">{reportTotalCny || "-"} CNY</p>
                    </div>
                    <div className="surface-muted rounded-xl p-3">
                      <p className="text-xs text-muted">Төлбөрийн холбоос</p>
                      {order.report.paymentLink ? (
                        <a href={order.report.paymentLink} target="_blank" rel="noreferrer" className="link-primary text-sm line-clamp-1">
                          {order.report.paymentLink}
                        </a>
                      ) : (
                        <p className="text-sm text-secondary">Оруулаагүй</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {(order.report.items || []).map((rItem, idx) => (
                      <div key={idx} className="surface-muted rounded-xl p-3 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">#{idx + 1} {rItem.title}</p>
                          <p className="text-xs text-secondary">{rItem.agentPrice} × {rItem.quantity} = {rItem.agentTotal} CNY</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Right Column - Actions */}
            <div className="space-y-4 sm:space-y-6">
              {/* Action Card */}
              <section className="surface-card rounded-xl sm:rounded-2xl card-padding">
                <h3 className="font-semibold mb-4">Үйлдэл</h3>
                {status === "PUBLISHED" && (
                  <Button onClick={() => doAction(`/api/agent/orders/${order._id}/lock`)} loading={actionLoading} fullWidth size="lg" className="touch-target">
                    🔒 Захиалгыг түгжих
                  </Button>
                )}
                {status === "AGENT_LOCKED" && (
                  <Button onClick={handleStart} loading={actionLoading} fullWidth size="lg" className="touch-target">
                    ▶️ Судалгаа эхлүүлэх
                  </Button>
                )}
                {status === "AGENT_RESEARCHING" && (
                  <p className="text-sm text-secondary">Бүх бараанд үнэ оруулаад "Тайлан илгээх" дарна.</p>
                )}
                {status === "WAITING_USER_REVIEW" && (
                  <p className="text-sm text-secondary">Хэрэглэгч шийдвэрлэхийг хүлээж байна.</p>
                )}
              </section>

              {/* Tracking Card */}
              {canTrack && (
                <section className="surface-card rounded-xl sm:rounded-2xl card-padding">
                  <h3 className="font-semibold mb-4">Tracking код</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={trackingCode}
                      onChange={(e) => setTrackingCode(e.target.value)}
                      placeholder="TRK код"
                      className="input-field"
                    />
                    <Button onClick={saveTracking} loading={actionLoading} variant="secondary" fullWidth className="touch-target">
                      Хадгалах
                    </Button>
                    {order.tracking?.code && (
                      <p className="text-xs text-muted">Сүүлд: {order.tracking.code}</p>
                    )}
                  </div>
                </section>
              )}

              {/* Info Card */}
              <section className="surface-card rounded-xl sm:rounded-2xl card-padding">
                <h3 className="font-semibold mb-4">Мэдээлэл</h3>
                <div className="space-y-2 text-sm text-secondary">
                  <p>📅 Үүсгэсэн: {formatDate(order.createdAt)}</p>
                  <p>🔄 Шинэчилсэн: {formatDate(order.updatedAt)}</p>
                  <p>🚚 Карго: {order.cargoId?.name || "Сонгоогүй"}</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      <ImageLightbox src={previewImage} alt="Зураг" onClose={() => setPreviewImage("")} />
    </>
  );
}
