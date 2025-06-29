import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center min-h-[100dvh] bg-gray-100 px-4"
    >
      <h1 className="text-6xl font-bold text-gray-800 mb-2">404</h1>
      <h2 className="text-2xl font-semibold text-gray-600 mb-4 text-center">
        Oops! Page Not Found
      </h2>
      <p className="text-gray-500 mb-6 text-center max-w-md">
        The page you're looking for doesn't exist or has been moved. Let's get
        you back on track!
      </p>
      <Button
        onClick={handleGoHome}
        onKeyDown={(e) => e.key === "Enter" && handleGoHome()}
      >
        Back to Home
      </Button>
    </motion.div>
  );
};

export default NotFound;
