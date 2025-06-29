import { privateClient } from "@/api";

export const getNotifications = async () => {
  const response = await privateClient.get("/notifications");
  return response.data;
};

export const updateNotificationStatus = async (notificationId: string, status: string) => {
  await privateClient.patch(`/notifications/${notificationId}/status`, { status });
};