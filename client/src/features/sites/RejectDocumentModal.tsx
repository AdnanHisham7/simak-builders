import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { rejectDocumentSignature } from "@/services/siteService";
import { toast } from "sonner";
import { XCircle, AlertTriangle } from "lucide-react";

interface RejectDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string;
  documentId: string;
  documentName: string;
  onSuccess: () => void;
}

export const RejectDocumentModal: React.FC<RejectDocumentModalProps> = ({
  isOpen,
  onClose,
  siteId,
  documentId,
  documentName,
  onSuccess,
}) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setIsSubmitting(true);
    try {
      await rejectDocumentSignature(siteId, documentId, reason.trim());
      toast.success("Document has been rejected. Team notified.");
      onSuccess();
      onClose();
      setReason("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reject document");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reject Document"
      description={`Decline approval or signature for "${documentName}"`}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-900 flex items-start gap-2.5">
          <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
          <span>
            Rejecting this document will mark its status as <strong>Rejected</strong> and notify the document uploader with your reason so they can upload a revised version.
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Reason for Rejection <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Dimensions in Section B do not match structural drawings; please update electrical conduit specifications..."
            className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" loading={isSubmitting}>
            <XCircle size={14} /> Confirm Rejection
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RejectDocumentModal;
