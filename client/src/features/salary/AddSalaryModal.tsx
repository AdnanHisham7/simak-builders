import { useState } from "react";
import { toast } from "sonner";
import { assignSalary } from "@/services/userService";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

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
      toast.error(err?.response?.data?.message || "Failed to create salary assignment");
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
      title="Add Salary Assignment"
      description={`For ${userName}`}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isSubmitting}>
            Add salary assignment
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-console-text">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-console-text">Amount *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            placeholder="Base salary amount"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-console-text">
            Allowance <span className="text-xs text-console-muted">(Optional)</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={allowance}
            onChange={(e) => setAllowance(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            placeholder="Additional allowance, if any"
          />
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
            placeholder="Any additional notes about this assignment..."
          />
        </div>

        <label className="flex cursor-pointer select-none items-center gap-2">
          <input
            type="checkbox"
            checked={markAsPaid}
            onChange={(e) => setMarkAsPaid(e.target.checked)}
            className="rounded border-console-border text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm text-console-text">Mark as paid immediately</span>
        </label>
        <p className="text-xs text-console-muted">
          Leave unchecked if the salary is only being assigned now but not yet paid — you can
          mark it as paid later from the salary history.
        </p>
      </div>
    </Modal>
  );
};

export default AddSalaryModal;
