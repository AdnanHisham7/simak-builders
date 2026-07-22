import React, { useState } from "react";

interface EditableAmountFieldProps {
  value: number;
  onCommit: (value: number) => void;
  disabled?: boolean;
  hint?: string;
  inputClassName?: string;
  currencyClassName?: string;
}

const DEFAULT_INPUT_CLASSNAME =
  "w-32 px-2 py-1.5 text-sm font-medium text-gray-900 text-right border border-transparent rounded-md hover:border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-colors";
const DEFAULT_CURRENCY_CLASSNAME = "text-sm text-gray-400 mr-1";

const EditableAmountField: React.FC<EditableAmountFieldProps> = ({
  value,
  onCommit,
  disabled = false,
  hint,
  inputClassName,
  currencyClassName,
}) => {
  const [draft, setDraft] = useState<string | null>(null);

  const inputValue = draft !== null ? draft : String(value);

  const commit = () => {
    if (draft === null) return;
    const trimmed = draft.trim();
    const parsed = parseFloat(trimmed);
    if (trimmed !== "" && !Number.isNaN(parsed)) {
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
    <div className="inline-flex flex-col items-end">
      <div className="flex items-center justify-end">
        <span className={currencyClassName || DEFAULT_CURRENCY_CLASSNAME}>₹</span>
        <input
          type="number"
          step="0.01"
          className={inputClassName || DEFAULT_INPUT_CLASSNAME}
          value={inputValue}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
        />
      </div>
      {hint && <span className="text-[11px] text-gray-400 mt-0.5">{hint}</span>}
    </div>
  );
};

export default EditableAmountField;