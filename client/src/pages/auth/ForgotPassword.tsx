import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../components/ui/Input.tsx";
import Button from "../../components/ui/Button.tsx";
import { EnvelopeIcon } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";
import ConstructionSiteIllustration from "../../components/auth/ConstructionSiteIllustration.tsx";
import AuthInfo from "../../components/auth/AuthInfo.tsx";
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex h-screen"
    >
      {/* Left - Form Section */}
      <motion.div
        className="w-full flex flex-col justify-center items-center p-4 sm:p-8 md:p-12 lg:p-16 xl:p-24 bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-md w-full mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Forgot Password
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                type="email"
                name="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<EnvelopeIcon className="h-5 w-5 text-gray-400" />}
              />
            </div>

            <Button
              type="submit"
              loading={isLoading}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Remember your password?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
            >
              Back to Login
            </button>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ForgotPassword;
