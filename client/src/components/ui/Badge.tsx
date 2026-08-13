import { cn } from "@/lib/cn";

type BadgeVariant = "success" | "error" | "warning" | "info" | "default" | "neutral";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-brand-50 text-brand-700",
  neutral: "bg-slate-100 text-slate-700",
  success: "bg-success-50 text-success-700",
  error: "bg-danger-50 text-danger-700",
  warning: "bg-warning-50 text-warning-700",
  info: "bg-info-50 text-info-700",
};

const Badge: React.FC<BadgeProps> = ({ children, className, variant = "default" }) => {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
};

export default Badge;
