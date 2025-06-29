import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  login,
  googleLogin,
  resendVerificationEmail,
} from "@/services/authService";
import { setUser } from "@/store/slices/authSlice";

export const useLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailNotVerified, setIsEmailNotVerified] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    if (!email || !password) {
      toast.warning("All fields are required!");
      return;
    }
    setIsLoading(true);
    try {
      const data = await login(email, password);
      dispatch(setUser({ user: data.user, userType: data.user.role }));
      navigate("/");
    } catch (error: any) {
      if (error?.response?.status === 403) {
        setIsEmailNotVerified(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse: any) => {
    setIsLoading(true);
    try {
      const data = await googleLogin(credentialResponse.credential);
      dispatch(setUser({ user: data.user, userType: "client" }));
      navigate("/");
    } catch (error) {
      toast.error("Google login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async (email: string) => {
    setIsResendingVerification(true);
    try {
      await resendVerificationEmail(email);
      toast.success("Verification email resent successfully!");
    } finally {
      setIsResendingVerification(false);
    }
  };

  return {
    isLoading,
    isEmailNotVerified,
    isResendingVerification,
    handleLogin,
    handleGoogleLogin,
    handleResendVerification,
  };
};
