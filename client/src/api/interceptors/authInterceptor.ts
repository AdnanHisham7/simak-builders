import { AxiosInstance, AxiosRequestConfig } from "axios";
import { refreshAccessToken } from "@/services/authService";
import { handleAxiosError } from "@/helpers/errorHandler";
import { store } from "@/store/store";
import { clearUser } from "@/store/slices/authSlice";
import { toast } from "sonner";

interface RetriableRequest extends AxiosRequestConfig {
  _retry?: boolean;
}

export const attachAuthInterceptor = (client: AxiosInstance) => {
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as RetriableRequest;

      // Handle 401 Unauthorized (session expired)
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          await refreshAccessToken();
          return client.request(originalRequest);
        } catch (refreshError) {
          store.dispatch(clearUser());
          toast.error("Session expired. Please login again.");
          return Promise.reject(refreshError);
        }
      }

      // Handle 403 Forbidden (user blocked)
      if (
        error.response?.status === 409 &&
        error.response.data.message === "User is blocked"
      ) {
        store.dispatch(clearUser());
        toast.error("Your account has been blocked. Please contact support.");
        // Optionally redirect to login page
        window.location.href = "/login";
        return Promise.reject(error);
      }

      return handleAxiosError(error);
    }
  );
};