import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { BadgeIndianRupee } from "lucide-react";
import { UserWithSalary } from "@/services/userService";

interface EditFixedSalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserWithSalary | null;
  onSave: (userId: string, newSalary: number) => Promise<void>;
  isLoading: boolean;
}

const EditFixedSalaryModal: React.FC<EditFixedSalaryModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
  isLoading,
}) => {
  const [fixedSalary, setFixedSalary] = useState<number>(0);

  useEffect(() => {
    if (user) {
      setFixedSalary(user.fixedSalary || 0);
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await onSave(user._id, fixedSalary);
  };

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Fixed Salary"
      description={`Set the monthly fixed base salary for ${user.name}`}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-console-text">
            Monthly Fixed Base (₹)
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-console-muted">
              ₹
            </span>
            <input
              type="number"
              min="0"
              step="100"
              value={fixedSalary}
              onChange={(e) => setFixedSalary(parseFloat(e.target.value) || 0)}
              required
              className="w-full rounded-lg border border-console-border py-2.5 pl-8 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            Update Salary
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditFixedSalaryModal;