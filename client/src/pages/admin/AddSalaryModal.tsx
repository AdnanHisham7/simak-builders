import React, { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { assignSalary } from "@/services/userService";

interface AddSalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  onAssigned: () => void;
}

const AddSalaryModal: React.FC<AddSalaryModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  onAssigned,
}) => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState<number | "">("");
  const [allowance, setAllowance] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [markAsPaid, setMarkAsPaid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setDate(new Date().toISOString().split("T")[0]);
    setAmount("");
    setAllowance("");
    setNotes("");
    setMarkAsPaid(false);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!amount || Number(amount) <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }
    if (allowance !== "" && Number(allowance) < 0) {
      toast.error("Allowance cannot be negative");
      return;
    }
    setIsSubmitting(true);
    try {
      await assignSalary(userId, {
        amount: Number(amount),
        date,
        allowance: allowance === "" ? 0 : Number(allowance),
        notes: notes.trim(),
        isVerified: markAsPaid,
      });
      toast.success("Salary assignment created");
      resetForm();
      onAssigned();
      onClose();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to create salary assignment",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            Add Salary Assignment
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500">
            For <span className="font-semibold text-gray-800">{userName}</span>
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Base salary amount"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Allowance{" "}
              <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={allowance}
              onChange={(e) =>
                setAllowance(
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional allowance, if any"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Any additional notes about this assignment..."
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={markAsPaid}
              onChange={(e) => setMarkAsPaid(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Mark as paid immediately
            </span>
          </label>
          <p className="text-xs text-gray-500">
            Leave unchecked if the salary is only being assigned now but not
            yet paid — you can mark it as paid later from the salary history.
          </p>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-gray-700 border-2 border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 font-medium"
          >
            {isSubmitting ? "Saving..." : "Add Salary Assignment"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddSalaryModal;