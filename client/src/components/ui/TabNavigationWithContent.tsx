import { AnimatePresence, motion } from "framer-motion";
import { ReactNode, useId } from "react";
import useTabs from "@/hooks/useTabs";
import { cn } from "@/lib/cn";

interface TabProps {
  tabs: { id: string; label: string }[];
  tabComponents: { [key: string]: ReactNode };
}

const TabNavigationWithContent: React.FC<TabProps> = ({ tabs, tabComponents }) => {
  const { activeTab, setActiveTab } = useTabs(tabs[0].id, tabs);
  const instanceId = useId();

  return (
    <div>
      <div className="mb-8 border-b border-console-border">
        <nav className="flex flex-wrap gap-6">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative py-4 px-1 text-sm font-medium transition-colors duration-200",
                  isActive ? "text-brand-800" : "text-console-muted hover:text-console-text",
                )}
              >
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId={`tab-nav-underline-${instanceId}`}
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-brand-700"
                    initial={false}
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {tabComponents[activeTab] || <div>No content available</div>}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default TabNavigationWithContent;
