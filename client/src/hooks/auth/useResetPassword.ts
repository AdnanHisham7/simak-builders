import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { resetPassword } from "@/services/authService";

export const useResetPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async (
    token: string | null,
    password: string,
    confirmPassword: string
  ) => {
    if (!password || !confirmPassword) {
      toast.warning("Both password fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      toast.warning("Passwords do not match.");
      return;
    }

    if (!token) {
      toast.error("Invalid or missing reset token.");
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(token, password);
      toast.success("Password reset successfully. Please log in.");
      navigate("/login");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleResetPassword,
  };
};
