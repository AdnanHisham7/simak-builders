import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/cn";

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  id?: string;
}> = ({ children, className, title, description, action, id }) => (
  <div
    id={id}
    className={cn(
      "rounded-glass border border-console-border bg-console-surface shadow-console",
      className,
    )}
  >
    {(title || action) && (
      <div className="flex items-start justify-between gap-3 border-b border-console-border px-5 py-4">
        <div>
          {title && <h3 className="text-sm font-semibold text-console-text">{title}</h3>}
          {description && <p className="mt-0.5 text-xs text-console-muted">{description}</p>}
        </div>
        {action}
      </div>
    )}
    <div className="p-5">{children}</div>
  </div>
);

export type TrendDirection = "up" | "down" | "neutral";
export type StatTone = "info" | "success" | "warning" | "danger" | "default";

export interface StatCardProps {
  label?: string;
  title?: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  change?: string;
  subtitle?: string;
  tone?: StatTone;
  trend?:
    | TrendDirection
    | {
        direction: TrendDirection;
        value: string;
        label?: string;
      };
  className?: string;
}

const toneIconStyles: Record<StatTone, string> = {
  info: "bg-blue-50 text-blue-600",
  success: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
  danger: "bg-rose-50 text-rose-600",
  default: "bg-brand-50 text-brand-600",
};

const toneTextStyles: Record<StatTone, string> = {
  info: "text-blue-600",
  success: "text-emerald-600",
  warning: "text-amber-600",
  danger: "text-rose-600",
  default: "text-console-muted",
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  title,
  value,
  icon: Icon,
  change,
  subtitle,
  tone = "default",
  trend,
  className,
}) => {
  const displayLabel = label || title;
  const isTrendObject = typeof trend === "object" && trend !== null;
  const trendDirection: TrendDirection | undefined = isTrendObject
    ? trend.direction
    : typeof trend === "string"
      ? trend
      : undefined;

  const subtext =
    (isTrendObject ? trend.value : undefined) || subtitle || change;

  let subtextColor = toneTextStyles[tone] || toneTextStyles.default;
  let TrendIcon: LucideIcon | null = null;

  if (trendDirection === "up") {
    subtextColor = "text-emerald-600";
    TrendIcon = TrendingUp;
  } else if (trendDirection === "down") {
    subtextColor = "text-rose-600";
    TrendIcon = TrendingDown;
  } else if (trendDirection === "neutral") {
    subtextColor = "text-console-muted";
  }

  const iconContainerClass = toneIconStyles[tone] || "bg-brand-50 text-brand-600";

  return (
    <div
      className={cn(
        "rounded-glass border border-console-border bg-console-surface p-5 shadow-console",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-console-muted">
          {displayLabel}
        </span>
        {Icon && (
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              iconContainerClass,
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="mt-3 text-2xl font-semibold text-console-text">{value}</div>
      {subtext && (
        <div className={cn("mt-2 flex items-center gap-1.5 text-xs font-medium", subtextColor)}>
          {TrendIcon && <TrendIcon className="h-3.5 w-3.5 shrink-0" />}
          <span>{subtext}</span>
          {isTrendObject && trend.label && (
            <span className="text-console-muted font-normal">{trend.label}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default Card;