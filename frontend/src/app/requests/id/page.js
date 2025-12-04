// src/app/requests/[id]/page.js
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUI } from "../../layout";

const MARKET_APP_LABEL = {
  any: "Ямар ч маркет",
  taobao: "Taobao",
  pinduoduo: "Pinduoduo",
  "1688": "1688 / Alibaba",
  dewu: "Dewu / Poizon",
};

const ORDER_STATUS_FLOW = [
  { key: "DRAFT", label: "Ноорог", hint: "Ноорог хадгалж байна." },
  { key: "PUBLISHED", label: "Нийтэлсэн", hint: "Агент түгжихийг хүлээж байна." },
  { key: "AGENT_LOCKED", label: "Түгжсэн", hint: "Агент захиалгыг түгжсэн." },
  { key: "AGENT_RESEARCHING", label: "Судалгаанд", hint: "Агент судалгаа хийж байна." },
  { key: "REPORT_SUBMITTED", label: "Тайлан ирсэн", hint: "Агент тайлан илгээсэн." },
  { key: "WAITING_USER_REVIEW", label: "Хэрэглэгчийн шийдвэр", hint: "Та шийдвэр гаргана." },
  { key: "WAITING_PAYMENT", label: "Төлбөр хүлээж", hint: "Админ/агент төлбөр баталгаажуулна." },
  { key: "PAYMENT_CONFIRMED", label: "Төлбөр баталгаажсан", hint: "Төлбөр баталгаажсан." },
  { key: "ORDER_PLACED", label: "Захиалга өгсөн", hint: "Агент худалдан авалт хийж байна." },
  { key: "CARGO_IN_TRANSIT", label: "Карго явж байна", hint: "Карго замд." },
  { key: "ARRIVED_AT_CARGO", label: "Каргонд ирсэн", hint: "Каргонд буусан." },
  { key: "COMPLETED", label: "Дууссан", hint: "Захиалга хаагдсан." },
  { key: "CANCELLED_BY_USER", label: "Хэрэглэгч цуцалсан", hint: "Цуцлагдсан." },
  { key: "CANCELLED_BY_ADMIN", label: "Админ цуцалсан", hint: "Цуцлагдсан." },
  { key: "CANCELLED_NO_AGENT", label: "Агент олдоогүй", hint: "Цуцлагдсан." },
];

const STATUS_BRIDGE = {
  new: "PUBLISHED",
  researching: "AGENT_RESEARCHING",
  proposal_sent: "REPORT_SUBMITTED",
  closed_success: "COMPLETED",
  closed_cancelled: "CANCELLED_BY_USER",
  cancelled: "CANCELLED_BY_USER",
};

const URGENCY_LABEL = {
  low: "Бага",
  normal: "Дундаж",
  high: "Яаралтай",
};

