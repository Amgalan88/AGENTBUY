/* eslint-disable */
// src/app/agent/order/[id]/page.js
"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUI } from "@/app/layout";
import { getSocket } from "@/lib/socket";
import Button from "@/components/ui/Button";

const appLabel = {
    any: "Ямар ч платформ",
    taobao: "Taobao",
    pinduoduo: "Pinduoduo",
    "1688": "1688 / Alibaba",
    dewu: "Dewu",
};

const statusLabel = {
    new: "Шинэ",
    researching: "Судлагдаж байна",
    proposal_sent: "Санал илгээгдсэн",
    closed_success: "Амжилттай хаагдсан",
    closed_cancelled: "Цуцлагдсан",
    cancelled: "Цуцлагдсан",
};

const urgencyLabel = {
    urgent: "Яаралтай",
    normal: "Энгийн",
    low: "Түргэн бус",
};

export default function AgentOrderDetailPage({ params }) {
    const { id } = use(params);
    const { theme, view } = useUI();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [claiming, setClaiming] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        priceCny: "",
        note: "",
        link: "",
        payLink: "",
        image: "",
    });
    const [newComment, setNewComment] = useState("");
    const [commentLoading, setCommentLoading] = useState(false);

    const mainClass =
        theme === "night"
            ? "bg-slate-950 text-slate-50"
            : theme === "mid"
                ? "bg-slate-200 text-slate-900"
                : "bg-slate-100 text-slate-900";

    const cardClass =
        theme === "night"
            ? "bg-slate-900 border-slate-700"
            : theme === "mid"
                ? "bg-slate-100 border-slate-300"
                : "bg-white border-slate-200";

    const widthClass =
        view === "mobile"
            ? "max-w-md"
            : view === "tablet"
                ? "max-w-3xl"
                : "max-w-5xl";

    useEffect(() => {
        let alive = true;
        async function loadRequest() {
            try {
                const res = await fetch(`http://localhost:5000/api/requests/${id}`);
                if (!res.ok) throw new Error(`API error ${res.status}`);
                const data = await res.json();
                if (alive) setRequest(data);
            } catch (err) {
                console.error("Failed to load request detail", err);
                if (alive) setError("Захиалгыг ачаалах үед алдаа гарлаа.");
            } finally {
                if (alive) setLoading(false);
            }
        }
        loadRequest();
        const socket = getSocket();
        const handleComment = (data) => {
            if (data?.orderId === id) loadRequest();
        };
        socket.on("order:comment", handleComment);
        return () => {
            alive = false;
            socket.off("order:comment", handleComment);
        };
    }, [id]);

    const researchHours = useMemo(() => {
        if (!request?.items) return 1;
        return request.items.length > 1 ? 4 : 1;
    }, [request]);

    const researchDeadline = useMemo(() => {
        if (!request) return null;
        const base = request.researchUntil || request.claimedAt || request.createdAt;
        if (!base) return null;
        const date = new Date(base);
        if (!request.researchUntil) {
            date.setHours(date.getHours() + researchHours);
        }
        return date;
    }, [request, researchHours]);

    const handleClaim = async () => {
        setClaiming(true);
        setError("");
        try {
            const res = await fetch(`http://localhost:5000/api/requests/${id}/claim`, {
                method: "POST",
            });
            if (!res.ok) throw new Error(`Claim failed ${res.status}`);
            const data = await res.json();
            setRequest(data);
        } catch (err) {
            console.error(err);
            setError("Захиалга авахад алдаа гарлаа.");
        } finally {
            setClaiming(false);
        }
    };

    const handleReportSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            const payload = {
                priceCny: form.priceCny,
                note: form.note,
                link: form.link,
                paymentLink: form.payLink,
                image: form.image,
            };
            const res = await fetch(`http://localhost:5000/api/requests/${id}/report`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(`Report failed ${res.status}`);
            const data = await res.json();
            setRequest(data);
        } catch (err) {
            console.error(err);
            setError("Тайлан илгээхэд алдаа гарлаа.");
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setCommentLoading(true);
        setError("");
        try {
            const res = await fetch(`http://localhost:5000/api/agent/orders/${id}/comment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: newComment }),
            });
            if (!res.ok) throw new Error(`Comment failed ${res.status}`);
            const data = await res.json();
            setRequest(data);
            setNewComment("");
        } catch (err) {
            console.error(err);
            setError("Сэтгэгдэл илгээхэд алдаа гарлаа.");
        } finally {
            setCommentLoading(false);
        }
    };

    if (loading) {
        return (
            <main className={`${mainClass} min-h-screen flex items-center justify-center`}>
                <p>Ачааллаж байна...</p>
            </main>
        );
    }

    if (!request || error) {
        return (
            <main className={`${mainClass} min-h-screen flex items-center justify-center`}>
                <div className="text-center space-y-3">
                    <p>{error || "Захиалгыг олсонгүй."}</p>
                    <Link href="/agent" className="text-emerald-600 hover:text-emerald-500 text-sm">
                        Буцах
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className={`${mainClass} min-h-screen`}>
            <div className={`${widthClass} mx-auto px-4 py-10 space-y-6`}>
                <div className="flex items-center justify-between">
                    <Link href="/agent" className="text-sm opacity-70">
                        Буцах жагсаалт
                    </Link>
                    <Link href="/agent/history" className="text-sm opacity-70">
                        Өмнөх захиалгууд
                    </Link>
                </div>

                <div className={`rounded-2xl border p-6 space-y-4 ${cardClass}`}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="space-y-1">
                            <h1 className="text-xl font-semibold">Захиалгын дэлгэрэнгүй</h1>
                            <p className="text-xs opacity-70">
                                ID: <span className="font-mono">{request._id}</span>
                            </p>
                            <p className="text-xs opacity-70">
                                Үүссэн: {new Date(request.createdAt).toLocaleString()}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs flex-wrap">
                            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600">
                                {statusLabel[request.status] || request.status}
                            </span>
                            <span className="px-3 py-1 rounded-full bg-slate-500/10 text-slate-700">
                                {request.type === "batch" ? "Багц" : "Нэг ширхэг"}
                            </span>
                            {request.urgency && (
                                <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-600">
                                    {urgencyLabel[request.urgency] || request.urgency}
                                </span>
                            )}
                        </div>
                    </div>

                    {researchDeadline && (
                        <div className="text-sm rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                            Судлах хугацаа: {researchHours} цаг. Дуусах хугацаа {researchDeadline.toLocaleString()}.
                            Нэг агент судалж байгаа үед бусад агент авах боломжгүй.
                        </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="md:col-span-2 space-y-3">
                            <h2 className="text-sm font-semibold">Барааны жагсаалт</h2>
                            {request.items.map((it, i) => (
                                <div
                                    key={i}
                                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm space-y-1"
                                >
                                    <p className="font-medium">
                                        #{i + 1} — {it.name} {it.mark ? `• ${it.mark}` : ""}
                                    </p>
                                    <p className="text-xs opacity-70">
                                        Тоо: {it.quantity} • Платформ: {appLabel[it.app] || it.app}
                                    </p>
                                    {it.link && (
                                        <p className="text-xs">
                                            Линк: {" "}
                                            <a
                                                href={it.link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-emerald-600 underline"
                                            >
                                                {it.link}
                                            </a>
                                        </p>
                                    )}
                                    {it.note && (
                                        <p className="text-xs opacity-80">Тэмдэглэл: {it.note}</p>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3">
                            <div className="rounded-xl border border-slate-200 p-3 text-sm space-y-2">
                                <h3 className="font-semibold text-sm">Үйлдэл</h3>
                                <Button
                                    onClick={handleClaim}
                                    disabled={request.status !== "new" || claiming}
                                    variant={request.status !== "new" ? "muted" : "primary"}
                                    size="sm"
                                    fullWidth
                                >
                                    {claiming ? "Авч байна..." : request.status !== "new" ? "Бусад авч байна" : "Захиалга авах"}
                                </Button>
                                <Link
                                    href={`/requests/${request._id}`}
                                    className="block rounded-lg border border-slate-200 px-4 py-2 text-center text-xs text-slate-700 hover:border-emerald-400"
                                >
                                    User харах
                                </Link>
                            </div>

                            <div className="rounded-xl border border-slate-200 p-3 text-sm space-y-3">
                                <h3 className="font-semibold text-sm">💬 Хэрэглэгчтэй чат</h3>
                                
                                {/* Comment List */}
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {(request.comments || []).length === 0 ? (
                                        <p className="text-xs text-slate-500">Сэтгэгдэл байхгүй байна.</p>
                                    ) : (
                                        (request.comments || []).map((c, idx) => (
                                            <div
                                                key={idx}
                                                className={`rounded-lg p-2 text-xs ${
                                                    c.senderRole === "user"
                                                        ? "bg-blue-50 border border-blue-100 mr-4"
                                                        : "bg-emerald-50 border border-emerald-100 ml-4"
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`font-medium ${
                                                        c.senderRole === "user" ? "text-blue-600" : "text-emerald-600"
                                                    }`}>
                                                        {c.senderRole === "user" ? "👤 Хэрэглэгч" : "💼 Та"}
                                                    </span>
                                                    <span className="text-slate-400">
                                                        {new Date(c.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-slate-700">{c.message}</p>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Comment Form */}
                                <form onSubmit={handleCommentSubmit} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Хариулт бичих..."
                                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                        disabled={commentLoading}
                                    />
                                    <Button
                                        type="submit"
                                        size="sm"
                                        variant="secondary"
                                        disabled={!newComment.trim() || commentLoading}
                                    >
                                        {commentLoading ? "..." : "Илгээх"}
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold">Тайлан илгээх (үнэ + тайлбар)</h2>
                            <span className="text-[11px] text-emerald-700">Юань * 510 = төгрөг</span>
                        </div>
                        <form className="grid gap-3 md:grid-cols-2" onSubmit={handleReportSubmit}>
                            <label className="text-xs space-y-1">
                                <span className="opacity-70">Үнэ (CNY)</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.priceCny}
                                    onChange={handleChange("priceCny")}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                    required
                                />
                            </label>
                            <label className="text-xs space-y-1">
                                <span className="opacity-70">Барааны линк</span>
                                <input
                                    type="url"
                                    value={form.link}
                                    onChange={handleChange("link")}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                />
                            </label>
                            <label className="text-xs space-y-1">
                                <span className="opacity-70">Төлбөр төлөх линк</span>
                                <input
                                    type="url"
                                    value={form.payLink}
                                    onChange={handleChange("payLink")}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                />
                            </label>
                            <label className="text-xs space-y-1">
                                <span className="opacity-70">Зураг (линк)</span>
                                <input
                                    type="url"
                                    value={form.image}
                                    onChange={handleChange("image")}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                />
                            </label>
                            <label className="text-xs space-y-1 md:col-span-2">
                                <span className="opacity-70">Нэмэлт тайлбар</span>
                                <textarea
                                    value={form.note}
                                    onChange={handleChange("note")}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                    rows={3}
                                />
                            </label>
                            <div className="md:col-span-2 flex items-center justify-between gap-3">
                                <p className="text-[11px] text-slate-600">
                                    Тайлан илгээснээр статус "Тайлан ирсэн" болно. Хэрэглэгч үзээд оноо өгч, төлбөрөө хийсний дараа биелсэн төлөвт орно.
                                </p>
                                <Button type="submit" disabled={saving} variant="secondary" size="sm" className="px-4 py-2">
                                    {saving ? "Илгээж байна..." : "Тайлан илгээх"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    );
}
