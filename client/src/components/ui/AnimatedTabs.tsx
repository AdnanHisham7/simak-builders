import { useId, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

type AnimatedTabsProps = {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
};

const AnimatedTabs: React.FC<AnimatedTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceId = useId();

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex gap-1 rounded-xl border border-console-border bg-console-bg/70 p-1 backdrop-blur-sm",
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={cn(
              "relative z-10 flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors duration-200",
              isActive ? "text-white" : "text-console-muted hover:text-console-text",
            )}
          >
            {isActive && (
              <motion.span
                layoutId={`animated-tabs-slider-${instanceId}`}
                className="absolute inset-0 -z-10 rounded-lg bg-brand-700 shadow-console"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            {tab}
          </button>
        );
      })}
    </div>
  );
};

export default AnimatedTabs;
