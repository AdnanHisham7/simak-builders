import { privateClient } from "@/api";
import { Site } from "./siteService";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  assignedSites: Site[];
  password?: string;
  isBlocked: boolean;
  siteExpensesBalance: number;
}

export interface SalaryAssignment {
  _id: string;
  date: string;
  givenBy: { _id: string; name: string };
  amount: number;
  isVerified: boolean;
}

export interface UserWithSalary {
  _id: string;
  name: string;
  email: string;
  role: string;
  salaryAssignments: SalaryAssignment[];
  totalSalary: number;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  isBlocked: boolean;
  assignedSite: Site | null;
}

export const getUsersByRole = async (role: string): Promise<User[]> => {
  const response = await privateClient.get("/users", { params: { role } });
  return response.data.map((user: any) => ({
    id: user.id, // Corrected from user.id to user._id
    name: user.name,
    email: user.email,
    role: user.role,
    assignedSites:
      user.assignedSites?.map((site: any) => ({
        id: site.id, // Ensure this matches the site's ID from siteService
        name: site.name,
      })) || [],
    isBlocked: user.isBlocked,
    password: user.password,
    siteExpensesBalance: user.siteExpensesBalance,
  }));
};

export const toggleUserStatus = async (
  userId: string,
  isBlocked: boolean // Change parameter type
) => {
  const response = await privateClient.put(`/users/toggleStatus/${userId}`, {
    isBlocked, // Send isBlocked instead of status
  });
  return {
    id: response.data._id,
    ...response.data,
    assignedSites:
      response.data.assignedSites?.map((site: any) => ({
        id: site._id,
        name: site.name,
      })) || [],
  };
};

export const regeneratePassword = async (id: string): Promise<string> => {
  try {
    const response = await privateClient.post(
      `/users/${id}/regenerate-password`
    );
    return response.data.newPassword; // Expecting newPassword in response
  } catch (error) {
    throw error;
  }
};

export const createSiteManager = async (userData: {
  name: string;
  email: string;
  role: string;
}) => {
  const response = await privateClient.post("/users/managers", userData);
  return {
    id: response.data._id,
    ...response.data,
  };
};

export const updateSiteManager = async (
  userId: string,
  updateData: { name?: string; email?: string }
) => {
  const response = await privateClient.put(
    `/users/managers/${userId}`,
    updateData
  );
  return {
    id: response.data._id,
    ...response.data,
    assignedSites:
      response.data.assignedSites?.map((site: any) => ({
        id: site._id,
        name: site.name,
      })) || [],
  };
};

export const assignSitesToManager = async (
  userId: string,
  siteIds: string[]
) => {
  await privateClient.put(`/users/manager/${userId}/assign-sites`, { siteIds });
};

export const assignSitesToClients = async (
  userId: string,
  siteIds: string[]
) => {
  await privateClient.put(`/users/clients/${userId}/assign-sites`, { siteIds });
};

export const createSupervisor = async (userData: {
  name: string;
  email: string;
}) => {
  const response = await privateClient.post("/users/supervisors", {
    ...userData,
    role: "supervisor",
  });
  return {
    id: response.data._id,
    ...response.data,
  };
};

export const updateSupervisor = async (
  userId: string,
  updateData: { name?: string; email?: string }
) => {
  const response = await privateClient.put(
    `/users/supervisors/${userId}`,
    updateData
  );
  return {
    id: response.data._id,
    ...response.data,
    assignedSites:
      response.data.assignedSites?.map((site: any) => ({
        id: site._id,
        name: site.name,
      })) || [],
  };
};

export const assignSitesToSupervisor = async (
  userId: string,
  siteIds: string[]
) => {
  await privateClient.put(`/users/supervisor/${userId}/assign-sites`, {
    siteIds,
  });
};

// Updated userService.ts (append these functions)
export const createArchitect = async (userData: {
  name: string;
  email: string;
}) => {
  const response = await privateClient.post("/users/architects", {
    ...userData,
    role: "architect",
  });
  return {
    id: response.data._id,
    ...response.data,
  };
};

export const updateArchitect = async (
  userId: string,
  updateData: { name?: string; email?: string }
) => {
  const response = await privateClient.put(
    `/users/architects/${userId}`,
    updateData
  );
  return {
    id: response.data._id,
    ...response.data,
    assignedSites:
      response.data.assignedSites?.map((site: any) => ({
        id: site._id,
        name: site.name,
      })) || [],
  };
};

export const assignSitesToArchitect = async (
  userId: string,
  siteIds: string[]
) => {
  await privateClient.put(`/users/architect/${userId}/assign-sites`, {
    siteIds,
  });
};

export const assignSalary = async (
  userId: string,
  amount: number,
  isVerified: boolean = false
): Promise<SalaryAssignment> => {
  const response = await privateClient.post(`/users/${userId}/assign-salary`, {
    amount,
    isVerified,
  });
  return response.data.salaryAssignment;
};

export const verifySalaryAssignment = async (
  userId: string,
  assignmentId: string
): Promise<void> => {
  await privateClient.put(
    `/users/${userId}/salary-assignments/${assignmentId}/verify`
  );
};

export const updateFixedSalary = async (userId: string, fixedSalary: number): Promise<void> => {
  await privateClient.put(`/users/${userId}/fixed-salary`, { fixedSalary });
};

export const updateSalaryAssignmentAmount = async (
  userId: string,
  assignmentId: string,
  amount: number
): Promise<void> => {
  await privateClient.put(`/users/${userId}/salary-assignments/${assignmentId}`, { amount });
};

export const listSalaries = async (): Promise<UserWithSalary[]> => {
  const response = await privateClient.get("/users/salaries");
  return response.data;
};

export const createClient = async (userData: {
  name: string;
  email: string;
}) => {
  const response = await privateClient.post("/users/clients", {
    ...userData,
    role: "client",
  });
  return {
    id: response.data.user.id,
    name: response.data.user.name,
    email: response.data.user.email,
    isBlocked: response.data.user.isBlocked,
    assignedSite: null,
  };
};

export const updateClient = async (
  userId: string,
  updateData: { name?: string; email?: string }
) => {
  const response = await privateClient.put(
    `/users/clients/${userId}`,
    updateData
  );
  return {
    id: userId,
    name: response.data.name || updateData.name,
    email: response.data.email || updateData.email,
    isBlocked: response.data.isBlocked,
    assignedSite: null, // Site assignment handled elsewhere
  };
};

export const assignSiteExpenses = async (
  userId: string,
  amount: number
): Promise<void> => {
  await privateClient.post(`/users/${userId}/assign-site-expenses`, { amount });
};

export const getCurrentUser = async () => {
  const response = await privateClient.get("/users/me");
  return response.data;
};

export const getUnassignedClients = async (): Promise<User[]> => {
  const response = await privateClient.get("/users/clients/unassigned");
  return response.data.map((user: any) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    assignedSites: [], // Since these are unassigned clients, this will be empty
    isBlocked: user.isBlocked,
  }));
};

export const getUserById = async (userId: string) => {
  const response = await privateClient.get(`/users/${userId}`); // Adjust endpoint as needed
  return response.data;
};
