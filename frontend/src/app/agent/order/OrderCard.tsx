// src/app/agent/order/OrderCard.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { useUI } from "@/app/layout";
import { api } from "@/lib/api";
import Button from "@/components/ui/Button";

interface UrgencyConfig {
  label: string;
  className: string;
}

const urgencyConfig: Record<string, UrgencyConfig> = {
  urgent: { label: "Яаралтай", className: "bg-red-500/10 text-red-600" },
  normal: { label: "Энгийн", className: "bg-emerald-500/10 text-emerald-600" },
  low: { label: "Түргэн бус", className: "bg-slate-500/10 text-slate-600" },
};

interface StatusLabel {
  text: string;
  className: string;
}

const statusLabel: Record<string, StatusLabel> = {
  new: { text: "Шинэ", className: "bg-emerald-500/10 text-emerald-600" },
  researching: { text: "Судлагдаж байна", className: "bg-amber-500/10 text-amber-600" },
  proposal_sent: { text: "Санал илгээгдсэн", className: "bg-sky-500/10 text-sky-600" },
  closed_success: { text: "Амжилттай хаагдсан", className: "bg-emerald-500/10 text-emerald-600" },
  closed_cancelled: { text: "Цуцлагдсан", className: "bg-slate-500/10 text-slate-600" },
};

const appLabel: Record<string, string> = {
  taobao: "Taobao",
  pinduoduo: "Pinduoduo",
  "1688": "1688 / Alibaba",
  dewu: "Dewu",
  any: "Ямар ч платформ",
};

interface OrderCardOrder {
  id: string;
  rawId: string;
  name: string;
  mark?: string;
  type?: "batch" | "single";
  status?: string;
  urgency?: string;
  app?: string;
  quantity?: number;
  isToday?: boolean;
  liked?: boolean;
  researchLock?: unknown;
}

interface OrderCardProps {
  order: OrderCardOrder;
}

export default function OrderCard({ order }: OrderCardProps): React.JSX.Element {
  const { theme } = useUI();
  const [claiming, setClaiming] = useState<boolean>(false);
  const [claimError, setClaimError] = useState<string>("");

  const cardClass =
    theme === "dark"
      ? "bg-slate-900 border-slate-700"
      : theme === "light"
        ? "bg-white border-slate-200"
        : "bg-white border-slate-200";

  const titleColor = theme === "dark" ? "text-slate-100" : "text-slate-900";
  const textColor = theme === "dark" ? "text-slate-300" : "text-slate-600";
  const pillBg =
    theme === "dark"
      ? "bg-slate-800 text-slate-200"
      : "bg-slate-100 text-slate-700";

  const urgency = (order.urgency && urgencyConfig[order.urgency]) || urgencyConfig.normal;
  const lockInfo = order.researchLock && order.status !== "new";

  const handleClaim = async (): Promise<void> => {
    setClaimError("");
    setClaiming(true);
    try {
      await api(`/api/requests/${order.rawId}/claim`, {
        method: "POST",
      });
      window.location.href = `/agent/order/${order.rawId}`;
    } catch (err) {
      console.error(err);
      setClaimError("Захиалга авахад алдаа гарлаа.");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <article
      className={`rounded-2xl border px-4 py-5 shadow-sm hover:shadow-md transition ${cardClass}`}
    >
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-2 text-[11px] flex-wrap">
          <span className={`px-2 py-1 rounded-full font-mono ${pillBg}`}>
            {order.id}
          </span>
          <span className={`px-2 py-1 rounded-full text-[10px] ${pillBg}`}>
            {order.type === "batch" ? "Багц" : "Нэг ширхэг"}
          </span>

          {order.isToday && (
            <span className="px-2 py-1 rounded-full bg-sky-500/10 text-sky-600 text-[10px]">
              Өнөөдөр
            </span>
          )}

          {order.status && (
            <span
              className={`px-2 py-1 rounded-full text-[10px] ${statusLabel[order.status]?.className || "bg-slate-500/10 text-slate-600"
              }`}
            >
              {statusLabel[order.status]?.text || order.status}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500">
            {order.app && (appLabel[order.app] || order.app)}
          </span>
          <span
            className={`h-7 w-7 flex items-center justify-center rounded-full border text-xs ${order.liked
              ? "border-emerald-500 bg-emerald-50 text-emerald-600"
              : "border-slate-300 bg-slate-50 text-slate-500"
            }`}
          >
            {order.liked ? "♥" : "♡"}
          </span>
        </div>
      </div>

      <h2 className={`text-sm md:text-base font-semibold mb-1 ${titleColor}`}>
        {order.name}
        {order.mark ? ` • ${order.mark}` : ""}
      </h2>

      <div className="flex flex-wrap gap-2 mb-3 text-[11px]">
        <span className={`px-3 py-1 rounded-full ${pillBg}`}>
          Тоо хэмжээ: {order.quantity || 1}
        </span>
        <span className={`px-3 py-1 rounded-full ${urgency.className}`}>
          {urgency.label}
        </span>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Button
            onClick={handleClaim}
            disabled={!!lockInfo || claiming}
            variant={lockInfo ? "muted" : "primary"}
            size="sm"
            title={lockInfo ? "Өөр агент судалж байна" : "Захиалга авах"}
          >
            {claiming ? "Авч байна..." : lockInfo ? "Түгжээтэй" : "Захиалга авах"}
          </Button>
          <Link href={`/agent/order/${order.rawId}`} className="inline-flex">
            <Button variant="secondary" size="sm">
              Дэлгэрэнгүй
            </Button>
          </Link>
        </div>
        <div className="flex-1 md:flex md:items-center md:justify-end">
          <div className="rounded-xl border border-dashed border-slate-300 px-3 py-2 text-[11px] text-slate-600 w-full md:w-auto">
            Чат (user/agent/admin) — дэлгэрэнгүй дээрээс шууд бичээрэй.
          </div>
        </div>
      </div>

      {claimError && (
        <p className="text-[11px] text-red-600 mt-2">{claimError}</p>
      )}
    </article>
  );
}

