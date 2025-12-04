"use client";

import RoleCard from "./_component/rolecard";
import MarketplaceBadge from "./_component/MarketplaceBadge";
import { useUI } from "./layout";

export default function HomePage() {
  const { theme, view } = useUI();

  const main =
    theme === "night"
      ? "bg-slate-950 text-slate-50"
      : theme === "mid"
        ? "bg-slate-200 text-slate-900"
        : "bg-slate-100 text-slate-900";

  const width =
    view === "mobile"
      ? "max-w-md"
      : view === "tablet"
        ? "max-w-3xl"
        : "max-w-6xl";

  const marketplaces = [
    { name: "Taobao", icon: "/marketplace/taobao.png" },
    { name: "Pinduoduo", icon: "/marketplace/pinduoudo.png" },
    { name: "Alibaba", icon: "/marketplace/1688.jpg" },
    { name: "Dewu", icon: "/marketplace/poizon.png" },
  ];

  return (
    <main className={`min-h-screen ${main}`}>
      <div className={`${width} mx-auto px-4 py-12 space-y-10`}>

        <header className="text-center space-y-3">
          <h1 className="text-3xl font-semibold">
            Welcome to <span className="text-emerald-500">AgentBuy</span>
          </h1>
          <p className="text-sm opacity-70">
            Монгол хэрэглэгчид Хятадын зах зээлээс бараа хайж, агентуудаар судалгаа хийлгэн захиалах нэг цэгийн үйлчилгээ.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <RoleCard
            title="I'm a User"
            desc="Хятадын сайтуудаас бараа хайж, агентуудаас үнэ санал авч захиалга өгөх."
            href="/auth/login?role=user"
            accent="bg-emerald-600 hover:bg-emerald-500"
          />

          <RoleCard
            title="I'm an Agent"
            desc="Шинэ захиалгуудыг түгжиж судалгаа хийн тайлан илгээх."
            href="/auth/login?role=agent"
            accent="bg-emerald-600 hover:bg-emerald-500"
          />
        </section>

        <section className="space-y-4">
          <h3 className="font-semibold">Дэмждэг маркетплейсүүд</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {marketplaces.map((m) => (
              <MarketplaceBadge key={m.name} name={m.name} icon={m.icon} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
