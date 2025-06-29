import React from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

interface SendMoneyCardProps {
  amountStr: string;
  setAmountStr: (value: string) => void;
  onSendMoneyRequest: () => void;
}

const SendMoneyCard: React.FC<SendMoneyCardProps> = ({
  amountStr,
  setAmountStr,
  onSendMoneyRequest,
}) => {
  const isValidAmount = () => {
    const num = parseFloat(amountStr);
    return !isNaN(num) && num > 0;
  };

  const handleSendMoney = () => {
    if (!isValidAmount()) {
      toast.error("Please enter a valid amount");
      return;
    }
    onSendMoneyRequest();
  };

  return (
    <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 p-6">
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-800 to-amber-900 rounded-t-2xl" />
      <div className="flex items-center gap-3 mb-6">
        <Send size={24} />
        <h3 className="text-xl font-bold text-gray-800">Send Money to Admin</h3>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount (₹)
          </label>
          <input
            type="number"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
            placeholder="Enter amount"
            min="0"
            step="0.01"
          />
        </div>
        <button
          onClick={handleSendMoney}
          disabled={!isValidAmount()}
          className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 transform ${
            !isValidAmount()
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-amber-800 to-amber-900 text-white hover:shadow-lg hover:scale-105 active:scale-95"
          }`}
        >
          Send Money
        </button>
      </div>
    </div>
  );
};

export default SendMoneyCard;