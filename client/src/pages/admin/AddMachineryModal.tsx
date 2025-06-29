// pages/admin/AddMachineryRentalModal.tsx
import React, { useState } from "react";
import { X, Wrench, AlertCircle } from "lucide-react";
import { addMachineryRental } from "@/services/machineryRentalService";

interface AddMachineryRentalModalProps {
  siteId: string | null;
  onClose: () => void;
}

const AddMachineryRentalModal: React.FC<AddMachineryRentalModalProps> = ({ siteId, onClose }) => {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!description) newErrors.description = "Description is required";
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
      await addMachineryRental({
        siteId,
        description,
        amount: parseFloat(amount),
        date,
      });
      onClose();
    } catch (error) {
      setErrors({ submit: "Failed to add machinery/rental" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <Wrench className="w-6 h-6 text-blue-600" />
            <span>Add Machinery/Rental</span>
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Description *</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg ${errors.description ? "border-red-300" : "border-gray-200"}`}
            />
            {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg ${errors.amount ? "border-red-300" : "border-gray-200"}`}
            />
            {errors.amount && <p className="text-red-500 text-sm">{errors.amount}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg ${errors.date ? "border-red-300" : "border-gray-200"}`}
            />
            {errors.date && <p className="text-red-500 text-sm">{errors.date}</p>}
          </div>
        </div>

        {errors.submit && (
          <p className="text-red-500 text-sm mt-2 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.submit}
          </p>
        )}

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMachineryRentalModal;