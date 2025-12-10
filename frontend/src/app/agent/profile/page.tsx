"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUI } from "@/app/layout";
import { api } from "@/lib/api";
import Button from "@/components/ui/Button";
import type { User } from "@/types/user";
import type { Order } from "@/types/order";

interface Stats {
  total: number;
  completed: number;
  pending: number;
}

export default function AgentProfilePage(): React.JSX.Element {
  const router = useRouter();
  const { theme, cycleTheme } = useUI();

  const [profile, setProfile] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0, pending: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let alive = true;
    async function load(): Promise<void> {
      setLoading(true);
      setError("");
      try {
        const [me, orders] = await Promise.all([
          api<User>("/api/auth/me"),
          api<Order[]>("/api/agent/orders"),
        ]);
        if (!alive) return;
        setProfile(me);
        
        const total = orders.length;
        const completed = orders.filter((o) => o.status === "COMPLETED").length;
        const pending = orders.filter((o) => 
          ["AGENT_LOCKED", "AGENT_RESEARCHING", "WAITING_USER_REVIEW", "WAITING_PAYMENT"].includes(o.status)
        ).length;
        setStats({ total, completed, pending });
      } catch (err) {
        if (!alive) return;
        const error = err as Error;
        setError(error.message || "Профайл уншихад алдаа");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, []);

  const handleLogout = async (): Promise<void> => {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch (e) {
      // ignore
    }
    localStorage.removeItem("token");
    router.push("/auth/login");
  };

  if (loading) {
    return (
      <main className="page-container flex items-center justify-center min-h-screen">
        <div className="space-y-3 text-center">
          <div className="skeleton w-16 h-16 rounded-full mx-auto" />
          <p className="text-sm text-muted">Ачааллаж байна...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page-container has-mobile-nav">
      <div className="container-responsive py-responsive space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/agent" className="back-link">← Буцах</Link>
        </div>

        <header className="page-header">
          <h1 className="page-title flex items-center gap-2 sm:gap-3">
            <span className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-xl sm:text-2xl text-white">
              🔍
            </span>
            <span>Агент профайл</span>
          </h1>
          <p className="page-subtitle">Тохиргоо, статистик, түүх</p>
        </header>

        {error && <div className="error-box">{error}</div>}

        <section className="surface-card rounded-xl sm:rounded-2xl card-padding animate-fade-in">
          <h3 className="font-semibold mb-4">Миний мэдээлэл</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <span className="text-muted min-w-[80px]">Утас:</span>
              <span className="font-medium">{profile?.phone || "—"}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-muted min-w-[80px]">Нэр:</span>
              <span className="font-medium">{profile?.fullName || "—"}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-muted min-w-[80px]">Эрх:</span>
              <span className="chip-info">{profile?.roles?.[0] || "agent"}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-muted min-w-[80px]">Баталгаа:</span>
              {(profile as { agentProfile?: { isVerified?: boolean } })?.agentProfile?.isVerified ? (
                <span className="chip-success">✓ Баталгаажсан</span>
              ) : (
                <span className="chip-warning">Хүлээгдэж байна</span>
              )}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-3 sm:gap-4 animate-slide-up" style={{animationDelay: '0.05s'}}>
          <div className="surface-card rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-[var(--accent-primary)]">{stats.total}</p>
            <p className="text-[10px] sm:text-xs text-muted mt-1">Нийт</p>
          </div>
          <div className="surface-card rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-emerald-500">{stats.completed}</p>
            <p className="text-[10px] sm:text-xs text-muted mt-1">Дууссан</p>
          </div>
          <div className="surface-card rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-amber-500">{stats.pending}</p>
            <p className="text-[10px] sm:text-xs text-muted mt-1">Хүлээгдэж</p>
          </div>
        </section>

        <section className="surface-card rounded-xl sm:rounded-2xl card-padding animate-slide-up" style={{animationDelay: '0.1s'}}>
          <h3 className="font-semibold mb-4">Харагдац</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{theme === "dark" ? "🌙" : "☀️"}</span>
              <div>
                <p className="font-medium">{theme === "dark" ? "Шөнийн горим" : "Өдрийн горим"}</p>
                <p className="text-xs text-muted">Дэлгэцийн өнгө</p>
              </div>
            </div>
            <Button onClick={cycleTheme} variant="outline" size="sm">
              Солих
            </Button>
          </div>
        </section>

        <section className="surface-card rounded-xl sm:rounded-2xl p-3 sm:p-4 space-y-1 animate-slide-up" style={{animationDelay: '0.15s'}}>
          <Link href="/agent" className="flex items-center justify-between group touch-target py-2">
            <div className="flex items-center gap-3">
              <span className="text-xl">🏠</span>
              <span className="font-medium">Нээлттэй захиалгууд</span>
            </div>
            <span className="text-muted group-hover:text-[var(--accent-primary)] transition-colors">→</span>
          </Link>
          <div className="divider my-1"></div>
          <Link href="/agent/history" className="flex items-center justify-between group touch-target py-2">
            <div className="flex items-center gap-3">
              <span className="text-xl">📋</span>
              <span className="font-medium">Миний захиалгууд</span>
            </div>
            <span className="text-muted group-hover:text-[var(--accent-primary)] transition-colors">→</span>
          </Link>
        </section>

        <section className="animate-slide-up" style={{animationDelay: '0.2s'}}>
          <Button onClick={handleLogout} variant="danger" fullWidth size="lg" className="touch-target">
            🚪 Гарах
          </Button>
        </section>
      </div>

      <nav className="mobile-nav">
        <Link href="/agent" className="mobile-nav-item">
          <span>🏠</span>
          <span>Нүүр</span>
        </Link>
        <Link href="/agent/history" className="mobile-nav-item">
          <span>📋</span>
          <span>Түүх</span>
        </Link>
        <Link href="/agent/profile" className="mobile-nav-item active">
          <span>👤</span>
          <span>Профайл</span>
        </Link>
      </nav>
    </main>
  );
}

