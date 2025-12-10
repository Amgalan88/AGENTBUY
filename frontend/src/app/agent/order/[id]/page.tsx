/* eslint-disable */
// src/app/agent/order/[id]/page.tsx
"use client";

import { use, useEffect, useMemo, useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useUI } from "@/app/layout";
import { getSocket } from "@/lib/socket";
import { api } from "@/lib/api";
import Button from "@/components/ui/Button";
import type { Order } from "@/types/order";

const appLabel: Record<string, string> = {
    any: "Ямар ч платформ",
    taobao: "Taobao",
    pinduoduo: "Pinduoduo",
    "1688": "1688 / Alibaba",
    dewu: "Dewu",
};

const statusLabel: Record<string, string> = {
    new: "Шинэ",
    researching: "Судлагдаж байна",
    proposal_sent: "Санал илгээгдсэн",
    closed_success: "Амжилттай хаагдсан",
    closed_cancelled: "Цуцлагдсан",
    cancelled: "Цуцлагдсан",
};

const urgencyLabel: Record<string, string> = {
    urgent: "Яаралтай",
    normal: "Энгийн",
    low: "Түргэн бус",
};

interface RequestForm {
    priceCny: string;
    note: string;
    link: string;
    payLink: string;
    image: string;
}

interface RequestItem {
    name?: string;
    title?: string;
    mark?: string;
    quantity?: number;
    app?: string;
    link?: string;
    note?: string;
    images?: string[];
    imageUrl?: string;
}

interface RequestComment {
    senderRole: "user" | "agent";
    message: string;
    createdAt: string | Date;
}

interface RequestData {
    _id: string;
    status: string;
    type?: string;
    urgency?: string;
    items: RequestItem[];
    comments?: RequestComment[];
    researchUntil?: string | Date;
    claimedAt?: string | Date;
    createdAt: string | Date;
    updatedAt?: string | Date;
}

interface RequestParams {
    id: string;
}

export default function AgentOrderDetailPage({ params }: { params: Promise<RequestParams> }): React.JSX.Element {
    const { id } = use(params);
    const { theme, view } = useUI();
    const [request, setRequest] = useState<RequestData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");
    const [claiming, setClaiming] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [form, setForm] = useState<RequestForm>({
        priceCny: "",
        note: "",
        link: "",
        payLink: "",
        image: "",
    });
    const [newComment, setNewComment] = useState<string>("");
    const [commentLoading, setCommentLoading] = useState<boolean>(false);

    const mainClass =
        theme === "dark"
            ? "bg-slate-950 text-slate-50"
            : theme === "light"
                ? "bg-slate-100 text-slate-900"
                : "bg-slate-100 text-slate-900";

    const cardClass =
        theme === "dark"
            ? "bg-slate-900 border-slate-700"
            : theme === "light"
                ? "bg-white border-slate-200"
                : "bg-white border-slate-200";

    const widthClass =
        view === "mobile"
            ? "max-w-md"
            : view === "tablet"
                ? "max-w-3xl"
                : "max-w-5xl";

    useEffect(() => {
        let alive = true;
        async function loadRequest(): Promise<void> {
            try {
                const data = await api<RequestData>(`/api/requests/${id}`);
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
        if (!socket) return;

        interface CommentData {
            orderId?: string;
        }

        const handleComment = (data: CommentData): void => {
            if (data?.orderId === id) loadRequest();
        };
        socket.on("order:comment", handleComment);
        return () => {
            alive = false;
            socket.off("order:comment", handleComment);
        };
    }, [id]);

    const researchHours = useMemo<number>(() => {
        if (!request?.items) return 1;
        return request.items.length > 1 ? 4 : 1;
    }, [request]);

    const researchDeadline = useMemo<Date | null>(() => {
        if (!request) return null;
        const base = request.researchUntil || request.claimedAt || request.createdAt;
        if (!base) return null;
        const date = new Date(base);
        if (!request.researchUntil) {
            date.setHours(date.getHours() + researchHours);
        }
        return date;
    }, [request, researchHours]);

    const handleClaim = async (): Promise<void> => {
        setClaiming(true);
        setError("");
        try {
            const data = await api<RequestData>(`/api/requests/${id}/claim`, {
                method: "POST",
            });
            setRequest(data);
        } catch (err) {
            console.error(err);
            setError("Захиалга авахад алдаа гарлаа.");
        } finally {
            setClaiming(false);
        }
    };

    const handleReportSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
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
            const data = await api<RequestData>(`/api/requests/${id}/report`, {
                method: "POST",
                body: payload,
            });
            setRequest(data);
        } catch (err) {
            console.error(err);
            setError("Тайлан илгээхэд алдаа гарлаа.");
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: keyof RequestForm) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
        setForm({ ...form, [field]: e.target.value });
    };

    const handleCommentSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setCommentLoading(true);
        setError("");
        try {
            const data = await api<RequestData>(`/api/agent/orders/${id}/comment`, {
                method: "POST",
                body: { message: newComment },
            });
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
                            {request.items.map((it, i) => {
                                const rawImgs = it.images || (it.imageUrl ? [it.imageUrl] : []);
                                const imgs = rawImgs.filter((img): img is string => 
                                    img && 
                                    typeof img === "string" && 
                                    img.trim() !== "" && 
                                    !img.startsWith("data:") &&
                                    (img.startsWith("http://") || img.startsWith("https://"))
                                );
                                const itemName = it.name || it.title || "Бараа";
                                return (
                                    <div
                                        key={i}
                                        className="rounded-xl border border-slate-200 px-4 py-3 text-sm space-y-1"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 space-y-1">
                                                <p className="font-medium">
                                                    #{i + 1} — {itemName} {it.mark ? `• ${it.mark}` : ""}
                                                </p>
                                                <p className="text-xs opacity-70">
                                                    Тоо: {it.quantity || 1} • Платформ: {appLabel[it.app || "any"] || it.app}
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
                                            {imgs.length > 0 && (
                                                <div className="flex gap-2 flex-wrap shrink-0">
                                                    {imgs.slice(0, 3).map((img, imgIdx) => (
                                                        <div
                                                            key={imgIdx}
                                                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-slate-200 cursor-pointer"
                                                            onClick={() => window.open(img, '_blank')}
                                                        >
                                                            <img 
                                                                src={img} 
                                                                alt={`${itemName} ${imgIdx + 1}`} 
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLImageElement;
                                                                    console.error("Image load error:", img);
                                                                    target.style.display = "none";
                                                                }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
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

                                <form onSubmit={handleCommentSubmit} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setNewComment(e.target.value)}
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
