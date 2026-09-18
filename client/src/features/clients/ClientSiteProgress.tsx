import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Building,
  Wallet,
  TrendingUp,
  CheckCircle2,
  Clock,
  Circle,
  FileText,
  Download,
  PenTool,
  XCircle,
  AlertCircle,
  User,
  Calendar,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { getClientDashboard, getClientSites } from "@/services/clientService";
import SiteProgressTimeline, { TimelinePhase } from "../sites/SiteProgressTimeline";
import SignDocumentModal from "../sites/SignDocumentModal";
import RejectDocumentModal from "../sites/RejectDocumentModal";
import { SiteMediaTab } from "../sites/SiteMediaTab";
import { Card, StatCard } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import PageLoader from "@/components/ui/PageLoader";
import GradientStatCard from "@/components/ui/GradientStatCard";
import Button from "@/components/ui/Button";
import { usePreferences } from "@/hooks/usePreferences";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

interface SitePhase {
  _id: string;
  name: string;
  status: "not started" | "pending" | "completed";
  completionDate?: string;
}

interface SiteDocument {
  _id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: string;
  url: string;
  category: "client" | "site";
  version?: number;
  status?: "draft" | "pending_signature" | "signed" | "rejected";
  phaseId?: string;
  phaseName?: string;
  uploadedBy?: { id: string; name: string };
  signature?: {
    signerName: string;
    signerRole: string;
    signedAt: string;
    comments?: string;
  };
  signRequests?: Array<{
    role: string;
    message?: string;
    status: string;
  }>;
  rejectionReason?: string;
}

interface SiteSummary {
  _id: string;
  name: string;
  budget: number;
  expenses: number;
  status: "InProgress" | "Completed";
  phases: SitePhase[];
  documents: SiteDocument[];
}

interface ClientSiteOption {
  _id: string;
  name: string;
}

const phaseStatusConfig: Record<
  SitePhase["status"],
  { icon: typeof CheckCircle2; badge: "success" | "warning" | "neutral"; label: string }
> = {
  completed: { icon: CheckCircle2, badge: "success", label: "Completed" },
  pending: { icon: Clock, badge: "warning", label: "Awaiting approval" },
  "not started": { icon: Circle, badge: "neutral", label: "Not started" },
};

