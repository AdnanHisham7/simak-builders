import { useState, useEffect } from "react";
import { Menu, PanelLeftClose, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button";
import NotificationBell from "@/components/ui/NotificationBell";
import ProfileDropdown from "@/components/layout/ProfileDropDown";
import NotificationPanel from "@/components/layout/NotificationPanel";
import { privateClient } from "@/api";
import { toast } from "sonner";

interface Notification {
  _id: string;
  type: string;
  relatedId: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

interface HeaderProps {
  toggleSidebar: () => void;
  sidebarCollapsed: boolean;
  isMobile: boolean;
  sidebarOpen?: boolean;
}

export default function Header({
  toggleSidebar,
  sidebarCollapsed,
  isMobile,
  sidebarOpen = false,
}: HeaderProps) {
  const navigate = useNavigate();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await privateClient.get("/notifications");
      setNotifications(response.data);
    } catch (error) {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const updateNotificationStatus = (id: string, newStatus: "pending" | "approved" | "rejected") => {
    setNotifications((prev: Notification[]) =>
      prev.map((notif) => (notif._id === id ? { ...notif, status: newStatus } : notif)),
    );
  };

  const pendingCount = notifications.filter((n) => n.status === "pending").length;

  return (
    <header className="flex items-center justify-between border-b border-console-border bg-white px-4 py-3 sm:px-6">
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={isMobile ? "Toggle navigation" : "Collapse sidebar"}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-console-muted transition-colors hover:bg-console-bg hover:text-console-text"
      >
        {isMobile ? (
          sidebarOpen ? <X size={19} /> : <Menu size={19} />
        ) : (
          <PanelLeftClose size={19} className={sidebarCollapsed ? "rotate-180" : ""} />
        )}
      </button>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          Back to site
        </Button>
        <NotificationBell count={pendingCount} onClick={() => setIsNotificationOpen(true)} />
        <div className="h-6 w-px bg-console-border" />
        <ProfileDropdown />
      </div>

      <NotificationPanel
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        updateNotificationStatus={updateNotificationStatus}
        fetchNotifications={fetchNotifications}
        loading={loading}
      />
    </header>
  );
}
