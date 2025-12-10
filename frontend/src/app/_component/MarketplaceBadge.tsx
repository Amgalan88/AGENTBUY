"use client";

import Image from "next/image";

interface MarketplaceBadgeProps {
  name: string;
  icon: string;
}

export default function MarketplaceBadge({ name, icon }: MarketplaceBadgeProps): React.JSX.Element {
  return (
    <div className="surface-card rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col items-center gap-2 sm:gap-3 card-interactive">
      <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl overflow-hidden bg-white shadow-sm relative">
        <Image
          src={icon}
          alt={name}
          fill
          sizes="(max-width: 640px) 40px, 56px"
          className="object-contain p-0.5 sm:p-1"
          loading="lazy"
        />
      </div>
      <span className="text-xs sm:text-sm font-medium text-[var(--text-primary)] text-center">{name}</span>
    </div>
  );
}

