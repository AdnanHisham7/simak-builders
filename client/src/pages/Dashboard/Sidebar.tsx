import { ReactNode, memo } from "react";
import { LucideIcon } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import SidebarItem from "./SidebarItem";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

interface MenuItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

interface MenuSection {
  title?: string;
  items: MenuItem[];
}

interface SidebarProps {
  collapsed: boolean;
  menus: MenuSection[];
  unseenCount: number;
}

function Sidebar({ collapsed, menus, unseenCount }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { userType } = useSelector((state: RootState) => state.auth);

  const currentPath = location.pathname;

  const handleItemClick = (item: MenuItem) => {
    navigate(item.path);
  };

  const formatRoleName = (role: string) => {
    return role
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const displayRole = userType ? formatRoleName(userType) : "";

  return (
    <div className="flex h-full flex-col bg-white">
      <div
        className={`flex items-center border-b border-console-border py-4 ${
          collapsed ? "justify-center" : "px-4"
        }`}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-800 text-sm font-bold tracking-wide text-white">
          SB
        </div>
        {!collapsed && (
          <div className="ml-3 min-w-0">
            <div className="truncate text-sm font-semibold text-console-text">
              Simak Builders
            </div>
            <div className="truncate text-xs text-console-muted">{displayRole}</div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4">
        {menus.map((menu, index) => (
          <div className="mb-5" key={menu.title ?? `section-${index}`}>
            {menu.title && !collapsed && (
              <div className="mb-2 px-5 text-xxs font-semibold uppercase tracking-wider text-slate-400">
                {menu.title}
              </div>
            )}
            {menu.items.map((item) => (
              <SidebarItem
                key={item.path}
                icon={item.icon}
                name={item.name}
                active={currentPath === item.path}
                collapsed={collapsed}
                onClick={() => handleItemClick(item)}
                badge={item.name === "Enquiries" && unseenCount > 0 ? unseenCount : undefined}
              />
            ))}
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className="border-t border-console-border px-5 py-3">
          <div className="text-xs text-slate-400">Console v1.0.0</div>
        </div>
      )}
    </div>
  );
}

export default memo(Sidebar);
