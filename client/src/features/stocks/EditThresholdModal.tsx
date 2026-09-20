import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { updateStockThreshold } from "@/services/stockService";
import { toast } from "sonner";
import { Sliders, AlertTriangle } from "lucide-react";

interface EditThresholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: {
    id: string;
    name: string;
    unit: string;
    currentThreshold?: number;
  } | null;
  onSuccess: (newThreshold: number) => void;
}

const EditThresholdModal: React.FC<EditThresholdModalProps> = ({
  isOpen,
  onClose,
  stock,
  onSuccess,
}) => {
  const [threshold, setThreshold] = useState<number>(
    stock?.currentThreshold ?? 10
  );
  const [loading, setLoading] = useState(false);

  // Sync initial threshold when stock changes
  React.useEffect(() => {
    if (stock) {
      setThreshold(stock.currentThreshold ?? 10);
    }
  }, [stock]);

  if (!stock) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (threshold < 0) {
      toast.error("Threshold must be 0 or higher");
      return;
    }
    setLoading(true);
    try {
      await updateStockThreshold(stock.id, threshold);
      toast.success(`Low stock threshold updated to ${threshold} ${stock.unit}`);
      onSuccess(threshold);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update threshold");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configure Reorder Threshold"
      description={`Set the warning limit for ${stock.name}`}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200 flex items-start gap-2">
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
          <span>
            When inventory drops to or below this quantity, the system generates automatic reorder alerts and emails/notifications to site managers and admins.
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-console-muted mb-1">
            Minimum Stock Threshold ({stock.unit})
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="1"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              required
              className="w-full rounded-lg border border-console-border py-2.5 px-3.5 text-sm font-semibold text-console-text focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-console-muted font-medium uppercase">
              {stock.unit}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-console-muted">
            Recommended: 10% – 20% of typical weekly site usage.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-console-border">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            <Sliders size={15} /> Save Threshold
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditThresholdModal;
