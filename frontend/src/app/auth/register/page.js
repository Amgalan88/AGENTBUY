"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import Button from "@/components/ui/Button";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(searchParams.get("role") || "user");
  const [secretQuestion, setSecretQuestion] = useState("");
  const [secretAnswer, setSecretAnswer] = useState("");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/auth/secret-questions")
      .then((data) => setQuestions(data.questions || []))
      .catch(() => {});
  }, []);

  const redirectByRole = (user) => {
    if (user?.roles?.includes("agent")) {
      router.push("/agent");
    } else {
      router.push("/user");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!secretQuestion || !secretAnswer) {
      setError("Нууц асуулт, хариулт заавал шаардлагатай");
      return;
    }
    setLoading(true);
    try {
      const user = await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ 
          fullName, 
          phone, 
          email, 
          password, 
          role,
          secretQuestion,
          secretAnswer,
        }),
      });
      redirectByRole(user);
    } catch (err) {
      setError(err.message || "Бүртгэхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-container flex items-center justify-center px-4 py-responsive min-h-screen">
      <div className="container-auth w-full animate-fade-in">
        {/* Back Link */}
        <Link href="/" className="back-link mb-4 sm:mb-6 inline-flex">
          ← Нүүр хуудас
        </Link>

        <div className="surface-card rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-lg">
          {/* Header */}
          <div className="text-center mb-5 sm:mb-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl surface-muted flex items-center justify-center text-2xl sm:text-3xl mx-auto mb-3 sm:mb-4">
              ✨
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">Бүртгүүлэх</h1>
            <p className="text-secondary text-xs sm:text-sm mt-2">
              Үндсэн мэдээллээ оруулаад 5 карттайгаар эхлээрэй
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 sm:mb-2">Овог нэр</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field"
                placeholder="Болормаа Бат"
                required
                autoComplete="name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 sm:mb-2">Утасны дугаар</label>
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
                Имэйл <span className="text-muted text-xs">(сонголтоор)</span>
              </label>
              <input
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="email@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 sm:mb-2">Нууц үг</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            
            {/* Secret Question - Grouped */}
            <div className="surface-muted rounded-xl sm:rounded-2xl p-3 sm:p-4 space-y-3 sm:space-y-4">
              <p className="text-sm font-medium flex items-center gap-2">
                <span>🔒</span> Нууц үг сэргээх асуулт
              </p>
              
              <div>
                <label className="block text-xs sm:text-sm mb-1.5 sm:mb-2">Нууц асуулт</label>
                <select
                  value={secretQuestion}
                  onChange={(e) => setSecretQuestion(e.target.value)}
                  className="select-field"
                  required
                >
                  <option value="">-- Сонгох --</option>
                  {questions.map((q) => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm mb-1.5 sm:mb-2">Хариулт</label>
                <input
                  type="text"
                  value={secretAnswer}
                  onChange={(e) => setSecretAnswer(e.target.value)}
                  className="input-field"
                  placeholder="Хариулт..."
                  required
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium mb-1.5 sm:mb-2">Хэрэглэгчийн төрөл</label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setRole("user")}
                  className={`p-3 sm:p-4 rounded-xl border text-sm font-medium transition-all touch-target ${
                    role === "user" 
                      ? "border-[var(--accent-primary)] bg-[rgba(16,185,129,0.1)] text-[var(--accent-primary)]" 
                      : "border-[var(--surface-card-border)] text-secondary"
                  }`}
                >
                  <span className="text-lg sm:text-xl block mb-1">🛒</span>
                  Хэрэглэгч
                </button>
                <button
                  type="button"
                  onClick={() => setRole("agent")}
                  className={`p-3 sm:p-4 rounded-xl border text-sm font-medium transition-all touch-target ${
                    role === "agent" 
                      ? "border-[var(--accent-secondary)] bg-[rgba(99,102,241,0.1)] text-[var(--accent-secondary)]" 
                      : "border-[var(--surface-card-border)] text-secondary"
                  }`}
                >
                  <span className="text-lg sm:text-xl block mb-1">🔍</span>
                  Агент
                </button>
              </div>
            </div>

            {error && <div className="error-box">{error}</div>}

            <Button type="submit" loading={loading} fullWidth size="lg" className="touch-target">
              Бүртгүүлэх
            </Button>
          </form>

          <div className="divider my-4 sm:my-6" />

          <p className="text-center text-sm text-secondary">
            Аль хэдийн бүртгэлтэй юу?{" "}
            <Link href="/auth/login" className="link-primary font-medium">
              Нэвтрэх
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
