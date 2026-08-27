import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { UserType } from "@/store/slices/authSlice";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertCircle,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Eye,
  MapPin,
  Building2,
  Clock,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Upload,
  ShoppingCart,
  Inbox,
  Loader2,
  Pencil,
} from "lucide-react";
import { createSite, getSites, getSitesPaginated, updateSite, Site } from "@/services/siteService";
import { getUsersByRole } from "@/services/userService";
import { UserRole } from "@/types/user";
import debounce from "lodash/debounce";
import AddSiteModal from "./AddSiteModal";
import AddPurchaseModal from "./AddPurchaseModal";
import EditSiteModal, { EditSiteFormValues } from "./EditSiteModal";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, StatCard } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonStatCards, SkeletonTable } from "@/components/ui/Skeleton";
import Tooltip from "@/components/ui/Tooltip";
import GradientStatCard from "@/components/ui/GradientStatCard";
import { cn } from "@/lib/cn";
import { usePreferences } from "@/hooks/usePreferences";

interface User {
  id: string;
  name: string;
  role: string;
}

interface MappedSite {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  location: string;
  status: string;
  clientName: string;
  budget: number;
  expenses: number;
  createdAt: string;
  siteManagerCount: number;
  architectCount: number;
  completedPhases: number;
  totalPhases: number;
}

const buildLocation = (address: string, city: string, state: string, zip: string) =>
  `${address}, ${city}, ${state} ${zip}`.trim().replace(/^,|,$/g, "");

const mapSiteForDisplay = (site: Site): MappedSite => ({
  id: site.id,
  name: site.name,
  address: site.address || "",
  city: site.city || "",
  state: site.state || "",
  zip: site.zip || "",
  location: buildLocation(site.address, site.city, site.state, site.zip),
  status: site.status || "Unknown",
  clientName: site.client?.name || "Unknown",
  budget: site.budget,
  expenses: site.expenses,
  createdAt: site.createdAt,
  siteManagerCount: site.siteManagerCount || 0,
  architectCount: site.architectCount || 0,
  completedPhases: site.phases?.filter((p) => p.status === "completed").length || 0,
  totalPhases: site.phases?.length || 0,
});

const getProjectStatuses = (sites: MappedSite[]) => {
  const statuses = sites.map((site) => site.status);
  return ["All Statuses", ...Array.from(new Set(statuses))];
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
      return <CheckCircle2 size={14} />;
    case "in progress":
    case "active":
      return <Clock size={14} />;
    case "pending":
      return <Circle size={14} />;
    case "on hold":
      return <AlertTriangle size={14} />;
    default:
      return <Circle size={14} />;
  }
};

const getStatusVariant = (status: string): "success" | "info" | "warning" | "error" | "neutral" => {
  switch (status.toLowerCase()) {
    case "completed":
      return "success";
    case "in progress":
    case "active":
      return "info";
    case "pending":
      return "warning";
    case "on hold":
      return "error";
    default:
      return "neutral";
  }
};

const getActionsForRole = (role: UserType): string[] => {
  switch (role) {
    case "admin":
      return ["view", "addPurchase", "edit"];
    case "siteManager":
    case "supervisor":
      return ["view", "addPurchase"];
    case "architect":
      return ["view", "uploadDocuments"];
    case "client":
      return ["view", "viewProgress"];
    default:
      return ["view"];
  }
};

