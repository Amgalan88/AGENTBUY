"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useUI } from "../../../layout";

const statusText = {
  DRAFT: "Ноорог",
  PUBLISHED: "Нийтэлсэн",
  AGENT_LOCKED: "Агент түгжсэн",
  AGENT_RESEARCHING: "Агент судалж байна",
  REPORT_SUBMITTED: "Тайлан илгээсэн",
  WAITING_USER_REVIEW: "Таны шийдвэр хүлээж байна",
  USER_REJECTED: "Тайланг цуцалсан",
  WAITING_PAYMENT: "Төлбөр хүлээж байна",
  PAYMENT_EXPIRED: "Төлбөрийн хугацаа дууссан",
  PAYMENT_CONFIRMED: "Төлбөр баталгаажсан",
  ORDER_PLACED: "Захиалга хийгдсэн",
  CARGO_IN_TRANSIT: "Тээвэрлэлтэд явж байна",
  ARRIVED_AT_CARGO: "Каргонд ирсэн",
  COMPLETED: "Дууссан",
  CANCELLED_BY_USER: "Хэрэглэгч цуцалсан",
  CANCELLED_BY_ADMIN: "Админ цуцалсан",
  CANCELLED_NO_AGENT: "Агентгүй хаагдсан",
};

const badgeTone = {
  WAITING_USER_REVIEW: "bg-amber-100 text-amber-700 border-amber-200",
  WAITING_PAYMENT: "bg-amber-100 text-amber-700 border-amber-200",
  PAYMENT_CONFIRMED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CANCELLED_BY_USER: "bg-rose-100 text-rose-700 border-rose-200",
  CANCELLED_BY_ADMIN: "bg-rose-100 text-rose-700 border-rose-200",
  CANCELLED_NO_AGENT: "bg-rose-100 text-rose-700 border-rose-200",
};

const formatDate = (v) =>
  v
    ? new Intl.DateTimeFormat("mn", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(v))
    : "-";

