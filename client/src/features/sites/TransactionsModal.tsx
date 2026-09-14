import { useMemo } from "react";
import { Receipt, ArrowRight, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { usePreferences } from "@/hooks/usePreferences";
import { cn } from "@/lib/cn";

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
  const navigate = useNavigate();
  const { userType } = useSelector((state: RootState) => state.auth);
  const basePath = userType === "siteManager" ? "siteManager" : "admin";
  const { formatDate, formatNumber } = usePreferences();

  const sortedTransactions = useMemo(() => {
    return [...(transactions || [])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [transactions]);

  const handleNavigate = (url: string) => {
    onClose();
    navigate(url);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Expense transactions"
      description="Full transaction history for this site, newest first. Click a purchase or miscellaneous expense to view full details."
      size="xl"
    >
      {sortedTransactions.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No transactions yet"
          description="No transactions have been recorded for this site."
        />
      ) : (
        <div className="overflow-x-auto rounded-console border border-console-border">
          <table className="min-w-full divide-y divide-console-border">
            <thead className="bg-console-bg">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">
                  Description
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-console-muted">
                  Amount
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-console-muted">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-console-border bg-white">
              {sortedTransactions.map((transaction, index) => {
                const isPurchase = transaction.type === "purchase";
                const isMisc = transaction.type === "miscellaneous";
                const targetUrl =
                  isPurchase && transaction.relatedId
                    ? `/${basePath}/purchases/${transaction.relatedId}`
                    : isMisc && transaction.relatedId
                    ? `/${basePath}/miscellaneous-expenses/${transaction.relatedId}`
                    : null;

                return (
                  <tr
                    key={index}
                    className={cn(
                      "transition-colors",
                      targetUrl
                        ? "cursor-pointer hover:bg-brand-50/40"
                        : "hover:bg-console-bg"
                    )}
                    onClick={() => {
                      if (targetUrl) handleNavigate(targetUrl);
                    }}
                  >
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-console-text">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <Badge variant={isPurchase ? "default" : isMisc ? "info" : "neutral"}>
                        {typeLabels[transaction.type] ?? transaction.type}
                      </Badge>
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
                    <td className="whitespace-nowrap px-4 py-3.5 text-right text-sm">
                      {targetUrl ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavigate(targetUrl);
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100 hover:text-brand-900 transition-colors shadow-2xs"
                        >
                          View Details <ArrowRight size={12} />
                        </button>
                      ) : (
                        <span className="text-xs text-console-muted">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
};

export default TransactionsModal;
