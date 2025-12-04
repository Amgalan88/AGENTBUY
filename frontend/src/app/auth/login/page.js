"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

export default function LoginPage() {
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
    <main className="min-h-screen bg-slate-100 text-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-2">Нэвтрэх</h1>
        <p className="text-sm text-slate-600 mb-4">
          Утасны дугаар, нууц үгээ оруулаад нэвтрэнэ үү.
          {prefRole === "agent" ? " (Агент)" : prefRole === "user" ? " (Хэрэглэгч)" : ""}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Утасны дугаар
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="8800XXXX"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Нууц үг
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="********"
              required
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Намайг сана
            </label>
            <a href="/auth/forgot" className="text-emerald-600 hover:underline">
              Нууц үг мартсан?
            </a>
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-70"
          >
            {loading ? "Түр хүлээнэ үү..." : "Нэвтрэх"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Шинэ хэрэглэгч үү?{" "}
          <a href="/auth/register" className="text-emerald-600 hover:underline">
            Бүртгүүлэх
          </a>
        </p>
      </div>
    </main>
  );
}

