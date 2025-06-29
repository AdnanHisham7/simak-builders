import React from "react";
import Spinner from "./Spinner";

interface ButtonProps {
  onClick?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "outline" | "pill-primary" | "pill-outline"; // <-- added new variants
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  onKeyDown,
  type = "button",
  children,
  className = "",
  loading = false,
  disabled = false,
  variant = "primary",
}) => {
  const variantClasses = (() => {
    switch (variant) {
      case "primary":
        return "bg-yellow-900 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-yellow-800";
      case "outline":
        return "bg-white border border-yellow-700 text-yellow-700 text-sm font-medium py-2 px-4 rounded-lg hover:bg-yellow-50";
      case "pill-primary":
        return "bg-yellow-900 text-white px-6 py-2 rounded-full hover:bg-yellow-800";
      case "pill-outline":
        return "bg-white border border-yellow-700 text-yellow-700 px-6 py-2 rounded-full hover:bg-yellow-50";
      default:
        return "";
    }
  })();

  return (
    <button
      type={type}
      onClick={onClick}
      onKeyDown={onKeyDown}
      disabled={disabled || loading}
      className={`
        transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
        ${variantClasses}
        ${className}
      `}
    >
      {loading && <Spinner />}
      {loading ? "Loading..." : children}
    </button>
  );
};

export default Button;