const Sites: React.FC = () => {
  const { formatDate, formatNumber } = usePreferences();
  const { userType } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [pageSites, setPageSites] = useState<MappedSite[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [portfolioStats, setPortfolioStats] = useState<MappedSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddPurchaseModalOpen, setIsAddPurchaseModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [siteBeingEdited, setSiteBeingEdited] = useState<MappedSite | null>(null);
  const [selectedProjectStatus, setSelectedProjectStatus] =
    useState("All Statuses");
  const [clients, setClients] = useState<User[]>([]);
  const [siteManagers, setSiteManagers] = useState<User[]>([]);
  const [architects, setArchitects] = useState<User[]>([]);
  const [projectStatuses, setProjectStatuses] = useState<string[]>([
    "All Statuses",
  ]);

  const itemsPerPage = 8;
  const pageRequestIdRef = useRef(0);

  const handleViewSite = (siteId: string) => {
    if (userType === "admin") {
      navigate(`/admin/sites/${siteId}`);
    } else if (userType === "siteManager") {
      navigate(`/siteManager/sites/${siteId}`);
    }
  };

  useEffect(() => {
    const debounced = debounce((value: string) => {
      setDebouncedSearchTerm(value);
      setCurrentPage(1);
    }, 350);
    debounced(searchTerm);
    return () => debounced.cancel();
  }, [searchTerm]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [allSites, clientList, managerList, architectList] =
          await Promise.all([
            getSites(),
            getUsersByRole(UserRole.Client),
            getUsersByRole(UserRole.SiteManager),
            getUsersByRole(UserRole.Architect),
          ]);
        const mappedAllSites = allSites.map(mapSiteForDisplay);
        setPortfolioStats(mappedAllSites);
        setProjectStatuses(getProjectStatuses(mappedAllSites));
        setClients(clientList);
        setSiteManagers(managerList);
        setArchitects(architectList);
      } catch (err) {
        toast.error("Failed to fetch sites");
        setError("Failed to fetch data. Please try again later.");
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const requestId = ++pageRequestIdRef.current;
    const fetchPage = async () => {
      setTableLoading(true);
      try {
        const result = await getSitesPaginated({
          page: currentPage,
          limit: itemsPerPage,
          search: debouncedSearchTerm,
          status: selectedProjectStatus,
        });
        if (pageRequestIdRef.current !== requestId) return;
        setPageSites(result.sites.map(mapSiteForDisplay));
        setTotal(result.total);
        setTotalPages(result.totalPages);
      } catch (err) {
        if (pageRequestIdRef.current !== requestId) return;
        toast.error("Failed to fetch sites");
        setError("Failed to fetch data. Please try again later.");
      } finally {
        if (pageRequestIdRef.current === requestId) {
          setLoading(false);
          setTableLoading(false);
        }
      }
    };
    fetchPage();
  }, [currentPage, debouncedSearchTerm, selectedProjectStatus]);

  const refetchCurrentPage = async () => {
    const requestId = ++pageRequestIdRef.current;
    const result = await getSitesPaginated({
      page: currentPage,
      limit: itemsPerPage,
      search: debouncedSearchTerm,
      status: selectedProjectStatus,
    });
    if (pageRequestIdRef.current !== requestId) return;
    setPageSites(result.sites.map(mapSiteForDisplay));
    setTotal(result.total);
    setTotalPages(result.totalPages);
  };

  const totalBudget = portfolioStats.reduce((sum, site) => sum + site.budget, 0);
  const completedSites = portfolioStats.filter(
    (site) => site.status.toLowerCase() === "completed"
  ).length;
  const activeSites = portfolioStats.filter(
    (site) =>
      site.status.toLowerCase() === "active" ||
      site.status.toLowerCase() === "in progress"
  ).length;

  const indexOfFirstItem = total === 0 ? 0 : (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = currentPage * itemsPerPage;

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleModalSubmit = async (siteData: any) => {
    try {
      const createdSite = await createSite(siteData);
      const mappedSite = mapSiteForDisplay(createdSite);
      setPortfolioStats((prev) => [...prev, mappedSite]);
      if (!projectStatuses.includes(mappedSite.status)) {
        setProjectStatuses((prev) => [...prev, mappedSite.status]);
      }
      setIsModalOpen(false);
      toast.success("Site created successfully");
      await refetchCurrentPage();
    } catch (err) {
      toast.error("Failed to create site");
    }
  };

  const handleAddPurchase = (siteId: string) => {
    setSelectedSiteId(siteId);
    setIsAddPurchaseModalOpen(true);
  };

  const handleEditSite = (site: MappedSite) => {
    setSiteBeingEdited(site);
    setIsEditModalOpen(true);
  };

  const applySiteEdit = (
    list: MappedSite[],
    siteId: string,
    updates: EditSiteFormValues,
  ): MappedSite[] =>
    list.map((s) =>
      s.id === siteId
        ? {
            ...s,
            name: updates.name,
            address: updates.address,
            city: updates.city,
            state: updates.state,
            zip: updates.zip,
            location: buildLocation(updates.address, updates.city, updates.state, updates.zip),
          }
        : s,
    );

  const handleEditSubmit = async (updates: EditSiteFormValues) => {
    if (!siteBeingEdited) return;
    try {
      await updateSite(siteBeingEdited.id, updates);
      const editedSiteId = siteBeingEdited.id;
      setPageSites((prev) => applySiteEdit(prev, editedSiteId, updates));
      setPortfolioStats((prev) => applySiteEdit(prev, editedSiteId, updates));
      setIsEditModalOpen(false);
      setSiteBeingEdited(null);
      toast.success("Site updated successfully");
    } catch {
      toast.error("Failed to update site");
    }
  };

  const handleUploadDocuments = (siteId: string) => {
    handleViewSite(siteId);
  };

  const handleViewProgress = (siteId: string) => {
    handleViewSite(siteId);
  };

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-50 text-danger-600">
            <AlertCircle size={22} />
          </div>
          <h3 className="text-lg font-semibold text-console-text">Error loading sites</h3>
          <p className="mt-1 text-sm text-console-muted">{error}</p>
          <Button className="mt-5" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-console-text">Site Management</h1>
          <p className="mt-0.5 text-sm text-console-muted">
            Manage and monitor your construction sites
          </p>
        </div>
        {userType === "admin" && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Add new site
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-6">
          <SkeletonStatCards />
          <SkeletonTable />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Sites" value={total} icon={Building2} />
            <StatCard label="Active Sites" value={activeSites} icon={TrendingUp} />
            <GradientStatCard label="Total Budget" value={totalBudget} prefix="₹" icon={DollarSign} />
            <StatCard label="Completed" value={completedSites} icon={CheckCircle2} />
          </div>

          <Card>
            <div className="mb-6 flex flex-col gap-4 lg:flex-row">
              <div className="relative flex-grow">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-console-muted"
                  size={18}
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search sites by name or location..."
                  className="w-full rounded-lg border border-console-border bg-console-bg py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div className="relative min-w-[200px]">
                <Filter
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-console-muted"
                  size={16}
                />
                <select
                  value={selectedProjectStatus}
                  onChange={(e) => {
                    setSelectedProjectStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full appearance-none rounded-lg border border-console-border bg-console-bg py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  {projectStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {!tableLoading && pageSites.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No sites found"
                description="We couldn't find any sites matching your search criteria. Try adjusting your filters or search terms."
                action={
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedProjectStatus("All Statuses");
                    }}
                  >
                    Clear all filters
                  </Button>
                }
              />
            ) : (
              <>
                <div className="relative mb-6 overflow-hidden rounded-console border border-console-border">
                  {tableLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
                      <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 shadow-sm ring-1 ring-console-border">
                        <Loader2 size={18} className="animate-spin text-brand-700" />
                        <span className="text-sm font-medium text-console-text">
                          Loading sites…
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-console-border">
                      <thead className="bg-console-bg">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">
                            Site Details
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">
                            Status &amp; Client
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">
                            Financial
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">
                            Team &amp; Progress
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-console-border bg-white">
                        {pageSites.map((site) => {
                          const actions = getActionsForRole(userType);
                          return (
                            <tr
                              key={site.id}
                              className="cursor-pointer transition-colors hover:bg-brand-50/40"
                              onClick={() => handleViewSite(site.id)}
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                                    <Building2 size={18} />
                                  </div>
                                  <div className="ml-3">
                                    <div className="text-sm font-semibold text-console-text">
                                      {site.name}
                                    </div>
                                    <div className="mt-0.5 flex items-center text-xs text-console-muted">
                                      <MapPin size={11} className="mr-1" />
                                      {site.location}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="space-y-1.5">
                                  <Badge variant={getStatusVariant(site.status)}>
                                    {getStatusIcon(site.status)}
                                    {site.status}
                                  </Badge>
                                  <div className="text-sm text-console-muted">{site.clientName}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="space-y-1">
                                  <div className="text-sm font-semibold text-console-text">
                                    ₹{formatNumber(site.budget)}
                                  </div>
                                  <div className="text-xs text-console-muted">
                                    Spent: ₹{formatNumber(site.expenses)}
                                  </div>
                                  <div className="h-1.5 w-full rounded-full bg-console-bg">
                                    <div
                                      className="h-1.5 rounded-full bg-brand-600"
                                      style={{
                                        width: `${Math.min(
                                          site.budget > 0 ? (site.expenses / site.budget) * 100 : 0,
                                          100
                                        )}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-4 text-xs text-console-muted">
                                    <span className="flex items-center gap-1">
                                      <Users size={13} />
                                      {site.siteManagerCount + site.architectCount}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Calendar size={13} />
                                      {formatDate(site.createdAt)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-console-muted">Progress:</span>
                                    <div className="h-1.5 flex-1 rounded-full bg-console-bg">
                                      <div
                                        className="h-1.5 rounded-full bg-success-600"
                                        style={{
                                          width: `${
                                            site.totalPhases > 0
                                              ? (site.completedPhases / site.totalPhases) * 100
                                              : 0
                                          }%`,
                                        }}
                                      />
                                    </div>
                                    <span className="text-xs text-console-muted">
                                      {site.completedPhases}/{site.totalPhases}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td
                                className="px-6 py-4"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex gap-1">
                                  <Tooltip label="View site">
                                    <button
                                      type="button"
                                      className="rounded-lg p-2 text-console-muted transition-colors hover:bg-brand-50 hover:text-brand-700"
                                      onClick={() => handleViewSite(site.id)}
                                      aria-label="View site"
                                    >
                                      <Eye size={16} />
                                    </button>
                                  </Tooltip>
                                  {actions.includes("edit") && (
                                    <Tooltip label="Edit site">
                                      <button
                                        type="button"
                                        className="rounded-lg p-2 text-console-muted transition-colors hover:bg-brand-50 hover:text-brand-700"
                                        onClick={() => handleEditSite(site)}
                                        aria-label="Edit site"
                                      >
                                        <Pencil size={16} />
                                      </button>
                                    </Tooltip>
                                  )}
                                  {actions.includes("addPurchase") && (
                                    <Tooltip label="Add purchase">
                                      <button
                                        type="button"
                                        className="rounded-lg p-2 text-console-muted transition-colors hover:bg-warning-50 hover:text-warning-700"
                                        onClick={() => handleAddPurchase(site.id)}
                                        aria-label="Add purchase"
                                      >
                                        <ShoppingCart size={16} />
                                      </button>
                                    </Tooltip>
                                  )}
                                  {actions.includes("uploadDocuments") && (
                                    <Tooltip label="Upload documents">
                                      <button
                                        type="button"
                                        className="rounded-lg p-2 text-console-muted transition-colors hover:bg-info-50 hover:text-info-700"
                                        onClick={() => handleUploadDocuments(site.id)}
                                        aria-label="Upload documents"
                                      >
                                        <Upload size={16} />
                                      </button>
                                    </Tooltip>
                                  )}
                                  {actions.includes("viewProgress") && (
                                    <Tooltip label="View progress">
                                      <button
                                        type="button"
                                        className="rounded-lg p-2 text-console-muted transition-colors hover:bg-info-50 hover:text-info-700"
                                        onClick={() => handleViewProgress(site.id)}
                                        aria-label="View progress"
                                      >
                                        <TrendingUp size={16} />
                                      </button>
                                    </Tooltip>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-between gap-4 rounded-console bg-console-bg px-4 py-3 sm:flex-row">
                  <p className="text-sm text-console-muted">
                    Showing{" "}
                    <span className="font-semibold text-console-text">{indexOfFirstItem + 1}</span> to{" "}
                    <span className="font-semibold text-console-text">
                      {Math.min(indexOfLastItem, total)}
                    </span>{" "}
                    of <span className="font-semibold text-console-text">{total}</span> sites
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1 || tableLoading}
                      className="rounded-lg p-2 text-console-muted transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                      ) {
                        return (
                          <button
                            type="button"
                            key={pageNum}
                            onClick={() => paginate(pageNum)}
                            disabled={tableLoading}
                            className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                              currentPage === pageNum
                                ? "bg-brand-700 text-white"
                                : "text-console-muted hover:bg-white",
                            )}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                      if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                        return (
                          <span key={pageNum} className="px-1 text-console-muted">
                            …
                          </span>
                        );
                      }
                      return null;
                    })}
                    <button
                      type="button"
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages || tableLoading}
                      className="rounded-lg p-2 text-console-muted transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </>
      )}

      {isModalOpen && (
        <AddSiteModal
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleModalSubmit}
          clients={clients}
          siteManagers={siteManagers}
          architects={architects}
        />
      )}
      {isAddPurchaseModalOpen && (
        <AddPurchaseModal
          siteId={selectedSiteId!}
          onClose={() => setIsAddPurchaseModalOpen(false)}
        />
      )}
      {siteBeingEdited && (
        <EditSiteModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSiteBeingEdited(null);
          }}
          site={{
            name: siteBeingEdited.name,
            address: siteBeingEdited.address,
            city: siteBeingEdited.city,
            state: siteBeingEdited.state,
            zip: siteBeingEdited.zip,
          }}
          onSubmit={handleEditSubmit}
        />
      )}
    </div>
  );
};

export default Sites;