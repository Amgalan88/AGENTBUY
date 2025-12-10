"use client";

import { ReactNode, HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  elevated?: boolean;
  interactive?: boolean;
  padding?: "sm" | "md" | "lg";
}

// Reusable Card component
export function Card({ 
  children, 
  className = "", 
  elevated = false,
  interactive = false,
  padding = "md",
  ...props 
}: CardProps): React.JSX.Element {
  const paddingSizes: Record<string, string> = {
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

interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: number;
}

// Stats Card
export function StatsCard({ label, value, icon, trend }: StatsCardProps): React.JSX.Element {
  return (
    <Card className="text-center">
      {icon && <div className="text-2xl mb-2">{icon}</div>}
      <p className="text-2xl font-bold text-[var(--accent-primary)]">{value}</p>
      <p className="text-sm text-muted">{label}</p>
      {trend !== undefined && (
        <p className={`text-xs mt-1 ${trend > 0 ? "text-[var(--accent-primary)]" : "text-[var(--accent-danger)]"}`}>
          {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
        </p>
      )}
    </Card>
  );
}

interface EmptyStateProps {
  icon?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
}

// Empty State
export function EmptyState({ 
  icon = "📭", 
  title = "Мэдээлэл олдсонгүй", 
  description,
  action 
}: EmptyStateProps): React.JSX.Element {
  return (
    <div className="empty-state py-12">
      <p className="text-4xl mb-4">{icon}</p>
      <p className="font-medium text-lg">{title}</p>
      {description && <p className="text-sm text-muted mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  variant?: "rect" | "circle" | "text" | "card";
}

// Loading Skeleton
export function Skeleton({ className = "", variant = "rect" }: SkeletonProps): React.JSX.Element {
  const variants: Record<string, string> = {
    rect: "h-20 rounded-xl",
    circle: "h-12 w-12 rounded-full",
    text: "h-4 rounded",
    card: "h-40 rounded-2xl",
  };

  return <div className={`skeleton ${variants[variant] || variants.rect} ${className}`} />;
}

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "active";
  size?: "xs" | "sm" | "md";
  className?: string;
}

// Badge / Chip
export function Badge({ 
  children, 
  variant = "default",
  size = "sm",
  className = "" 
}: BadgeProps): React.JSX.Element {
  const variants: Record<string, string> = {
    default: "chip",
    success: "chip-success",
    warning: "chip-warning",
    danger: "chip-danger",
    info: "chip-info",
    active: "chip-active",
  };

  const sizes: Record<string, string> = {
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

interface DividerProps {
  className?: string;
}

// Divider
export function Divider({ className = "" }: DividerProps): React.JSX.Element {
  return <div className={`divider ${className}`} />;
}

interface AvatarProps {
  src?: string;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

// Avatar
export function Avatar({ src, name, size = "md", className = "" }: AvatarProps): React.JSX.Element {
  const sizes: Record<string, string> = {
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
        <img src={src} alt={name || "Avatar"} className="w-full h-full object-cover" />
      ) : (
        <span>{initials || "?"}</span>
      )}
    </div>
  );
}

