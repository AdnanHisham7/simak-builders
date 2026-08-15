import { publicClient as api, privateClient } from "@/api";

export const login = async (email: string, password: string) => {
  const response = await api.post("/auth/login", { email, password });
  return response.data;
};

export const signupClient = async (data: {
  email: string;
  password: string;
  confirmPassword: string;
}) => {
  const response = await api.post("/auth/register/client", data);
  return response.data;
};

export const signupCompany = async (data: any) => {
  const response = await api.post("/auth/register/company", data);
  return response.data;
};

export const validateCompanyEmail = async (email: string) => {
  const response = await api.post("/auth/validate-email", { email });
  return response.data;
};

export const forgotPassword = async (email: string) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

export const resetPassword = async (token: string, password: string) => {
  const response = await api.post("/auth/reset-password", { token, password });
  return response.data;
};

export const verifyEmail = async (token: string) => {
  const response = await api.get(`/auth/verify-email?token=${token}`);
  return response.data;
};

export const googleLogin = async (credential: string) => {
  const response = await api.post("/auth/google", { credential });
  return response.data;
};

export const refreshAccessToken = async () => {
  const response = await api.post("/auth/refresh-token", null, {
    withCredentials: true,
  });
  return response.data;
};

export const resendVerificationEmail = async (email: string) => {
  const response = await api.post("/auth/resend-verification-email", { email });
  return response.data;
};

export const logout = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export const changePassword = async (payload: ChangePasswordPayload) => {
  const response = await privateClient.post("/auth/change-password", payload);
  return response.data;
};

export interface UserSession {
  id: string;
  device: string;
  browser: string;
  os: string;
  ip: string;
  createdAt: string;
  lastUsedAt: string;
  isCurrent: boolean;
}

export const getSessions = async (): Promise<UserSession[]> => {
  const response = await privateClient.get("/auth/sessions");
  return response.data.sessions;
};

export const revokeSession = async (
  sessionId: string,
): Promise<{ loggedOutCurrent: boolean }> => {
  const response = await privateClient.delete(`/auth/sessions/${sessionId}`);
  return response.data;
};

export const logoutOtherSessions = async () => {
  const response = await privateClient.post("/auth/sessions/logout-others");
  return response.data;
};

export interface LoginActivityEntry {
  id: string;
  ip: string;
  userAgent: string;
  device: string;
  timestamp: string;
}

export const getLoginActivity = async (
  limit = 20,
): Promise<LoginActivityEntry[]> => {
  const response = await privateClient.get("/auth/login-activity", {
    params: { limit },
  });
  return response.data.logins;
};