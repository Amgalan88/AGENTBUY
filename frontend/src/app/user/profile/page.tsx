"use client";

import { useEffect, useState, ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUI } from "@/app/layout";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import Button from "@/components/ui/Button";
import type { User } from "@/types/user";
import type { Cargo } from "@/types/order";

interface Settings {
  bankName?: string;
  bankAccount?: string;
  bankOwner?: string;
  cnyRate?: number;
  [key: string]: unknown;
}

interface CardTransaction {
  _id: string;
  type: string;
  cardChange: number;
  balanceAfter: number;
  createdAt: string | Date;
  [key: string]: unknown;
}

export default function UserProfilePage(): React.JSX.Element {
  const router = useRouter();
  const { theme, cycleTheme } = useUI();

  const [profile, setProfile] = useState<User | null>(null);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [selectedCargo, setSelectedCargo] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [showBuyCards, setShowBuyCards] = useState<boolean>(false);
  const [cardQuantity, setCardQuantity] = useState<number>(1);
  const [buyingCards, setBuyingCards] = useState<boolean>(false);
  const [settings, setSettings] = useState<Settings>({});
  const [cardTransactions, setCardTransactions] = useState<CardTransaction[]>([]);
  const [showTransactionHistory, setShowTransactionHistory] = useState<boolean>(false);

  const loadData = async (includeTransactions = true): Promise<void> => {
    setError("");
    try {
      const promises: Promise<unknown>[] = [
        api<User>("/api/auth/me"),
        api<Cargo[]>("/api/user/cargos"),
        api<Settings>("/api/settings"),
      ];
      if (includeTransactions) {
        promises.push(api<CardTransaction[]>("/api/user/cards/transactions").catch(() => []));
      }
      const results = await Promise.all(promises);
      const [me, cargoData, settingsData, transactionsData] = results;
      setProfile(me as User);
      setCargos((cargoData as Cargo[]) || []);
      setSelectedCargo((me as User)?.defaultCargoId || "");
      setSettings((settingsData as Settings) || {});
      if (includeTransactions && transactionsData) {
        setCardTransactions((transactionsData as CardTransaction[]) || []);
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Профайл уншихад алдаа");
    }
  };

  useEffect(() => {
    let alive = true;
    let currentUserId: string | null = null;
    
    async function load(): Promise<void> {
      setLoading(true);
      try {
        const [me, cargoData, settingsData, transactionsData] = await Promise.all([
          api<User>("/api/auth/me"),
          api<Cargo[]>("/api/user/cargos"),
          api<Settings>("/api/settings"),
          api<CardTransaction[]>("/api/user/cards/transactions").catch((err) => {
            console.error("Failed to load transactions:", err);
            return [];
          }),
        ]);
        if (!alive) return;
        currentUserId = (me as User)?._id || (me as { id?: string })?.id || null;
        setProfile(me as User);
        setCargos((cargoData as Cargo[]) || []);
        setSelectedCargo((me as User)?.defaultCargoId || "");
        setSettings((settingsData as Settings) || {});
        setCardTransactions((transactionsData as CardTransaction[]) || []);
      } catch (err) {
        if (!alive) return;
        const error = err as Error;
        setError(error.message || "Профайл уншихад алдаа");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();

    const socket = getSocket();
    if (!socket) return;
    
    interface CardBalanceUpdateData {
      userId?: string;
    }
    
    const handleCardBalanceUpdate = async (data: CardBalanceUpdateData): Promise<void> => {
      if (currentUserId && (data.userId === currentUserId || data.userId === currentUserId.toString())) {
        try {
          const [me, transactionsData] = await Promise.all([
            api<User>("/api/auth/me"),
            api<CardTransaction[]>("/api/user/cards/transactions").catch((err) => {
              console.error("Failed to refresh transactions:", err);
              return [];
            }),
          ]);
          if (alive) {
            setProfile(me as User);
            setCardTransactions((transactionsData as CardTransaction[]) || []);
          }
        } catch (err) {
          console.error("Failed to refresh card data:", err);
        }
      }
    };
    socket.on("card:balance:update", handleCardBalanceUpdate);

    return () => {
      alive = false;
      socket.off("card:balance:update", handleCardBalanceUpdate);
    };
  }, []);

  const handleSaveCargo = async (): Promise<void> => {
    if (!selectedCargo) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await api("/api/user/default-cargo", {
        method: "POST",
        body: { cargoId: selectedCargo },
      });
      setSuccess("Карго хадгалагдлаа!");
      setProfile((prev) => prev ? ({ ...prev, defaultCargoId: selectedCargo } as User) : null);
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Хадгалахад алдаа");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch (e) {
      // ignore
    }
    localStorage.removeItem("token");
    router.push("/auth/login");
  };

  const generateTransactionNumber = (): string => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `TXN${timestamp}${random}`;
  };

  const handleBuyCards = async (): Promise<void> => {
    if (!cardQuantity || cardQuantity < 1) {
      setError("Картын тоо 1-ээс дээш байх ёстой");
      return;
    }
    setBuyingCards(true);
    setError("");
    setSuccess("");
    try {
      const transactionNumber = generateTransactionNumber();
      await api("/api/user/cards/request", {
        method: "POST",
        body: {
          quantity: Number(cardQuantity),
          transactionNumber: transactionNumber,
        },
      });
      setSuccess("Карт худалдан авах хүсэлт илгээгдлээ! Админ шалгаад баталгаажуулах болно.");
      setShowBuyCards(false);
      setCardQuantity(1);
      const me = await api<User>("/api/auth/me");
      setProfile(me);
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Карт худалдан авах хүсэлт илгээхэд алдаа гарлаа");
    } finally {
      setBuyingCards(false);
    }
  };

  const PRICE_PER_CARD = 2000;
  const totalPrice = cardQuantity * PRICE_PER_CARD;

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

  const typeLabels: Record<string, string> = {
    init: "Эхлэл",
    consume: "Хэрэглэсэн",
    return: "Буцаалт",
    consume_kept: "Хэрэглэсэн (хадгалагдсан)",
    bonus_progress: "Бонус прогресс",
    bonus_card: "Бонус карт",
    gift_send: "Бэлэг илгээсэн",
    gift_receive: "Бэлэг хүлээж авсан",
    buy_package: "Карт худалдан авсан",
    sell_to_admin: "Админд борлуулсан",
  };

  return (
    <main className="page-container has-mobile-nav">
      <div className="container-responsive py-responsive space-y-4 sm:space-y-6">
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
              <span className="text-muted min-w-[80px]">Email:</span>
              <span className="font-medium">{profile?.email || "—"}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-muted min-w-[80px]">Эрх:</span>
              <span className="chip">{profile?.roles?.[0] || "user"}</span>
            </div>
          </div>
        </section>

        <section className="surface-card rounded-xl sm:rounded-2xl card-padding animate-slide-up" style={{animationDelay: '0.05s'}}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Картын үлдэгдэл</h3>
            {(profile?.cardBalance ?? 0) === 0 && (
              <Button
                onClick={() => setShowBuyCards(true)}
                size="sm"
                variant="primary"
              >
                Карт авах
              </Button>
            )}
          </div>
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
          {(profile?.cardBalance ?? 0) > 0 && (
            <div className="mt-4 pt-3 border-t border-[var(--surface-card-border)]">
              <Button
                onClick={() => setShowBuyCards(true)}
                variant="outline"
                fullWidth
                size="sm"
              >
                ➕ Нэмэлт карт авах
              </Button>
            </div>
          )}
          
          <div className="mt-4 pt-3 border-t border-[var(--surface-card-border)]">
            <button
              onClick={() => setShowTransactionHistory(!showTransactionHistory)}
              className="w-full text-left flex items-center justify-between py-2 hover:opacity-80 transition-opacity"
            >
              <span className="text-sm font-medium text-muted">Түүх</span>
              <span className="text-muted">{showTransactionHistory ? "▲" : "▼"}</span>
            </button>
            {showTransactionHistory && (
              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                {cardTransactions.length === 0 ? (
                  <p className="text-xs text-muted text-center py-2">Түүх байхгүй</p>
                ) : (
                  cardTransactions.map((txn) => {
                    const isPositive = txn.cardChange > 0;
                    return (
                      <div
                        key={txn._id}
                        className="flex items-center justify-between p-2 rounded-lg surface-muted text-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{typeLabels[txn.type] || txn.type}</p>
                          <p className="text-muted text-[10px]">
                            {new Date(txn.createdAt).toLocaleDateString("mn", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="text-right ml-2 shrink-0">
                          <p className={`font-semibold text-sm ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
                            {isPositive ? "+" : ""}{txn.cardChange}
                          </p>
                          <p className="text-[10px] text-muted">Үлд: {txn.balanceAfter}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </section>

        {showBuyCards && (
          <section className="surface-card rounded-xl sm:rounded-2xl card-padding animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Карт худалдан авах</h3>
              <Button
                onClick={() => {
                  setShowBuyCards(false);
                  setCardQuantity(1);
                  setError("");
                }}
                variant="ghost"
                size="sm"
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Картын тоо</label>
                <input
                  type="number"
                  min={1}
                  value={cardQuantity}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setCardQuantity(Number(e.target.value) || 1)}
                  className="input-field"
                  placeholder="1"
                />
                <p className="text-xs text-muted mt-1">
                  Үнэ: {totalPrice.toLocaleString()}₮ ({PRICE_PER_CARD.toLocaleString()}₮ × {cardQuantity})
                </p>
              </div>

              <div className="surface-muted rounded-xl p-3 space-y-2">
                <p className="text-sm font-medium">💳 Дансны мэдээлэл:</p>
                <div className="text-xs space-y-1">
                  <p><strong>Банк:</strong> {settings.bankName || "—"}</p>
                  <p><strong>Данс:</strong> {settings.bankAccount || "—"}</p>
                  <p><strong>Эзэмшигч:</strong> {settings.bankOwner || "—"}</p>
                </div>
              </div>

              {error && <div className="error-box">{error}</div>}
              {success && <div className="success-box">{success}</div>}

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowBuyCards(false);
                    setCardQuantity(1);
                    setError("");
                  }}
                  variant="outline"
                  fullWidth
                >
                  Цуцлах
                </Button>
                <Button
                  onClick={handleBuyCards}
                  loading={buyingCards}
                  fullWidth
                  disabled={!cardQuantity || cardQuantity < 1}
                >
                  Төлбөр төлсөн
                </Button>
              </div>
            </div>
          </section>
        )}

        <section className="surface-card rounded-xl sm:rounded-2xl card-padding animate-slide-up" style={{animationDelay: '0.1s'}}>
          <h3 className="font-semibold mb-4">Үндсэн карго</h3>
          <p className="text-xs text-muted mb-3">Захиалга үүсгэхэд автоматаар сонгогдоно</p>
          <div className="space-y-3">
            <select
              value={selectedCargo}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedCargo(e.target.value)}
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

        <section className="surface-card rounded-xl sm:rounded-2xl p-3 sm:p-4 animate-slide-up" style={{animationDelay: '0.2s'}}>
          <Link href="/user/requests" className="flex items-center justify-between group touch-target py-2">
            <div className="flex items-center gap-3">
              <span className="text-xl">📋</span>
              <span className="font-medium">Өмнөх захиалгууд</span>
            </div>
            <span className="text-muted group-hover:text-[var(--accent-primary)] transition-colors">→</span>
          </Link>
        </section>

        <section className="animate-slide-up" style={{animationDelay: '0.3s'}}>
          <Button onClick={handleLogout} variant="danger" fullWidth size="lg" className="touch-target">
            🚪 Гарах
          </Button>
        </section>
      </div>

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

