import { useState } from "react";
import {
  CheckCircle,
  Download,
  FileText,
  Receipt,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Shield,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface CompleteSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deleteSiteDocuments: boolean, deletePurchaseBills: boolean) => void;
  downloadSiteDocuments: () => void;
  downloadPurchaseBills: () => void;
}

const CompleteSiteModal: React.FC<CompleteSiteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  downloadSiteDocuments,
  downloadPurchaseBills,
}) => {
  const [step, setStep] = useState(1);
  const [deleteSiteDocuments, setDeleteSiteDocuments] = useState(false);
  const [deletePurchaseBills, setDeletePurchaseBills] = useState(false);
  const [downloadingDocs, setDownloadingDocs] = useState(false);
  const [downloadingBills, setDownloadingBills] = useState(false);

  const handleClose = () => {
    onClose();
    setStep(1);
    setDeleteSiteDocuments(false);
    setDeletePurchaseBills(false);
  };

  const handleDownloadDocs = async () => {
    setDownloadingDocs(true);
    await downloadSiteDocuments();
    setTimeout(() => setDownloadingDocs(false), 2000);
  };

  const handleDownloadBills = async () => {
    setDownloadingBills(true);
    await downloadPurchaseBills();
    setTimeout(() => setDownloadingBills(false), 2000);
  };

  const handleFinalConfirm = () => {
    onConfirm(deleteSiteDocuments, deletePurchaseBills);
    handleClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      title={step === 1 ? "Complete Site" : "Confirm Completion"}
      description={step === 1 ? "Manage documents before completion" : "Final confirmation required"}
      footer={
        <div className="flex w-full justify-between">
          <Button variant="secondary" onClick={step === 1 ? handleClose : () => setStep(1)}>
            {step === 2 && <ArrowLeft size={15} />}
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          <Button variant={step === 1 ? "primary" : "primary"} onClick={step === 1 ? () => setStep(2) : handleFinalConfirm}>
            {step === 1 ? "Continue" : "Complete site"}
            {step === 1 && <ArrowRight size={15} />}
          </Button>
        </div>
      }
    >
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm font-medium text-brand-700">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-700 text-xs font-semibold text-white">
            1
          </div>
          Document management
        </div>
        <div className={cn("h-px flex-1", step >= 2 ? "bg-brand-700" : "bg-console-border")} />
        <div
          className={cn(
            "flex items-center gap-2 text-sm font-medium",
            step >= 2 ? "text-brand-700" : "text-console-muted",
          )}
        >
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
              step >= 2 ? "bg-brand-700 text-white" : "bg-console-bg text-console-muted",
            )}
          >
            2
          </div>
          Final confirmation
        </div>
      </div>

      {step === 1 ? (
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-console border border-info-100 bg-info-50 p-4">
            <Shield size={18} className="mt-0.5 shrink-0 text-info-600" />
            <div>
              <h3 className="mb-1 text-sm font-semibold text-info-900">Before you continue</h3>
              <p className="text-sm text-info-700">
                Download important documents before completion. You can also choose to delete
                files to free up storage space.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-console border border-console-border p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info-50 text-info-700">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-console-text">Site documents</h3>
                    <p className="text-xs text-console-muted">Client and site-related files</p>
                  </div>
                </div>
                <Button size="sm" variant="secondary" loading={downloadingDocs} onClick={handleDownloadDocs}>
                  <Download size={14} /> Download ZIP
                </Button>
              </div>
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={deleteSiteDocuments}
                  onChange={(e) => setDeleteSiteDocuments(e.target.checked)}
                  className="h-4 w-4 rounded border-console-border text-danger-600 focus:ring-danger-500"
                />
                <span className={cn("text-sm", deleteSiteDocuments ? "font-medium text-danger-600" : "text-console-text")}>
                  Delete all site documents after completion
                </span>
              </label>
            </div>

            <div className="rounded-console border border-console-border p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-50 text-success-700">
                    <Receipt size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-console-text">Purchase bills</h3>
                    <p className="text-xs text-console-muted">All purchase-related invoices</p>
                  </div>
                </div>
                <Button size="sm" variant="secondary" loading={downloadingBills} onClick={handleDownloadBills}>
                  <Download size={14} /> Download ZIP
                </Button>
              </div>
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={deletePurchaseBills}
                  onChange={(e) => setDeletePurchaseBills(e.target.checked)}
                  className="h-4 w-4 rounded border-console-border text-danger-600 focus:ring-danger-500"
                />
                <span className={cn("text-sm", deletePurchaseBills ? "font-medium text-danger-600" : "text-console-text")}>
                  Delete all purchase bills after completion
                </span>
              </label>
            </div>
          </div>

          {(deleteSiteDocuments || deletePurchaseBills) && (
            <div className="flex items-start gap-3 rounded-console border border-danger-100 bg-danger-50 p-4">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger-600" />
              <div>
                <h3 className="mb-1 text-sm font-semibold text-danger-900">Warning</h3>
                <p className="text-sm text-danger-700">
                  Selected files will be permanently deleted. Make sure you have downloaded all
                  necessary documents.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warning-100 text-warning-700">
              <CheckCircle size={26} />
            </div>
            <h3 className="mb-1.5 text-lg font-semibold text-console-text">Ready to complete site?</h3>
            <p className="text-sm text-console-muted">
              This action will finalize the site and restrict future modifications.
            </p>
          </div>

          <div className="space-y-2 rounded-console border border-console-border bg-console-bg p-4">
            <h4 className="text-sm font-semibold text-console-text">Summary of changes</h4>
            {deleteSiteDocuments && (
              <div className="flex items-center gap-2 text-sm text-danger-600">
                <span className="h-1.5 w-1.5 rounded-full bg-danger-500" />
                All site documents will be deleted
              </div>
            )}
            {deletePurchaseBills && (
              <div className="flex items-center gap-2 text-sm text-danger-600">
                <span className="h-1.5 w-1.5 rounded-full bg-danger-500" />
                All purchase bills will be deleted
              </div>
            )}
            {!deleteSiteDocuments && !deletePurchaseBills && (
              <div className="flex items-center gap-2 text-sm text-success-700">
                <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
                No files will be deleted
              </div>
            )}
          </div>

          <div className="flex items-start gap-3 rounded-console border border-warning-100 bg-warning-50 p-4">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning-600" />
            <div>
              <h3 className="mb-1 text-sm font-semibold text-warning-900">Important notice</h3>
              <p className="text-sm text-warning-700">
                After completion, you won't be able to add purchases, miscellaneous expenses,
                mark attendance, or perform other operations except stock transfers.
              </p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CompleteSiteModal;
