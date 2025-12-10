"use client";

import Image from "next/image";
import Link from "next/link";

const PLATFORM_ICONS: Record<string, string> = {
  taobao: "/marketplace/taobao.png",
  pinduoduo: "/marketplace/pinduoudo.png",
  "1688": "/marketplace/1688.jpg",
  dewu: "/marketplace/poizon.png",
  any: "/marketplace/taobao.png",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-100 border-amber-400/60",
  researching: "bg-sky-500/15 text-sky-100 border-sky-400/60",
  completed: "bg-emerald-500/20 text-emerald-100 border-emerald-400/70",
  cancelled: "bg-rose-500/15 text-rose-100 border-rose-400/60",
  default: "bg-slate-500/15 text-slate-100 border-slate-400/60",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Шинэ",
  researching: "Судалгаанд",
  completed: "Төлөгдсөн",
  cancelled: "Цуцлагдсан",
};

const THEME = {
  bg: "from-slate-900 via-slate-850 to-slate-950",
  ring: "border-slate-500/30",
  glow: "shadow-[0_28px_90px_rgba(16,24,40,0.55)]",
};

interface SampleItem {
  title: string;
  quantity: number;
  image?: string;
}

interface Sample {
  platform: string;
  orderId: string;
  createdAt: string;
  cargoName: string;
  items: SampleItem[];
  totalPrice: string;
  status: string;
}

const SAMPLE: Sample = {
  platform: "taobao",
  orderId: "ABY-2402-0193",
  createdAt: "2024-04-24 12:30",
  cargoName: "Darkhan Cargo",
  items: [
    { title: "Spaghetti", quantity: 1, image: "/marketplace/taobao.png" },
    { title: "Salad", quantity: 2, image: "/marketplace/poizon.png" },
    { title: "Grilled Meat", quantity: 1, image: "/marketplace/1688.jpg" },
    { title: "Juice", quantity: 3 },
  ],
  totalPrice: "",
  status: "completed",
};

export default function CardDesignPage(): React.JSX.Element {
  const platformIcon = PLATFORM_ICONS[SAMPLE.platform] || PLATFORM_ICONS.any;
  const statusCls = STATUS_STYLE[SAMPLE.status] || STATUS_STYLE.default;
  const statusText = STATUS_LABEL[SAMPLE.status] || SAMPLE.status;

  const itemsTextArr = SAMPLE.items.slice(0, 3).map((it) => `${it.title} × ${it.quantity}`);
  const itemsText = itemsTextArr.join(" • ") + (SAMPLE.items.length > 3 ? " • ..." : "");

  const gallery = SAMPLE.items
    .map((it) => it.image)
    .filter((img): img is string => Boolean(img))
    .slice(0, 3);

  return (
    <main className="min-h-screen w-full bg-slate-950 flex items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-md">
        <div
          className={`
            rounded-3xl border ${THEME.ring}
            bg-gradient-to-br ${THEME.bg}
            text-white p-6 ${THEME.glow}
            overflow-hidden backdrop-blur
          `}
        >
          <div className="flex flex-col items-start justify-between gap-4 mb-5">
            <div className="flex items-between gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white/95 overflow-hidden shadow-xl flex items-center justify-center">
                <Image
                  src={platformIcon}
                  alt="Platform icon"
                  width={40}
                  height={40}
                  className="object-contain p-2"
                />
              </div>

              <div className="leading-tight">
                <p className="text-[10px] tracking-[0.3em] uppercase text-slate-300">AgentBuy</p>
                <p className="text-sm font-semibold text-white">Order Card</p>
              </div>
              <div className="mt-4 text-[11px] text-slate-300">
                Захиалга дугаар: <span className="font-mono">{SAMPLE.orderId}</span>
              </div>
            </div>

            <div className="flex -space-x-3">
              {gallery.length === 0 ? (
                <div className="h-20 w-24 rounded-xl bg-slate-800 border border-slate-600/70 shadow-inner flex items-center justify-center text-slate-300">
                  No Img
                </div>
              ) : (
                gallery.map((img, idx) => (
                  <div
                    key={idx}
                    className="h-20 w-24 rounded-xl bg-slate-800 overflow-hidden border border-slate-600/70 shadow-inner"
                    style={{ zIndex: 10 - idx }}
                  >
                    <Image
                      src={img}
                      alt={`product-${idx}`}
                      width={96}
                      height={80}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="text-xs text-slate-200 space-y-2 mt-1">
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span>{SAMPLE.createdAt}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🛒</span>
              <span className="line-clamp-2">{itemsText}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🚚</span>
              <span className="line-clamp-1">{SAMPLE.cargoName}</span>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <p className="text-3xl font-semibold">
              {SAMPLE.totalPrice || "Үнийн санал ирэхийг хүлээж байна"}
            </p>
            <span
              className={`rounded-full border px-3 py-1 text-[12px] font-semibold ${statusCls}`}
            >
              {statusText}
            </span>
          </div>

          <div className="mt-5">
            <Link
              href="#"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 border border-white/20"
            >
              Дэлгэрэнгүй харах
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

