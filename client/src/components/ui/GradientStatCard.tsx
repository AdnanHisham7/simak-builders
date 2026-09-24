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
    isToggle?: boolean;
    active?: boolean;
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

const toneActiveTextClass: Record<GradientTone, string> = {
  dark: "text-brand-950",
  success: "text-success-950",
  danger: "text-danger-950",
};

const toneActiveTrackClass: Record<GradientTone, string> = {
  dark: "bg-brand-600",
  success: "bg-success-600",
  danger: "bg-danger-600",
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

      {action &&
        (action.isToggle ? (
          <button
            type="button"
            role="switch"
            aria-checked={action.active}
            onClick={(e) => {
              e.stopPropagation();
              action.onClick(e);
            }}
            className={cn(
              "mt-5 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition-all duration-200 select-none",
              action.active
                ? cn("bg-white font-semibold shadow-md ring-1 ring-white/70 hover:bg-white/95", toneActiveTextClass[tone])
                : "bg-white/15 text-white/90 hover:bg-white/20"
            )}
          >
            <span>{action.label}</span>
            <span
              className={cn(
                "relative inline-flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out",
                action.active ? toneActiveTrackClass[tone] : "bg-black/30"
              )}
            >
              <span
                className={cn(
                  "inline-block h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out",
                  action.active ? "translate-x-3" : "translate-x-0"
                )}
              />
            </span>
          </button>
        ) : (
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
        ))}
    </Wrapper>
  );
};

export default GradientStatCard;
