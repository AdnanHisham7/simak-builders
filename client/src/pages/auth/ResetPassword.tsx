import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { useResetPassword } from "@/hooks/auth/useResetPassword";

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { isLoading, handleResetPassword } = useResetPassword();

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const handleSubmit = () => {
    handleResetPassword(token, password, confirmPassword);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-screen"
    >
      {/* Left Panel (Form) */}
      <motion.div
        className="w-full lg:w-full flex flex-col justify-center p-4 sm:p-8 md:p-12 lg:p-16 xl:p-24 bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-md w-full mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Reset Password</h1>
            <p className="mt-2 text-sm text-gray-600">
              Enter and confirm your new password below.
            </p>
          </div>

          <ResetPasswordForm
            password={password}
            setPassword={setPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            showConfirmPassword={showConfirmPassword}
            setShowConfirmPassword={setShowConfirmPassword}
            isLoading={isLoading}
            handleSubmit={handleSubmit}
          />

          <p className="mt-6 text-center text-sm text-gray-600">
            Remember your password?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ResetPassword;
