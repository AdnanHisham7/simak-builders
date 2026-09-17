import React, { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import {
  Document as SiteDocument,
  DocumentVersion,
  getDocumentVersions,
  uploadDocumentVersion,
  requestDocumentSignature,
} from "@/services/siteService";
import {
  FileText,
  Upload,
  Download,
  History,
  CheckCircle2,
  Clock,
  XCircle,
  PenTool,
  Send,
  User,
  Calendar,
  AlertCircle,
  Check,
} from "lucide-react";
import { toast } from "sonner";

interface DocumentVersionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string;
  document: SiteDocument | null;
  sitePhases?: Array<{ id: string; name: string; status: string }>;
  canUploadVersion?: boolean;
  onDocumentUpdated: () => void;
  onOpenSignModal?: (doc: SiteDocument) => void;
}

export const DocumentVersionsModal: React.FC<DocumentVersionsModalProps> = ({
  isOpen,
  onClose,
  siteId,
  document,
  sitePhases = [],
  canUploadVersion = true,
  onDocumentUpdated,
  onOpenSignModal,
}) => {
  const [activeTab, setActiveTab] = useState<"history" | "new_version" | "request_sign">("history");
  const [docDetails, setDocDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // New version state
  const [newFile, setNewFile] = useState<File | null>(null);
  const [versionNotes, setVersionNotes] = useState("");
  const [requestSigOnUpload, setRequestSigOnUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Request signature state
  const [signRole, setSignRole] = useState("client");
  const [signMessage, setSignMessage] = useState("");
  const [selectedPhaseId, setSelectedPhaseId] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);

  const fetchVersions = async () => {
    if (!document) return;
    const docId = document.id || document._id;
    if (!docId) return;

    try {
      setLoading(true);
      const res = await getDocumentVersions(siteId, docId);
      setDocDetails(res);
      if (res.current?.phaseId) {
        setSelectedPhaseId(res.current.phaseId);
      }
    } catch (err) {
      console.error("Failed to load versions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && document) {
      fetchVersions();
    }
  }, [isOpen, document]);

  const handleUploadNewVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document || !newFile) {
      toast.error("Please select a new file");
      return;
    }

    const docId = document.id || document._id;
    if (!docId) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", newFile);
      formData.append("notes", versionNotes.trim());
      if (requestSigOnUpload) {
        formData.append("requestSignature", "true");
      }

      await uploadDocumentVersion(siteId, docId, formData);
      toast.success("New version uploaded successfully!");
      setNewFile(null);
      setVersionNotes("");
      setActiveTab("history");
      await fetchVersions();
      onDocumentUpdated();
    } catch (err: any) {
      console.error("Failed to upload new version:", err);
      toast.error(err.response?.data?.message || "Failed to upload new version.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRequestSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document) return;
    const docId = document.id || document._id;
    if (!docId) return;

    try {
      setIsRequesting(true);
      await requestDocumentSignature(siteId, docId, {
        role: signRole,
        message: signMessage.trim(),
        phaseId: selectedPhaseId || undefined,
      });

      toast.success("Signature requested!");
      setActiveTab("history");
      await fetchVersions();
      onDocumentUpdated();
    } catch (err: any) {
      console.error("Signature request failed:", err);
      toast.error(err.response?.data?.message || "Failed to request signature.");
    } finally {
      setIsRequesting(false);
    }
  };

  if (!document) return null;

  const current = docDetails?.current || document;
  const versions: DocumentVersion[] = docDetails?.versions || document.versions || [];
  const signature = current.signature;
  const isSigned = current.status === "signed";
  const isPending = current.status === "pending_signature";
  const isRejected = current.status === "rejected";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Document Details & Version Control"
      description={current.name}
      size="lg"
    >
      <div className="space-y-5">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all ${
              activeTab === "history"
                ? "bg-white text-brand-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <History size={14} />
            Version History ({versions.length + 1})
          </button>
          {canUploadVersion && (
            <button
              type="button"
              onClick={() => setActiveTab("new_version")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all ${
                activeTab === "new_version"
                  ? "bg-white text-brand-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Upload size={14} />
              Upload New Version
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab("request_sign")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all ${
              activeTab === "request_sign"
                ? "bg-white text-brand-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <PenTool size={14} />
            {isSigned ? "Signature Details" : "Sign / Request"}
          </button>
        </div>

        {/* Tab 1: Version History */}
        {activeTab === "history" && (
          <div className="space-y-4">
            {/* Current Active Version Banner */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-brand-700 px-2 py-0.5 text-xs font-bold text-white">
                      v{current.version || 1} (Current)
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        isSigned
                          ? "bg-emerald-100 text-emerald-800"
                          : isPending
                          ? "bg-amber-100 text-amber-800"
                          : isRejected
                          ? "bg-rose-100 text-rose-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {isSigned ? (
                        <>
                          <CheckCircle2 size={12} /> Signed
                        </>
                      ) : isPending ? (
                        <>
                          <Clock size={12} /> Awaiting Sign-off
                        </>
                      ) : isRejected ? (
                        <>
                          <XCircle size={12} /> Rejected
                        </>
                      ) : (
                        "Draft"
                      )}
                    </span>
                  </div>
                  <h4 className="mt-1.5 text-sm font-semibold text-slate-900">{current.name}</h4>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Uploaded {new Date(current.uploadDate).toLocaleDateString()} • {(current.size / 1024).toFixed(1)} KB
                  </p>
                  {current.notes && (
                    <p className="mt-2 text-xs italic text-slate-600 bg-white/80 p-2 rounded-lg border border-slate-100">
                      "{current.notes}"
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 items-end">
                  <a
                    href={current.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 shadow-xs hover:bg-slate-50 transition-colors"
                  >
                    <Download size={13} />
                    Download
                  </a>
                  {!isSigned && onOpenSignModal && (
                    <Button
                      size="sm"
                      onClick={() => {
                        onClose();
                        onOpenSignModal(current);
                      }}
                    >
                      <PenTool size={13} /> Sign Now
                    </Button>
                  )}
                </div>
              </div>

              {/* Linked Phase info */}
              {current.phaseName && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-brand-700 font-medium">
                  <Check size={14} />
                  <span>Linked to Phase completion: <strong>{current.phaseName}</strong></span>
                </div>
              )}
            </div>

            {/* Previous Versions Timeline */}
            <div>
              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Previous Revisions
              </h5>

              {versions.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center rounded-xl bg-slate-50 border border-slate-100">
                  No prior revisions exist for this document.
                </p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {versions.map((ver, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl bg-white p-3 border border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono font-medium text-slate-700">
                          v{ver.version}
                        </span>
                        <div>
                          <p className="text-xs font-medium text-slate-800">{ver.name}</p>
                          <p className="text-[11px] text-slate-500">
                            {new Date(ver.uploadDate).toLocaleDateString()} • {(ver.size / 1024).toFixed(1)} KB
                            {ver.notes && ` • ${ver.notes}`}
                          </p>
                        </div>
                      </div>

                      <a
                        href={ver.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                        title="Download past version"
                      >
                        <Download size={14} />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Upload New Version */}
        {activeTab === "new_version" && (
          <form onSubmit={handleUploadNewVersion} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Select Revised File *
              </label>
              <input
                type="file"
                required
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setNewFile(e.target.files[0]);
                  }
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-700 file:px-3 file:py-1 file:text-xs file:font-medium file:text-white hover:file:bg-brand-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Revision Changelog / Notes
              </label>
              <textarea
                rows={2}
                value={versionNotes}
                onChange={(e) => setVersionNotes(e.target.value)}
                placeholder="Describe what changed in this version (e.g. updated structural dimensions)..."
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={requestSigOnUpload}
                onChange={(e) => setRequestSigOnUpload(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-xs text-slate-700">
                Immediately request client sign-off on this revised version
              </span>
            </label>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setActiveTab("history")}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading || !newFile}>
                {isUploading ? "Uploading..." : `Upload Version ${Number(current.version || 1) + 1}`}
              </Button>
            </div>
          </form>
        )}

        {/* Tab 3: Signature & Sign Requests */}
        {activeTab === "request_sign" && (
          <div className="space-y-4">
            {isSigned && signature ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 size={18} />
                  <h4 className="text-sm font-semibold">Document Formally Signed & Approved</h4>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-white/80 p-3 rounded-xl border border-emerald-100">
                  <div>
                    <span className="text-slate-500">Signer Name:</span>
                    <p className="font-semibold text-slate-900">{signature.signerName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Role:</span>
                    <p className="font-semibold text-slate-900 capitalize">{signature.signerRole}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Signed At:</span>
                    <p className="font-semibold text-slate-900">
                      {new Date(signature.signedAt).toLocaleString()}
                    </p>
                  </div>
                  {signature.comments && (
                    <div className="col-span-2">
                      <span className="text-slate-500">Remarks:</span>
                      <p className="text-slate-800 italic">"{signature.comments}"</p>
                    </div>
                  )}
                </div>

                {signature.signatureDataUrl && (
                  <div>
                    <span className="text-xs font-medium text-slate-600">Digital Signature Image:</span>
                    <div className="mt-1 flex h-24 w-full max-w-sm items-center justify-center rounded-xl border border-slate-200 bg-white p-2 shadow-xs">
                      <img
                        src={signature.signatureDataUrl}
                        alt="E-Signature"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleRequestSignature} className="space-y-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    Requesting a signature will notify the recipient in their notifications dashboard. Once signed, a legal audit record is logged.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Required Signer Role
                    </label>
                    <select
                      value={signRole}
                      onChange={(e) => setSignRole(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="client">Client</option>
                      <option value="siteManager">Site Manager</option>
                      <option value="architect">Architect</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  {sitePhases.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Link to Site Phase (Optional)
                      </label>
                      <select
                        value={selectedPhaseId}
                        onChange={(e) => setSelectedPhaseId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      >
                        <option value="">None / General Document</option>
                        {sitePhases.map((phase) => (
                          <option key={phase.id} value={phase.id}>
                            {phase.name} ({phase.status})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Custom Notification Message
                  </label>
                  <textarea
                    rows={2}
                    value={signMessage}
                    onChange={(e) => setSignMessage(e.target.value)}
                    placeholder="e.g. Please review and sign off on completion of foundation phase..."
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  {onOpenSignModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenSignModal(current);
                      }}
                      className="text-xs font-medium text-brand-600 hover:text-brand-800 flex items-center gap-1"
                    >
                      <PenTool size={13} /> Sign Document Yourself Now
                    </button>
                  )}
                  <Button type="submit" disabled={isRequesting}>
                    <Send size={13} />
                    {isRequesting ? "Sending Request..." : "Send Signature Request"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DocumentVersionsModal;
