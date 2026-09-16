import { offlineDB, LocalAttendance } from "../db";
import { enqueueMutation, generateClientId } from "../sync/syncQueue";
import { syncEngine } from "../sync/syncEngine";
import { networkManager } from "../network/networkStatus";
import { privateClient } from "@/api";

export const localMarkAttendance = async (
  employeeId: string,
  siteId: string,
  date: string,
  status: number
): Promise<{ message: string; attendanceId: string; isOffline: boolean }> => {
  const isOnline = networkManager.isOnline();
  const dateStr = date.split("T")[0];

  // Check if employee exists locally
  const employee = await offlineDB.employees.get(employeeId);
  const dailyWage = employee?.dailyWage || 0;

  const localId = `att-${generateClientId()}`;

  const attendanceRecord: LocalAttendance = {
    id: localId,
    employeeId,
    employeeName: employee?.name,
    employeePosition: employee?.position,
    siteId,
    date: dateStr,
    status,
    dailyWage,
    isPaid: false,
    updatedAt: new Date().toISOString(),
    syncStatus: isOnline ? "pending" : "pending",
  };

  // 1. Save optimistically to IndexedDB
  await offlineDB.attendance.put(attendanceRecord);

  // 2. Optimistically adjust local site expenses
  const localSite = await offlineDB.sites.get(siteId);
  if (localSite) {
    const expense = status * dailyWage;
    const currentExpenses = localSite.expenses || 0;
    await offlineDB.sites.update(siteId, {
      expenses: currentExpenses + expense,
    });
  }

  // 3. Enqueue mutation
  await enqueueMutation("attendance", "CREATE", localId, {
    employeeId,
    siteId,
    date: dateStr,
    status,
  });

  // 4. If online, trigger background sync
  if (isOnline) {
    syncEngine.syncNow().catch((err) => {
      console.warn("[attendanceRepository] Background sync failed:", err);
    });
  }

  return {
    message: isOnline ? "Attendance marked" : "Attendance saved offline (will sync when connected)",
    attendanceId: localId,
    isOffline: !isOnline,
  };
};

export const localGetEmployeesWithAttendance = async (
  siteId: string,
  date: string
): Promise<string[]> => {
  const dateStr = date.split("T")[0];

  // Check local database first
  const localRecords = await offlineDB.attendance
    .where("siteId")
    .equals(siteId)
    .filter((record) => record.date === dateStr)
    .toArray();

  const localEmployeeIds = localRecords.map((r) => r.employeeId);

  // If online and we have network, try to fetch fresh from server and cache
  if (networkManager.isOnline()) {
    try {
      const response = await privateClient.get(
        `/attendance/site/${siteId}/employees/${dateStr}`
      );
      const serverIds: string[] = response.data || [];

      // Combine server and local optimistic records
      const merged = Array.from(new Set([...serverIds, ...localEmployeeIds]));
      return merged;
    } catch {
      // Fallback to local
      return localEmployeeIds;
    }
  }

  return localEmployeeIds;
};

export const localGetSiteAttendance = async (
  siteId: string,
  startDate: string,
  endDate: string
): Promise<any[]> => {
  // If online, fetch from API and cache
  if (networkManager.isOnline()) {
    try {
      const response = await privateClient.get(`/attendance/site/${siteId}`, {
        params: { startDate, endDate },
      });
      return response.data;
    } catch (err) {
      console.warn("[attendanceRepository] Fetch attendance failed, using offline records:", err);
    }
  }

  // Fallback: Group local attendance
  const records = await offlineDB.attendance
    .where("siteId")
    .equals(siteId)
    .filter((r) => r.date >= startDate && r.date <= endDate)
    .toArray();

  return records;
};
