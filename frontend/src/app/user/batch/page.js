"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useUI } from "@/app/layout";
import { api } from "@/lib/api";
import Button from "@/components/ui/Button";
import ImageLightbox from "@/components/ImageLightbox";

const emptyItem = () => ({
  title: "",
  quantity: 1,
  app: "any",
  userNotes: "",
  sourceUrl: "",
  images: [],
});

function BatchOrderForm() {
  const { theme, view } = useUI();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [cargos, setCargos] = useState([]);
  const [selectedCargo, setSelectedCargo] = useState("");
  const [defaultCargoId, setDefaultCargoId] = useState("");
  const [items, setItems] = useState([emptyItem()]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState("");
  const [savingDefault, setSavingDefault] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

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

  const inputClass =
    theme === "night"
      ? "bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-400"
      : theme === "mid"
        ? "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400"
        : "bg-white border-slate-300 text-slate-900 placeholder-slate-400";

  const widthClass =
    view === "mobile"
      ? "max-w-md"
      : view === "tablet"
        ? "max-w-3xl"
        : "max-w-4xl";

  const appOptions = useMemo(
    () => [
      { value: "any", label: "Бүх платформ" },
      { value: "taobao", label: "Taobao" },
      { value: "pinduoduo", label: "Pinduoduo" },
      { value: "1688", label: "1688 / Alibaba" },
      { value: "dewu", label: "Dewu (Poizon)" },
    ],
    []
  );

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [cargoData, profile] = await Promise.all([api("/api/user/cargos"), api("/api/auth/me")]);
        if (!alive) return;
        setCargos(cargoData);
        setDefaultCargoId(profile?.defaultCargoId || "");
        const fromQuery = searchParams.get("cargo");
        if (fromQuery && cargoData.find((c) => c._id === fromQuery)) {
          setSelectedCargo(fromQuery);
        } else if (profile?.defaultCargoId && cargoData.find((c) => c._id === profile.defaultCargoId)) {
          setSelectedCargo(profile.defaultCargoId);
        } else if (cargoData[0]?._id) {
          setSelectedCargo(cargoData[0]._id);
        }
      } catch (err) {
        if (!alive) return;
        setError(err.message || "Карго ачаалахад алдаа гарлаа");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [searchParams]);

  const updateItem = (idx, patch) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const addImage = (idx, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setItems((prev) =>
        prev.map((it, i) =>
          i === idx ? { ...it, images: [...(it.images || []), reader.result] } : it
        )
      );
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (idx, e) => {
    const file = e.target.files?.[0];
    if (file) addImage(idx, file);
    e.target.value = "";
  };

  const addItem = () => {
    setItems((prev) => [...prev, emptyItem()]);
    setCurrentIndex(items.length);
  };

  const removeItem = (idx) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
    setCurrentIndex(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessId("");
    if (!selectedCargo) {
      setError("Карго сонгоно уу");
      return;
    }
    if (!items.every((it) => it.title.trim() && it.quantity > 0)) {
      setError("Бүх мөрөнд нэр/тоо оруулна уу");
      return;
    }
    setSubmitting(true);
    try {
      const payloadItems = items.map((it) => ({
        title: it.title.trim(),
        quantity: Number(it.quantity),
        app: it.app,
        userNotes: it.userNotes || undefined,
        sourceUrl: it.sourceUrl || undefined,
        images: it.images,
      }));
      const created = await api("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          cargoId: selectedCargo,
          isPackage: true,
          items: payloadItems,
        }),
      });
      await api(`/api/orders/${created._id}/publish`, { method: "POST" });
      if (selectedCargo) {
        await api("/api/user/default-cargo", {
          method: "POST",
          body: JSON.stringify({ cargoId: selectedCargo }),
        });
        setDefaultCargoId(selectedCargo);
      }
      setSuccessId(created._id);
      setItems([emptyItem()]);
      setCurrentIndex(0);
    } catch (err) {
      setError(err.message || "Захиалга үүсгэж чадсангүй");
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
            <p className="text-xs opacity-70">Багц захиалга</p>
            <h1 className="text-2xl font-semibold">Олон барааны захиалга</h1>
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
            <label className="text-sm font-medium">Карго</label>
            <select
              value={selectedCargo}
              onChange={(e) => setSelectedCargo(e.target.value)}
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
                      body: JSON.stringify({ cargoId: selectedCargo }),
                    });
                    setDefaultCargoId(selectedCargo);
                  } catch (err) {
                    setError(err.message || "Default болгож чадсангүй");
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

          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold">Барааны жагсаалт</p>
              <p className="text-xs text-slate-500">Доорх картаар мөрөө сонгон засна.</p>
            </div>
            <Button type="button" onClick={addItem} size="sm">
              + Мөр нэмэх
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-[1.4fr,1fr]">
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl border px-4 py-4 ${currentIndex === idx ? "border-emerald-300" : "border-slate-200"}`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">#{idx + 1}</h3>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="ghost" size="sm" className="text-emerald-600 hover:underline px-0" onClick={() => setCurrentIndex(idx)}>
                        Засах
                      </Button>
                      {items.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" className="text-rose-600 hover:underline px-0" onClick={() => removeItem(idx)}>
                          Устгах
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 truncate">
                    {item.title || "Барааны нэр оруулаагүй"} • {item.quantity} ширхэг
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4 space-y-3">
              <p className="text-sm font-semibold text-slate-900">Сонгосон мөр: #{currentIndex + 1}</p>
              <div className="space-y-1">
                <label className="text-xs font-medium">Барааны нэр</label>
                <input
                  type="text"
                  value={items[currentIndex]?.title || ""}
                  onChange={(e) => updateItem(currentIndex, { title: e.target.value })}
                  className={`w-full rounded-xl border px-3 py-2 text-sm ${inputClass}`}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Тоо хэмжээ</label>
                  <input
                    type="number"
                    min={1}
                    value={items[currentIndex]?.quantity || 1}
                    onChange={(e) => updateItem(currentIndex, { quantity: Number(e.target.value) })}
                    className={`w-full rounded-xl border px-3 py-2 text-sm ${inputClass}`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Платформ</label>
                  <select
                    value={items[currentIndex]?.app || "any"}
                    onChange={(e) => updateItem(currentIndex, { app: e.target.value })}
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
                <label className="text-xs font-medium">Холбоос (optional)</label>
                <input
                  type="url"
                  value={items[currentIndex]?.sourceUrl || ""}
                  onChange={(e) => updateItem(currentIndex, { sourceUrl: e.target.value })}
                  className={`w-full rounded-xl border px-3 py-2 text-sm ${inputClass}`}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Тэмдэглэл</label>
                <textarea
                  rows={3}
                  value={items[currentIndex]?.userNotes || ""}
                  onChange={(e) => updateItem(currentIndex, { userNotes: e.target.value })}
                  className={`w-full rounded-xl border px-3 py-2 text-sm resize-none ${inputClass}`}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Зураг</label>
                <div className="flex flex-wrap gap-3">
                  {(items[currentIndex]?.images || []).map((img, imgIdx) => (
                    <div
                      key={imgIdx}
                      className="relative h-16 w-16 rounded-xl overflow-hidden border border-slate-300 cursor-zoom-in"
                      onClick={() => setPreviewImage(img)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setPreviewImage(img);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label="Зураг томруулах"
                    >
                      <img src={img} alt={`item-${currentIndex}-${imgIdx}`} className="h-full w-full object-cover" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-1 right-1 h-4 w-4 rounded-full bg-black/60 text-white text-[10px] flex items-center justify-center px-0 py-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateItem(currentIndex, {
                            images: (items[currentIndex].images || []).filter((_, ii) => ii !== imgIdx),
                          });
                        }}
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                  <label className="h-16 w-16 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-500 cursor-pointer hover:border-emerald-400">
                    <span className="text-lg">＋</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(currentIndex, e)}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <Button type="submit" disabled={submitting} fullWidth size="lg">
            {submitting ? "Илгээж байна..." : "Багц захиалга илгээх"}
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
      <ImageLightbox src={previewImage} alt="Багцын зураг" onClose={() => setPreviewImage("")} />
    </>
  );
}

export default function BatchOrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Ачааллаж байна...</div>}>
      <BatchOrderForm />
    </Suspense>
  );
}
