import { memo } from "react";
import { LucideIcon } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import SidebarItem from "./SidebarItem";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useCompanyProfile } from "@/hooks/useCompanyProfile";

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
  pendingDeactivationCount?: number;
}

function Sidebar({ collapsed, menus, unseenCount, pendingDeactivationCount = 0 }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { userType } = useSelector((state: RootState) => state.auth);
  const { profile } = useCompanyProfile();

  const currentPath = location.pathname;

  const handleItemClick = (item: MenuItem) => {
    navigate(item.path);
  };

  const getBadgeCount = (item: MenuItem): number | undefined => {
    if (item.name === "Enquiries" && unseenCount > 0) {
      return unseenCount;
    }
    if (item.path === "/admin/settings" && pendingDeactivationCount > 0) {
      return pendingDeactivationCount;
    }
    return undefined;
  };

  const formatRoleName = (role: string) => {
    return role
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const displayRole = userType ? formatRoleName(userType) : "";
  const companyName = profile?.name || "Simak Builders";
  const companyInitials = companyName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-full flex-col bg-white/90 backdrop-blur-xl">
      <div
        className={`flex items-center border-b border-console-border py-4 ${
          collapsed ? "justify-center" : "px-4"
        }`}
      >
        {profile?.logo ? (
          <img
            src={profile.logo}
            alt={companyName}
            className="h-9 w-9 shrink-0 rounded-lg object-cover shadow-glow-brand"
          />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-brand-900 text-sm font-bold tracking-wide text-white shadow-glow-brand">
            {companyInitials || "SB"}
          </div>
        )}
        {!collapsed && (
          <div className="ml-3 min-w-0">
            <div className="truncate text-sm font-semibold text-console-text">
              {companyName}
            </div>
            <div className="truncate text-xs text-console-muted">{displayRole}</div>
          </div>
        )}
      </div>

      <nav className="no-scrollbar flex-1 overflow-y-auto overflow-x-hidden py-4">
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
                badge={getBadgeCount(item)}
                layoutId="sidebar-active-pill"
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
