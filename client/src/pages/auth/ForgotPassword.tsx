import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../components/ui/Input.tsx";
import Button from "../../components/ui/Button.tsx";
import { EnvelopeIcon } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";
import { KeyRound, ArrowLeft } from "lucide-react";
import { useForgotPassword } from "@/hooks/auth/useForgotPassword.ts";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const { isLoading, handleForgotPassword } = useForgotPassword();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleForgotPassword(email);
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
            <KeyRound className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold text-console-text">Forgot password</h1>
          <p className="mt-2 text-sm text-console-muted">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-console-text">Email</label>
            <Input
              type="email"
              name="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<EnvelopeIcon className="h-5 w-5" />}
            />
          </div>

          <Button type="submit" loading={isLoading} disabled={isLoading} className="w-full" size="lg">
            {isLoading ? "Sending..." : "Send reset link"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="mt-6 flex w-full items-center justify-center gap-1.5 text-sm font-medium text-brand-700 transition-colors hover:text-brand-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </button>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
