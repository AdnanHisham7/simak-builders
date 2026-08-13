import { Send } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

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
    <Card>
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <Send size={16} />
        </div>
        <h3 className="text-base font-semibold text-console-text">Send money to admin</h3>
      </div>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-console-text">Amount (₹)</label>
          <input
            type="number"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            placeholder="Enter amount"
            min="0"
            step="0.01"
          />
        </div>
        <Button className="w-full" disabled={!isValidAmount()} onClick={handleSendMoney}>
          Send money
        </Button>
      </div>
    </Card>
  );
};

export default SendMoneyCard;
