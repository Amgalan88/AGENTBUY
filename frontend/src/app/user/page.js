"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import Button from "@/components/ui/Button";

export default function UserEntryPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const me = await api("/api/auth/me");
        if (!alive) return;
        setProfile(me);
      } catch (err) {
        if (!alive) return;
        setError(err.message || "Профайл уншихад алдаа гарлаа");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, []);

  return (
    <main className="page-container has-mobile-nav">
      <div className="container-responsive py-responsive space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="back-link">← Буцах</Link>
          <Link href="/auth/login" className="link-primary text-xs sm:text-sm">Гарах</Link>
        </div>

        <header className="page-header">
          <h1 className="page-title flex items-center gap-2 sm:gap-3">
            <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl surface-muted flex items-center justify-center text-lg sm:text-xl">🛒</span>
            <span>Хэрэглэгчийн самбар</span>
          </h1>
          <p className="page-subtitle">
            Картын үлдэгдэл, захиалгын үндсэн урсгал.
          </p>
        </header>

        {error && <div className="error-box">{error}</div>}

        {/* Card Balance */}
        <section className="surface-card rounded-xl sm:rounded-2xl card-padding animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-xl sm:text-2xl text-white shrink-0">
                💳
              </div>
              <div>
                <p className="text-xs sm:text-sm text-secondary">Картын үлдэгдэл</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {loading ? "..." : `${profile?.cardBalance ?? 0}`}
                  <span className="text-xs sm:text-sm font-normal text-muted ml-1">карт</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 pl-13 sm:pl-0">
              <div className="flex-1 sm:w-24 h-2 rounded-full surface-muted overflow-hidden">
                <div 
                  className="h-full bg-[var(--accent-primary)] rounded-full transition-all"
                  style={{ width: `${((profile?.cardProgress ?? 0) / 2) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium whitespace-nowrap">{profile?.cardProgress ?? 0}/2</span>
            </div>
          </div>
          <p className="text-xs text-muted mt-3 pt-3 border-t border-[var(--surface-card-border)]">
            💡 1 захиалга = 1 карт. Амжилттай бол буцаана.
          </p>
        </section>

        {/* Action Cards */}
        <section className="grid-auto-fit">
          <Link href="/user/single" className="surface-card rounded-xl sm:rounded-2xl card-padding card-interactive block animate-slide-up">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xl sm:text-2xl text-white shrink-0">
                📦
              </div>
              <div className="min-w-0">
                <h2 className="text-card-title">Ганц бараа</h2>
                <p className="text-xs sm:text-sm text-secondary mt-0.5 sm:mt-1 line-clamp-2">
                  Нэг барааны мэдээлэл оруулаад нийтлэх.
                </p>
              </div>
            </div>
          </Link>

          <Link href="/user/batch" className="surface-card rounded-xl sm:rounded-2xl card-padding card-interactive block animate-slide-up" style={{animationDelay: '0.1s'}}>
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-xl sm:text-2xl text-white shrink-0">
                📚
              </div>
              <div className="min-w-0">
                <h2 className="text-card-title">Багц захиалга</h2>
                <p className="text-xs sm:text-sm text-secondary mt-0.5 sm:mt-1 line-clamp-2">
                  10 хүртэл бараа нэг дор оруулах.
                </p>
              </div>
            </div>
          </Link>
        </section>

        {/* History Link */}
        <section className="surface-card rounded-xl sm:rounded-2xl p-3 sm:p-4 animate-slide-up" style={{animationDelay: '0.2s'}}>
          <Link href="/user/requests" className="flex items-center justify-between group touch-target">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-lg sm:text-xl">📋</span>
              <span className="text-sm sm:text-base font-medium">Өмнөх захиалгууд</span>
            </div>
            <span className="text-muted group-hover:text-[var(--accent-primary)] transition-colors text-lg">→</span>
          </Link>
        </section>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav">
        <Link href="/user" className="mobile-nav-item active">
          <span>🏠</span>
          <span>Нүүр</span>
        </Link>
        <Link href="/user/requests" className="mobile-nav-item">
          <span>📋</span>
          <span>Захиалга</span>
        </Link>
        <Link href="/user/profile" className="mobile-nav-item">
          <span>👤</span>
          <span>Профайл</span>
        </Link>
        <Link href="/user/single" className="mobile-nav-item">
          <span>➕</span>
          <span>Шинэ</span>
        </Link>
      </nav>
    </main>
  );
}
