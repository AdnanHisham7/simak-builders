import { AxiosInstance } from "axios";
import { handleAxiosError } from "@/helpers/errorHandler";

export const attachErrorhInterceptor = (client: AxiosInstance) => {
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      return handleAxiosError(error);
    }
  );
};
