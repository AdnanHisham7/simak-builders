import React, { useState, useEffect } from "react";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import {
  getCompanySummary,
  addCompanyFunds,
  CompanyTransaction,
} from "@/services/companyService";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import PageLoader from "@/components/ui/PageLoader";
import EmptyState from "@/components/ui/EmptyState";
import { DollarSign } from "lucide-react";
import { cn } from "@/lib/cn";
import { usePreferences } from "@/hooks/usePreferences";

interface CompanyFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (totalAmount: number) => void;
}

const CompanyFundsModal: React.FC<CompanyFundsModalProps> = ({
  isOpen,
  onClose,
  onUpdated,
}) => {
  const { formatNumber, formatDate } = usePreferences();
  const [totalAmount, setTotalAmount] = useState(0);
  const [transactions, setTransactions] = useState<CompanyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [amount, setAmount] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const data = await getCompanySummary();
      setTotalAmount(data.totalAmount);
      setTransactions(data.transactions);
    } catch (err) {
      toast.error("Failed to load company transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSummary();
      setShowAddForm(false);
      setAmount("");
      setNotes("");
    }
  }, [isOpen]);

  const handleAddFunds = async () => {
    if (isSubmitting) return;
    if (!amount || Number(amount) <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await addCompanyFunds(Number(amount), notes.trim());
      toast.success("Funds added successfully");
      onUpdated(result.totalAmount);
      setShowAddForm(false);
      setAmount("");
      setNotes("");
      fetchSummary();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to add funds");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title="Company Funds"
      description={`₹${formatNumber(totalAmount)} available`}
    >
      <div className="mb-5 flex justify-end">
        <Button variant="secondary" size="sm" onClick={() => setShowAddForm((v) => !v)}>
          <Plus size={15} /> Add funds
        </Button>
      </div>

      {showAddForm && (
        <div className="mb-5 space-y-3 rounded-console border border-console-border bg-console-bg p-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-console-text">Amount *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-full rounded-lg border border-console-border px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-console-text">
              Notes <span className="text-xs text-console-muted">(Optional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-console-border px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder="e.g. Owner capital infusion"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" disabled={isSubmitting} onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
            <Button size="sm" loading={isSubmitting} onClick={handleAddFunds}>
              Confirm add
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <PageLoader label="Loading transactions" fullHeight={false} />
      ) : transactions.length === 0 ? (
        <EmptyState icon={DollarSign} title="No transactions yet" description="Fund additions and deductions will appear here." />
      ) : (
        <div className="space-y-2">
          {transactions.map((tx) => (
            <div
              key={tx._id}
              className="flex items-center justify-between rounded-console border border-console-border p-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full",
                    tx.amount >= 0 ? "bg-success-50 text-success-700" : "bg-danger-50 text-danger-700",
                  )}
                >
                  {tx.amount >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                </div>
                <div>
                  <p className="text-sm font-medium text-console-text">{tx.description || tx.type}</p>
                  <p className="text-xs text-console-muted">
                    {formatDate(tx.date)}
                    {tx.site?.name ? ` • ${tx.site.name}` : ""}
                  </p>
                </div>
              </div>
              <p className={cn("font-semibold", tx.amount >= 0 ? "text-success-700" : "text-danger-700")}>
                {tx.amount >= 0 ? "+" : ""}
                {formatNumber(tx.amount)}
              </p>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default CompanyFundsModal;
