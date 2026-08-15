import { useState } from "react";
import { AlertTriangle, UserX } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  DeactivationRequest,
  cancelOwnDeactivationRequest,
  requestOwnDeactivation,
} from "@/services/userService";

interface DeactivateAccountCardProps {
  deactivationRequest: DeactivationRequest | undefined;
  onChange: (request: DeactivationRequest) => void;
}

const DeactivateAccountCard: React.FC<DeactivateAccountCardProps> = ({
  deactivationRequest,
  onChange,
}) => {
  const [reason, setReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const status = deactivationRequest?.status || "none";

  const handleSubmitRequest = async () => {
    setSubmitting(true);
    try {
      const updated = await requestOwnDeactivation(reason.trim() || undefined);
      onChange(updated);
      toast.success("Deactivation request submitted for admin approval");
      setReason("");
    } catch (err: any) {
      toast.error(
        err.response?.data?.error || "Failed to submit deactivation request",
      );
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelOwnDeactivationRequest();
      onChange({ status: "none" });
      toast.success("Deactivation request cancelled");
    } catch (err: any) {
      toast.error(
        err.response?.data?.error || "Failed to cancel deactivation request",
      );
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Card className="border-danger-100">
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-danger-50 text-danger-600">
          <UserX size={16} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-console-text">Deactivate my account</h3>
          <p className="text-xs text-console-muted">
            Submitting a request notifies an administrator, who must approve it
            before your account is deactivated.
          </p>
        </div>
      </div>

      {status === "pending" && (
        <div className="mb-5 flex items-start gap-2.5 rounded-console border border-warning-200 bg-warning-50 p-4 text-sm text-warning-800">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Deactivation request pending review</p>
            {deactivationRequest?.reason && (
              <p className="mt-1 text-warning-700">Reason: {deactivationRequest.reason}</p>
            )}
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="mt-3 text-sm font-medium text-warning-800 underline decoration-dotted hover:text-warning-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelling ? "Cancelling..." : "Cancel request"}
            </button>
          </div>
        </div>
      )}

      {status === "rejected" && (
        <div className="mb-5 rounded-console border border-console-border bg-console-bg p-4 text-sm text-console-muted">
          Your previous deactivation request was reviewed and not approved.
          {deactivationRequest?.reviewNotes && (
            <p className="mt-1">Admin notes: {deactivationRequest.reviewNotes}</p>
          )}
        </div>
      )}

      {status !== "pending" && (
        <div className="max-w-md space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-console-text">
              Reason (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Let the admin know why you're requesting deactivation"
              className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            Request account deactivation
          </Button>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleSubmitRequest}
        title="Request account deactivation?"
        message="An administrator will review this request. Your account stays active until it's approved, and you can cancel the request any time before then."
        variant="danger"
        confirmText="Submit request"
        isLoading={submitting}
      />
    </Card>
  );
};

export default DeactivateAccountCard;