const toneMap = {
  primary: "bg-emerald-500/15 text-emerald-600 border-emerald-200",
  neutral: "bg-slate-500/10 text-slate-700 border-slate-200",
  warning: "bg-amber-500/15 text-amber-600 border-amber-200",
};

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("mn", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const Pill = ({ tone = "neutral", children }) => (
  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${toneMap[tone]}`}>
    {children}
  </span>
);

const InfoStat = ({ label, value, helper }) => (
  <div className="rounded-2xl border border-slate-200 bg-white/50 px-4 py-3 backdrop-blur">
    <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
    <p className="text-base font-semibold text-slate-900">{value}</p>
    {helper && <p className="text-[11px] text-slate-500">{helper}</p>}
  </div>
);

export default function RequestDetailPage({ params }) {
  const { id } = params;
  const { theme, view } = useUI();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rating, setRating] = useState(0);
  const [ratingSaving, setRatingSaving] = useState(false);
  const [paying, setPaying] = useState(false);

  const mainClass =
    theme === "night"
      ? "bg-slate-950 text-slate-50"
      : theme === "mid"
        ? "bg-slate-100 text-slate-900"
        : "bg-slate-50 text-slate-900";

  const shellClass =
    theme === "night"
      ? "bg-slate-900/80 border-slate-800"
      : theme === "mid"
        ? "bg-white/80 border-slate-200"
        : "bg-white border-slate-100";

  const widthClass =
    view === "mobile"
      ? "max-w-md"
      : view === "tablet"
        ? "max-w-3xl"
        : "max-w-5xl";

  useEffect(() => {
    let alive = true;
    async function loadRequest() {
      try {
        const res = await fetch(`/api/orders/${id}`);
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data = await res.json();
        if (alive) setRequest(data);
      } catch (err) {
        console.error("Failed to load request detail", err);
        if (alive) setError("Мэдээлэл татахад алдаа гарлаа.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    loadRequest();
    return () => {
      alive = false;
    };
  }, [id]);

  const totalMnt = useMemo(() => {
    const price = Number(request?.report?.pricing?.grandTotalCny || request?.report?.priceCny || 0);
    return Math.round(price * 510);
  }, [request]);

  const normalizedStatus = useMemo(() => {
    if (!request?.status) return "PUBLISHED";
    const normalized = STATUS_BRIDGE[request.status] || request.status;
    return normalized.toUpperCase();
  }, [request]);

  const activeStepIndex = useMemo(() => {
    const idx = ORDER_STATUS_FLOW.findIndex((step) => step.key === normalizedStatus);
    return idx === -1 ? 1 : idx;
  }, [normalizedStatus]);

  const items = request?.items ?? [];
  const totalItems = items.length;
  const aggregateQty = items.reduce((sum, it) => sum + (it?.quantity || 0), 0);

  const stats = [
    {
      label: "Захиалгын төрөл",
      value: request?.type === "batch" ? "Багц" : "Нэг бараа",
      helper: request?.urgency ? URGENCY_LABEL[request.urgency] || "Дундаж" : undefined,
    },
    {
      label: "Барааны тоо",
      value: `${totalItems} мөр`,
      helper: `${aggregateQty} ширхэг`,
    },
    {
      label: "Шинэчлэлт",
      value: formatDateTime(request?.updatedAt),
      helper: "Үүсгэсэн: " + formatDateTime(request?.createdAt),
    },
    {
      label: "Карго",
      value: request?.cargoId?.name || request?.cargoId || "Тодорхойгүй",
    },
  ];

  const handleRating = async (value) => {
    setRating(value);
    setRatingSaving(true);
    try {
      const res = await fetch(`/api/orders/${id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: value }),
      });
      if (!res.ok) throw new Error(`Rate failed ${res.status}`);
      const data = await res.json();
      setRequest(data);
    } catch (err) {
      console.error(err);
      setError("Үнэлгээ хадгалахдаа алдаа гарлаа.");
    } finally {
      setRatingSaving(false);
    }
  };

  const handlePay = async () => {
    setPaying(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${id}/pay`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`Pay failed ${res.status}`);
      const data = await res.json();
      setRequest(data);
    } catch (err) {
      console.error(err);
      setError("Төлбөр баталгаажуулахад алдаа гарлаа.");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <main className={`${mainClass} min-h-screen flex items-center justify-center`}>
        <p className="animate-pulse text-sm text-slate-500">Ачааллаж байна...</p>
      </main>
    );
  }

  if (!request) {
    return (
      <main className={`${mainClass} min-h-screen flex items-center justify-center`}>
        <p className="text-sm text-rose-500">{error || "Захиалга олдсонгүй."}</p>
      </main>
    );
  }

  return (
    <main className={`${mainClass} min-h-screen`}>
      <div className={`${widthClass} mx-auto px-4 py-10 space-y-6`}>
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <Link href="/user/requests" className="transition hover:text-emerald-600">
              ← Захиалгын жагсаалт
            </Link>
            <span>/</span>
            <span className="font-mono text-slate-700">{request._id}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Pill tone="primary">{normalizedStatus}</Pill>
            <Pill tone="neutral">{request.type === "batch" ? "Багц" : "Нэг бараа"}</Pill>
            {request.urgency === "high" && <Pill tone="warning">Яаралтай</Pill>}
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600">
            {error}
          </div>
        )}

        <section className={`rounded-3xl border px-6 py-6 shadow-sm ${shellClass}`}>
          <div className="flex flex-col gap-1">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Request overview</p>
            <h1 className="text-2xl font-semibold text-slate-900">AgentBuy захиалга</h1>
            <p className="text-sm text-slate-500">
              Агентын судалгаа, тайлан, төлбөрийн мэдээлэл нэг дор харагдана.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {stats.map((stat) => (
              <InfoStat key={stat.label} {...stat} />
            ))}
          </div>
        </section>

        <section className={`rounded-3xl border px-4 py-5 ${shellClass}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Order lifecycle</p>
              <h2 className="text-lg font-semibold text-slate-900">Захиалгын алхамууд</h2>
            </div>
            <span className="text-[11px] text-slate-500">State machine</span>
          </div>

          <div className="mt-5 flex snap-x gap-4 overflow-x-auto pb-2">
            {ORDER_STATUS_FLOW.map((step, idx) => {
              const isActive = idx <= activeStepIndex;
              return (
                <div
                  key={step.key}
                  className={`min-w-[180px] rounded-2xl border px-4 py-3 ${isActive ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${isActive ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"}`}
                    >
                      {idx + 1}
                    </span>
                    <p className="text-sm font-semibold text-slate-900">{step.label}</p>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{step.hint}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className={`rounded-3xl border px-5 py-5 ${shellClass}`}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Бараанууд</h2>
              <span className="text-xs text-slate-500">{totalItems} мөр</span>
            </div>

            <div className="mt-4 space-y-4">
              {items.map((item, index) => (
                <article
                  key={`${item.name}-${index}`}
                  className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        #{index + 1} {item.name}
                      </p>
                      {item.mark && (
                        <p className="text-xs text-slate-500">Тэмдэглэл: {item.mark}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 text-[11px] text-slate-600">
                      <Pill tone="neutral">
                        Тоо: {item.quantity || 1}
                      </Pill>
                      <Pill tone="primary">
                        {MARKET_APP_LABEL[item.app] || item.app}
                      </Pill>
                    </div>
                  </div>
                  {item.note && (
                    <p className="mt-2 text-sm text-slate-600">Тайлбар: {item.note}</p>
                  )}
                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center text-sm font-medium text-emerald-600 underline underline-offset-2"
                    >
                      Барааны холбоос
                    </a>
                  )}
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className={`rounded-3xl border px-5 py-5 ${shellClass}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Чат & мэдэгдэл</h3>
                <span className="text-[11px] text-slate-500">Realtime roadmap</span>
              </div>
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-xs text-slate-500">
                Чат, мэдэгдлийн хэсгийг цаашид хөгжүүлнэ. Түр зуур энд байрлаж байна.
              </div>
            </div>

            {request.report && (
              <div className={`rounded-3xl border px-5 py-5 ${shellClass}`}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-slate-900">Агентын тайлан</h3>
                  <Pill tone="primary">REPORT_SUBMITTED</Pill>
                </div>
                <dl className="mt-4 space-y-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Нийт дүн (CNY)</dt>
                    <dd className="font-semibold text-slate-900">
                      {request.report.pricing?.grandTotalCny || request.report.priceCny || "-"}
                    </dd>
                  </div>
                  {request.report.items?.length > 0 &&
                    request.report.items.map((rItem, idx) => {
                      const imgs =
                        rItem.images ||
                        (rItem.imageUrl ? [rItem.imageUrl] : []) ||
                        (rItem.image ? [rItem.image] : []);
                      return (
                        <div key={idx} className="flex flex-col gap-1 border border-slate-200 rounded-xl p-3">
                          <div className="flex items-center justify-between">
                            <dt className="text-slate-500">Бараа #{idx + 1}</dt>
                            <dd className="font-semibold text-slate-900">
                              {rItem.agentPrice ? `${rItem.agentPrice} CNY × ${rItem.quantity || 1}` : "-"}
                            </dd>
                          </div>
                          {imgs?.[0] && (
                            <div className="flex flex-wrap gap-2">
                              {(imgs || []).slice(0, 3).map((img, imgIdx) => (
                                <img
                                  key={imgIdx}
                                  src={img}
                                  alt={`report-img-${imgIdx}`}
                                  className="h-16 w-16 rounded-lg object-cover border border-slate-200"
                                />
                              ))}
                            </div>
                          )}
                          {rItem.note && (
                            <dd className="text-xs text-slate-600">Тайлбар: {rItem.note}</dd>
                          )}
                        </div>
                      );
                    })}
                  {request.report.link && (
                    <div className="flex flex-col gap-1">
                      <dt className="text-slate-500">Барааны холбоос</dt>
                      <dd>
                        <a
                          href={request.report.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-600 underline"
                        >
                          {request.report.link}
                        </a>
                      </dd>
                    </div>
                  )}
                  {request.report.paymentLink && (
                    <div className="flex flex-col gap-1">
                      <dt className="text-slate-500">Төлбөрийн холбоос (админ/агент)</dt>
                      <dd>
                        <a
                          href={request.report.paymentLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-600 underline"
                        >
                          {request.report.paymentLink}
                        </a>
                      </dd>
                    </div>
                  )}
                  {request.report.note && (
                    <div className="flex flex-col gap-1">
                      <dt className="text-slate-500">Нэмэлт тайлбар</dt>
                      <dd>{request.report.note}</dd>
                    </div>
                  )}
                </dl>
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  Төсөв (CNY → MNT): <span className="font-semibold">{totalMnt.toLocaleString()}₮</span>
                </div>
                <button
                  onClick={handlePay}
                  disabled={paying}
                  className="mt-5 flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {paying ? "Төлбөрийг баталгаажуулж байна..." : "Төлбөр баталгаажуулах"}
                </button>
              </div>
            )}
          </div>
        </section>

        {request.report && (
          <section className={`rounded-3xl border px-5 py-5 ${shellClass}`}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Үнэлгээ өгөх</h3>
                <p className="text-xs text-slate-500">0-5 оноо — агентын гүйцэтгэлийг үнэлнэ.</p>
              </div>
              <span className="text-[11px] text-indigo-500">Report → WAITING_USER_REVIEW</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {[0, 1, 2, 3, 4, 5].map((value) => {
                const active = request.rating === value || rating === value;
                return (
                  <button
                    key={value}
                    onClick={() => handleRating(value)}
                    disabled={ratingSaving}
                    className={`h-10 w-10 rounded-full border text-sm font-semibold transition ${active
                      ? "border-indigo-500 bg-indigo-600 text-white shadow-lg"
                      : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200"
                      }`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section className={`rounded-3xl border px-5 py-5 text-sm text-slate-600 ${shellClass}`}>
          Тэмдэглэл: төлбөр баталгаажсаны дараа агент худалдан авалт хийж, карго хяналт руу шилжинэ.
        </section>
      </div>
    </main>
  );
}
