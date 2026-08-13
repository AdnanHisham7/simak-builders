import { forwardRef } from "react";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import Tooltip from "@/components/ui/Tooltip";

interface SidebarItemProps {
  icon: LucideIcon;
  name: string;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
  badge?: number;
  layoutId: string;
}

const SidebarItemButton = forwardRef<HTMLButtonElement, SidebarItemProps>(function SidebarItemButton(
  { icon: Icon, name, active, collapsed, onClick, badge, layoutId },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={cn(
        "group relative mx-2 my-0.5 flex w-[calc(100%-1rem)] items-center rounded-lg py-2 text-sm transition-colors duration-200",
        collapsed ? "justify-center px-2" : "px-3",
        active ? "font-medium text-brand-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      )}
    >
      {active && (
        <motion.span
          layoutId={layoutId}
          className="absolute inset-0 rounded-lg bg-brand-50"
          transition={{ type: "spring", stiffness: 420, damping: 36 }}
        />
      )}
      {active && (
        <span className="absolute left-0 top-1/2 z-10 h-4/5 w-0.5 -translate-y-1/2 rounded-r bg-brand-600" />
      )}
      <Icon
        className={cn(
          "relative z-10 h-[18px] w-[18px] shrink-0",
          active ? "text-brand-700" : "text-slate-500 group-hover:text-slate-700",
        )}
      />
      {!collapsed && (
        <span className="relative z-10 ml-3 flex flex-1 items-center justify-between truncate">
          <span className="truncate">{name}</span>
          {typeof badge === "number" && badge > 0 && (
            <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-600 px-1.5 text-[11px] font-semibold text-white">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </span>
      )}
      {collapsed && typeof badge === "number" && badge > 0 && (
        <span className="absolute right-1 top-1 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-600 px-1 text-[10px] font-semibold text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
});

export default function SidebarItem(props: SidebarItemProps) {
  if (props.collapsed) {
    return (
      <Tooltip label={props.name} placement="right">
        <SidebarItemButton {...props} />
      </Tooltip>
    );
  }
  return <SidebarItemButton {...props} />;
}
