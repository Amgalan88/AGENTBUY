import Link from "next/link";
import Button from "@/components/ui/Button";

export default function RoleCard({ title, desc, href, accent = "primary", icon = "📦" }) {
  return (
    <div className="surface-card rounded-2xl sm:rounded-3xl card-padding card-interactive">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl surface-muted flex items-center justify-center text-xl sm:text-2xl shrink-0">
          {icon}
        </div>
        <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
          <h2 className="text-card-title">{title}</h2>
          <p className="text-xs sm:text-sm text-secondary line-clamp-2">{desc}</p>
        </div>
      </div>

      <Link href={href} className="mt-4 sm:mt-5 block">
        <Button fullWidth size="lg" variant={accent} className="touch-target">
          Нэвтрэх / Бүртгүүлэх
        </Button>
      </Link>
    </div>
  );
}
