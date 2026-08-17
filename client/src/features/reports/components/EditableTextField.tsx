import React, { useState } from "react";

interface EditableTextFieldProps {
  value: string;
  onCommit: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  inputClassName?: string;
}

const DEFAULT_INPUT_CLASSNAME =
  "w-full min-w-[12rem] px-2 py-1.5 text-sm text-gray-900 border border-transparent rounded-md hover:border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-colors";

const EditableTextField: React.FC<EditableTextFieldProps> = ({
  value,
  onCommit,
  disabled = false,
  placeholder,
  inputClassName,
}) => {
  const [draft, setDraft] = useState<string | null>(null);

  const inputValue = draft !== null ? draft : value;

  const commit = () => {
    if (draft === null) return;
    const trimmed = draft.trim();
    if (trimmed !== "" && trimmed !== value) {
      onCommit(trimmed);
    }
    setDraft(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setDraft(null);
      e.currentTarget.blur();
    }
  };

  return (
    <input
      type="text"
      className={inputClassName || DEFAULT_INPUT_CLASSNAME}
      value={inputValue}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
    />
  );
};

export default EditableTextField;