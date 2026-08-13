import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

interface PageLoaderProps {
  label?: string;
  fullHeight?: boolean;
  className?: string;
}

const PageLoader: React.FC<PageLoaderProps> = ({
  label = "Loading",
  fullHeight = true,
  className,
}) => (
  <div
    className={cn(
      "flex w-full flex-col items-center justify-center gap-3 text-console-muted",
      fullHeight ? "min-h-[320px]" : "py-10",
      className,
    )}
    role="status"
    aria-live="polite"
  >
    <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
    <span className="text-sm font-medium">{label}</span>
  </div>
);

export const InlineSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <Loader2 className={cn("h-4 w-4 animate-spin", className)} />
);

export default PageLoader;
