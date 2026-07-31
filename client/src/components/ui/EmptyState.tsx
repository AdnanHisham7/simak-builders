import { Inbox, LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center rounded-console border border-dashed border-console-border bg-console-surface px-6 py-14 text-center",
      className,
    )}
  >
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-console-bg text-console-muted">
      <Icon className="h-5 w-5" />
    </div>
    <h3 className="mt-4 text-sm font-semibold text-console-text">{title}</h3>
    {description && (
      <p className="mt-1.5 max-w-sm text-sm text-console-muted">{description}</p>
    )}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;
