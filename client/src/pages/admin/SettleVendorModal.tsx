import React, { useState, useEffect } from "react";
import { X, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { settleVendorPayments } from "@/services/vendorService";

interface SettleVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorId: string;
  vendorName: string;
  outstandingAmount: number;
  onSettled: () => void;
}

const SettleVendorModal: React.FC<SettleVendorModalProps> = ({
  isOpen,
  onClose,
  vendorId,
  vendorName,
  outstandingAmount,
  onSettled,
}) => {
  const [amount, setAmount] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setNotes("");
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setError(null);

    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter an amount greater than zero");
      return;
    }
    if (numAmount > outstandingAmount) {
      setError(
        `This exceeds the outstanding balance of $${outstandingAmount.toFixed(
          2,
        )}. Enter an amount at or below that.`,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await settleVendorPayments(vendorId, {
        amount: numAmount,
        notes: notes.trim(),
      });
      toast.success(
        `Settled $${numAmount.toFixed(2)}. Remaining outstanding: $${result.remainingOutstanding.toFixed(2)}`,
      );
      onSettled();
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to settle payment",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Settle Payment</h2>
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
            Vendor:{" "}
            <span className="font-semibold text-gray-800">{vendorName}</span>
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm text-blue-700">
              Outstanding balance
            </span>
            <span className="text-lg font-bold text-blue-900">
              ${outstandingAmount.toFixed(2)}
            </span>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount to Settle *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                min="0"
                max={outstandingAmount}
                step="0.01"
                value={amount}
                onChange={(e) =>
                  setAmount(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
            <button
              type="button"
              onClick={() => setAmount(outstandingAmount)}
              className="mt-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Settle full outstanding amount
            </button>
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
              placeholder="Any additional notes about this settlement..."
            />
          </div>
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
            className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-green-600 hover:to-blue-600 disabled:opacity-50 font-medium"
          >
            {isSubmitting ? "Settling..." : "Settle Payment"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettleVendorModal;