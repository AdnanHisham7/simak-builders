import React, { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

interface InputProps {
  type?: string;
  placeholder?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon?: React.ReactNode;
  showToggle?: boolean; // <- new prop
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
    <div className="relative rounded-md shadow-sm">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {icon}
        </div>
      )}
      <input
        type={inputType}
        placeholder={placeholder}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full py-3 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200`}
      />
      {showToggle && isPasswordType && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          ) : (
            <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          )}
        </button>
      )}
    </div>
  );
};

export default Input;
