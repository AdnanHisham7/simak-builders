import { ChevronDownIcon } from "@/assets/icons";
import React from "react";

interface SelectInputProps {
  options: string[];
  placeholder?: string;
  className?: string;
}

const SelectInput: React.FC<SelectInputProps> = ({
  options,
  placeholder,
  className = "",
}) => {
  return (
    <div className={`relative ${className}`}>
      <select
        className="w-full h-[44px] px-3 py-2 border border-gray-300 rounded-md text-sm
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
                   placeholder-gray-400 transition-all hover:border-gray-400
                   disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none"
      >
        {placeholder && (
          <option value="" disabled selected hidden>
            {placeholder}
          </option>
        )}
        {options.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>
      {/* Custom arrow (optional) */}
      <div className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
        <ChevronDownIcon className="h-4 w-4" />
      </div>
    </div>
  );
};

export default SelectInput;
