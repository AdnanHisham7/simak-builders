import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { motion, AnimatePresence } from "framer-motion";
import SignupForm from "@/components/auth/SignupForm.tsx";
import Button from "@/components/ui/Button";
import loginIllustration from "@/assets/signup-illustration.svg";
import { toast } from "sonner";
import { useSignup } from "@/hooks/auth/useSignup";

// Company Prompt Component
const CompanyPrompt: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
    className="p-6 border rounded-md text-center"
  >
    <h3 className="text-lg font-semibold mb-2">Register Your Construction Company</h3>
    <p className="text-sm text-gray-600 mb-4">
      To register as a construction company, we need additional information to verify your business.
    </p>
    <Button
      type="button"
      className="w-full bg-yellow-600 text-white py-2 rounded-md"
      onClick={() => navigate("/company-registration")}
    >
      Continue to Company Registration
    </Button>
  </motion.div>
);

// Email Sent Message Component
export const EmailSentMessage = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
    className="mt-4 p-4 bg-yellow-100 text-yellow-700 rounded-md"
  >
    A verification email has been sent to your email address. Please check your inbox to activate your account.
  </motion.div>
);

const Signup: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"client" | "company">("client");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const { isLoading, isEmailSent, handleSignup, handleGoogleLogin } = useSignup();

  const handleSubmit = () => {
    handleSignup(email, password, confirmPassword);
  };

  return (
    <div className="flex h-screen">
      {/* Left Side - Illustration */}
      <motion.div
        className="lg:block lg:w-1/2 bg-yellow-600 relative shapedividers_com-right"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={loginIllustration}
            alt="Signup Illustration"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      </motion.div>

      {/* Right Side - Form */}
      <motion.div
        className="w-full lg:w-1/2 flex flex-col justify-center p-4 sm:p-8 md:p-12 lg:p-16 xl:p-24 bg-white"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-md w-full mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create an account</h1>
            <p className="mt-2 text-sm text-gray-600">
              Partner with us to connect with the right construction experts.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {role === "client" ? (
              isEmailSent ? (
                <EmailSentMessage key="email-sent" />
              ) : (
                <SignupForm
                  email={email}
                  setEmail={setEmail}
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
              )
            ) : (
              <CompanyPrompt key="company-prompt" navigate={navigate} />
            )}
          </AnimatePresence>

          {!isEmailSent && role === "client" && (
            <>
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">Or continue with</span>
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
                Already have an account?{" "}
                <span
                  onClick={() => navigate("/login")}
                  className="text-yellow-600 font-medium cursor-pointer hover:text-yellow-800 hover:underline transition-colors"
                >
                  Sign In
                </span>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