const formatBytes = (bytes: number) => {
  if (!bytes) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

const ClientSiteProgress: React.FC = () => {
  const { formatDate } = usePreferences();
  const { user } = useSelector((state: RootState) => state.auth);
  const [sites, setSites] = useState<ClientSiteOption[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [site, setSite] = useState<SiteSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDocForSign, setSelectedDocForSign] = useState<any | null>(null);
  const [selectedDocForReject, setSelectedDocForReject] = useState<any | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const [highlightedDocId, setHighlightedDocId] = useState<string | null>(null);
  const [highlightedContainer, setHighlightedContainer] = useState(false);
  const hasTriggeredHighlightRef = useRef(false);
  const [activeStatusPopoverId, setActiveStatusPopoverId] = useState<string | null>(null);

  useEffect(() => {
    const handleOutsideClick = () => setActiveStatusPopoverId(null);
    if (activeStatusPopoverId) {
      window.addEventListener("click", handleOutsideClick);
      return () => window.removeEventListener("click", handleOutsideClick);
    }
  }, [activeStatusPopoverId]);

  const loadSite = async (siteIdToLoad: string) => {
    try {
      const data = await getClientDashboard({
        siteId: siteIdToLoad,
        purchasesPage: 1,
        purchasesLimit: 1,
        stocksPage: 1,
        stocksLimit: 1,
        miscellaneousPage: 1,
        miscellaneousLimit: 1,
        transactionsPage: 1,
        transactionsLimit: 1,
      });
      setSite(data.site);
    } catch (err) {
      setError("Failed to load site progress");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadSites = async () => {
      try {
        const sitesData = await getClientSites();
        setSites(sitesData);
        const querySiteId = searchParams.get("siteId");
        if (querySiteId && sitesData.some((s) => s._id === querySiteId)) {
          setSelectedSiteId(querySiteId);
        } else if (sitesData.length > 0) {
          setSelectedSiteId(sitesData[0]._id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError("Failed to load your sites");
        setLoading(false);
      }
    };
    loadSites();
  }, []);

  // Update selected site if search parameter siteId changes
  useEffect(() => {
    const querySiteId = searchParams.get("siteId");
    if (
      querySiteId &&
      querySiteId !== selectedSiteId &&
      sites.some((s) => s._id === querySiteId)
    ) {
      setSelectedSiteId(querySiteId);
      hasTriggeredHighlightRef.current = false;
    }
  }, [searchParams, sites, selectedSiteId]);

  useEffect(() => {
    if (!selectedSiteId) return;
    setLoading(true);
    loadSite(selectedSiteId);
  }, [selectedSiteId]);

  // Contextual smooth scroll-down and 2-second highlighter on targeted document / container
  useEffect(() => {
    if (loading || !site || hasTriggeredHighlightRef.current) return;
    const highlightParam = searchParams.get("highlight");
    const tabParam = searchParams.get("tab");

    if (!highlightParam && tabParam !== "documents" && tabParam !== "phases") {
      return;
    }

    const timer = setTimeout(() => {
      let targetEl: HTMLElement | null = null;
      let matchedDocId: string | null = null;

      if (highlightParam && highlightParam !== "documents" && highlightParam !== "phases") {
        targetEl = document.getElementById(`highlight-${highlightParam}`);
        if (targetEl) matchedDocId = highlightParam;
      }

      if (!targetEl && (highlightParam === "documents" || tabParam === "documents")) {
        const clientDocs = (site.documents || []).filter(
          (d) =>
            d.category === "client" ||
            d.signRequests?.some((r: any) => r.role === "client") ||
            d.status === "pending_signature"
        );
        const pendingDoc = clientDocs.find((d) => d.status === "pending_signature");
        if (pendingDoc) {
          targetEl = document.getElementById(`highlight-${pendingDoc._id}`);
          if (targetEl) matchedDocId = pendingDoc._id;
        }
        if (!targetEl) {
          targetEl = document.getElementById("client-documents-section");
        }
      } else if (!targetEl && (highlightParam === "phases" || tabParam === "phases")) {
        targetEl = document.getElementById("client-phases-section");
      }

      if (targetEl) {
        hasTriggeredHighlightRef.current = true;
        targetEl.scrollIntoView({ behavior: "smooth", block: "center" });

        if (matchedDocId) {
          setHighlightedDocId(matchedDocId);
        } else {
          setHighlightedContainer(true);
        }

        // Clean up URL parameter cleanly
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete("highlight");
        setSearchParams(nextParams, { replace: true });

        // Exactly 2-second highlighter pulse and smooth fade out
        const clearTimer = setTimeout(() => {
          setHighlightedDocId(null);
          setHighlightedContainer(false);
        }, 2000);

        return () => clearTimeout(clearTimer);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [loading, site, searchParams]);

  if (loading) {
    return <PageLoader label="Loading site progress" />;
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <h2 className="text-lg font-semibold text-console-text">
            Something went wrong
          </h2>
          <p className="mt-1 text-sm text-danger-600">{error}</p>
        </Card>
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <EmptyState
        icon={Building}
        title="No sites assigned yet"
        description="Once a site is assigned to your account, its progress will appear here."
      />
    );
  }

  const phases = site?.phases || [];
  const completedCount = phases.filter((p) => p.status === "completed").length;
  const progressPercent =
    phases.length > 0 ? Math.round((completedCount / phases.length) * 100) : 0;
  const clientDocuments = (site?.documents || []).filter(
    (doc) =>
      doc.category === "client" ||
      doc.signRequests?.some((r: any) => r.role === "client") ||
      doc.status === "pending_signature",
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-console-text">
            Site Progress
          </h1>
          <p className="mt-0.5 text-sm text-console-muted">
            Track construction phases, budget health, and shared documents.
          </p>
        </div>
        <div>
          <label
            htmlFor="progress-site-select"
            className="mb-1 block text-xs font-medium text-console-muted"
          >
            Select site
          </label>
          <select
            id="progress-site-select"
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            {sites.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Site Name" value={site?.name || "N/A"} icon={Building} />
        <GradientStatCard label="Budget" value={site?.budget || 0} prefix="₹" icon={Wallet} />
        <GradientStatCard
          label="Expenses"
          value={site?.expenses || 0}
          prefix="₹"
          icon={TrendingUp}
          tone={
            site && site.expenses > site.budget ? "danger" : "dark"
          }
        />
        <StatCard
          label="Overall Progress"
          value={`${progressPercent}%`}
          icon={CheckCircle2}
        />
      </div>

      <div id="client-phases-section" className="scroll-mt-6">
        <SiteProgressTimeline
          phases={phases.map((p) => ({
            id: p._id,
            name: p.name,
            status: p.status,
            completionDate: p.completionDate,
          }))}
          siteName={site?.name}
          readOnly={true}
          userType="client"
        />
      </div>

      <div
        id="client-documents-section"
        className={`scroll-mt-6 rounded-2xl transition-all duration-700 ${
          highlightedContainer
            ? "ring-4 ring-brand-500/50 shadow-2xl bg-brand-50/20 p-1"
            : ""
        }`}
      >
        <Card
          title="Shared Documents & E-Signatures"
          description="Review, download, sign, or manage approvals for your construction site documents."
        >
          {clientDocuments.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No documents shared yet"
              description="Documents your team shares for this site will show up here."
            />
          ) : (
            <div className="space-y-3">
              {clientDocuments.map((doc) => {
                const isSigned = doc.status === "signed";
                const isPending = doc.status === "pending_signature";
                const isRejected = doc.status === "rejected";
                const isItemHighlighted = highlightedDocId === doc._id;
                const uploaderName =
                  typeof doc.uploadedBy === "object" && doc.uploadedBy?.name
                    ? doc.uploadedBy.name
                    : "Site Manager";

                const currentUserId = user?.id || (user as any)?._id;
                const uploaderId = typeof doc.uploadedBy === "object" ? (doc.uploadedBy?.id || (doc.uploadedBy as any)?._id) : doc.uploadedBy;
                const isUploader = Boolean(currentUserId && uploaderId && String(currentUserId) === String(uploaderId));

                const isRequestedSigner = Boolean(
                  doc.signRequests?.some((sr: any) => {
                    const targetUserId = typeof sr.requestedTo === "object" ? (sr.requestedTo?._id || sr.requestedTo?.id) : sr.requestedTo;
                    if (currentUserId && targetUserId && String(currentUserId) === String(targetUserId)) return true;
                    const targetRole = (sr.requestedRole || sr.role || "").toLowerCase();
                    return targetRole === "client";
                  }) ||
                  doc.category === "client" ||
                  doc.status === "pending_signature"
                );

                // Sign only shown to uploader and requested signer
                const showSign = !isSigned && (isUploader || isRequestedSigner);
                // Reject NEVER shown to uploader
                const showReject = !isSigned && !isUploader && isRequestedSigner;

                const firstReq = doc.signRequests?.[0];
                const reqRole = firstReq?.requestedRole || firstReq?.role || "Client";
                const reqMsg = firstReq?.message;

                return (
                  <div
                    key={doc._id}
                    id={`highlight-${doc._id}`}
                    className={`flex flex-col gap-3 rounded-xl border p-4 transition-all duration-700 sm:flex-row sm:items-center sm:justify-between ${
                      isItemHighlighted
                        ? "ring-4 ring-brand-500/60 border-brand-400 bg-brand-50/80 shadow-2xl scale-[1.015]"
                        : isPending
                        ? "border-amber-300 bg-amber-50/40 hover:border-amber-400"
                        : isSigned
                        ? "border-emerald-200 bg-emerald-50/20"
                        : isRejected
                        ? "border-rose-200 bg-rose-50/20"
                        : "border-console-border bg-console-bg"
                    }`}
                  >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-xs ${
                        isSigned
                          ? "bg-emerald-100 text-emerald-800"
                          : isPending
                          ? "bg-amber-100 text-amber-800"
                          : isRejected
                          ? "bg-rose-100 text-rose-800"
                          : "bg-brand-50 text-brand-700"
                      }`}
                    >
                      <FileText size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold font-mono text-brand-800">
                          v{doc.version || 1}
                        </span>
                        <p className="truncate text-sm font-semibold text-console-text">
                          {doc.name}
                        </p>
                        {/* Interactive Status Badge with Floating Popover */}
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveStatusPopoverId(
                                activeStatusPopoverId === doc._id ? null : doc._id
                              );
                            }}
                            title="Click to view sign-off details"
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-all cursor-pointer hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-offset-1",
                              isSigned
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 focus:ring-emerald-400"
                                : isPending
                                ? "bg-amber-100 text-amber-900 hover:bg-amber-200 focus:ring-amber-400"
                                : isRejected
                                ? "bg-rose-100 text-rose-900 hover:bg-rose-200 focus:ring-rose-400"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-400",
                              activeStatusPopoverId === doc._id && "ring-2 ring-offset-1"
                            )}
                          >
                            {isSigned ? (
                              <>
                                <CheckCircle2 size={12} className="text-emerald-600" />
                                <span>Signed & Approved</span>
                              </>
                            ) : isPending ? (
                              <>
                                <Clock size={12} className="text-amber-600" />
                                <span>Awaiting Your Signature</span>
                              </>
                            ) : isRejected ? (
                              <>
                                <XCircle size={12} className="text-rose-600" />
                                <span>Rejected</span>
                              </>
                            ) : (
                              <span>Shared Document</span>
                            )}
                          </button>

                          {/* Floating Popover on Click */}
                          {activeStatusPopoverId === doc._id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className={cn(
                                "absolute left-0 top-full mt-1.5 z-30 w-72 sm:w-80 rounded-xl border p-3 shadow-xl text-xs transition-all animate-in fade-in slide-in-from-top-1",
                                isSigned
                                  ? "border-emerald-200 bg-emerald-50/95 text-emerald-950"
                                  : isPending
                                  ? "border-amber-200 bg-amber-50/95 text-amber-950"
                                  : isRejected
                                  ? "border-rose-200 bg-rose-50/95 text-rose-950"
                                  : "border-slate-200 bg-white text-slate-800"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2 mb-1.5 pb-1 border-b border-black/5 font-semibold">
                                <span className="flex items-center gap-1.5">
                                  {isSigned && <CheckCircle2 size={13} className="text-emerald-600" />}
                                  {isPending && <Clock size={13} className="text-amber-600" />}
                                  {isRejected && <XCircle size={13} className="text-rose-600" />}
                                  {isSigned
                                    ? "Signature Details"
                                    : isPending
                                    ? "Signature Request"
                                    : isRejected
                                    ? "Rejection Details"
                                    : "Document Status"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setActiveStatusPopoverId(null)}
                                  className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                                >
                                  <X size={12} />
                                </button>
                              </div>

                              {isSigned && doc.signature && (
                                <div className="space-y-1">
                                  <p>
                                    Digitally signed by <strong>{doc.signature.signerName}</strong> ({doc.signature.signerRole || "Client"})
                                  </p>
                                  <p className="text-[11px] opacity-80">
                                    Date: {formatDate(doc.signature.signedAt)}
                                  </p>
                                  {doc.signature.comments && (
                                    <p className="mt-1 rounded bg-emerald-100/60 p-1.5 text-[11px] italic">
                                      "{doc.signature.comments}"
                                    </p>
                                  )}
                                </div>
                              )}

                              {isPending && (
                                <div className="space-y-1">
                                  <p>
                                    <strong>Required Signer:</strong>{" "}
                                    <span className="capitalize">{reqRole}</span>
                                  </p>
                                  {reqMsg ? (
                                    <p className="mt-1 rounded bg-amber-100/60 p-1.5 text-[11px] italic">
                                      "{reqMsg}"
                                    </p>
                                  ) : (
                                    <p className="text-[11px] opacity-80">
                                      Your formal signature is required to approve this milestone document.
                                    </p>
                                  )}
                                </div>
                              )}

                              {isRejected && (
                                <div className="space-y-1">
                                  <p>
                                    <strong>Rejection reason:</strong>{" "}
                                    {doc.rejectionReason || "Declined by signer"}
                                  </p>
                                </div>
                              )}

                              {!isSigned && !isPending && !isRejected && (
                                <p className="text-[11px] opacity-80">
                                  Shared document available for your site construction records.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-console-muted">
                        <span>{formatBytes(doc.size)}</span>
                        <span>•</span>
                        <User size={11} />
                        <span>Uploaded by: <strong>{uploaderName}</strong></span>
                        <span>•</span>
                        <Calendar size={11} />
                        <span>{formatDate(doc.uploadDate)}</span>
                        {doc.phaseName && (
                          <>
                            <span>•</span>
                            <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-700">
                              Phase: {doc.phaseName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {showSign && (
                      <Button
                        size="sm"
                        onClick={() => setSelectedDocForSign(doc)}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white"
                      >
                        <PenTool size={13} />
                        <span>Sign Document</span>
                      </Button>
                    )}

                    {showReject && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedDocForReject(doc)}
                        className="border-rose-200 text-rose-700 hover:bg-rose-50"
                      >
                        <XCircle size={13} />
                        <span>Reject</span>
                      </Button>
                    )}

                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-console-border bg-white px-3 py-1.5 text-xs font-medium text-console-text shadow-xs hover:bg-console-surface"
                      aria-label={`Download ${doc.name}`}
                    >
                      <Download size={13} />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
      </div>

      {selectedSiteId && site && (
        <SiteMediaTab
          siteId={selectedSiteId}
          siteName={site.name}
          userType="client"
        />
      )}

      {/* Signature Modal */}
      {selectedDocForSign && (
        <SignDocumentModal
          isOpen={Boolean(selectedDocForSign)}
          onClose={() => setSelectedDocForSign(null)}
          siteId={selectedSiteId}
          document={selectedDocForSign}
          defaultSignerName={user?.name || ""}
          defaultSignerRole="client"
          onSigned={async () => {
            await loadSite(selectedSiteId);
          }}
        />
      )}

      {/* Rejection Modal */}
      {selectedDocForReject && (
        <RejectDocumentModal
          isOpen={Boolean(selectedDocForReject)}
          onClose={() => setSelectedDocForReject(null)}
          siteId={selectedSiteId}
          documentId={selectedDocForReject._id || selectedDocForReject.id}
          documentName={selectedDocForReject.name}
          onSuccess={async () => {
            await loadSite(selectedSiteId);
          }}
        />
      )}
    </div>
  );
};

export default ClientSiteProgress;