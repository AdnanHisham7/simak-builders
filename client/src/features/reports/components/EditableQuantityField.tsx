import React, { useState } from "react";

interface EditableQuantityFieldProps {
  value: number | null;
  onCommit: (value: number | null) => void;
  disabled?: boolean;
  inputClassName?: string;
}

const DEFAULT_INPUT_CLASSNAME =
  "w-24 px-2 py-1.5 text-sm font-medium text-gray-900 text-center border border-transparent rounded-md hover:border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-colors";

const EditableQuantityField: React.FC<EditableQuantityFieldProps> = ({
  value,
  onCommit,
  disabled = false,
  inputClassName,
}) => {
  const [draft, setDraft] = useState<string | null>(null);

  const displayValue = value === null || value === undefined ? "" : String(value);
  const inputValue = draft !== null ? draft : displayValue;

  const commit = () => {
    if (draft === null) return;
    const trimmed = draft.trim();

    if (trimmed === "") {
      if (value !== null && value !== undefined) {
        onCommit(null);
      }
      setDraft(null);
      return;
    }

    const parsed = parseFloat(trimmed);
    if (!Number.isNaN(parsed)) {
      onCommit(parsed);
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
      type="number"
      step="any"
      placeholder="-"
      className={inputClassName || DEFAULT_INPUT_CLASSNAME}
      value={inputValue}
      disabled={disabled}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
    />
  );
};

export default EditableQuantityField;