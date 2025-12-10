"use client";

import { useEffect, useMemo, useState, Suspense, FormEvent, ChangeEvent, KeyboardEvent } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useUI } from "@/app/layout";
import { api } from "@/lib/api";
import Button from "@/components/ui/Button";
import ImageLightbox from "@/components/ImageLightbox";
import type { Cargo } from "@/types/order";
import type { User } from "@/types/user";
import type { Order } from "@/types/order";

interface AppOption {
  value: string;
  label: string;
}

const appOptionsData: AppOption[] = [
  { value: "any", label: "Бүх платформ" },
  { value: "taobao", label: "Taobao" },
  { value: "pinduoduo", label: "Pinduoduo" },
  { value: "1688", label: "1688 / Alibaba" },
  { value: "dewu", label: "Dewu (Poizon)" },
];

function SingleOrderForm(): React.JSX.Element {
  const { theme, view } = useUI();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [selectedCargo, setSelectedCargo] = useState<string>("");
  const [defaultCargoId, setDefaultCargoId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [sourceUrl, setSourceUrl] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [app, setApp] = useState<string>("any");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [successId, setSuccessId] = useState<string>("");
  const [savingDefault, setSavingDefault] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [draftOrderId, setDraftOrderId] = useState<string | null>(null);

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

  const inputClass =
    theme === "dark"
      ? "bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-400"
      : theme === "light"
        ? "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
        : "bg-white border-slate-300 text-slate-900 placeholder-slate-400";

  const widthClass =
    view === "mobile"
      ? "max-w-md"
      : view === "tablet"
        ? "max-w-3xl"
        : "max-w-4xl";

  const appOptions = useMemo<AppOption[]>(() => appOptionsData, []);

  useEffect(() => {
    let alive = true;
    async function load(): Promise<void> {
      setLoading(true);
      setError("");
      try {
        const editId = searchParams?.get("edit");
        const results = await Promise.all([
          api<Cargo[]>("/api/user/cargos"),
          api<User>("/api/auth/me"),
          ...(editId ? [api<Order>(`/api/orders/${editId}`)] : []),
        ]);
        if (!alive) return;
        
        const cargoData = results[0] || [];
        const profile = results[1];
        setCargos(cargoData);
        setDefaultCargoId(profile?.defaultCargoId || "");
        
        // Edit mode - ноорог захиалга ачаалах
        if (editId && results[2] && results[2].status === "DRAFT") {
          const order = results[2];
          setDraftOrderId(order._id);
          setSelectedCargo((typeof order.cargoId === "object" && order.cargoId?._id) || (typeof order.cargoId === "string" ? order.cargoId : "") || "");
          if (order.items && order.items.length > 0) {
            const firstItem = order.items[0];
            setTitle(firstItem.title || "");
            setQuantity(firstItem.quantity || 1);
            setSourceUrl(firstItem.sourceUrl || "");
            setNote(firstItem.userNotes || "");
            setApp((firstItem as { app?: string }).app || "any");
            setImages((firstItem.images || []) as string[]);
          }
          setLoading(false);
          return;
        }
        
        const fromQuery = searchParams?.get("cargo");
        if (fromQuery && cargoData.find((c) => c._id === fromQuery)) {
          setSelectedCargo(fromQuery);
        } else if (profile?.defaultCargoId && cargoData.find((c) => c._id === profile.defaultCargoId)) {
          setSelectedCargo(profile.defaultCargoId);
        } else if (cargoData[0]?._id) {
          setSelectedCargo(cargoData[0]._id);
        }
      } catch (err) {
        if (!alive) return;
        const error = err as Error;
        setError(error.message || "Карго ачаалахад алдаа гарлаа");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [searchParams]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result && typeof reader.result === "string") {
        setImages((prev) => [...prev, reader.result as string]);
      }
    };
    reader.readAsDataURL(file);
    if (e.target) {
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setSuccessId("");
    if (!selectedCargo) {
      setError("Карго сонгоно уу");
      return;
    }
    if (!title.trim()) {
      setError("Барааны нэр оруулна уу");
      return;
    }
    if (!quantity || quantity < 1) {
      setError("Тоо хэмжээ 1-аас дээш байх ёстой");
      return;
    }

    setSubmitting(true);
    try {
      let orderId = draftOrderId;

      // Ноорог байгаа бол шинэчлэх, байхгүй бол үүсгэх
      if (orderId) {
        await api(`/api/orders/${orderId}/draft`, {
          method: "PUT",
          body: {
            cargoId: selectedCargo,
            items: [
              {
                title: title.trim(),
                quantity: Number(quantity),
                sourceUrl: sourceUrl || undefined,
                images,
                userNotes: note || undefined,
                app,
              },
            ],
          },
        });
      } else {
        const created = await api<Order>("/api/orders", {
          method: "POST",
          body: {
            cargoId: selectedCargo,
            isPackage: false,
            items: [
              {
                title: title.trim(),
                quantity: Number(quantity),
                sourceUrl: sourceUrl || undefined,
                images,
                userNotes: note || undefined,
                app,
              },
            ],
          },
        });
        orderId = created._id;
      }

      // Нийтлэх
      await api(`/api/orders/${orderId}/publish`, { method: "POST" });
      
      // сонгосон карго-г default болгох
      if (selectedCargo) {
        await api("/api/user/default-cargo", {
          method: "POST",
          body: { cargoId: selectedCargo },
        });
        setDefaultCargoId(selectedCargo);
      }
      setSuccessId(orderId);
      setTitle("");
      setQuantity(1);
      setSourceUrl("");
      setNote("");
      setApp("any");
      setImages([]);
      setDraftOrderId(null);
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Захиалга үүсгэж чадсангүй");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <main className={`${mainClass} min-h-screen`}>
        <div className={`${widthClass} mx-auto px-4 py-10 space-y-6`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-70">Дан захиалга үүсгэх</p>
            <h1 className="text-2xl font-semibold">Нэг барааны захиалга</h1>
          </div>
          <Link href="/user" className="text-sm opacity-70 hover:text-emerald-600">
            ← Буцах
          </Link>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={`rounded-3xl border px-5 py-5 space-y-4 ${cardClass}`}>
          <div className="space-y-1">
            <label className="text-sm font-medium">Карго (идэвхтэй жагсаалт)</label>
            <select
              value={selectedCargo}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedCargo(e.target.value)}
              className={`w-full rounded-xl border px-3 py-2 text-sm ${inputClass}`}
              disabled={loading || !cargos.length}
            >
              {cargos.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>
                Default: {defaultCargoId ? cargos.find((c) => c._id === defaultCargoId)?.name || "сонгоогүй" : "сонгоогүй"}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!selectedCargo || savingDefault}
                onClick={async () => {
                  if (!selectedCargo) return;
                  setSavingDefault(true);
                  setError("");
                  try {
                    await api("/api/user/default-cargo", {
                      method: "POST",
                      body: { cargoId: selectedCargo },
                    });
                    setDefaultCargoId(selectedCargo);
                  } catch (err) {
                    const error = err as Error;
                    setError(error.message || "Default болгож чадсангүй");
                  } finally {
                    setSavingDefault(false);
                  }
                }}
                className="text-emerald-600 hover:underline disabled:opacity-60"
              >
                {savingDefault ? "Хадгалж..." : "Default болгох"}
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Барааны нэр *</label>
            <input
              type="text"
              value={title}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              className={`w-full rounded-xl border px-3 py-2 text-sm ${inputClass}`}
              placeholder="Жишээ: Nike Air Force 1"
              required
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Тоо хэмжээ *</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setQuantity(Number(e.target.value))}
                className={`w-full rounded-xl border px-3 py-2 text-sm ${inputClass}`}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Платформ</label>
              <select
                value={app}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setApp(e.target.value)}
                className={`w-full rounded-xl border px-3 py-2 text-sm ${inputClass}`}
              >
                {appOptions.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Холбоос (optional)</label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSourceUrl(e.target.value)}
              className={`w-full rounded-xl border px-3 py-2 text-sm ${inputClass}`}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Тэмдэглэл (optional)</label>
            <textarea
              rows={3}
              value={note}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
              className={`w-full rounded-xl border px-3 py-2 text-sm resize-none ${inputClass}`}
              placeholder="Өнгө, хэмжээ, материал гэх мэт"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Зураг (optional)</label>
            <div className="flex flex-wrap gap-3">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="relative h-20 w-20 rounded-xl overflow-hidden border border-slate-300 cursor-zoom-in"
                  onClick={() => setPreviewImage(img)}
                  onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setPreviewImage(img);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label="Зураг томруулах"
                >
                  <img src={img} alt={`preview-${idx}`} className="h-full w-full object-cover" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImages((prev) => prev.filter((_, i) => i !== idx));
                    }}
                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white text-[10px] flex items-center justify-center px-0 py-0"
                    aria-label="Remove image"
                  >
                    ✕
                  </Button>
                </div>
              ))}
              <label className="h-20 w-20 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-500 cursor-pointer hover:border-emerald-400">
                <span className="text-lg">＋</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
            <p className="text-xs text-slate-500">Зураг оруулбал агент талд илүү ойлгомжтой.</p>
          </div>

          <Button type="submit" disabled={loading || submitting} fullWidth size="lg">
            {submitting ? "Илгээж байна..." : "Захиалга илгээх"}
          </Button>
        </form>

        {successId && (
          <div className={`rounded-2xl border px-4 py-4 ${cardClass}`}>
            <p className="text-sm text-emerald-700">
              Захиалга амжилттай илгээгдлээ. ID: {successId}
            </p>
            <div className="mt-2 flex gap-3 text-sm">
              <Link href={`/user/requests/${successId}`} className="text-emerald-600 hover:underline">
                Дэлгэрэнгүй харах
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-slate-600 hover:underline px-0"
                onClick={() => {
                  setSuccessId("");
                  router.push("/user/requests");
                }}
              >
                Жагсаалт руу буцах
              </Button>
            </div>
          </div>
        )}
        </div>
      </main>
      <ImageLightbox src={previewImage} alt="Захиалгын зураг" onClose={() => setPreviewImage("")} />
    </>
  );
}

export default function SingleOrderPage(): React.JSX.Element {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Ачааллаж байна...</div>}>
      <SingleOrderForm />
    </Suspense>
  );
}

