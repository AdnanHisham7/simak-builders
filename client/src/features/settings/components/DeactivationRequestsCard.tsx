import { useCallback, useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  PendingDeactivationRequest,
  listDeactivationRequests,
  reviewDeactivationRequest,
} from "@/services/userService";
import { useDashboardContext } from "@/context/DashboardContext";

const DeactivationRequestsCard: React.FC = () => {
  const [requests, setRequests] = useState<PendingDeactivationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{
    userId: string;
    decision: "approve" | "reject";
  } | null>(null);
  const { pendingDeactivationCount, setPendingDeactivationCount } = useDashboardContext();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listDeactivationRequests();
      setRequests(data);
      setPendingDeactivationCount(data.length);
    } catch (err) {
      toast.error("Failed to load deactivation requests");
    } finally {
      setLoading(false);
    }
  }, [setPendingDeactivationCount]);

  useEffect(() => {
    load();
  }, [load]);

  const handleReview = async () => {
    if (!confirmTarget) return;
    setActioning(confirmTarget.userId);
    try {
      await reviewDeactivationRequest(confirmTarget.userId, confirmTarget.decision);
      toast.success(
        confirmTarget.decision === "approve"
          ? "Account deactivated"
          : "Request rejected",
      );
      setRequests((prev) => prev.filter((r) => r.id !== confirmTarget.userId));
      setPendingDeactivationCount(Math.max(0, pendingDeactivationCount - 1));
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to process request");
    } finally {
      setActioning(null);
      setConfirmTarget(null);
    }
  };

  if (!loading && requests.length === 0) {
    return null;
  }

  return (
    <Card className="border-warning-200">
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning-50 text-warning-700">
          <ShieldAlert size={16} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-console-text">
            Pending deactivation requests
          </h3>
          <p className="text-xs text-console-muted">
            Users who have asked to have their accounts deactivated.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
        </div>
      ) : (
        <ul className="divide-y divide-console-border">
          {requests.map((request) => (
            <li
              key={request.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium text-console-text">{request.name}</p>
                <p className="text-xs text-console-muted">
                  {request.email} &middot; {request.role}
                </p>
                {request.deactivationRequest.reason && (
                  <p className="mt-1 text-xs text-console-muted">
                    "{request.deactivationRequest.reason}"
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={actioning === request.id}
                  onClick={() =>
                    setConfirmTarget({ userId: request.id, decision: "reject" })
                  }
                  className="rounded-lg border border-console-border px-3 py-1.5 text-sm font-medium text-console-text hover:bg-console-bg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Reject
                </button>
                <button
                  type="button"
                  disabled={actioning === request.id}
                  onClick={() =>
                    setConfirmTarget({ userId: request.id, decision: "approve" })
                  }
                  className="rounded-lg bg-danger-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-danger-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Approve
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        isOpen={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleReview}
        title={
          confirmTarget?.decision === "approve"
            ? "Approve deactivation?"
            : "Reject this request?"
        }
        message={
          confirmTarget?.decision === "approve"
            ? "This will deactivate the user's account and log them out of all devices."
            : "The user will be notified that their request was not approved."
        }
        variant={confirmTarget?.decision === "approve" ? "danger" : "default"}
        confirmText={confirmTarget?.decision === "approve" ? "Approve" : "Reject"}
        isLoading={!!actioning}
      />
    </Card>
  );
};

export default DeactivationRequestsCard;
