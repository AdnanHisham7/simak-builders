import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

interface SidebarItemProps {
  icon: LucideIcon;
  name: string;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
  badge?: number;
}

export default function SidebarItem({
  icon: Icon,
  name,
  active,
  collapsed,
  onClick,
  badge,
}: SidebarItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? name : undefined}
      className={cn(
        "group relative mx-2 my-0.5 flex w-[calc(100%-1rem)] items-center rounded-lg py-2 text-sm transition-colors",
        collapsed ? "justify-center px-2" : "px-3",
        active
          ? "bg-brand-50 font-medium text-brand-800"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-4/5 w-0.5 -translate-y-1/2 rounded-r bg-brand-600" />
      )}
      <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-brand-700" : "text-slate-500 group-hover:text-slate-700")} />
      {!collapsed && (
        <span className="ml-3 flex flex-1 items-center justify-between truncate">
          <span className="truncate">{name}</span>
          {typeof badge === "number" && badge > 0 && (
            <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-600 px-1.5 text-[11px] font-semibold text-white">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </span>
      )}
    </button>
  );
}
