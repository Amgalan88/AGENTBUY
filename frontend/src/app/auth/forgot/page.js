"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import Button from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [secretQuestion, setSecretQuestion] = useState("");
  const [secretAnswer, setSecretAnswer] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleFetchQuestion = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api(`/api/auth/secret-question/${phone}`);
      setSecretQuestion(data.question);
      setStep(2);
    } catch (err) {
      setError(err.message || "Хэрэглэгч олдсонгүй");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAnswer = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api("/api/auth/verify-secret", {
        method: "POST",
        body: JSON.stringify({ phone, secretAnswer }),
      });
      setResetToken(data.resetToken);
      setStep(3);
    } catch (err) {
      setError(err.message || "Хариулт буруу байна");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password !== confirm) {
      setError("Нууц үг давхцахгүй байна");
      return;
    }
    if (password.length < 6) {
      setError("Нууц үг хамгийн багадаа 6 тэмдэгт");
      return;
    }
    setLoading(true);
    try {
      await api("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ phone, newPassword: password, resetToken }),
      });
      setSuccess("Нууц үг шинэчлэгдлээ!");
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 2000);
    } catch (err) {
      setError(err.message || "Сэргээхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, label: "Утас" },
    { num: 2, label: "Асуулт" },
    { num: 3, label: "Шинэчлэх" },
  ];

  return (
    <main className="page-container flex items-center justify-center px-4 py-responsive min-h-screen">
      <div className="container-auth w-full animate-fade-in">
        <Link href="/auth/login" className="back-link mb-4 sm:mb-6 inline-flex">
          ← Нэвтрэх
        </Link>

        <div className="surface-card rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-lg">
          {/* Header */}
          <div className="text-center mb-5 sm:mb-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl surface-muted flex items-center justify-center text-2xl sm:text-3xl mx-auto mb-3 sm:mb-4">
              🔑
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">Нууц үг сэргээх</h1>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-6 sm:mb-8">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center gap-1.5 sm:gap-2">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all ${
                  step >= s.num 
                    ? "bg-[var(--accent-primary)] text-white" 
                    : "surface-muted text-muted"
                }`}>
                  {step > s.num ? "✓" : s.num}
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-6 sm:w-8 h-0.5 ${step > s.num ? "bg-[var(--accent-primary)]" : "bg-[var(--surface-muted)]"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Phone */}
          {step === 1 && (
            <form onSubmit={handleFetchQuestion} className="space-y-4">
              <p className="text-xs sm:text-sm text-secondary text-center mb-4">
                Бүртгэлтэй утасны дугаараа оруулна уу
              </p>
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
              {error && <div className="error-box">{error}</div>}
              <Button type="submit" loading={loading} fullWidth size="lg" className="touch-target">
                Үргэлжлүүлэх
              </Button>
            </form>
          )}

          {/* Step 2: Secret Question */}
          {step === 2 && (
            <form onSubmit={handleVerifyAnswer} className="space-y-4">
              <div className="surface-muted rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center">
                <p className="text-xs text-muted mb-1">Таны нууц асуулт:</p>
                <p className="font-semibold text-sm sm:text-base">{secretQuestion}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 sm:mb-2">Хариулт</label>
                <input
                  type="text"
                  value={secretAnswer}
                  onChange={(e) => setSecretAnswer(e.target.value)}
                  className="input-field"
                  placeholder="Хариултаа оруулна уу..."
                  required
                />
              </div>
              {error && <div className="error-box">{error}</div>}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="touch-target order-2 sm:order-1">
                  ← Буцах
                </Button>
                <Button type="submit" loading={loading} fullWidth size="lg" className="touch-target order-1 sm:order-2">
                  Баталгаажуулах
                </Button>
              </div>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="success-box text-center text-sm">
                ✅ Баталгаажлаа! Шинэ нууц үгээ оруулна уу.
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 sm:mb-2">Шинэ нууц үг</label>
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
              <div>
                <label className="block text-sm font-medium mb-1.5 sm:mb-2">Нууц үг давтах</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                />
              </div>
              {error && <div className="error-box">{error}</div>}
              {success && <div className="success-box text-center">{success}</div>}
              <Button type="submit" loading={loading} fullWidth size="lg" className="touch-target">
                Нууц үг шинэчлэх
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
