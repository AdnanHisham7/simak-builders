import { useState, useEffect } from "react";
import {
  CheckCircle,
  Download,
  FileText,
  Receipt,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  X,
  Building2,
  Shield,
} from "lucide-react";

interface CompleteSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    deleteSiteDocuments: boolean,
    deletePurchaseBills: boolean
  ) => void;
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
  const [isVisible, setIsVisible] = useState(false);
  const [downloadingDocs, setDownloadingDocs] = useState(false);
  const [downloadingBills, setDownloadingBills] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
      // Reset state when modal closes
      setTimeout(() => {
        setStep(1);
        setDeleteSiteDocuments(false);
        setDeletePurchaseBills(false);
      }, 300);
    }
  }, [isOpen]);

  if (!isOpen && !isVisible) return null;

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

  const handleContinue = () => {
    setStep(2);
  };

  const handleFinalConfirm = () => {
    onConfirm(deleteSiteDocuments, deletePurchaseBills);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        isVisible ? "bg-black/60 backdrop-blur-sm" : "bg-black/0"
      }`}
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 transition-all duration-300 transform ${
          isVisible
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-4"
        }`}
      >
        {/* Header with progress indicator */}
        <div className="relative p-6 border-b border-gray-100">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl text-white">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {step === 1 ? "Complete Site" : "Confirm Completion"}
              </h2>
              <p className="text-sm text-gray-500">
                {step === 1
                  ? "Manage documents before completion"
                  : "Final confirmation required"}
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center space-x-2 ${
                step >= 1 ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step >= 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                1
              </div>
              <span className="text-sm font-medium">Document Management</span>
            </div>
            <div
              className={`h-px flex-1 ${
                step >= 2 ? "bg-blue-600" : "bg-gray-200"
              }`}
            />
            <div
              className={`flex items-center space-x-2 ${
                step >= 2 ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step >= 2
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                2
              </div>
              <span className="text-sm font-medium">Final Confirmation</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 ? (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">
                      Before You Continue
                    </h3>
                    <p className="text-sm text-blue-700">
                      Download important documents before completion. You can
                      also choose to delete files to free up storage space.
                    </p>
                  </div>
                </div>
              </div>

              {/* Document Management Cards */}
              <div className="space-y-4">
                {/* Site Documents Card */}
                <div className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Site Documents
                        </h3>
                        <p className="text-sm text-gray-500">
                          Client and site-related files
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleDownloadDocs}
                      disabled={downloadingDocs}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {downloadingDocs ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Downloading...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Download ZIP</span>
                        </>
                      )}
                    </button>
                  </div>

                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={deleteSiteDocuments}
                        onChange={(e) =>
                          setDeleteSiteDocuments(e.target.checked)
                        }
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 border-2 border-gray-300 rounded peer-checked:bg-red-500 peer-checked:border-red-500 transition-all">
                        {deleteSiteDocuments && (
                          <CheckCircle className="w-3 h-3 text-white absolute top-0.5 left-0.5" />
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-sm transition-colors ${
                        deleteSiteDocuments
                          ? "text-red-600 font-medium"
                          : "text-gray-700 group-hover:text-gray-900"
                      }`}
                    >
                      Delete all site documents after completion
                    </span>
                  </label>
                </div>

                {/* Purchase Bills Card */}
                <div className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Receipt className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Purchase Bills
                        </h3>
                        <p className="text-sm text-gray-500">
                          All purchase-related invoices
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleDownloadBills}
                      disabled={downloadingBills}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {downloadingBills ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Downloading...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Download ZIP</span>
                        </>
                      )}
                    </button>
                  </div>

                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={deletePurchaseBills}
                        onChange={(e) =>
                          setDeletePurchaseBills(e.target.checked)
                        }
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 border-2 border-gray-300 rounded peer-checked:bg-red-500 peer-checked:border-red-500 transition-all">
                        {deletePurchaseBills && (
                          <CheckCircle className="w-3 h-3 text-white absolute top-0.5 left-0.5" />
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-sm transition-colors ${
                        deletePurchaseBills
                          ? "text-red-600 font-medium"
                          : "text-gray-700 group-hover:text-gray-900"
                      }`}
                    >
                      Delete all purchase bills after completion
                    </span>
                  </label>
                </div>
              </div>

              {/* Warning if files will be deleted */}
              {(deleteSiteDocuments || deletePurchaseBills) && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-900 mb-1">
                        Warning
                      </h3>
                      <p className="text-sm text-red-700">
                        Selected files will be permanently deleted. Make sure
                        you have downloaded all necessary documents.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Ready to Complete Site?
                </h3>
                <p className="text-gray-600">
                  This action will finalize the site and restrict future
                  modifications.
                </p>
              </div>

              {/* Summary of actions */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h4 className="font-semibold text-gray-900">
                  Summary of Changes:
                </h4>
                <div className="space-y-2 text-sm">
                  {deleteSiteDocuments && (
                    <div className="flex items-center space-x-2 text-red-600">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      <span>All site documents will be deleted</span>
                    </div>
                  )}
                  {deletePurchaseBills && (
                    <div className="flex items-center space-x-2 text-red-600">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      <span>All purchase bills will be deleted</span>
                    </div>
                  )}
                  {!deleteSiteDocuments && !deletePurchaseBills && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>No files will be deleted</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-amber-900 mb-1">
                      Important Notice
                    </h3>
                    <p className="text-sm text-amber-700">
                      After completion, you won't be able to add purchases,
                      machinery rentals, mark attendance, or perform other
                      operations except stock transfers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <div className="flex justify-between">
            <button
              onClick={step === 1 ? onClose : () => setStep(1)}
              className="flex items-center space-x-2 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-white hover:shadow-sm transition-all"
            >
              {step === 2 && <ArrowLeft className="w-4 h-4" />}
              <span>{step === 1 ? "Cancel" : "Back"}</span>
            </button>

            <button
              onClick={step === 1 ? handleContinue : handleFinalConfirm}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105"
            >
              <span>{step === 1 ? "Continue" : "Complete Site"}</span>
              {step === 1 && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteSiteModal;
