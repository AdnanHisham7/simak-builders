import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
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
    <div className="flex min-h-screen items-center justify-center bg-console-bg p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="glass-panel w-full max-w-md rounded-glass p-8 shadow-glass-lg sm:p-10"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold text-console-text">Reset password</h1>
          <p className="mt-2 text-sm text-console-muted">
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

        <p className="mt-6 text-center text-sm text-console-muted">
          Remember your password?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="font-medium text-brand-700 transition-colors hover:text-brand-800 hover:underline"
          >
            Sign in
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
