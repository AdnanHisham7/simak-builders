import { useMemo } from "react";
import { Receipt } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { usePreferences } from "@/hooks/usePreferences";

interface Transaction {
  date: string;
  amount: number;
  type:
    | "purchase"
    | "miscellaneous"
    | "attendance"
    | "stockTransfer"
    | "client_payment"
    | "contractor_payment";
  description: string;
  relatedId: string;
  user: { id: string; name: string };
}

const typeLabels: Record<Transaction["type"], string> = {
  purchase: "Purchase",
  miscellaneous: "Miscellaneous",
  attendance: "Attendance",
  stockTransfer: "Stock transfer",
  client_payment: "Client payment",
  contractor_payment: "Contractor payment",
};

interface TransactionsModalProps {
  isOpen: boolean;
  transactions: Transaction[];
  onClose: () => void;
}

const TransactionsModal: React.FC<TransactionsModalProps> = ({
  isOpen,
  transactions,
  onClose,
}) => {
  const { formatDate, formatNumber } = usePreferences();
  const sortedTransactions = useMemo(() => {
    return [...(transactions || [])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [transactions]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Expense transactions"
      description="Full transaction history for this site, newest first"
      size="xl"
    >
      {sortedTransactions.length === 0 ? (
        <EmptyState icon={Receipt} title="No transactions yet" description="No transactions have been recorded for this site." />
      ) : (
        <div className="overflow-x-auto rounded-console border border-console-border">
          <table className="min-w-full divide-y divide-console-border">
            <thead className="bg-console-bg">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Description</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-console-muted">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-console-border bg-white">
              {sortedTransactions.map((transaction, index) => (
                <tr key={index} className="hover:bg-console-bg">
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm text-console-text">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <Badge variant="neutral">{typeLabels[transaction.type] ?? transaction.type}</Badge>
                  </td>
                  <td className="max-w-xs truncate px-4 py-3.5 text-sm text-console-muted">
                    {transaction.description}
                  </td>
                  <td
                    className={`whitespace-nowrap px-4 py-3.5 text-right text-sm font-semibold ${
                      transaction.amount >= 0 ? "text-success-700" : "text-danger-600"
                    }`}
                  >
                    {transaction.amount >= 0 ? "+" : "-"}₹
                    {formatNumber(Math.abs(transaction.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
};

export default TransactionsModal;