const Pill = ({ tone, children }) => (
  <span
    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
      tone || "bg-slate-100 text-slate-700 border-slate-200"
    }`}
  >
    {children}
  </span>
);

const SectionCard = ({ title, right, children }) => (
  <section className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {right}
    </div>
    <div className="mt-3">{children}</div>
  </section>
);

export default function UserOrderDetailPage() {
  const { theme, view } = useUI();
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showItems, setShowItems] = useState(true);

  const mainBg =
    theme === "night"
      ? "bg-slate-950 text-slate-50"
      : theme === "mid"
      ? "bg-slate-100 text-slate-900"
      : "bg-white text-slate-900";
  const widthClass = view === "mobile" ? "max-w-md" : view === "tablet" ? "max-w-3xl" : "max-w-4xl";

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [ord, st] = await Promise.all([api(`/api/orders/${id}`), api("/api/settings")]);
        if (!alive) return;
        setOrder(ord);
        setSettings(st || {});
      } catch (err) {
        if (!alive) return;
        setError(err.message || "Системийн алдаа гарлаа.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
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
    () =>
      ["WAITING_PAYMENT", "PAYMENT_CONFIRMED", "ORDER_PLACED", "CARGO_IN_TRANSIT", "ARRIVED_AT_CARGO", "COMPLETED"].includes(
        order?.status || ""
      ),
    [order?.status]
  );
  const paymentStatus =
    order?.payment?.status ||
    (order?.status === "WAITING_PAYMENT"
      ? "pending"
      : order?.status === "PAYMENT_CONFIRMED"
      ? "confirmed"
      : "");
  const trackingCode = order?.tracking?.code || "";

  const doAction = async (path) => {
    setActionLoading(true);
    setError("");
    try {
      const updated = await api(path, { method: "POST" });
      setOrder(updated);
    } catch (err) {
      setError(err.message || "Үйлдлийг хийхэд алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setActionLoading(false);
    }
  };

  const actionButtons =
    order?.status === "WAITING_USER_REVIEW" ? (
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => doAction(`/api/orders/${order._id}/request-order`)}
          disabled={actionLoading}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
        >
          Авах
        </button>
        <button
          onClick={() => doAction(`/api/orders/${order._id}/cancel-after-report`)}
          disabled={actionLoading}
          className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-400 disabled:opacity-60"
        >
          Цуцлах
        </button>
      </div>
    ) : order?.status === "PUBLISHED" ? (
      <button
        onClick={() => doAction(`/api/orders/${order._id}/cancel-before-agent`)}
        disabled={actionLoading}
        className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-400 disabled:opacity-60"
      >
        Цуцлах
      </button>
    ) : order?.status === "ARRIVED_AT_CARGO" ? (
      <button
        onClick={() => doAction(`/api/orders/${order._id}/complete`)}
        disabled={actionLoading}
        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
      >
        Бараагаа авлаа
      </button>
    ) : null;

  if (loading) {
    return (
      <main className={`${mainBg} min-h-screen flex items-center justify-center`}>
        <p className="text-sm text-slate-500">Уншиж байна...</p>
      </main>
    );
  }

  if (!order) {
    return (
      <main className={`${mainBg} min-h-screen flex items-center justify-center`}>
        <div className="text-center space-y-3">
          <p className="text-sm text-rose-600">{error || "Мэдээлэл олдсонгүй."}</p>
          <Link href="/user/requests" className="text-sm text-emerald-600 hover:underline">
            Жагсаалт руу буцах
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className={`${mainBg} min-h-screen`}>
      <div className={`${widthClass} mx-auto px-3 py-6 space-y-5`}>
        <header className="rounded-2xl border border-slate-200 bg-white/90 px-5 py-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <Link href="/user/requests" className="hover:text-emerald-600">
              Жагсаалт руу
            </Link>
            <span>/</span>
            <span className="font-mono text-slate-700">#{order._id?.slice(-6)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Pill tone={badgeTone[order.status] || undefined}>{statusText[order.status] || order.status}</Pill>
            <span className="text-[11px] text-slate-500">Шинэчлэгдсэн: {formatDate(order.updatedAt)}</span>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
          <div className="space-y-4">
            <SectionCard
              title="Оруулсан бараа"
              right={
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>
                    {items.length} төрөл / {totalQty} ширхэг
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowItems((v) => !v)}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] hover:border-emerald-300"
                  >
                    {showItems ? "Нуух" : "Харах"}
                  </button>
                </div>
              }
            >
              {showItems ? (
                <div className="space-y-2">
                  {items.map((item, idx) => {
                    const imgs = item.images || (item.imageUrl ? [item.imageUrl] : []) || [];
                    return (
                      <div key={idx} className="rounded-xl border border-slate-200 px-3 py-2 flex justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-900">
                            #{idx + 1} {item.title || "Бараа"}
                          </p>
                          <p className="text-xs text-slate-600">Тоо: {item.quantity || 1}</p>
                          {item.userNotes && <p className="text-xs text-slate-600">Тайлбар: {item.userNotes}</p>}
                          {item.sourceUrl && (
                            <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 underline">
                              Линк рүү очих
                            </a>
                          )}
                        </div>
                        {imgs[0] && (
                          <div className="h-14 w-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                            <img src={imgs[0]} alt={item.title} className="h-full w-full object-cover" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Дэлгэрэнгүй харахад &quot;Харах&quot; дарна уу.</p>
              )}
            </SectionCard>

            {order.report ? (
              <SectionCard
                title="Агентийн тайлан"
                right={<span className="text-xs text-slate-500">Илгээгдсэн: {formatDate(order.report.submittedAt)}</span>}
              >
                <div className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2">
                  <p className="text-xs text-slate-500">Нийт дүн</p>
                  <p className="text-lg font-semibold text-slate-900">{totalPriceCny ?? "-"} CNY</p>
                </div>

                <div className="mt-3 space-y-3">
                  {reportItems.map((rItem, idx) => {
                    const imgs = rItem.images || (rItem.imageUrl ? [rItem.imageUrl] : []) || [];
                    const total = rItem.agentTotal ?? (rItem.agentPrice || 0) * (rItem.quantity || 1);
                    return (
                      <div key={idx} className="rounded-xl border border-slate-200 px-3 py-3 space-y-2">
                        <div className="flex justify-between gap-2">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-slate-900">
                              #{idx + 1} {rItem.title || "Бараа"}
                            </p>
                            <p className="text-xs text-slate-600">
                              Үнэ: {rItem.agentPrice || "-"} {rItem.agentCurrency || "CNY"} × {rItem.quantity || 1}
                            </p>
                            <p className="text-xs font-semibold text-slate-800">Нийт: {total} CNY</p>
                            {rItem.note && <p className="text-xs text-slate-600">Тайлбар: {rItem.note}</p>}
                            {rItem.sourceUrl && (
                              <a href={rItem.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 underline">
                                Линк рүү очих
                              </a>
                            )}
                          </div>
                          {imgs[0] && (
                            <div className="flex flex-col gap-2">
                              <div className="h-16 w-16 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                                <img src={imgs[0]} alt={`report-${idx}`} className="h-full w-full object-cover" />
                              </div>
                              {imgs.length > 1 && <p className="text-[11px] text-slate-500">Нийт {imgs.length} зураг</p>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {order.status === "WAITING_USER_REVIEW" && (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                    Та “Авах” дарсны дараа төлбөрийн мэдээлэл (данс, холбоос) идэвхжинэ. Цуцлах бол “Цуцлах” дарна уу.
                  </div>
                )}
              </SectionCard>
            ) : (
              <SectionCard title="Агентийн тайлан">
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  Агентийн тайлан хараахан ирээгүй байна. Ирмэгц энд харагдана.
                </div>
              </SectionCard>
            )}
          </div>

          <div className="space-y-4">
            <SectionCard title="Үйлдэл" right={<span className="text-xs text-slate-500">Үүссэн: {formatDate(order.createdAt)}</span>}>
              {actionButtons || <p className="text-sm text-slate-500">Одоогоор хийх нэмэлт үйлдэл байхгүй.</p>}
            </SectionCard>

            <SectionCard title="Төлбөр / Tracking">
              <div className="space-y-2 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Төлбөрийн статус:</span>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold border ${
                      paymentStatus === "confirmed"
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                        : paymentStatus === "pending"
                        ? "bg-amber-100 text-amber-700 border-amber-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {paymentStatus === "confirmed" ? "Баталгаажсан" : paymentStatus === "pending" ? "Төлбөр хүлээж байна" : "Мэдээлэл алга"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Tracking код:</span>
                  {trackingCode ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-800 border border-slate-200">
                      {trackingCode}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">Одоогоор байхгүй</span>
                  )}
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Нийт дүн ба данс">
              {showPaymentInfo ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2">
                    <p className="text-xs text-slate-500">Нийт үнэ</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {totalPriceCny ? `${totalPriceCny} CNY` : "-"}
                      {totalPriceMnt ? ` · ${totalPriceMnt.toLocaleString()}₮` : ""}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 space-y-1 text-sm text-slate-700">
                    <p className="text-xs text-slate-500">Төлбөр төлөх данс</p>
                    <p>{settings.bankName || "Банк: тохируулаагүй"}</p>
                    <p>{settings.bankAccount || "Дансны дугаар: тохируулаагүй"}</p>
                    {settings.bankOwner && <p>{settings.bankOwner}</p>}
                    <p className="text-xs text-slate-500">
                      Ханш: {rate ? `${rate} MNT / 1 CNY` : "Ханш тохируулаагүй"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2">
                    <p className="text-xs text-slate-500">Төлбөрийн холбоос</p>
                    {order?.report?.paymentLink ? (
                      <span className="text-sm font-semibold text-slate-600 line-through select-none cursor-default">
                        {order.report.paymentLink}
                      </span>
                    ) : (
                      <p className="text-sm text-slate-600">Админ холбоосыг оруулаагүй байна.</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Төлбөрийн мэдээлэл зөвхөн “Авах” дарж, төлбөрийн шат руу шилжсэний дараа харагдана.
                </p>
              )}
            </SectionCard>
          </div>
        </div>
      </div>
    </main>
  );
}
