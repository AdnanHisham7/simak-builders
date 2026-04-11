import React, { useEffect, useState } from "react";
import { X, CheckCircle, Trash2 } from "lucide-react";
import { privateClient } from "@/api";
import { toast } from "sonner";

interface ClientPayment {
  _id: string;
  amount: number;
  notes: string;
  transactionDate: string;
  status: "pending" | "verified";
  verifiedBy?: { name: string };
  createdAt: string;
}

interface ClientPaymentsModalProps {
  siteId: string;
  onClose: () => void;
  onPaymentChanged: () => void; // refresh parent data
}

const ClientPaymentsModal: React.FC<ClientPaymentsModalProps> = ({
  siteId,
  onClose,
  onPaymentChanged,
}) => {
  const [payments, setPayments] = useState<ClientPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      const { data } = await privateClient.get(
        `/client/${siteId}/client-transactions`,
      );
      setPayments(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [siteId]);

  const handleVerify = async (transactionId: string) => {
    try {
      await privateClient.put(`/client/transactions/${transactionId}/verify`);
      toast.success("Payment verified successfully");
      fetchPayments();
      onPaymentChanged(); // refresh site budget and expenses
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Verification failed");
    }
  };

  const handleDelete = async (transactionId: string) => {
    if (
      !window.confirm("Delete this unverified payment? This cannot be undone.")
    )
      return;
    try {
      await privateClient.delete(`/client/transactions/${transactionId}`);
      toast.success("Payment deleted");
      fetchPayments();
      onPaymentChanged(); // in case any changes (though unverified didn't affect budgets)
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">Client Payments</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          {loading ? (
            <p className="text-center">Loading...</p>
          ) : payments.length === 0 ? (
            <p className="text-center text-gray-500">No payments recorded.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(
                        payment.transactionDate || payment.createdAt,
                      ).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold">
                      ₹{payment.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate">
                      {payment.notes || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          payment.status === "verified"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.status === "pending" && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleVerify(payment._id)}
                            className="text-green-600 hover:text-green-800"
                            title="Verify Payment"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(payment._id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete Payment"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      )}
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

export default ClientPaymentsModal;
