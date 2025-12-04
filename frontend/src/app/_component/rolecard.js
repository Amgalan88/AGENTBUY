import Link from "next/link";
import { useUI } from "@/app/layout";

export default function RoleCard({ title, desc, href, accent }) {
    const { theme } = useUI();

    const card =
        theme === "night"
            ? "bg-slate-900 border-slate-700"
            : theme === "mid"
                ? "bg-slate-100 border-slate-300"
                : "bg-white border-slate-200";

    const textColor = theme === "night" ? "text-slate-100" : "text-slate-900";
    const subColor = theme === "night" ? "text-slate-400" : "text-slate-600";

    return (
        <div
            className={`rounded-3xl border px-5 py-7 shadow-sm hover:shadow-md transition ${card}`}
        >
            <h2 className={`text-xl font-semibold ${textColor}`}>{title}</h2>
            <p className={`text-sm mt-2 ${subColor}`}>{desc}</p>

            <Link
                href={href}
                className={`mt-4 inline-flex w-full justify-center rounded-xl py-3 text-sm font-medium text-white ${accent}`}
            >
                Нэвтрэх / Бүртгүүлэх
            </Link>
        </div>
    );
}
