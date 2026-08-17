import { useEffect, useState } from "react";
import { DollarSign, Filter, Check, X } from "lucide-react";
import { toast } from "sonner";
import {
  getAllExpenseRequests,
  approveExpenseRequest,
  rejectExpenseRequest,
  ExpenseRequest,
  ExpenseRequestStatus,
} from "@/services/expenseRequestService";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonTable } from "@/components/ui/Skeleton";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import Modal from "@/components/ui/Modal";
import { usePreferences } from "@/hooks/usePreferences";
import { useDashboardContext } from "@/context/DashboardContext";
import { useHighlightFromQuery } from "@/hooks/useHighlightFromQuery";
import { useSearchParams } from "react-router-dom";

type StatusFilter = "all" | ExpenseRequestStatus;

const statusBadge: Record<
  ExpenseRequest["status"],
  { variant: "warning" | "success" | "error"; label: string }
> = {
  pending: { variant: "warning", label: "Pending review" },
  approved: { variant: "success", label: "Approved" },
  rejected: { variant: "error", label: "Rejected" },
};

const AdminExpenseRequests: React.FC = () => {
  const { formatDate, formatNumber } = usePreferences();
  const { expenseRequestPendingCount, setExpenseRequestPendingCount } =
    useDashboardContext();
  const [searchParams] = useSearchParams();
  const [requests, setRequests] = useState<ExpenseRequest[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() =>
    searchParams.get("highlight") ? "all" : "pending",
  );
  const [approveTarget, setApproveTarget] = useState<ExpenseRequest | null>(
    null,
  );
  const [rejectTarget, setRejectTarget] = useState<ExpenseRequest | null>(
    null,
  );
  const [rejectNotes, setRejectNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const loadRequests = async (status: StatusFilter) => {
    setLoading(true);
    try {
      const response = await getAllExpenseRequests({
        status: status === "all" ? undefined : status,
        limit: 50,
      });
      setRequests(response.data);
      setPendingCount(response.pendingCount ?? 0);
    } catch (error) {
      toast.error("Failed to load expense requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const highlightedId = useHighlightFromQuery(!loading && requests.length > 0);

  const handleApprove = async () => {
    if (!approveTarget) return;
    setProcessing(true);
    try {
      await approveExpenseRequest(approveTarget._id);
      setExpenseRequestPendingCount(Math.max(0, expenseRequestPendingCount - 1));
      toast.success("Expense request approved");
      setApproveTarget(null);
      await loadRequests(statusFilter);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to approve request",
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setProcessing(true);
    try {
      await rejectExpenseRequest(rejectTarget._id, rejectNotes.trim());
      setExpenseRequestPendingCount(Math.max(0, expenseRequestPendingCount - 1));
      toast.success("Expense request rejected");
      setRejectTarget(null);
      setRejectNotes("");
      await loadRequests(statusFilter);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to reject request",
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-console-text">
            Expense Requests
          </h1>
          <p className="mt-0.5 text-sm text-console-muted">
            {pendingCount} request{pendingCount === 1 ? "" : "s"} pending review
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-console-muted" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {loading ? (
        <SkeletonTable columns={5} />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No expense requests found"
          description="Architect expense requests will appear here as they're submitted."
        />
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-console-border">
              <thead className="bg-console-bg">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">
                    Architect
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">
                    Site
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">
                    Request
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-console-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-console-border">
                {requests.map((request) => {
                  const architect =
                    typeof request.architect === "object"
                      ? request.architect.name
                      : "Architect";
                  const site =
                    typeof request.site === "object"
                      ? request.site.name
                      : "Site";
                  const status = statusBadge[request.status];
                  return (
                    <tr
                      key={request._id}
                      id={`highlight-${request._id}`}
                      className={`transition-colors duration-700 hover:bg-console-bg ${
                        highlightedId === request._id
                          ? "bg-brand-50 ring-2 ring-inset ring-brand-400"
                          : ""
                      }`}
                    >
                      <td className="whitespace-nowrap px-4 py-3.5 text-sm text-console-text">
                        {architect}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-sm text-console-text">
                        {site}
                      </td>
                      <td className="max-w-xs px-4 py-3.5">
                        <div className="text-sm font-medium text-console-text">
                          {request.title}
                        </div>
                        <div className="text-xs capitalize text-console-muted">
                          {request.category} • {formatDate(request.createdAt)}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-sm font-semibold text-brand-700">
                        ₹{formatNumber(request.amount)}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        {request.status === "pending" ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setApproveTarget(request)}
                              aria-label="Approve request"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-success-600 transition-colors hover:bg-success-50"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectTarget(request)}
                              aria-label="Reject request"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-danger-600 transition-colors hover:bg-danger-50"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <span className="block text-center text-xs text-console-muted">
                            {request.reviewedBy && typeof request.reviewedBy === "object"
                              ? `by ${request.reviewedBy.name}`
                              : "—"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ConfirmationModal
        isOpen={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={handleApprove}
        title="Approve expense request"
        description={
          approveTarget
            ? `This will approve "${approveTarget.title}" for ₹${formatNumber(approveTarget.amount)} and record it as a verified company expense.`
            : ""
        }
        confirmText="Approve"
        theme="success"
        isLoading={processing}
      />

      <Modal
        isOpen={!!rejectTarget}
        onClose={() => {
          setRejectTarget(null);
          setRejectNotes("");
        }}
        title="Reject expense request"
        description={rejectTarget?.title}
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setRejectTarget(null);
                setRejectNotes("");
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" loading={processing} onClick={handleReject}>
              Reject Request
            </Button>
          </>
        }
      >
        <label
          htmlFor="reject-notes"
          className="mb-1 block text-xs font-medium text-console-muted"
        >
          Reason (optional)
        </label>
        <textarea
          id="reject-notes"
          value={rejectNotes}
          onChange={(e) => setRejectNotes(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="Let the architect know why this was rejected..."
          className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </Modal>
    </div>
  );
};

export default AdminExpenseRequests;