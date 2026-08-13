import React, { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, MailCheck } from "lucide-react";
import { verifyEmail } from "../../services/authService";
import { toast } from "sonner";

const VerifyEmail: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = new URLSearchParams(location.search).get("token");
  const hasVerified = useRef(false);

  useEffect(() => {
    const verify = async () => {
      if (token && !hasVerified.current) {
        hasVerified.current = true;
        try {
          await verifyEmail(token);
          toast.success("Email verified successfully!");
          navigate("/login");
        } catch (error) {
          toast.error("Invalid or expired token");
          navigate("/signup");
        }
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-console-bg p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="glass-panel flex w-full max-w-md flex-col items-center rounded-glass p-10 text-center shadow-glass-lg"
      >
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <MailCheck className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-semibold text-console-text">Verifying your email</h1>
        <p className="mt-2 text-sm text-console-muted">
          Please wait while we confirm your email address.
        </p>
        <Loader2 className="mt-6 h-6 w-6 animate-spin text-brand-600" />
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
