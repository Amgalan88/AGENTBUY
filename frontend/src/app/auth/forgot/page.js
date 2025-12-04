"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password !== confirm) {
      setError("Нууц үг давхцахгүй байна");
      return;
    }
    setLoading(true);
    try {
      await api("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ phone, newPassword: password }),
      });
      setSuccess("Нууц үг шинэчлэгдлээ. Дахин нэвтэрч орно уу.");
      setPhone("");
      setPassword("");
      setConfirm("");
    } catch (err) {
      setError(err.message || "Сэргээхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-2">Нууц үг сэргээх</h1>
        <p className="text-sm text-slate-600 mb-4">Утасны дугаар болон шинэ нууц үгээ оруулна уу.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Утасны дугаар</label>
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Шинэ нууц үг</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="********"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Шинэ нууц үг давт</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="********"
              required
            />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          {success && <p className="text-sm text-emerald-600">{success}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-70"
          >
            {loading ? "Шинэчилж байна..." : "Сэргээх"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          <Link href="/auth/login" className="text-emerald-600 hover:underline">
            Нэвтрэх рүү буцах
          </Link>
        </p>
      </div>
    </main>
  );
}
