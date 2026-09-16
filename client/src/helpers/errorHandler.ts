import { toast } from "sonner";
import axios from "axios";

export const handleAxiosError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const isNetworkError =
      error.code === "ERR_NETWORK" ||
      error.message === "Network Error" ||
      (typeof navigator !== "undefined" && !navigator.onLine);

    // Suppress global toast popups when user is intentionally offline
    if (!isNetworkError) {
      console.error("Global Error Captured:", error);
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Something went wrong.";
      toast.error(message);
    }
  } else if (error instanceof Error) {
    if (typeof navigator === "undefined" || navigator.onLine) {
      console.error("Global Error Captured:", error);
      toast.error(error.message);
    }
  }

  return Promise.reject(error);
};
