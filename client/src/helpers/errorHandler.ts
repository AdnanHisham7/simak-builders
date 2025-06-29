import { toast } from "sonner";
import axios from "axios";

export const handleAxiosError = (error: unknown) => {
  console.error("Global Error Captured:", error);

  if (axios.isAxiosError(error)) {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "Something went wrong.";
    toast.error(message);
  } else if (error instanceof Error) {
    toast.error(error.message);
  } else {
    toast.error("Something went wrong.");
  }

  return Promise.reject(error);
};
