import { useState } from "react";
import { DollarSign, X } from "lucide-react";
import { toast } from "sonner";

const AssignFundsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
  const [amount, setAmount] = useState("");

  const handleSubmit = () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }
    onSubmit(parsedAmount);
    setAmount("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Assign Funds</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount
          </label>
          <div className="relative">
            <DollarSign
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
              placeholder="Enter amount"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignFundsModal;
