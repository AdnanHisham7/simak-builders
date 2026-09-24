import { useMemo } from "react";
import { Receipt, ArrowRight, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { usePreferences } from "@/hooks/usePreferences";
import { formatDate as formatDateUtil } from "@/utils/formatters";
import { cn } from "@/lib/cn";

interface Transaction {
  _id?: string;
  id?: string;
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
  const { formatDate, formatNumber, timezone } = usePreferences();

  const sortedTransactions = useMemo(() => {
    return (transactions || [])
      .map((tx, originalIndex) => ({ tx, originalIndex }))
      .sort((a, b) => {
        const timeA = new Date(a.tx.date).getTime();
        const timeB = new Date(b.tx.date).getTime();

        if (isNaN(timeA) && isNaN(timeB)) return b.originalIndex - a.originalIndex;
        if (isNaN(timeA)) return 1;
        if (isNaN(timeB)) return -1;

        // Group by calendar date (formatted as YYYY-MM-DD in user's timezone)
        const dateKeyA = formatDateUtil(a.tx.date, "YYYY-MM-DD", timezone);
        const dateKeyB = formatDateUtil(b.tx.date, "YYYY-MM-DD", timezone);

        if (dateKeyA !== dateKeyB) {
          // Different calendar days: later date comes first (e.g. "2026-09-24" before "2026-07-28")
          return dateKeyB.localeCompare(dateKeyA);
        }

        // On the same calendar day:
        // 1. If both have MongoDB _id, newer ObjectId was created later
        const idA = a.tx._id || a.tx.id;
        const idB = b.tx._id || b.tx.id;
        if (idA && idB && idA !== idB) {
          return String(idB).localeCompare(String(idA));
        }

        // 2. If both have distinct non-zero time components, sort by time
        const hasTimeA =
          a.tx.date &&
          new Date(a.tx.date).toISOString().slice(11, 19) !== "00:00:00";
        const hasTimeB =
          b.tx.date &&
          new Date(b.tx.date).toISOString().slice(11, 19) !== "00:00:00";

        if (hasTimeA && hasTimeB && timeA !== timeB) {
          return timeB - timeA;
        }

        // 3. Fallback to array insertion order: later element comes first
        return b.originalIndex - a.originalIndex;
      })
      .map((item) => item.tx);
  }, [transactions, timezone]);

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
