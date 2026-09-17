import { privateClient } from "@/api";
import {
  localMarkAttendance,
  localGetEmployeesWithAttendance,
  localGetSiteAttendance,
} from "@/offline/repositories/attendanceRepository";

export const markAttendance = async (
  employeeId: string,
  siteId: string,
  date: string,
  status: number
) => {
  return localMarkAttendance(employeeId, siteId, date, status);
};

export const getSiteAttendance = async (
  siteId: string,
  startDate: string,
  endDate: string
) => {
  return localGetSiteAttendance(siteId, startDate, endDate);
};

export const getAttendanceDetailsForDay = async (siteId: string, date: string) => {
  const response = await privateClient.get(`/attendance/site/${siteId}/day/${date}`);
  return response.data;
};

export const getEmployeesWithAttendance = async (siteId: string, date: string) => {
  return localGetEmployeesWithAttendance(siteId, date);
};