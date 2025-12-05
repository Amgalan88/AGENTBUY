"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import Button from "@/components/ui/Button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const redirectByRole = (user) => {
    if (user?.roles?.includes("admin") || user?.roles?.includes("super_admin")) {
      router.push("/admin");
    } else if (user?.roles?.includes("agent")) {
      router.push("/agent");
    } else {
      router.push("/user");
    }
  };

  const prefRole = searchParams.get("role");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ phone, password, remember }),
      });
      redirectByRole(user);
    } catch (err) {
      setError(err.message || "Нэвтрэхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-auth w-full animate-fade-in">
      <Link href="/" className="back-link mb-4 sm:mb-6 inline-flex">
        ← Нүүр хуудас
      </Link>

      <div className="surface-card rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-lg">
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl surface-muted flex items-center justify-center text-2xl sm:text-3xl mx-auto mb-3 sm:mb-4">
            🔐
          </div>
          <h1 className="text-xl sm:text-2xl font-bold">Нэвтрэх</h1>
          <p className="text-secondary text-xs sm:text-sm mt-2">
            Утасны дугаар, нууц үгээ оруулаад нэвтрэнэ үү.
            {prefRole === "agent" && <span className="chip-info ml-2 px-2 py-0.5 rounded-full text-xs">Агент</span>}
            {prefRole === "user" && <span className="chip-success ml-2 px-2 py-0.5 rounded-full text-xs">Хэрэглэгч</span>}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5 sm:mb-2">
              Утасны дугаар
            </label>
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-field"
              placeholder="8800XXXX"
              required
              autoComplete="tel"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1.5 sm:mb-2">
              Нууц үг
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-sm">
            <label className="inline-flex items-center gap-2 cursor-pointer touch-target">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 sm:w-5 sm:h-5 rounded border-[var(--surface-card-border)] text-[var(--accent-primary)]"
              />
              <span className="text-secondary">Намайг сана</span>
            </label>
            <Link href="/auth/forgot" className="link-primary">
              Нууц үг мартсан?
            </Link>
          </div>

          {error && <div className="error-box">{error}</div>}

          <Button type="submit" loading={loading} fullWidth size="lg" className="touch-target">
            Нэвтрэх
          </Button>
        </form>

        <div className="divider my-5 sm:my-6" />

        <p className="text-center text-sm text-secondary">
          Шинэ хэрэглэгч үү?{" "}
          <Link href="/auth/register" className="link-primary font-medium">
            Бүртгүүлэх
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="page-container flex items-center justify-center px-4 py-responsive min-h-screen">
      <Suspense fallback={<div className="text-center">Ачааллаж байна...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
