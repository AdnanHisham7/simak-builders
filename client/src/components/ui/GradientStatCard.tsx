import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedCounter from "./AnimatedCounter";
import { cn } from "@/lib/cn";

type GradientTone = "dark" | "success" | "danger";

interface GradientStatCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  locale?: string;
  loading?: boolean;
  helperText?: string;
  icon?: LucideIcon;
  tone?: GradientTone;
  action?: {
    label: string;
    onClick: (event: React.MouseEvent) => void;
  };
  onClick?: () => void;
  className?: string;
}

const toneClass: Record<GradientTone, string> = {
  dark: "glass-dark-card",
  success: "glass-success-card",
  danger: "glass-danger-card",
};

const toneIconClass: Record<GradientTone, string> = {
  dark: "text-brand-200",
  success: "text-success-100",
  danger: "text-danger-100",
};

const GradientStatCard: React.FC<GradientStatCardProps> = ({
  label,
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  locale,
  loading = false,
  helperText,
  icon: Icon,
  tone = "dark",
  action,
  onClick,
  className,
}) => {
  const Wrapper = onClick ? motion.button : motion.div;

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      whileHover={{ y: -3 }}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        toneClass[tone],
        "group relative flex w-full flex-col justify-between rounded-glass p-5 text-left shadow-glass-dark sm:p-6",
        onClick && "cursor-pointer",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-white/55">{label}</p>
          <div className="mt-2 text-[26px] font-semibold leading-none text-white sm:text-3xl">
            {loading ? (
              <span
                className="inline-block h-7 w-24 animate-pulse rounded-md bg-white/20 sm:h-8 sm:w-28"
                aria-hidden="true"
              />
            ) : (
              <AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={decimals} locale={locale} />
            )}
          </div>
          {helperText && <p className="mt-2 text-xs text-white/50">{helperText}</p>}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur-sm transition-transform duration-300 group-hover:scale-105",
              toneIconClass[tone],
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      {action && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            action.onClick(e);
          }}
          className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm transition-colors hover:bg-white/20"
        >
          {action.label}
        </button>
      )}
    </Wrapper>
  );
};

export default GradientStatCard;
