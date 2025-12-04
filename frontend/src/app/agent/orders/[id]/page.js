"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useUI } from "../../../layout";
import { api } from "@/lib/api";

const statusLabel = {
  PUBLISHED: "Нээлттэй",
  AGENT_LOCKED: "Түгжсэн",
  AGENT_RESEARCHING: "Судалж байна",
  REPORT_SUBMITTED: "Тайлан илгээгдсэн",
  WAITING_USER_REVIEW: "Хэрэглэгчийн шийдвэр",
  WAITING_PAYMENT: "Төлбөр хүлээж байна",
  COMPLETED: "Амжилттай хаасан",
};

const appIcon = {
  taobao: "/marketplace/taobao.png",
  pinduoduo: "/marketplace/pinduoudo.png",
  "1688": "/marketplace/1688.jpg",
  dewu: "/marketplace/poizon.png",
  any: "/marketplace/taobao.png",
};

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

export default function AgentOrderDetailPage() {
  const { theme, view } = useUI();
  const { id } = useParams();
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [paymentLink, setPaymentLink] = useState("");
  const [reportDraft, setReportDraft] = useState([]);
  const [trackingCode, setTrackingCode] = useState("");

  const mainClass =
    theme === "night"
      ? "bg-slate-950 text-slate-50"
      : theme === "mid"
        ? "bg-slate-200 text-slate-900"
        : "bg-slate-100 text-slate-900";

  const cardClass =
    theme === "night"
      ? "bg-slate-900/80 border-slate-700"
      : theme === "mid"
        ? "bg-slate-100 border-slate-300"
        : "bg-white border-slate-200";

  const widthClass =
    view === "mobile"
      ? "max-w-md"
      : view === "tablet"
        ? "max-w-3xl"
        : "max-w-5xl";

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
        setError(err.message || "Захиалга уншихад алдаа гарлаа");
      } finally {
        if (alive) setLoading(false);
      }
    }
    if (id) load();
    return () => {
      alive = false;
    };
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
      pricing: {
        grandTotalCny: grandTotal,
      },
      paymentLink: paymentLink || undefined,
    });
  };

  const status = order?.status;
  const totalQty = order?.items?.reduce((s, it) => s + (it.quantity || 0), 0) || 0;
  const reportTotalCny = order?.report?.pricing?.grandTotalCny;
  const reportImagesPreview =
    (order?.report?.items || [])
      .flatMap((it) => (it.images || (it.imageUrl ? [it.imageUrl] : [])).slice(0, 3))
      .slice(0, 3);

  if (loading) {
    return (
      <main className={`${mainClass} min-h-screen flex items-center justify-center`}>
        <p className="text-sm text-slate-500">Ачааллаж байна...</p>
      </main>
    );
  }

  if (!order) {
    return (
      <main className={`${mainClass} min-h-screen flex items-center justify-center`}>
        <div className="text-center space-y-2">
          <p className="text-sm text-rose-600">{error || "Захиалга олдсонгүй"}</p>
          <Link href="/agent" className="text-sm text-emerald-600 hover:underline">
            Буцах
          </Link>
        </div>
      </main>
    );
  }

  const firstApp = order.items?.[0]?.app;
  const platformIcon = appIcon[firstApp] || appIcon.any;
  const canTrack = ["ORDER_PLACED", "CARGO_IN_TRANSIT", "ARRIVED_AT_CARGO", "COMPLETED"].includes(status);

  return (
    <main className={`${mainClass} min-h-screen`}>
      <div className={`${widthClass} mx-auto px-4 py-10 space-y-6`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-70">Агент захиалга</p>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              #{order._id?.slice(-6)}
              <img src={platformIcon} alt="app" className="h-6 w-6 rounded" />
            </h1>
            <p className="text-xs text-slate-500">Карго: {order.cargoId?.name || "Сонгогдоогүй"}</p>
          </div>
          <button className="text-sm opacity-70 hover:text-emerald-600" onClick={() => router.back()}>
            ← Буцах
          </button>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {error}
          </div>
        )}

        <section className={`rounded-3xl border px-5 py-5 ${cardClass}`}>
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>
              Статус: <strong>{statusLabel[status] || status}</strong>
            </span>
            <span>Үүсгэсэн: {formatDate(order.createdAt)}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-xs text-slate-500">Нийт бараа: {order.items?.length || 0}</span>
            <span className="text-xs text-slate-500">Тоо хэмжээ: {totalQty}</span>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
          <div className="space-y-5">
            <div className={`rounded-3xl border px-5 py-5 ${cardClass}`}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-slate-900">Хэрэглэгчийн оруулсан бараа</h3>
                <span className="text-xs text-slate-500">{order.items?.length || 0} мөр</span>
              </div>
              <div className="mt-4 space-y-3">
                {mappedItems.map((item, idx) => (
                  <article
                    key={`${item.title}-${idx}`}
                    className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900">
                          #{idx + 1} {item.title || "Бараа"}
                        </p>
                        <p className="text-xs text-slate-600">Тоо: {item.quantity || 1}</p>
                        {item.userNotes && (
                          <p className="text-xs text-slate-600">Тэмдэглэл: {item.userNotes}</p>
                        )}
                        {item.sourceUrl && (
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-emerald-600 underline"
                          >
                            Барааны холбоос
                          </a>
                        )}
                      </div>
                      {item.images?.length > 0 && (
                        <div className="flex items-center gap-2">
                          {item.images.slice(0, 3).map((img, imgIdx) => (
                            <div
                              key={imgIdx}
                              className="h-16 w-20 overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                            >
                              <img src={img} alt={item.title} className="h-full w-full object-cover" />
                            </div>
                          ))}
                          {item.images.length > 3 && (
                            <span className="text-[11px] text-slate-500">+{item.images.length - 3} зураг</span>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {status === "AGENT_RESEARCHING" && (
              <div className={`rounded-3xl border px-5 py-5 ${cardClass}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Тайлан бэлтгэх</h3>
                  <span className="text-xs text-slate-500">Бүх үнэ CNY</span>
                </div>
                <div className="mt-4 space-y-3">
                  <label className="text-sm font-medium text-slate-700">Төлбөрийн холбоос</label>
                  <input
                    type="url"
                    value={paymentLink}
                    onChange={(e) => setPaymentLink(e.target.value)}
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    placeholder="https://pay.example.com/invoice"
                  />
                </div>
                <div className="mt-5 space-y-4">
                  {mappedItems.map((item, idx) => {
                    const draft = reportDraft[idx] || {};
                    return (
                      <div key={idx} className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-slate-900">
                              #{idx + 1} {item.title || "Бараа"}
                            </p>
                            <p className="text-xs text-slate-600">Тоо: {item.quantity || 1}</p>
                          </div>
                          {item.images?.[0] && (
                            <div className="h-16 w-20 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                              <img src={item.images[0]} alt={item.title} className="h-full w-full object-cover" />
                            </div>
                          )}
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <label className="text-xs font-medium text-slate-600 flex flex-col gap-2">
                            Нэгж үнэ (CNY)
                            <input
                              type="number"
                              value={draft.price}
                              onChange={(e) =>
                                setReportDraft((prev) =>
                                  prev.map((d, i) => (i === idx ? { ...d, price: e.target.value } : d))
                                )
                              }
                              className="rounded-xl border px-3 py-2 text-sm"
                              placeholder="Жишээ: 80"
                            />
                          </label>
                          <label className="text-xs font-medium text-slate-600 flex flex-col gap-2">
                            Тайлбар
                            <input
                              type="text"
                              value={draft.note || ""}
                              onChange={(e) =>
                                setReportDraft((prev) =>
                                  prev.map((d, i) => (i === idx ? { ...d, note: e.target.value } : d))
                                )
                              }
                              className="rounded-xl border px-3 py-2 text-sm"
                              placeholder="Хэмжээ, материал, загвар..."
                            />
                          </label>
                        </div>
                        <div className="mt-3">
                          <p className="text-xs font-medium text-slate-600 mb-2">Зураг (татаж оруулах)</p>
                          <div className="flex flex-wrap gap-3">
                            {(draft.images || []).map((img, imgIdx) => (
                              <div
                                key={imgIdx}
                                className="relative h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                              >
                                <img src={img} alt={`draft-${idx}-${imgIdx}`} className="h-full w-full object-cover" />
                                <button
                                  onClick={() =>
                                    setReportDraft((prev) =>
                                      prev.map((d, i) =>
                                        i === idx
                                          ? { ...d, images: (d.images || []).filter((_, ii) => ii !== imgIdx) }
                                          : d
                                      )
                                    )
                                  }
                                  className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white text-[10px]"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                            <label className="h-16 w-16 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-500 cursor-pointer hover:border-emerald-400">
                              <span className="text-lg">＋</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    setReportDraft((prev) =>
                                      prev.map((d, i) =>
                                        i === idx ? { ...d, images: [...(d.images || []), reader.result] } : d
                                      )
                                    );
                                  };
                                  reader.readAsDataURL(file);
                                  e.target.value = "";
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-5">
                  <button
                    disabled={actionLoading}
                    onClick={handleReport}
                    className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-70"
                  >
                    {actionLoading ? "Илгээж байна..." : "Тайлан илгээх"}
                  </button>
                </div>
              </div>
            )}

            {order.report && (
              <div className={`rounded-3xl border px-5 py-5 ${cardClass}`}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-slate-900">Илгээсэн тайлан</h3>
                  <span className="text-xs text-slate-500">{formatDate(order.report.submittedAt)}</span>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white/60 px-4 py-3">
                    <p className="text-xs text-slate-500">Нийт дүн</p>
                    <p className="text-lg font-semibold text-slate-900">{reportTotalCny || "-"} CNY</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/60 px-4 py-3">
                    <p className="text-xs text-slate-500">Төлбөрийн холбоос</p>
                    {order.report.paymentLink ? (
                      <a
                        href={order.report.paymentLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-emerald-600 underline"
                      >
                        {order.report.paymentLink}
                      </a>
                    ) : (
                      <p className="text-sm text-slate-600">Оруулаагүй байна</p>
                    )}
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {(order.report.items || []).map((rItem, idx) => {
                    const imgs = (rItem.images || (rItem.imageUrl ? [rItem.imageUrl] : [])).slice(0, 3);
                    return (
                      <div key={idx} className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-slate-900">
                              #{idx + 1} {rItem.title || "Бараа"}
                            </p>
                            <p className="text-xs text-slate-600">
                              Нэгж: {rItem.agentPrice || "-"} {rItem.agentCurrency || "CNY"} × {rItem.quantity || 1}
                            </p>
                            <p className="text-xs font-semibold text-slate-800">
                              Нийт: {rItem.agentTotal ?? "-"} CNY
                            </p>
                            {rItem.note && <p className="text-xs text-slate-600">Тайлбар: {rItem.note}</p>}
                            {rItem.sourceUrl && (
                              <a
                                href={rItem.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-semibold text-emerald-600 underline"
                              >
                                Барааны холбоос
                              </a>
                            )}
                          </div>
                          {imgs?.length > 0 && (
                            <div className="flex items-center gap-2">
                              {imgs.map((img, imgIdx) => (
                                <div
                                  key={imgIdx}
                                  className="h-16 w-16 overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                                >
                                  <img src={img} alt={`report-${idx}-${imgIdx}`} className="h-full w-full object-cover" />
                                </div>
                              ))}
                              {rItem.images?.length > 3 && (
                                <span className="text-[11px] text-slate-500">+{rItem.images.length - 3} зураг</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {reportImagesPreview.length > 0 && (
                  <div className="mt-4 flex gap-2">
                    {reportImagesPreview.map((img, idx) => (
                      <div
                        key={idx}
                        className="h-14 w-14 overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                      >
                        <img src={img} alt={`preview-${idx}`} className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className={`rounded-3xl border px-5 py-5 ${cardClass}`}>
              <h3 className="text-base font-semibold text-slate-900 mb-3">Үйлдэл</h3>
              {status === "PUBLISHED" && (
                <button
                  disabled={actionLoading}
                  onClick={() => doAction(`/api/agent/orders/${order._id}/lock`)}
                  className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-70"
                >
                  {actionLoading ? "Түгжиж байна..." : "Захиалгыг түгжих"}
                </button>
              )}
              {status === "AGENT_LOCKED" && (
                <button
                  disabled={actionLoading}
                  onClick={handleStart}
                  className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-70"
                >
                  {actionLoading ? "Эхлүүлж байна..." : "Судалгаа эхлүүлэх"}
                </button>
              )}
              {status === "AGENT_RESEARCHING" && (
                <p className="text-sm text-slate-600">
                  Бүх бараанд үнэ, зураг, товч тайлбар оруулаад доорх “Тайлан илгээх”-ийг дарна.
                </p>
              )}
              {status === "WAITING_USER_REVIEW" && (
                <p className="text-sm text-slate-600">
                  Хэрэглэгч шийдвэрлэхийг хүлээж байна. Шинэчлэх шаардлагатай бол хэрэглэгчтэй чатлана уу.
                </p>
              )}
            </div>

            {canTrack && (
              <div className={`rounded-3xl border px-5 py-5 ${cardClass}`}>
                <h3 className="text-base font-semibold text-slate-900 mb-3">Tracking код</h3>
                <div className="flex flex-col gap-2 text-sm text-slate-700">
                  <input
                    type="text"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    placeholder="TRK код"
                    className="rounded-xl border px-3 py-2"
                  />
                  <button
                    disabled={actionLoading}
                    onClick={saveTracking}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {actionLoading ? "Хадгалж байна..." : "Хадгалах"}
                  </button>
                  {order.tracking?.code && (
                    <p className="text-xs text-slate-500">Сүүлд: {order.tracking.code}</p>
                  )}
                </div>
              </div>
            )}

            <div className={`rounded-3xl border px-5 py-5 ${cardClass}`}>
              <h3 className="text-base font-semibold text-slate-900 mb-3">Товч мэдээлэл</h3>
              <div className="space-y-2 text-sm text-slate-700">
                <p>Үүсгэсэн: {formatDate(order.createdAt)}</p>
                <p>Сүүлд шинэчилсэн: {formatDate(order.updatedAt)}</p>
                <p>Карго: {order.cargoId?.name || "Сонгогдоогүй"}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
