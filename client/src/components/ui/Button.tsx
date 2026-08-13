import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "pill-primary"
  | "pill-outline";

type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
  onMouseEnter?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseLeave?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLButtonElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-700 text-white hover:bg-brand-800 focus-visible:ring-brand-500 rounded-lg",
  secondary:
    "bg-console-bg text-console-text border border-console-border hover:bg-slate-100 focus-visible:ring-slate-400 rounded-lg",
  outline:
    "bg-white border border-brand-600 text-brand-700 hover:bg-brand-50 focus-visible:ring-brand-500 rounded-lg",
  ghost:
    "bg-transparent text-console-text hover:bg-console-bg focus-visible:ring-slate-400 rounded-lg",
  danger:
    "bg-danger-600 text-white hover:bg-danger-700 focus-visible:ring-danger-500 rounded-lg",
  "pill-primary": "bg-brand-700 text-white hover:bg-brand-800 focus-visible:ring-brand-500 rounded-full",
  "pill-outline":
    "bg-white border border-brand-600 text-brand-700 hover:bg-brand-50 focus-visible:ring-brand-500 rounded-full",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "text-xs font-medium px-3 py-1.5",
  md: "text-sm font-medium px-4 py-2",
  lg: "text-sm font-semibold px-5 py-2.5",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    onClick,
    onKeyDown,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    type = "button",
    children,
    className = "",
    loading = false,
    disabled = false,
    variant = "primary",
    size = "md",
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {loading ? "Loading..." : children}
    </button>
  );
});

export default Button;
