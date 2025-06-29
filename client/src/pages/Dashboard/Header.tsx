import { useState, useEffect } from "react";
import { ArrowLeft, Menu, X } from "lucide-react";
import { motion } from "framer-motion";
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

export default function Header({
  toggleSidebar,
  sidebarCollapsed,
  isMobile,
}: any) {
  const navigate = useNavigate();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch notifications from the backend
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await privateClient.get("/notifications");
      setNotifications(response.data);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications when the Header mounts
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Function to update notification status
  const updateNotificationStatus = (
    id: string,
    newStatus: "pending" | "approved" | "rejected"
  ) => {
    setNotifications((prev: Notification[]) =>
      prev.map((notif) =>
        notif._id === id ? { ...notif, status: newStatus } : notif
      )
    );
  };

  // Calculate the count of pending notifications
  const pendingCount = notifications.filter(
    (n) => n.status === "pending"
  ).length;

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-16 sm:ps-6 py-4 flex items-center justify-between">
      <div className="flex items-center">
        <motion.button
          className="text-gray-500 mr-4 p-1 rounded-md hover:bg-gray-100 focus:outline-none"
          onClick={toggleSidebar}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {sidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
        </motion.button>
      </div>
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          className="flex items-center"
          onClick={() => navigate("/")}
        >
          Back To Home
        </Button>
        <NotificationBell
          count={pendingCount} // Pass dynamic pending count
          onClick={() => setIsNotificationOpen(true)}
        />
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
