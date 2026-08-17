import { useEffect, useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, type LucideIcon } from "lucide-react";
import NotificationBell from "@/components/ui/NotificationBell";
import Tooltip from "@/components/ui/Tooltip";
import NotificationPanel from "@/components/layout/NotificationPanel";
import ProfileDropdown from "@/components/layout/ProfileDropDown";
import { privateClient } from "@/api";
import { toast } from "sonner";
import { useCompanyProfile } from "@/hooks/useCompanyProfile";
import { DashboardContext } from "@/context/DashboardContext";
import { cn } from "@/lib/cn";

export interface PortalMenuItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

export interface PortalMenuSection {
  title: string;
  items: PortalMenuItem[];
}

interface PortalLayoutProps {
  children: ReactNode;
  menus: PortalMenuSection[];
  roleLabel: string;
}

interface Notification {
  _id: string;
  type: string;
  relatedId: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

const PortalLayout = ({ children, menus, roleLabel }: PortalLayoutProps) => {
  const { profile } = useCompanyProfile();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const items = menus.flatMap((section) => section.items);

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const response = await privateClient.get("/notifications");
      setNotifications(response.data);
    } catch (error) {
      toast.error("Failed to load notifications");
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const updateNotificationStatus = (id: string, newStatus: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif._id === id
          ? { ...notif, status: newStatus as Notification["status"] }
          : notif,
      ),
    );
  };

  const pendingCount = notifications.filter(
    (notif) => notif.status === "pending",
  ).length;

  const companyName = profile?.name || "Simak Builders";
  const companyInitials =
    companyName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "SB";

  return (
    <DashboardContext.Provider
      value={{
        unseenCount: 0,
        setUnseenCount: () => {},
        pendingDeactivationCount: 0,
        setPendingDeactivationCount: () => {},
        feedbackOpenCount: 0,
        setFeedbackOpenCount: () => {},
        expenseRequestPendingCount: 0,
        setExpenseRequestPendingCount: () => {},
      }}
    >
      <div className="flex h-screen flex-col overflow-hidden bg-console-bg">
        <header className="glass-surface z-40 flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {profile?.logo ? (
              <img
                src={profile.logo}
                alt={companyName}
                className="h-9 w-9 shrink-0 rounded-lg object-cover shadow-glow-brand"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-brand-900 text-sm font-bold tracking-wide text-white shadow-glow-brand">
                {companyInitials}
              </div>
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-console-text">
                {companyName}
              </div>
              <div className="truncate text-xs text-console-muted">
                {roleLabel}
              </div>
            </div>
          </div>

          <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
            {items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path.endsWith("/dashboard")}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-200",
                    isActive
                      ? "bg-brand-50 text-brand-800"
                      : "text-console-muted hover:bg-console-bg hover:text-console-text",
                  )
                }
              >
                <item.icon size={16} />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              aria-label="Toggle navigation"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-console-muted transition-colors hover:bg-console-bg hover:text-console-text lg:hidden"
            >
              {mobileNavOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
            <Tooltip label="Notifications">
              <NotificationBell
                count={pendingCount}
                onClick={() => setIsNotificationOpen(true)}
              />
            </Tooltip>
            <div className="hidden h-6 w-px bg-console-border sm:block" />
            <ProfileDropdown />
          </div>
        </header>

        <AnimatePresence>
          {mobileNavOpen && (
            <motion.nav
              key="portal-mobile-nav"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden border-b border-console-border bg-console-surface lg:hidden"
            >
              <div className="flex flex-col gap-1 p-3">
                {items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path.endsWith("/dashboard")}
                    onClick={() => setMobileNavOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors duration-200",
                        isActive
                          ? "bg-brand-50 text-brand-800"
                          : "text-console-muted hover:bg-console-bg hover:text-console-text",
                      )
                    }
                  >
                    <item.icon size={16} />
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>

        <main className="no-scrollbar flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>

      <NotificationPanel
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        updateNotificationStatus={updateNotificationStatus}
        fetchNotifications={fetchNotifications}
        loading={loadingNotifications}
      />
    </DashboardContext.Provider>
  );
};

export default PortalLayout;