import { useMemo } from 'react';
import { X } from "lucide-react";

interface Transaction {
  date: string;
  amount: number;
  type: "purchase" | "rental" | "attendance" | "stockTransfer";
  description: string;
  relatedId: string;
  user: { id: string; name: string };
}

const TransactionsModal = ({
  transactions,
  onClose,
}: {
  transactions: Transaction[];
  onClose: () => void;
}) => {
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto scrollbar-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Expense Transactions
          </h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          {sortedTransactions.length === 0 ? (
            <p className="text-gray-600 text-center py-4">
              No transactions found.
            </p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedTransactions.map((transaction, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {transaction.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {transaction.description}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap ${
                        transaction.amount >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.amount >= 0 ? "+" : "-"}₹
                      {Math.abs(transaction.amount).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionsModal;