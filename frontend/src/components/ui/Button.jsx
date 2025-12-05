"use client";

const baseStyles =
  "inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-card)] disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

const variantStyles = {
  primary:
    "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-color)] hover:bg-[var(--btn-primary-bg-hover)] focus-visible:ring-[var(--btn-primary-bg)] shadow-sm hover:shadow-md",
  secondary:
    "bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-color)] hover:bg-[var(--btn-secondary-bg-hover)] focus-visible:ring-[var(--btn-secondary-bg)] shadow-sm hover:shadow-md",
  outline:
    "border border-[var(--btn-outline-border)] text-[var(--btn-outline-color)] hover:bg-[var(--surface-muted)] hover:border-[var(--accent-primary)] focus-visible:ring-[var(--accent-primary)]",
  ghost: 
    "text-[var(--btn-ghost-color)] hover:text-[var(--accent-primary)] hover:bg-[var(--surface-muted)] focus-visible:ring-transparent",
  danger:
    "bg-[var(--btn-danger-bg)] text-white hover:bg-[var(--btn-danger-bg-hover)] focus-visible:ring-[var(--btn-danger-bg)] shadow-sm hover:shadow-md",
  muted: 
    "bg-[var(--surface-muted)] text-[var(--text-muted)] cursor-not-allowed",
  success:
    "bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)] focus-visible:ring-[var(--accent-primary)] shadow-sm hover:shadow-md",
  link:
    "text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] underline-offset-4 hover:underline p-0",
};

// Responsive sizes
const sizeStyles = {
  xs: "px-2 py-1 text-[10px] sm:px-2.5 sm:py-1 sm:text-xs min-h-[28px] sm:min-h-[32px]",
  sm: "px-2.5 py-1.5 text-xs sm:px-3 sm:py-1.5 sm:text-sm min-h-[32px] sm:min-h-[36px]",
  md: "px-3.5 py-2 text-sm sm:px-4 sm:py-2.5 sm:text-sm min-h-[40px] sm:min-h-[44px]",
  lg: "px-5 py-2.5 text-sm sm:px-6 sm:py-3 sm:text-base min-h-[44px] sm:min-h-[48px]",
  xl: "px-6 py-3 text-base sm:px-8 sm:py-4 sm:text-lg min-h-[48px] sm:min-h-[56px]",
};

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Button({ 
  variant = "primary", 
  size = "md", 
  fullWidth = false, 
  className = "", 
  loading = false,
  icon = null,
  iconPosition = "left",
  children, 
  ...props 
}) {
  return (
    <button
      className={cn(
        baseStyles, 
        variantStyles[variant] || variantStyles.primary, 
        sizeStyles[size] || sizeStyles.md, 
        fullWidth && "w-full", 
        className
      )}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span className="hidden sm:inline">Түр хүлээнэ үү...</span>
          <span className="sm:hidden">Хүлээнэ...</span>
        </>
      ) : (
        <>
          {icon && iconPosition === "left" && <span className="text-sm sm:text-base">{icon}</span>}
          {children}
          {icon && iconPosition === "right" && <span className="text-sm sm:text-base">{icon}</span>}
        </>
      )}
    </button>
  );
}
