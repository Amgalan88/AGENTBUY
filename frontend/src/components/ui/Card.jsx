"use client";

// Reusable Card component
export function Card({ 
  children, 
  className = "", 
  elevated = false,
  interactive = false,
  padding = "md",
  ...props 
}) {
  const paddingSizes = {
    sm: "p-3",
    md: "p-5",
    lg: "p-6",
  };

  return (
    <div 
      className={`
        ${elevated ? "surface-card-elevated" : "surface-card"} 
        rounded-2xl 
        ${paddingSizes[padding] || paddingSizes.md}
        ${interactive ? "card-interactive" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

// Stats Card
export function StatsCard({ label, value, icon, trend }) {
  return (
    <Card className="text-center">
      {icon && <div className="text-2xl mb-2">{icon}</div>}
      <p className="text-2xl font-bold text-[var(--accent-primary)]">{value}</p>
      <p className="text-sm text-muted">{label}</p>
      {trend && (
        <p className={`text-xs mt-1 ${trend > 0 ? "text-[var(--accent-primary)]" : "text-[var(--accent-danger)]"}`}>
          {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
        </p>
      )}
    </Card>
  );
}

// Empty State
export function EmptyState({ 
  icon = "📭", 
  title = "Мэдээлэл олдсонгүй", 
  description,
  action 
}) {
  return (
    <div className="empty-state py-12">
      <p className="text-4xl mb-4">{icon}</p>
      <p className="font-medium text-lg">{title}</p>
      {description && <p className="text-sm text-muted mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Loading Skeleton
export function Skeleton({ className = "", variant = "rect" }) {
  const variants = {
    rect: "h-20 rounded-xl",
    circle: "h-12 w-12 rounded-full",
    text: "h-4 rounded",
    card: "h-40 rounded-2xl",
  };

  return <div className={`skeleton ${variants[variant] || variants.rect} ${className}`} />;
}

// Badge / Chip
export function Badge({ 
  children, 
  variant = "default",
  size = "sm",
  className = "" 
}) {
  const variants = {
    default: "chip",
    success: "chip-success",
    warning: "chip-warning",
    danger: "chip-danger",
    info: "chip-info",
    active: "chip-active",
  };

  const sizes = {
    xs: "px-1.5 py-0.5 text-[10px]",
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}

// Divider
export function Divider({ className = "" }) {
  return <div className={`divider ${className}`} />;
}

// Avatar
export function Avatar({ src, name, size = "md", className = "" }) {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
  };

  const initials = name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`${sizes[size]} rounded-full overflow-hidden surface-muted flex items-center justify-center font-semibold ${className}`}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span>{initials || "?"}</span>
      )}
    </div>
  );
}
