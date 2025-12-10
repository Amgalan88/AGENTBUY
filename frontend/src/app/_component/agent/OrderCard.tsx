// src/components/agent/OrderCard.tsx
"use client";

import Link from "next/link";
import { useUI } from "@/app/layout";
import Button from "@/components/ui/Button";

interface OrderCardOrder {
  id: string;
  rawId: string;
  name: string;
  type?: "batch" | "single";
  app?: string;
  isToday?: boolean;
  quantity?: number;
}

interface OrderCardProps {
  order: OrderCardOrder;
}

const appLabel: Record<string, string> = {
  taobao: "Taobao",
  pinduoduo: "Pinduoduo",
  "1688": "1688 / Alibaba",
  dewu: "Dewu (Poizon)",
  any: "Аль нь ч болно",
};

export default function OrderCard({ order }: OrderCardProps): React.JSX.Element {
  const { theme } = useUI();

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

  return (
    <article
      className={`rounded-2xl border px-4 py-5 shadow-sm hover:shadow-md transition ${cardClass}`}
    >
      {/* Дээд мөр: ID, төрөл, апп */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-[11px]">
          <span className={`px-2 py-1 rounded-full font-mono ${pillBg}`}>
            {order.id}
          </span>
          <span className={`px-2 py-1 rounded-full text-[10px] ${pillBg}`}>
            {order.type === "batch" ? "Багц" : "Дан"}
          </span>
          {order.isToday && (
            <span className="px-2 py-1 rounded-full bg-sky-500/10 text-sky-600 text-[10px]">
              Өнөөдөр
            </span>
          )}
        </div>

        <span className="text-[11px] text-slate-500">
          {order.app && (appLabel[order.app] || order.app)}
        </span>
      </div>

      {/* Гарчиг */}
      <h2 className={`text-sm md:text-base font-semibold mb-1 ${titleColor}`}>
        {order.name}
      </h2>

      {/* Тоо ширхэг */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`text-xs ${textColor}`}>
          🔢 Тоо: {order.quantity || 1}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link href={`/agent/order/${order.rawId}`} className="flex-1">
          <Button variant="primary" size="sm" fullWidth>
            Захиалга авах
          </Button>
        </Link>
      </div>
    </article>
  );
}

