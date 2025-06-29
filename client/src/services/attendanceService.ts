import { privateClient } from "@/api";

export const markAttendance = async (
  employeeId: string,
  siteId: string,
  date: string,
  status: number // Changed to number
) => {
  const response = await privateClient.post(`/attendance/mark`, {
    employeeId,
    siteId,
    date,
    status,
  });
  return response.data;
};

export const getSiteAttendance = async (
  siteId: string,
  startDate: string,
  endDate: string
) => {
  const response = await privateClient.get(`/attendance/site/${siteId}`, {
    params: { startDate, endDate },
  });
  return response.data;
};

export const getAttendanceDetailsForDay = async (siteId: string, date: string) => {
  const response = await privateClient.get(`/attendance/site/${siteId}/day/${date}`);
  return response.data;
};

export const getEmployeesWithAttendance = async (siteId: string, date: string) => {
  const response = await privateClient.get(`/attendance/site/${siteId}/employees/${date}`);
  return response.data;
};