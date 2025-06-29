import React, { useState } from "react";
import { X, AlertCircle } from "lucide-react";

interface Contractor {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: "active" | "blocked";
  siteAssignments: { site: { id: string; name: string }; balance: number }[];
}

interface AddContractorTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractor: Contractor;
  onAddTransaction: (data: any) => Promise<any>;
}

const AddContractorTransactionModal: React.FC<AddContractorTransactionModalProps> = ({
  isOpen,
  onClose,
  contractor,
  onAddTransaction,
}) => {
  const [transaction, setTransaction] = useState({
    siteId: "",
    type: "",
    amount: 0,
    description: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTransaction((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdd = async () => {
    if (!transaction.siteId || !transaction.type || !transaction.amount) {
      setError("Please fill all required fields: site, type, and amount.");
      return;
    }
    try {
      const data = {
        contractorId: contractor.id,
        siteId: transaction.siteId,
        type: transaction.type as "advance" | "expense" | "additional_payment",
        amount: Number(transaction.amount),
        description: transaction.description,
      };
      await onAddTransaction(data);
      setTransaction({ siteId: "", type: "", amount: 0, description: "" });
      setError(null);
      onClose();
      window.location.href = '/admin/contractors'
    } catch (err) {
      setError("Failed to add transaction. Ensure the site exists.");
    }
  };

  if (!isOpen) return null;

  const assignedSites = contractor.siteAssignments.map((assignment) => assignment.site);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 max-w-lg w-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
        <h2 className="text-2xl font-bold mb-6">Add Transaction for {contractor.name}</h2>
        {assignedSites.length === 0 ? (
          <p className="text-red-500">No sites assigned to this contractor.</p>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2">Site *</label>
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
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2">Type *</label>
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
              <label className="block text-gray-700 text-sm font-semibold mb-2">Amount *</label>
              <input
                type="number"
                name="amount"
                value={transaction.amount || ""}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-blue-50 transition-all duration-200"
                placeholder="Enter amount"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2">Description</label>
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
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                Add Transaction
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AddContractorTransactionModal;