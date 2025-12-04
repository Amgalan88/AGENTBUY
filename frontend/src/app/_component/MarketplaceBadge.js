"use client";

import { useUI } from "@/app/layout";

export default function MarketplaceBadge({ name, icon }) {
    const { theme } = useUI();

    const card =
        theme === "night"
            ? "bg-slate-900 border-slate-700"
            : theme === "mid"
                ? "bg-slate-100 border-slate-300"
                : "bg-white border-slate-200";

    const initialBg =
        theme === "night"
            ? "bg-slate-800 text-slate-200"
            : "bg-slate-100 text-slate-700";

    return (
        <div className={`rounded-2xl border px-3 py-4 text-center shadow-sm ${card}`}>
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-2xl overflow-hidden">
                {icon ? (
                    // Зураг байгаа бол тэрийг нь харуулна
                    <img
                        src={icon}
                        alt={name}
                        className="h-full w-full object-contain"
                    />
                ) : (
                    // Зураг байхгүй бол эхний 2 үсэг
                    <span className={`h-full w-full flex items-center justify-center text-xs font-semibold ${initialBg}`}>
                        {name.slice(0, 2).toUpperCase()}
                    </span>
                )}
            </div>
            <p className="text-xs font-medium">{name}</p>
        </div>
    );
}
