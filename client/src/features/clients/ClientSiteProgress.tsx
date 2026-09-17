import { useEffect, useState } from "react";
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
} from "lucide-react";
import { getClientDashboard, getClientSites } from "@/services/clientService";
import SiteProgressTimeline, { TimelinePhase } from "../sites/SiteProgressTimeline";
import SignDocumentModal from "../sites/SignDocumentModal";
import RejectDocumentModal from "../sites/RejectDocumentModal";
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
        if (sitesData.length > 0) {
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

  useEffect(() => {
    if (!selectedSiteId) return;
    setLoading(true);
    loadSite(selectedSiteId);
  }, [selectedSiteId]);

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
              const uploaderName =
                typeof doc.uploadedBy === "object" && doc.uploadedBy?.name
                  ? doc.uploadedBy.name
                  : "Site Manager";

              return (
                <div
                  key={doc._id}
                  className={`flex flex-col gap-3 rounded-xl border p-4 transition-shadow sm:flex-row sm:items-center sm:justify-between ${
                    isPending
                      ? "border-amber-300 bg-amber-50/40"
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
                        <Badge
                          variant={
                            isSigned
                              ? "success"
                              : isPending
                              ? "warning"
                              : isRejected
                              ? "error"
                              : "neutral"
                          }
                        >
                          {isSigned
                            ? "Signed & Approved"
                            : isPending
                            ? "Awaiting Your Signature"
                            : isRejected
                            ? "Rejected"
                            : "Shared Document"}
                        </Badge>
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

                      {/* Signed Info */}
                      {isSigned && doc.signature && (
                        <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/80 px-2.5 py-1 text-xs text-emerald-900">
                          <CheckCircle2 size={13} className="shrink-0 text-emerald-600" />
                          <span>
                            Digitally signed by <strong>{doc.signature.signerName}</strong> on{" "}
                            {formatDate(doc.signature.signedAt)}
                            {doc.signature.comments ? ` ("${doc.signature.comments}")` : ""}
                          </span>
                        </div>
                      )}

                      {/* Pending Signature Notice */}
                      {isPending && (
                        <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50/80 px-2.5 py-1 text-xs text-amber-950">
                          <Clock size={13} className="shrink-0 text-amber-600 mt-0.5" />
                          <span>
                            {doc.signRequests?.[0]?.message
                              ? doc.signRequests[0].message
                              : "Your signature is required to formally approve this document / milestone."}
                          </span>
                        </div>
                      )}

                      {/* Rejection notice */}
                      {isRejected && doc.rejectionReason && (
                        <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-rose-200 bg-rose-50/80 px-2.5 py-1 text-xs text-rose-950">
                          <XCircle size={13} className="shrink-0 text-rose-600 mt-0.5" />
                          <span>
                            <strong>Rejection Reason:</strong> {doc.rejectionReason}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {!isSigned && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => setSelectedDocForSign(doc)}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white"
                        >
                          <PenTool size={13} />
                          <span>Sign Document</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedDocForReject(doc)}
                          className="border-rose-200 text-rose-700 hover:bg-rose-50"
                        >
                          <XCircle size={13} />
                          <span>Reject</span>
                        </Button>
                      </>
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