import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getSites, uploadDocument } from "@/services/siteService";
import { getCurrentUser, UserWithSalary } from "@/services/userService";
import {
  Building2,
  FileText,
  Upload,
  DollarSign,
  MapPin,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Download,
  Activity,
  LucideIcon,
} from "lucide-react";
import { Card, StatCard } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import PageLoader from "@/components/ui/PageLoader";
import GradientStatCard from "@/components/ui/GradientStatCard";
import Tooltip from "@/components/ui/Tooltip";
import { cn } from "@/lib/cn";

interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: string;
  url: string;
  uploadedBy: { id: string; name: string };
  category: "client" | "site";
}

interface Site {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  documents: Document[];
}

const TABS = [
  { id: "overview", name: "Overview", icon: Activity },
  { id: "sites", name: "Sites", icon: Building2 },
  { id: "documents", name: "Documents", icon: FileText },
  { id: "salary", name: "Salary", icon: DollarSign },
] as const;

const ArchitectDashboard: React.FC = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [currentUser, setCurrentUser] = useState<UserWithSalary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["id"]>("overview");
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sitesData, currentUserData] = await Promise.all([
          getSites(),
          getCurrentUser(),
        ]);
        setSites(sitesData);
        setCurrentUser(currentUserData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUpload = async (
    siteId: string,
    file: File,
    category: "client" | "site",
  ) => {
    const uploadId = `${siteId}-${category}`;
    setUploadingIds((prev) => new Set([...prev, uploadId]));

    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);

    try {
      await uploadDocument(siteId, formData);
      const updatedSites = await getSites();
      setSites(updatedSites);
    } catch (error) {
      console.error("Error uploading document:", error);
    } finally {
      setUploadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(uploadId);
        return newSet;
      });
    }
  };

  if (loading) {
    return <PageLoader label="Loading dashboard" />;
  }

  if (!currentUser) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <XCircle className="mx-auto mb-4 h-10 w-10 text-danger-500" />
          <h2 className="text-lg font-semibold text-console-text">Error loading data</h2>
          <p className="mt-1 text-sm text-console-muted">
            Unable to load user information. Please try again.
          </p>
        </Card>
      </div>
    );
  }

  const myDocuments = sites
    .flatMap((site) => site.documents)
    .filter((doc) => doc.uploadedBy.id === currentUser._id)
    .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());

  const totalDocuments = sites.reduce((total, site) => total + site.documents.length, 0);
  const verifiedSalary =
    currentUser.salaryAssignments
      ?.filter((s) => s.isVerified)
      .reduce((sum, s) => sum + s.amount, 0) || 0;

  const DashStatCard = ({
    title,
    value,
    icon,
    subtitle,
  }: {
    title: string;
    value: React.ReactNode;
    icon: LucideIcon;
    subtitle?: string;
  }) => <StatCard label={title} value={value} icon={icon} trend={subtitle ? { direction: "neutral", value: subtitle } : undefined} />;

  const SiteCard = ({ site }: { site: Site }) => {
    const clientDocuments = [...site.documents]
      .filter((doc) => doc.category === "client")
      .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
    const siteDocuments = [...site.documents]
      .filter((doc) => doc.category === "site")
      .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());

    return (
      <Card>
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Building2 size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-console-text">{site.name}</h3>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-console-muted">
                <MapPin size={12} />
                {site.address}, {site.city}, {site.state} {site.zip}
              </div>
            </div>
          </div>
          <Badge variant="success">{site.documents.length} docs</Badge>
        </div>

        <div className="space-y-5">
          {[
            { title: "Client Documentation", docs: clientDocuments, category: "client" as const },
            { title: "Site Documentation", docs: siteDocuments, category: "site" as const },
          ].map((group) => (
            <div key={group.category}>
              <div className="flex items-center justify-between">
                <h4 className="flex items-center text-sm font-medium text-console-text">
                  <FileText size={14} className="mr-2" />
                  {group.title} ({group.docs.length})
                </h4>
                <label className="relative cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    disabled={uploadingIds.has(`${site.id}-${group.category}`)}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleUpload(site.id, file, group.category);
                      }
                    }}
                  />
                  <div className="flex items-center gap-2 rounded-lg bg-brand-700 px-3 py-2 text-sm text-white transition-colors hover:bg-brand-800">
                    <Upload size={14} />
                    <span>
                      {uploadingIds.has(`${site.id}-${group.category}`)
                        ? "Uploading..."
                        : `Upload ${group.category}`}
                    </span>
                  </div>
                </label>
              </div>

              {group.docs.length === 0 ? (
                <p className="mt-2 text-sm text-console-muted">No documents uploaded yet</p>
              ) : (
                <div className="mt-2 max-h-48 space-y-2 overflow-y-auto">
                  {group.docs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-lg bg-console-bg p-3 transition-colors hover:bg-slate-100"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <FileText size={14} className="shrink-0 text-console-muted" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-console-text">{doc.name}</p>
                          <div className="flex items-center gap-2 text-xs text-console-muted">
                            <span>{(doc.size / 1024).toFixed(1)} KB</span>
                            <span>•</span>
                            <User size={11} />
                            <span>{doc.uploadedBy.name}</span>
                            <span>•</span>
                            <Calendar size={11} />
                            <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <Tooltip label="Download document">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded p-1.5 hover:bg-slate-200"
                        >
                          <Download size={15} className="text-console-muted" />
                        </a>
                      </Tooltip>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-console-text">Architect Dashboard</h1>
          <p className="mt-0.5 text-sm text-console-muted">Welcome back, {currentUser.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-console-text">
              ₹{currentUser.totalSalary?.toLocaleString() || "0"}
            </p>
            <p className="text-xs text-console-muted">Total earnings</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-800">
            <User size={18} />
          </div>
        </div>
      </div>

      <div className="relative flex flex-wrap gap-1 rounded-console border border-console-border bg-console-bg p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative z-10 flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-200",
                isActive ? "text-brand-700" : "text-console-muted hover:bg-white/60",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="architect-dashboard-tab-pill"
                  className="absolute inset-0 -z-10 rounded-lg bg-white shadow-console"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <Icon size={15} />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DashStatCard title="Total Sites" value={sites.length} icon={Building2} subtitle="Active projects" />
                <DashStatCard title="Total Documents" value={totalDocuments} icon={FileText} subtitle="Across all sites" />
                <DashStatCard title="My Uploads" value={myDocuments.length} icon={Upload} subtitle="Documents uploaded" />
                <GradientStatCard label="Verified Salary" value={verifiedSalary} prefix="₹" icon={CheckCircle} helperText="Confirmed payments" />
              </div>

              <Card title="Recent activity">
                {myDocuments.length === 0 ? (
                  <p className="py-8 text-center text-sm text-console-muted">No recent activity</p>
                ) : (
                  <div className="space-y-2.5">
                    {myDocuments.slice(0, 3).map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 rounded-lg bg-console-bg p-3">
                        <FileText size={18} className="text-brand-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-console-text">{doc.name}</p>
                          <p className="text-xs text-console-muted">
                            Uploaded {new Date(doc.uploadDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          {activeTab === "sites" && (
            <div className="space-y-6">
              {sites.length === 0 ? (
                <Card>
                  <EmptyState icon={Building2} title="No sites assigned" description="You don't have any sites assigned yet." />
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {sites.map((site) => (
                    <SiteCard key={site.id} site={site} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "documents" && (
            <Card title="My uploaded documents">
              {myDocuments.length === 0 ? (
                <EmptyState icon={FileText} title="No documents yet" description="You haven't uploaded any documents yet." />
              ) : (
                <div className="space-y-2.5">
                  {myDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-lg bg-console-bg p-4 transition-colors hover:bg-slate-100"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-4">
                        <FileText size={18} className="shrink-0 text-brand-600" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-console-text">
                            {doc.name} <span className="text-xs text-console-muted">({doc.category})</span>
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-console-muted">
                            <span>{(doc.size / 1024).toFixed(1)} KB</span>
                            <span>
                              Site: {sites.find((s) => s.documents.some((d) => d.id === doc.id))?.name}
                            </span>
                            <span>Uploaded {new Date(doc.uploadDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg bg-brand-700 px-3 py-2 text-sm text-white transition-colors hover:bg-brand-800"
                      >
                        <Download size={14} />
                        <span>Download</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {activeTab === "salary" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <GradientStatCard
                  label="Total Salary"
                  value={currentUser.totalSalary || 0}
                  prefix="₹"
                  icon={DollarSign}
                  helperText="All time earnings"
                />
                <GradientStatCard
                  label="Verified Amount"
                  value={verifiedSalary}
                  prefix="₹"
                  icon={CheckCircle}
                  helperText="Confirmed payments"
                />
                <DashStatCard
                  title="Pending Verification"
                  value={`₹${((currentUser.totalSalary || 0) - verifiedSalary).toLocaleString()}`}
                  icon={XCircle}
                  subtitle="Awaiting confirmation"
                />
              </div>

              <Card title="Salary transactions">
                {!currentUser.salaryAssignments || currentUser.salaryAssignments.length === 0 ? (
                  <EmptyState icon={DollarSign} title="No transactions yet" description="No salary transactions have been recorded." />
                ) : (
                  <div className="space-y-2.5">
                    {currentUser.salaryAssignments
                      .slice()
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((assignment) => (
                        <div
                          key={assignment._id}
                          className="flex items-center justify-between rounded-lg bg-console-bg p-4"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-full",
                                assignment.isVerified ? "bg-success-100 text-success-700" : "bg-warning-100 text-warning-700",
                              )}
                            >
                              {assignment.isVerified ? <CheckCircle size={16} /> : <XCircle size={16} />}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-console-text">
                                ₹{assignment.amount.toLocaleString()}
                              </p>
                              <div className="mt-0.5 flex items-center gap-3 text-xs text-console-muted">
                                <span className="flex items-center gap-1">
                                  <Calendar size={11} />
                                  {new Date(assignment.date).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <User size={11} />
                                  {assignment.givenBy?.name || "auto"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Badge variant={assignment.isVerified ? "success" : "warning"}>
                            {assignment.isVerified ? "Verified" : "Pending"}
                          </Badge>
                        </div>
                      ))}
                  </div>
                )}
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ArchitectDashboard;
