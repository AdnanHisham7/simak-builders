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
} from "lucide-react";
import { getClientDashboard, getClientSites } from "@/services/clientService";
import { Card, StatCard } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import PageLoader from "@/components/ui/PageLoader";
import GradientStatCard from "@/components/ui/GradientStatCard";
import { usePreferences } from "@/hooks/usePreferences";

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
  const [sites, setSites] = useState<ClientSiteOption[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [site, setSite] = useState<SiteSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    const loadSite = async () => {
      setLoading(true);
      try {
        const data = await getClientDashboard({
          siteId: selectedSiteId,
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
    loadSite();
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
    (doc) => doc.category === "client",
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

      <Card title="Construction Phases" description="Status of every phase for this site">
        {phases.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No phases recorded yet"
            description="Your site manager hasn't added construction phases for this site yet."
          />
        ) : (
          <ol className="space-y-3">
            {phases.map((phase, index) => {
              const config = phaseStatusConfig[phase.status];
              const Icon = config.icon;
              return (
                <li
                  key={phase._id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-console-border bg-console-bg px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-console-surface text-console-muted">
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-console-text">
                        {index + 1}. {phase.name}
                      </p>
                      {phase.completionDate && (
                        <p className="text-xs text-console-muted">
                          Completed on {formatDate(phase.completionDate)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={config.badge}>{config.label}</Badge>
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      <Card title="Shared Documents" description="Documents shared with you for this site">
        {clientDocuments.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No documents shared yet"
            description="Documents your team shares for this site will show up here."
          />
        ) : (
          <ul className="space-y-2">
            {clientDocuments.map((doc) => (
              <li
                key={doc._id}
                className="flex items-center justify-between gap-3 rounded-lg border border-console-border bg-console-bg px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-console-text">
                      {doc.name}
                    </p>
                    <p className="text-xs text-console-muted">
                      {formatBytes(doc.size)} • {formatDate(doc.uploadDate)}
                    </p>
                  </div>
                </div>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-console-muted transition-colors hover:bg-console-surface hover:text-brand-700"
                  aria-label={`Download ${doc.name}`}
                >
                  <Download size={16} />
                </a>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default ClientSiteProgress;