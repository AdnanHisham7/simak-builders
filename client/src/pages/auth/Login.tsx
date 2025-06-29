import React, { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";
import LoginForm from "@/components/auth/LoginForm";
import { useLogin } from "@/hooks/auth/useLogin";
import loginIllustration from "@/assets/login-illustration.svg";

const Login: React.FC = () => {
  const {
    isLoading,
    isResendingVerification,
    isEmailNotVerified,
    handleLogin,
    handleResendVerification,
    handleGoogleLogin,
  } = useLogin();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const navigate = useNavigate();

  const handleSubmit = () => {
    handleLogin(email, password);
  };

  console.log(loginIllustration);

  return (
    <div className="flex h-screen">
      {/* Left Side - Form */}
      <motion.div
        className="w-full lg:w-1/2 flex flex-col justify-center p-4 sm:p-8 md:p-12 lg:p-16 xl:p-24 bg-white"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-md w-full mx-auto">
          <div className="mb-6">
            <button
              onClick={() => navigate("/")}
              className="text-sm text-yellow-800 hover:text-yellow-600 font-medium hover:underline transition-colors"
            >
              ← Go to Home
            </button>
          </div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to access your account
            </p>
          </div>

          <LoginForm
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            isLoading={isLoading}
            handleSubmit={handleSubmit}
            isEmailNotVerified={isEmailNotVerified}
            handleResendVerification={() => handleResendVerification(email)}
            resendVerificationLoading={isResendingVerification}
            navigate={navigate}
          />

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>
            <div className="mt-6">
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => toast.error("Google login failed")}
              />
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="text-yellow-800 hover:text-yellow-600 font-medium hover:underline transition-colors"
            >
              Sign up
            </button>
          </p>
        </div>
      </motion.div>

      {/* Right Side - Info */}
      <motion.div
        className="lg:block lg:w-1/2 bg-yellow-600 relative shapedividers_com-left"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={loginIllustration}
            alt="Login Illustration"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
