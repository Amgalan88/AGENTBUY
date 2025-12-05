"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUI } from "@/app/layout";
import { api } from "@/lib/api";
import Button from "@/components/ui/Button";

export default function UserProfilePage() {
  const router = useRouter();
  const { theme, cycleTheme } = useUI();

  const [profile, setProfile] = useState(null);
  const [cargos, setCargos] = useState([]);
  const [selectedCargo, setSelectedCargo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [me, cargoData] = await Promise.all([
          api("/api/auth/me"),
          api("/api/user/cargos"),
        ]);
        if (!alive) return;
        setProfile(me);
        setCargos(cargoData);
        setSelectedCargo(me?.defaultCargoId || "");
      } catch (err) {
        if (!alive) return;
        setError(err.message || "Профайл уншихад алдаа");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, []);

  const handleSaveCargo = async () => {
    if (!selectedCargo) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await api("/api/user/default-cargo", {
        method: "POST",
        body: JSON.stringify({ cargoId: selectedCargo }),
      });
      setSuccess("Карго хадгалагдлаа!");
      setProfile((prev) => ({ ...prev, defaultCargoId: selectedCargo }));
    } catch (err) {
      setError(err.message || "Хадгалахад алдаа");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/user" className="back-link">← Буцах</Link>
        </div>

        <header className="page-header">
          <h1 className="page-title flex items-center gap-2 sm:gap-3">
            <span className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xl sm:text-2xl text-white">
              👤
            </span>
            <span>Профайл</span>
          </h1>
          <p className="page-subtitle">Тохиргоо, карго сонголт, түүх</p>
        </header>

        {error && <div className="error-box">{error}</div>}
        {success && <div className="success-box">{success}</div>}

        {/* Profile Info */}
        <section className="surface-card rounded-xl sm:rounded-2xl card-padding animate-fade-in">
          <h3 className="font-semibold mb-4">Миний мэдээлэл</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <span className="text-muted min-w-[80px]">Утас:</span>
              <span className="font-medium">{profile?.phone || "—"}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-muted min-w-[80px]">Нэр:</span>
              <span className="font-medium">{profile?.firstName || "—"} {profile?.lastName || ""}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-muted min-w-[80px]">Эрх:</span>
              <span className="chip">{profile?.role || "user"}</span>
            </div>
          </div>
        </section>

        {/* Card Balance */}
        <section className="surface-card rounded-xl sm:rounded-2xl card-padding animate-slide-up" style={{animationDelay: '0.05s'}}>
          <h3 className="font-semibold mb-4">Картын үлдэгдэл</h3>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-2xl text-white">
              💳
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold">{profile?.cardBalance ?? 0}</p>
              <p className="text-xs text-muted">нийт карт</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[var(--surface-card-border)]">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted">Идэвхтэй:</span>
              <div className="flex-1 h-2 rounded-full surface-muted overflow-hidden">
                <div 
                  className="h-full bg-[var(--accent-primary)] rounded-full transition-all"
                  style={{ width: `${((profile?.cardProgress ?? 0) / 2) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium">{profile?.cardProgress ?? 0}/2</span>
            </div>
          </div>
        </section>

        {/* Default Cargo Selection */}
        <section className="surface-card rounded-xl sm:rounded-2xl card-padding animate-slide-up" style={{animationDelay: '0.1s'}}>
          <h3 className="font-semibold mb-4">Үндсэн карго</h3>
          <p className="text-xs text-muted mb-3">Захиалга үүсгэхэд автоматаар сонгогдоно</p>
          <div className="space-y-3">
            <select
              value={selectedCargo}
              onChange={(e) => setSelectedCargo(e.target.value)}
              className="select-field"
            >
              <option value="">Сонгоогүй</option>
              {cargos.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            <Button 
              onClick={handleSaveCargo} 
              loading={saving} 
              disabled={!selectedCargo || selectedCargo === profile?.defaultCargoId}
              fullWidth
              className="touch-target"
            >
              Хадгалах
            </Button>
          </div>
        </section>

        {/* Theme Toggle */}
        <section className="surface-card rounded-xl sm:rounded-2xl card-padding animate-slide-up" style={{animationDelay: '0.15s'}}>
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

        {/* Quick Links */}
        <section className="surface-card rounded-xl sm:rounded-2xl p-3 sm:p-4 animate-slide-up" style={{animationDelay: '0.2s'}}>
          <Link href="/user/requests" className="flex items-center justify-between group touch-target py-2">
            <div className="flex items-center gap-3">
              <span className="text-xl">📋</span>
              <span className="font-medium">Өмнөх захиалгууд</span>
            </div>
            <span className="text-muted group-hover:text-[var(--accent-primary)] transition-colors">→</span>
          </Link>
        </section>

        {/* Logout */}
        <section className="animate-slide-up" style={{animationDelay: '0.25s'}}>
          <Button onClick={handleLogout} variant="danger" fullWidth size="lg" className="touch-target">
            🚪 Гарах
          </Button>
        </section>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav">
        <Link href="/user" className="mobile-nav-item">
          <span>🏠</span>
          <span>Нүүр</span>
        </Link>
        <Link href="/user/requests" className="mobile-nav-item">
          <span>📋</span>
          <span>Захиалга</span>
        </Link>
        <Link href="/user/profile" className="mobile-nav-item active">
          <span>👤</span>
          <span>Профайл</span>
        </Link>
      </nav>
    </main>
  );
}
