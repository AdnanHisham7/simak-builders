import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import {
  getAmountToBeReceived,
  AmountToBeReceivedSummary,
} from "@/services/companyService";

interface AmountToBeReceivedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AmountToBeReceivedModal: React.FC<AmountToBeReceivedModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [data, setData] = useState<AmountToBeReceivedSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    getAmountToBeReceived()
      .then(setData)
      .catch(() => toast.error("Failed to load receivables"))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Amount To Be Received
            </h2>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              ₹{(data?.total ?? 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Sum of (site expenses − amount received) across all sites
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : !data || data.bySite.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No sites found.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Site
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Client
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                      Expenses
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                      Received
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                      To Be Received
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.bySite.map((site) => (
                    <tr key={site.siteId}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {site.siteName}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {site.clientName}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        ₹{site.expenses.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        ₹{site.amountReceived.toLocaleString()}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-semibold ${
                          site.amountToBeReceived > 0
                            ? "text-amber-600"
                            : site.amountToBeReceived < 0
                              ? "text-green-600"
                              : "text-gray-500"
                        }`}
                      >
                        ₹{site.amountToBeReceived.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-4">
            A negative "To Be Received" value means the client has paid more
            than the site's recorded expenses so far.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AmountToBeReceivedModal;