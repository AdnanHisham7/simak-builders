import React, { useEffect, useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Contractor {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: "active" | "blocked";
  siteAssignments: { site: { id: string; name: string }; totalAmount: number }[];
}

interface AddContractorTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractor: Contractor;
  onAddTransaction: (data: any) => Promise<any>;
  defaultSiteId?: string;
}

const AddContractorTransactionModal: React.FC<
  AddContractorTransactionModalProps
> = ({ isOpen, onClose, contractor, onAddTransaction, defaultSiteId }) => {
  const [transaction, setTransaction] = useState({
    siteId: "",
    type: "",
    amount: 0,
    description: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  const predefinedCategories = [
    "electrical work",
    "plumbing",
    "Waterproofing",
    "landscaping",
    "concrete",
    "industrial work",
    "roofing work",
    "painting work",
    "plastering work",
  ];

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "other") {
      setShowCustomCategory(true);
      setCategory("");
    } else {
      setShowCustomCategory(false);
      setCategory(value);
      setCustomCategory("");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    if (name === "amount" && value !== "" && Number(value) < 0) {
      return;
    }
    setTransaction((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (defaultSiteId)
      setTransaction((prev) => ({ ...prev, siteId: defaultSiteId }));
  }, [defaultSiteId]);

  const handleAdd = async () => {
    if (isSubmitting) return;
    if (!transaction.siteId || !transaction.type || !transaction.amount) {
      setError("Please fill all required fields: site, type, and amount.");
      return;
    }
    if (Number(transaction.amount) <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }
    setIsSubmitting(true);
    try {
      const data = {
        contractorId: contractor.id,
        siteId: transaction.siteId,
        type: transaction.type as "advance" | "expense" | "additional_payment",
        amount: Number(transaction.amount),
        description: transaction.description,
        category: showCustomCategory ? customCategory : category,
      };
      await onAddTransaction(data);
      setTransaction({ siteId: "", type: "", amount: 0, description: "" });
      setError(null);
      onClose();
      toast.success("Transaction added successfully");
      // window.location.href = "/admin/contractors";
    } catch (err) {
      setError("Failed to add transaction. Ensure the site exists.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const assignedSites = contractor.siteAssignments.map(
    (assignment) => assignment.site,
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 max-w-lg w-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
        <h2 className="text-2xl font-bold mb-6">
          Add Transaction for {contractor.name}
        </h2>
        {assignedSites.length === 0 ? (
          <p className="text-red-500">No sites assigned to this contractor.</p>
        ) : (
          <>
            {!defaultSiteId ? (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Site *
                </label>
                <select
                  name="siteId"
                  value={transaction.siteId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-blue-50 transition-all duration-200"
                >
                  <option value="">Select a site</option>
                  {assignedSites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Site
                </label>
                <input
                  type="text"
                  value={
                    assignedSites.find((s) => s.id === defaultSiteId)?.name ||
                    ""
                  }
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-100 bg-gray-100 rounded-xl text-gray-600"
                />
              </div>
            )}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Type *
              </label>
              <select
                name="type"
                value={transaction.type}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-blue-50 transition-all duration-200"
              >
                <option value="">Select type</option>
                <option value="advance">Advance</option>
                <option value="expense">Expense</option>
                <option value="additional_payment">Additional Payment</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Amount *
              </label>
              <input
                type="number"
                name="amount"
                value={transaction.amount || ""}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-blue-50 transition-all duration-200"
                placeholder="Enter amount"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Category Type *
              </label>
              <select
                value={showCustomCategory ? "other" : category}
                onChange={handleCategoryChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
              >
                <option value="">Select category</option>
                {predefinedCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="other">Other (specify)</option>
              </select>
              {showCustomCategory && (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter custom category"
                  className="mt-2 w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                  required
                />
              )}
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Description
              </label>
              <input
                type="text"
                name="description"
                value={transaction.description}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-blue-50 transition-all duration-200"
                placeholder="Transaction description"
              />
            </div>
            {error && (
              <p className="text-red-500 text-sm mb-4 flex items-center">
                <AlertCircle size={16} className="mr-2" />
                {error}
              </p>
            )}
            <div className="flex justify-end">
              <button
                onClick={handleAdd}
                disabled={isSubmitting}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Adding..." : 'Add "Transaction"'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AddContractorTransactionModal;