import React, { useState, useEffect } from "react";
import { X, Activity, AlertCircle } from "lucide-react";
import { getContractorTransactions } from "@/services/contractorService";

interface Contractor {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: "active" | "blocked";
  siteAssignments: { site: { id: string; name: string }; balance: number }[];
}

interface ContractorTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractor: Contractor | null;
  transactions: any[];
  setTransactions: (transactions: any[]) => void;
  selectedSiteId: string;
  setError: (error: string | null) => void; // Added to align with parent props
  isAnimating: boolean;
}

const ContractorTransactionsModal: React.FC<ContractorTransactionsModalProps> = ({
  isOpen,
  onClose,
  contractor,
  transactions,
  setTransactions,
  selectedSiteId,
  setError,
  isAnimating,
}) => {
  const [currentSiteId, setCurrentSiteId] = useState(selectedSiteId);

  useEffect(() => {
    setCurrentSiteId(selectedSiteId);
    if (selectedSiteId && contractor) {
      fetchTransactions(selectedSiteId);
    }
  }, [selectedSiteId, contractor]);

  const fetchTransactions = async (siteId: string) => {
    try {
      const txs = await getContractorTransactions(contractor!.id, siteId);
      setTransactions(txs);
      setError(null);
    } catch (err) {
      setError("Failed to fetch transactions.");
    }
  };

  const handleSiteChange = async (siteId: string) => {
    setCurrentSiteId(siteId);
    if (siteId) {
      await fetchTransactions(siteId);
    } else {
      setTransactions([]);
    }
  };

  if (!isOpen || !contractor) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`relative bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-200 transform ${
          isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
        } max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col`}
      >
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-t-2xl" />
        <div className="p-8 flex-shrink-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Activity size={24} className="mr-3 text-blue-600" />
              Transactions for {contractor.name}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Select Site
            </label>
            <select
              value={currentSiteId}
              onChange={(e) => handleSiteChange(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-blue-50 transition-all duration-200"
            >
              <option value="">Select a site to view transactions</option>
              {contractor.siteAssignments.map((assignment) => (
                <option key={assignment.site.id} value={assignment.site.id}>
                  {assignment.site.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 px-8 pb-8">
          {currentSiteId && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Transactions for{" "}
                {contractor.siteAssignments.find(
                  (a) => a.site.id === currentSiteId
                )?.site.name || "Unknown Site"}
              </h3>
              {transactions.length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((tx) => (
                        <tr key={tx.id}>
                          <td className="px-6 py-4 whitespace-nowrap">{tx.type}</td>
                          <td className="px-6 py-4 whitespace-nowrap">${tx.amount.toFixed(2)}</td>
                          <td className="px-6 py-4">{tx.description || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {new Date(tx.date).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No transactions found for this site.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContractorTransactionsModal;