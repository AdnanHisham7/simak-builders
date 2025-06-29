import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  signupClient,
  resendVerificationEmail,
  googleLogin,
} from "@/services/authService";
import { setUser } from "@/store/slices/authSlice";

export const useSignup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false); // <-- for signup success

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSignup = async (
    email: string,
    password: string,
    confirmPassword: string
  ) => {
    if (!email || !password || !confirmPassword) {
      toast.warning("All fields are required!");
      return;
    }
    if (password !== confirmPassword) {
      toast.warning("Passwords do not match");
      return;
    }
    setIsLoading(true);
    try {
      const result = await signupClient({ email, password, confirmPassword });
      if (result.resend) {
        await resendVerificationEmail(email);
        setIsEmailSent(true);
        toast.success(
          "Verification email has been sent to your email address."
        );
      } else {
        setIsEmailSent(true);
        toast.success("Signup successful! Please check your email to verify.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse: any) => {
    setIsLoading(true);
    try {
      const data = await googleLogin(credentialResponse.credential);
      dispatch(setUser({ user: data.user, userType: data.userType }));
      navigate("/");
    } catch (error) {
      toast.error("Google login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleSignup,
    isEmailSent,
    handleGoogleLogin,
  };
};
