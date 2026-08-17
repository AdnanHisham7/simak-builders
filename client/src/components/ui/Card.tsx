import { LucideIcon } from "lucide-react";
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

type TrendDirection = "up" | "down" | "neutral";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  trend?: {
    direction: TrendDirection;
    value: string;
    label?: string;
  };
  className?: string;
}

const trendColor: Record<TrendDirection, string> = {
  up: "text-success-600",
  down: "text-danger-600",
  neutral: "text-console-muted",
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  trend,
  className,
}) => (
  <div
    className={cn(
      "rounded-glass border border-console-border bg-console-surface p-5 shadow-console",
      className,
    )}
  >
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium uppercase tracking-wide text-console-muted">
        {label}
      </span>
      {Icon && (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Icon className="h-4 w-4" />
        </div>
      )}
    </div>
    <div className="mt-3 text-2xl font-semibold text-console-text">{value}</div>
    {trend && (
      <div className={cn("mt-2 flex items-center gap-1 text-xs font-medium", trendColor[trend.direction])}>
        <span>{trend.value}</span>
        {trend.label && <span className="text-console-muted">{trend.label}</span>}
      </div>
    )}
  </div>
);

export default Card;