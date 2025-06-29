import { forgotPassword } from "@/services/authService";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const useForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleForgotPassword = async (email: string) => {
    if (!email) {
      toast.warning("Please enter your email address.");
      return;
    }
    setIsLoading(true);
    try {
      await forgotPassword(email);
      toast.success("A reset link has been sent to the mail");
      navigate("/login");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleForgotPassword,
  };
};
