import React, { useState } from "react";
import { privateClient } from "@/api";
import { toast } from "sonner";
import {
  Bell,
  X,
  Check,
  XCircle,
  Package,
  ShoppingCart,
  Settings,
  Clock,
  Filter,
  RefreshCw,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
} from "lucide-react";

interface Notification {
  _id: string;
  type: string;
  relatedId: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  updateNotificationStatus: (id: string, newStatus: string) => void;
  fetchNotifications: () => void;
  loading: boolean;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
  notifications,
  updateNotificationStatus,
  fetchNotifications,
  loading,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) setIsAnimating(true);
    else setIsAnimating(false);
  }, [isOpen]);

  const handleAction = async (notification: Notification, action: string) => {
    setActionLoading(`${notification._id}-${action}`);
    try {
      if (notification.type === "stock_transfer") {
        if (action === "approve") {
          await privateClient.patch(
            `/stocks/transfers/${notification.relatedId}/approve`
          );
          updateNotificationStatus(notification._id, "approved");
        } else if (action === "reject") {
          await privateClient.patch(
            `/stocks/transfers/${notification.relatedId}/reject`
          );
          updateNotificationStatus(notification._id, "rejected");
        }
      } else if (notification.type === "purchase_verification") {
        if (action === "verify") {
          await privateClient.patch(
            `/purchases/${notification.relatedId}/verify`
          );
          updateNotificationStatus(notification._id, "approved");
        }
      } else if (notification.type === "machinery_rental_verification") {
        if (action === "verify") {
          await privateClient.patch(
            `/machinery-rentals/${notification.relatedId}/verify`
          );
          updateNotificationStatus(notification._id, "approved");
        }
      } else if (notification.type === "phase_status_verification") {
        if (action === "approve") {
          await privateClient.patch(
            `/sites/phases/${notification.relatedId}/approve`
          );
          updateNotificationStatus(notification._id, "approved");
        } else if (action === "reject") {
          await privateClient.patch(
            `/sites/phases/${notification.relatedId}/reject`
          );
          updateNotificationStatus(notification._id, "rejected");
        }
      } else if (notification.type === "client_payment_verification") {
        if (action === "verify") {
          await privateClient.put(
            `/client/transactions/${notification.relatedId}/verify`
          );
          updateNotificationStatus(notification._id, "approved");
        }
      }
      toast.success(
        `${action.charAt(0).toUpperCase() + action.slice(1)}d successfully`
      );
    } catch (error) {
      console.error(`Failed to ${action} notification`, error);
      toast.error(`Failed to ${action} notification`);
    } finally {
      setActionLoading(null);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "stock_transfer":
        return <Package className="w-5 h-5 text-blue-500" />;
      case "purchase_verification":
        return <ShoppingCart className="w-5 h-5 text-green-500" />;
      case "machinery_rental_verification":
        return <Settings className="w-5 h-5 text-purple-500" />;
      case "phase_status_verification":
        return <CheckCircle2 className="w-5 h-5 text-teal-500" />;
      case "client_payment_verification":
        return <DollarSign className="w-5 h-5 text-green-500" />;
      case "payment_verified":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-3 h-3" />;
      case "approved":
        return <Check className="w-3 h-3" />;
      case "rejected":
        return <XCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const filteredNotifications = notifications.filter(
    (notif) => filter === "all" || notif.status === filter
  );

  const pendingCount = notifications.filter(
    (n) => n.status === "pending"
  ).length;
  const approvedCount = notifications.filter(
    (n) => n.status === "approved"
  ).length;
  const rejectedCount = notifications.filter(
    (n) => n.status === "rejected"
  ).length;

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      <div
        className={`
          fixed top-0 right-0 h-full w-[550px] bg-white overflow-auto shadow-2xl transform transition-all duration-300 ease-out z-50
          ${isOpen ? "translate-x-0" : "translate-x-full"}
          ${isAnimating ? "opacity-100" : "opacity-0"}
        `}
      >
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        <div className="relative bg-white border-b border-gray-100 p-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Bell className="w-6 h-6 text-gray-700" />
                {pendingCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-800">Notifications</h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchNotifications}
                disabled={loading}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-yellow-800">
                {pendingCount}
              </div>
              <div className="text-xs text-yellow-600">Pending</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-green-800">
                {approvedCount}
              </div>
              <div className="text-xs text-green-600">Approved</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-red-800">
                {rejectedCount}
              </div>
              <div className="text-xs text-red-600">Rejected</div>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700 capitalize">
                  {filter === "all" ? "All Notifications" : `${filter} Only`}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-500 transition-transform ${
                  isFilterOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isFilterOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {["all", "pending", "approved", "rejected"].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setFilter(status as any);
                      setIsFilterOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors capitalize first:rounded-t-lg last:rounded-b-lg ${
                      filter === status
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700"
                    }`}
                  >
                    {status === "all" ? "All Notifications" : `${status} Only`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
                <p className="text-gray-500">Loading notifications...</p>
              </div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">
                  No notifications found
                </p>
                <p className="text-gray-400 text-sm">
                  {filter !== "all"
                    ? `No ${filter} notifications`
                    : "You're all caught up!"}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              <div className="p-4 space-y-3">
                {filteredNotifications.map((notif) => (
                  <div
                    key={notif._id}
                    className={`relative bg-white border rounded-xl p-4 transition-all duration-200 hover:shadow-md ${
                      notif.status === "pending"
                        ? "border-yellow-200 bg-yellow-50/30"
                        : "border-gray-200"
                    }`}
                  >
                    {notif.status === "pending" && (
                      <div className="absolute top-3 right-3">
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      </div>
                    )}
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              notif.status
                            )}`}
                          >
                            {getStatusIcon(notif.status)}
                            <span className="capitalize">{notif.status}</span>
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(notif.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 mb-3 leading-relaxed">
                          {notif.message}
                        </p>
                        {notif.status === "pending" && (
                          <div className="flex space-x-2">
                            {notif.type === "stock_transfer" && (
                              <>
                                <button
                                  onClick={() => handleAction(notif, "approve")}
                                  disabled={
                                    actionLoading === `${notif._id}-approve`
                                  }
                                  className="flex items-center space-x-1 px-3 py-2 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {actionLoading === `${notif._id}-approve` ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Check className="w-3 h-3" />
                                  )}
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => handleAction(notif, "reject")}
                                  disabled={
                                    actionLoading === `${notif._id}-reject`
                                  }
                                  className="flex items-center space-x-1 px-3 py-2 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {actionLoading === `${notif._id}-reject` ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <XCircle className="w-3 h-3" />
                                  )}
                                  <span>Reject</span>
                                </button>
                              </>
                            )}
                            {(notif.type === "purchase_verification" ||
                              notif.type === "machinery_rental_verification" ||
                              notif.type === "client_payment_verification") && (
                              <button
                                onClick={() => handleAction(notif, "verify")}
                                disabled={
                                  actionLoading === `${notif._id}-verify`
                                }
                                className="flex items-center space-x-1 px-3 py-2 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {actionLoading === `${notif._id}-verify` ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )}
                                <span>Verify</span>
                              </button>
                            )}
                            {notif.type === "phase_status_verification" && (
                              <>
                                <button
                                  onClick={() => handleAction(notif, "approve")}
                                  disabled={
                                    actionLoading === `${notif._id}-approve`
                                  }
                                  className="flex items-center space-x-1 px-3 py-2 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {actionLoading === `${notif._id}-approve` ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Check className="w-3 h-3" />
                                  )}
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => handleAction(notif, "reject")}
                                  disabled={
                                    actionLoading === `${notif._id}-reject`
                                  }
                                  className="flex items-center space-x-1 px-3 py-2 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {actionLoading === `${notif._id}-reject` ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <XCircle className="w-3 h-3" />
                                  )}
                                  <span>Reject</span>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationPanel;