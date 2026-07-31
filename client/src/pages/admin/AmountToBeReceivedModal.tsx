import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  getAmountToBeReceived,
  AmountToBeReceivedSummary,
} from "@/services/companyService";
import Modal from "@/components/ui/Modal";
import PageLoader from "@/components/ui/PageLoader";
import EmptyState from "@/components/ui/EmptyState";
import { Building } from "lucide-react";
import { cn } from "@/lib/cn";

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title="Amount To Be Received"
      description={`₹${(data?.total ?? 0).toLocaleString()} · Sum of (site expenses − amount received) across all sites`}
    >
      {loading ? (
        <PageLoader label="Loading receivables" fullHeight={false} />
      ) : !data || data.bySite.length === 0 ? (
        <EmptyState icon={Building} title="No sites found" />
      ) : (
        <>
          <div className="overflow-hidden rounded-console border border-console-border">
            <table className="min-w-full divide-y divide-console-border">
              <thead className="bg-console-bg">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-console-muted">
                    Site
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-console-muted">
                    Client
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-console-muted">
                    Expenses
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-console-muted">
                    Received
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-console-muted">
                    To Be Received
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-console-border bg-white">
                {data.bySite.map((site) => (
                  <tr key={site.siteId}>
                    <td className="px-4 py-3 font-medium text-console-text">{site.siteName}</td>
                    <td className="px-4 py-3 text-console-muted">{site.clientName}</td>
                    <td className="px-4 py-3 text-right text-console-text">
                      ₹{site.expenses.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-console-text">
                      ₹{site.amountReceived.toLocaleString()}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right font-semibold",
                        site.amountToBeReceived > 0
                          ? "text-warning-700"
                          : site.amountToBeReceived < 0
                            ? "text-success-700"
                            : "text-console-muted",
                      )}
                    >
                      ₹{site.amountToBeReceived.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-console-muted">
            A negative "To Be Received" value means the client has paid more than the site's
            recorded expenses so far.
          </p>
        </>
      )}
    </Modal>
  );
};

export default AmountToBeReceivedModal;
