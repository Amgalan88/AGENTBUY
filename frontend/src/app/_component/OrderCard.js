"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import Button from "@/components/ui/Button";

const STATUS_CONFIG = {
  new: { text: "Шинэ", className: "chip-success" },
  researching: { text: "Судлагдаж байна", className: "chip-warning" },
  proposal_sent: { text: "Санал илгээгдсэн", className: "chip-info" },
  closed_success: { text: "Амжилттай хаагдсан", className: "chip-success" },
  closed_cancelled: { text: "Цуцлагдсан", className: "chip" },
};

const APP_LABELS = {
  taobao: "Taobao",
  pinduoduo: "Pinduoduo",
  "1688": "1688 / Alibaba",
  dewu: "Dewu (Poizon)",
  any: "Бүх платформ",
};

export default function OrderCard({ order }) {
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState("");

  const lockInfo = order.researchLock && order.status !== "new";
  const statusInfo = STATUS_CONFIG[order.status] || { text: order.status, className: "chip" };

  const handleClaim = async () => {
    setClaimError("");
    setClaiming(true);
    try {
      await api(`/api/requests/${order.rawId}/claim`, {
        method: "POST",
      });
      window.location.href = `/agent/order/${order.rawId}`;
    } catch (err) {
      console.error(err);
      setClaimError("Захиалга авахад алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <article className="surface-card rounded-2xl p-5 card-interactive">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="chip px-2 py-1 rounded-full font-mono text-xs">
            {order.id}
          </span>
          <span className="chip px-2 py-1 rounded-full text-xs">
            {order.type === "batch" ? "📚 Багц" : "📦 Нэг ширхэг"}
          </span>
          {order.isToday && (
            <span className="chip-info px-2 py-1 rounded-full text-xs">
              ⏰ Өнөөдөр
            </span>
          )}
          {order.status && (
            <span className={`status-badge ${statusInfo.className}`}>
              {statusInfo.text}
            </span>
          )}
        </div>
        <span className="text-xs text-muted">
          {APP_LABELS[order.app] || order.app}
        </span>
      </div>

      {/* Title */}
      <h2 className="text-base font-semibold mb-2">
        {order.name}
        {order.mark && <span className="text-muted font-normal"> • {order.mark}</span>}
      </h2>

      {/* Meta */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="chip px-3 py-1 rounded-full">
          🔢 Тоо: {order.quantity}
        </span>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Button
            onClick={handleClaim}
            disabled={lockInfo || claiming}
            variant={lockInfo ? "muted" : "primary"}
            size="sm"
            loading={claiming}
          >
            {lockInfo ? "🔒 Түгжээтэй" : "Захиалга авах"}
          </Button>

          <Link href={`/agent/order/${order.rawId}`}>
            <Button variant="secondary" size="sm">
              Дэлгэрэнгүй
            </Button>
          </Link>
        </div>

        <div className="surface-muted rounded-xl px-3 py-2 text-xs text-muted">
          💬 Чат мессеж бичих бол "Дэлгэрэнгүй" рүү орно уу.
        </div>
      </div>

      {claimError && (
        <div className="error-box mt-3 text-xs">{claimError}</div>
      )}
    </article>
  );
}
