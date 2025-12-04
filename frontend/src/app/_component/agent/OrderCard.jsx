// src/components/agent/OrderCard.jsx
"use client";

import Link from "next/link";
import { useUI } from "@/app/layout";

const appLabel = {
    taobao: "Taobao",
    pinduoduo: "Pinduoduo",
    "1688": "1688 / Alibaba",
    dewu: "Dewu (Poizon)",
    any: "Аль нь ч болно",
};

export default function OrderCard({ order }) {
    const { theme } = useUI();

    const cardClass =
        theme === "night"
            ? "bg-slate-900 border-slate-700"
            : theme === "mid"
                ? "bg-slate-100 border-slate-300"
                : "bg-white border-slate-200";

    const titleColor = theme === "night" ? "text-slate-100" : "text-slate-900";
    const textColor = theme === "night" ? "text-slate-300" : "text-slate-600";
    const pillBg =
        theme === "night"
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
                    {appLabel[order.app] || order.app}
                </span>
            </div>

            {/* Гарчиг */}
            <h2 className={`text-sm md:text-base font-semibold mb-1 ${titleColor}`}>
                {order.name}
                {order.mark ? ` · ${order.mark}` : ""}
            </h2>

            {/* Доод мэдээлэл */}
            <div className="flex flex-wrap gap-2 mb-3 text-[11px]">
                <span className={`px-3 py-1 rounded-full ${pillBg}`}>
                    Ширхэг: {order.quantity}
                </span>
            </div>

            {/* Үйлдлүүд */}
            <div className="flex items-center justify-between gap-2">
                <button className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 transition">
                    Судлах
                </button>
                <button className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500 transition">
                    Санал илгээх
                </button>

                <Link
                    href={`/requests/${order.rawId}`}
                    className={`text-[11px] ${textColor} hover:text-emerald-600`}
                >
                    Дэлгэрэнгүй →
                </Link>
            </div>
        </article>
    );
}
