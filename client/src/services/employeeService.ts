import { privateClient } from "@/api";

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  dailyWage: number;
  totalPaidSalary?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Attendance {
  id: string;
  site: { id: string; name: string };
  date: string;
  status: number; 
  dailyWage: number;
  isPaid: boolean;
  markedBy: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export const getEmployees = async (): Promise<Employee[]> => {
  const response = await privateClient.get("/employees");
  return response.data.map((employee: any) => ({
    id: employee._id,
    name: employee.name,
    email: employee.email,
    phone: employee.phone,
    position: employee.position,
    dailyWage: employee.dailyWage,
    totalPaidSalary: employee.totalPaidSalary,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  }));
};

export const getEmployeesBySite = async (id: string): Promise<Employee> => {
  const response = await privateClient.get(`/employees/${id}`);
  const employee = response.data;
  return {
    id: employee._id,
    name: employee.name,
    email: employee.email,
    phone: employee.phone,
    position: employee.position,
    dailyWage: employee.dailyWage,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  };
};

export const createEmployee = async (data: {
  name: string;
  email: string;
  phone: string;
  position: string;
  dailyWage: number;
}): Promise<Employee> => {
  const response = await privateClient.post("/employees", data);
  const employee = response.data;
  return {
    id: employee._id,
    name: employee.name,
    email: employee.email,
    phone: employee.phone,
    position: employee.position,
    dailyWage: employee.dailyWage,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  };
};

export const updateEmployee = async (
  id: string,
  data: Partial<Omit<Employee, "id">>
): Promise<Employee> => {
  const response = await privateClient.put(`/employees/${id}`, data);
  const employee = response.data;
  return {
    id: employee._id,
    name: employee.name,
    email: employee.email,
    phone: employee.phone,
    position: employee.position,
    dailyWage: employee.dailyWage,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  };
};

export const deleteEmployee = async (id: string): Promise<void> => {
  await privateClient.delete(`/employees/${id}`);
};

export const getAttendanceByEmployee = async (
  employeeId: string
): Promise<Attendance[]> => {
  const response = await privateClient.get(
    `/employees/${employeeId}/attendance`
  );
  return response.data.map((attendance: any) => ({
    id: attendance._id,
    site: { id: attendance.site._id, name: attendance.site.name },
    date: attendance.date,
    status: attendance.status,
    dailyWage: attendance.dailyWage,
    isPaid: attendance.isPaid,
    markedBy: { id: attendance.markedBy._id, name: attendance.markedBy.name },
    createdAt: attendance.createdAt,
    updatedAt: attendance.updatedAt,
  }));
};

export const calculateSalary = async (
  employeeId: string,
  startDate: string,
  endDate: string
): Promise<{ totalSalary: number; attendanceIds: string[] }> => {
  const response = await privateClient.post("/employees/calculate-salary", {
    employeeId,
    startDate,
    endDate,
  });
  return response.data;
};

export const markAttendancesPaid = async (
  attendanceIds: string[]
): Promise<void> => {
  await privateClient.post("/employees/mark-attendances-paid", {
    attendanceIds,
  });
};
