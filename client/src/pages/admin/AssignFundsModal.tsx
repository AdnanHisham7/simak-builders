import { useState } from "react";
import { DollarSign } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface AssignFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => void;
}

const AssignFundsModal: React.FC<AssignFundsModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
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

  const handleClose = () => {
    setAmount("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Assign Funds"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Assign</Button>
        </>
      }
    >
      <label className="mb-1.5 block text-sm font-medium text-console-text">Amount (₹)</label>
      <div className="relative">
        <DollarSign
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-console-muted"
          size={16}
        />
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-lg border border-console-border py-2.5 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          placeholder="Enter amount"
          min="0"
        />
      </div>
    </Modal>
  );
};

export default AssignFundsModal;
