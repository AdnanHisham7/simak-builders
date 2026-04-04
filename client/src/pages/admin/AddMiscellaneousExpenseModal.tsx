// components/AddMiscellaneousModal.tsx
import React, { useState } from "react";
import { X, Plus, AlertCircle } from "lucide-react";
import { addMiscellaneousExpense } from "@/services/miscellaneousExpenseService";  // update service

interface Props {
  siteId: string;
  onClose: () => void;
}

const AddMiscellaneousExpenseModal: React.FC<Props> = ({ siteId, onClose }) => {
  const [category, setCategory] = useState<"machinery" | "rental" | "service">("machinery");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [tip, setTip] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = "Name is required";
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = "Valid amount is required";
    }
    if (!date) newErrors.date = "Date is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      await addMiscellaneousExpense({
        siteId,
        category,
        name: name.trim(),
        amount: parseFloat(amount),
        tip: tip ? parseFloat(tip) : 0,
        notes: notes.trim(),
        date,
      });
      onClose();
      // toast.success("Expense added successfully"); if you use sonner
    } catch (error: any) {
      setErrors({ submit: error.response?.data?.message || "Failed to add expense" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <Plus className="w-6 h-6 text-blue-600" />
            <span>Add Miscellaneous Expense</span>
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="machinery">Machinery</option>
              <option value="rental">Rental</option>
              <option value="service">Service</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name / Description *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg ${errors.name ? "border-red-300" : "border-gray-200"}`}
              placeholder="e.g., JCB Hire, Generator Service"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg ${errors.amount ? "border-red-300" : "border-gray-200"}`}
                placeholder="0.00"
                step="0.01"
              />
              {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tip (₹) Optional</label>
              <input
                type="number"
                value={tip}
                onChange={(e) => setTip(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                placeholder="0.00"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg h-20"
              placeholder="Any additional details..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            />
          </div>
        </div>

        {errors.submit && (
          <p className="text-red-500 text-sm mt-4 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.submit}
          </p>
        )}

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-5 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-70"
          >
            {loading ? "Adding..." : "Add Expense"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMiscellaneousExpenseModal;