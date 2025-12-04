"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUI } from "../layout";
import { api } from "@/lib/api";

const CARGOS = [
  { id: "darkhan", name: "Darkhan Cargo" },
  { id: "ubexpress", name: "UB Express Cargo" },
  { id: "fastasia", name: "Fast Asia Cargo" },
];

export default function UserEntryPage() {
  const { theme, view } = useUI();
  const [selectedCargo, setSelectedCargo] = useState(CARGOS[0].id);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const mainClass =
    theme === "night"
      ? "bg-slate-950 text-slate-50"
      : theme === "mid"
        ? "bg-slate-200 text-slate-900"
        : "bg-slate-100 text-slate-900";

  const cardClass =
    theme === "night"
      ? "bg-slate-900 border-slate-700"
      : theme === "mid"
        ? "bg-slate-100 border-slate-300"
        : "bg-white border-slate-200";

  const widthClass =
    view === "mobile"
      ? "max-w-md"
      : view === "tablet"
        ? "max-w-3xl"
        : "max-w-6xl";

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const me = await api("/api/auth/me");
        if (!alive) return;
        setProfile(me);
        if (me.defaultCargoId) {
          setSelectedCargo(me.defaultCargoId);
        }
      } catch (err) {
        if (!alive) return;
        setError(err.message || "Профайл уншихад алдаа гарлаа");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  const selectedCargoLabel =
    CARGOS.find((c) => c.id === selectedCargo)?.name || "Сонгоогүй";

  return (
    <main className={`${mainClass} min-h-screen`}>
      <div className={`${widthClass} mx-auto px-4 py-10 space-y-6`}>
        <Link href="/" className="text-sm opacity-70">
          ← Буцах
        </Link>

        <header className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-semibold">
            Хэрэглэгчийн самбар
          </h1>
          <p className="text-sm opacity-80">
            Картын үлдэгдэл, захиалгын үндсэн урсгалаа эндээс эхлүүлнэ.
          </p>
        </header>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {error}
          </div>
        )}

        <section
          className={`rounded-2xl border px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${cardClass}`}
        >
          <div className="space-y-1">
            <p className="text-sm font-medium">Картын үлдэгдэл</p>
            <p className="text-xs opacity-70">
              Нэг захиалга нийтлэхэд 1 карт зарцуулна. Амжилттай дуусвал буцаан олгоно.
            </p>
          </div>

          <div className="flex flex-col items-start gap-1">
            <p className="text-lg font-semibold">
              {loading ? "..." : `${profile?.cardBalance ?? 0} карт`}
            </p>
            <p className="text-[11px] opacity-70">
              Бонусын ахиц: {profile?.cardProgress ?? 0} / 2
            </p>
          </div>
        </section>



        <section className="grid gap-4 md:grid-cols-2">
          <Link
            href={{
              pathname: "/user/single",
              query: { cargo: selectedCargo },
            }}
            className={`rounded-2xl border p-5 space-y-3 hover:shadow-md transition block ${cardClass}`}
          >
            <h2 className="text-lg font-semibold">Ганц бараа захиалах</h2>
            <p className="text-sm opacity-80">
              Нэг барааны мэдээлэл, зураг, линк, тоо ширхэгээ оруулаад нийтэлнэ.
            </p>
            <p className="text-xs opacity-70">
              Карго: <span className="font-medium">{selectedCargoLabel}</span>
            </p>
          </Link>

          <Link
            href={{
              pathname: "/user/batch",
              query: { cargo: selectedCargo },
            }}
            className={`rounded-2xl border p-5 space-y-3 hover:shadow-md transition block ${cardClass}`}
          >
            <h2 className="text-lg font-semibold">Багц захиалга</h2>
            <p className="text-sm opacity-80">
              Олон барааг нэг дор оруулах (10 хүртэл). Багц захиалгыг нийтлэхэд мөн 1 карт зарцуулна.
            </p>
            <p className="text-xs opacity-70">
              Карго: <span className="font-medium">{selectedCargoLabel}</span>
            </p>
          </Link>
        </section>

        <section>
          <Link
            href="/user/requests"
            className="text-xs text-emerald-600 hover:text-emerald-500"
          >
            Өмнөх захиалгуудыг харах
          </Link>
        </section>
      </div>
    </main>
  );
}
