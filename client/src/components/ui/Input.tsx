import React, { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import Tooltip from "@/components/ui/Tooltip";

interface InputProps {
  type?: string;
  placeholder?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon?: React.ReactNode;
  showToggle?: boolean;
}

const Input: React.FC<InputProps> = ({
  type = "text",
  placeholder,
  name,
  value,
  onChange,
  icon,
  showToggle = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPasswordType = type === "password";
  const inputType = showPassword && isPasswordType ? "text" : type;

  return (
    <div className="relative">
      {icon && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-console-muted">
          {icon}
        </div>
      )}
      <input
        type={inputType}
        placeholder={placeholder}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-console-border bg-white py-3 pl-10 pr-10 text-sm text-console-text transition-colors duration-200 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
      />
      {showToggle && isPasswordType && (
        <Tooltip label={showPassword ? "Hide password" : "Show password"}>
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-console-muted transition-colors hover:text-brand-700"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        </Tooltip>
      )}
    </div>
  );
};

export default Input;
