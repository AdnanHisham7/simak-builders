import { useEffect, useState } from "react";
import { CheckCircle, Trash2, Wallet } from "lucide-react";
import { privateClient } from "@/api";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PageLoader from "@/components/ui/PageLoader";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";

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
  onPaymentChanged: () => void;
}

const ClientPaymentsModal: React.FC<ClientPaymentsModalProps> = ({
  siteId,
  onClose,
  onPaymentChanged,
}) => {
  const [payments, setPayments] = useState<ClientPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClientPayment | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPayments = async () => {
    try {
      const { data } = await privateClient.get(`/client/${siteId}/client-transactions`);
      setPayments(data);
    } catch (err) {
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  const handleVerify = async (transactionId: string) => {
    setVerifyingId(transactionId);
    try {
      await privateClient.put(`/client/transactions/${transactionId}/verify`);
      toast.success("Payment verified successfully");
      fetchPayments();
      onPaymentChanged();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await privateClient.delete(`/client/transactions/${deleteTarget._id}`);
      toast.success("Payment deleted");
      fetchPayments();
      onPaymentChanged();
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Modal isOpen onClose={onClose} title="Client Payments" size="lg">
        {loading ? (
          <PageLoader label="Loading payments" fullHeight={false} />
        ) : payments.length === 0 ? (
          <EmptyState icon={Wallet} title="No payments recorded" />
        ) : (
          <div className="overflow-x-auto rounded-console border border-console-border">
            <table className="min-w-full divide-y divide-console-border">
              <thead className="bg-console-bg">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Notes</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-console-border bg-white">
                {payments.map((payment) => (
                  <tr key={payment._id}>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-console-text">
                      {new Date(payment.transactionDate || payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm font-semibold text-console-text">
                      ₹{payment.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3.5 text-sm text-console-muted">
                      {payment.notes || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <Badge variant={payment.status === "verified" ? "success" : "warning"}>
                        {payment.status}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      {payment.status === "pending" && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleVerify(payment._id)}
                            disabled={verifyingId === payment._id}
                            aria-label="Verify payment"
                            title="Verify payment"
                            className="rounded-lg p-2 text-success-600 transition-colors hover:bg-success-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(payment)}
                            aria-label="Delete payment"
                            title="Delete payment"
                            className="rounded-lg p-2 text-danger-600 transition-colors hover:bg-danger-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete payment"
        message="Delete this unverified payment? This cannot be undone."
        variant="danger"
        confirmText="Delete"
        isLoading={deleting}
      />
    </>
  );
};

export default ClientPaymentsModal;
