import React, { useState, useEffect } from "react";
import { X, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import {
  getCompanySummary,
  addCompanyFunds,
  CompanyTransaction,
} from "@/services/companyService";

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

  if (!isOpen) return null;

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
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Company Funds</h2>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              ₹{totalAmount.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm((v) => !v)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:shadow-lg flex items-center gap-1 text-sm font-medium"
            >
              <Plus size={16} /> Add
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="p-6 border-b border-gray-100 bg-gray-50 space-y-3">
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
                  setAmount(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes{" "}
                <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g. Owner capital infusion"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddForm(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFunds}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {isSubmitting ? "Adding..." : "Confirm Add"}
              </button>
            </div>
          </div>
        )}

        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No transactions yet.
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx._id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        tx.amount >= 0
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {tx.amount >= 0 ? (
                        <TrendingUp size={16} />
                      ) : (
                        <TrendingDown size={16} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {tx.description || tx.type}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(tx.date).toLocaleDateString()}
                        {tx.site?.name ? ` • ${tx.site.name}` : ""}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`font-semibold ${
                      tx.amount >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {tx.amount >= 0 ? "+" : ""}
                    {tx.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyFundsModal;