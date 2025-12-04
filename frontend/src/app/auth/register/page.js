"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(searchParams.get("role") || "user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    setLoading(true);
    try {
      const user = await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ fullName, phone, email, password, role }),
      });
      redirectByRole(user);
    } catch (err) {
      setError(err.message || "Бүртгэхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-2">Бүртгүүлэх</h1>
        <p className="text-sm text-slate-600 mb-4">
          Үндсэн мэдээллээ оруулснаар 10 карттайгаар эхлэнэ.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Овог нэр
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="Болормаа Бат"
              required
            />
          </div>
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
              Имэйл (сонголтоор)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="email@example.com"
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
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Дүр
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm"
            >
              <option value="user">Хэрэглэгч</option>
              <option value="agent">Агент</option>
            </select>
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-70"
          >
            {loading ? "Түр хүлээнэ үү..." : "Бүртгүүлэх"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Аль хэдийн бүртгэлтэй юу?{" "}
          <a href="/auth/login" className="text-emerald-600 hover:underline">
            Нэвтрэх
          </a>
        </p>
      </div>
    </main>
  );
}
