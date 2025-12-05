"use client";

import RoleCard from "./_component/rolecard";
import MarketplaceBadge from "./_component/MarketplaceBadge";

export default function HomePage() {
  const marketplaces = [
    { name: "Taobao", icon: "/marketplace/taobao.png" },
    { name: "Pinduoduo", icon: "/marketplace/pinduoudo.png" },
    { name: "Alibaba", icon: "/marketplace/1688.jpg" },
    { name: "Dewu", icon: "/marketplace/poizon.png" },
  ];

  return (
    <main className="page-container">
      <div className="container-responsive py-responsive space-y-8 sm:space-y-10 lg:space-y-12">

        {/* Hero Section */}
        <header className="text-center space-y-4 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full surface-muted text-xs sm:text-sm">
            <span className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-pulse-dot" />
            <span className="text-secondary">Хятад бараа захиалгын платформ</span>
          </div>
          
          <h1 className="text-hero">
            <span className="text-[var(--text-primary)]">Тавтай морил, </span>
            <span className="text-[var(--accent-primary)]">AgentBuy</span>
          </h1>
          
          <p className="text-secondary text-sm sm:text-base max-w-xl mx-auto px-4">
            Монгол хэрэглэгчид Хятадын зах зээлээс бараа хайж, 
            агентуудаар судалгаа хийлгэн захиалах нэг цэгийн үйлчилгээ.
          </p>
        </header>

        {/* Role Cards */}
        <section className="grid-auto-fit animate-slide-up" style={{animationDelay: '0.1s'}}>
          <RoleCard
            title="Хэрэглэгч"
            desc="Хятадын сайтуудаас бараа хайж, агентуудаас үнэ санал авч захиалга өгөх."
            href="/auth/login?role=user"
            accent="primary"
            icon="🛒"
          />

          <RoleCard
            title="Агент"
            desc="Шинэ захиалгуудыг түгжиж судалгаа хийн тайлан илгээх."
            href="/auth/login?role=agent"
            accent="secondary"
            icon="🔍"
          />
        </section>

        {/* Marketplace Section */}
        <section className="space-y-4 animate-slide-up" style={{animationDelay: '0.2s'}}>
          <div className="flex items-center gap-3">
            <h3 className="text-base sm:text-lg font-semibold whitespace-nowrap">Дэмждэг маркетплейсүүд</h3>
            <div className="flex-1 h-px bg-[var(--surface-card-border)]" />
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {marketplaces.map((m) => (
              <MarketplaceBadge key={m.name} name={m.name} icon={m.icon} />
            ))}
          </div>
        </section>

        {/* Stats Section */}
        <section className="surface-card rounded-2xl sm:rounded-3xl card-padding animate-slide-up" style={{animationDelay: '0.3s'}}>
          <div className="grid-stats text-center">
            <div className="p-2 sm:p-4">
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--accent-primary)]">500+</p>
              <p className="text-xs sm:text-sm text-muted mt-1">Хэрэглэгч</p>
            </div>
            <div className="p-2 sm:p-4 border-x border-[var(--surface-card-border)]">
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--accent-secondary)]">50+</p>
              <p className="text-xs sm:text-sm text-muted mt-1">Агент</p>
            </div>
            <div className="p-2 sm:p-4">
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--accent-warning)]">2000+</p>
              <p className="text-xs sm:text-sm text-muted mt-1">Захиалга</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
