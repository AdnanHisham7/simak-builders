import { useState, useEffect } from "react";
import { DollarSign } from "lucide-react";
import { toast } from "sonner";
import { settleVendorPayments } from "@/services/vendorService";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

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
        `This exceeds the outstanding balance of ₹${outstandingAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}. Enter an amount at or below that.`,
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
        `Settled ₹${numAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}. Remaining outstanding: ₹${result.remainingOutstanding.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
      );
      onSettled();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to settle payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      disableClose={isSubmitting}
      closeOnOverlayClick={!isSubmitting}
      title="Settle Payment"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isSubmitting}>
            Settle payment
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-console-muted">
          Vendor: <span className="font-semibold text-console-text">{vendorName}</span>
        </p>
        <div className="flex items-center justify-between rounded-console border border-info-100 bg-info-50 p-4">
          <span className="text-sm text-info-700">Outstanding balance</span>
          <span className="text-lg font-semibold text-info-700">
            ₹{outstandingAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          </span>
        </div>

        {error && (
          <div className="rounded-console border border-danger-100 bg-danger-50 p-3 text-sm text-danger-700">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-console-text">
            Amount to settle *
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-console-muted" size={16} />
            <input
              type="number"
              min="0"
              max={outstandingAmount}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full rounded-lg border border-console-border py-2.5 pl-9 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder="0.00"
            />
          </div>
          <button
            type="button"
            onClick={() => setAmount(outstandingAmount)}
            className="mt-1.5 text-xs font-medium text-brand-700 hover:text-brand-800"
          >
            Settle full outstanding amount
          </button>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-console-text">
            Notes <span className="text-xs text-console-muted">(Optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            placeholder="Any additional notes about this settlement..."
          />
        </div>
      </div>
    </Modal>
  );
};

export default SettleVendorModal;
