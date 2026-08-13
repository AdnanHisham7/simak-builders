import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  createSiteManager,
  regeneratePassword,
  toggleUserStatus,
  updateSiteManager,
  assignSitesToClients,
  assignSiteExpenses,
  getUsersByRole,
} from "@/services/userService";
import { getSites, Site } from "@/services/siteService";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Pencil,
  RefreshCw,
  Users,
  Building2,
  Mail,
  ShieldCheck,
  ShieldX,
  Trash2,
  Plus,
  Loader2,
  Wallet,
} from "lucide-react";
import AddSiteManagerModal from "./AddSiteManagerModal";
import EditSiteManagerModal from "./EditSiteManagerModal";
import AssignSitesModal from "@/features/sites/AssignSitesModal";
import AssignFundsModal from "./AssignFundsModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { toast } from "sonner";
import { Card, StatCard } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonStatCards, SkeletonTable } from "@/components/ui/Skeleton";
import Tooltip from "@/components/ui/Tooltip";
import CopyButton from "@/components/ui/CopyButton";
import { cn } from "@/lib/cn";

interface SiteManager {
  id: string;
  name: string;
  email: string;
  password: string;
  isBlocked: boolean;
  sites: Site[];
  siteExpensesBalance: number;
}

const SiteManagers: React.FC = () => {
  const [siteManagers, setSiteManagers] = useState<SiteManager[]>([]);
  const [allSites, setAllSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedSiteManager, setSelectedSiteManager] = useState<SiteManager | null>(null);
  const [isToggling, setIsToggling] = useState<{ [key: string]: boolean }>({});
  const [isRegenerating, setIsRegenerating] = useState<{ [key: string]: boolean }>({});
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isAssignFundsModalOpen, setIsAssignFundsModalOpen] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isLoading: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    isLoading: false,
  });

  const itemsPerPage = 8;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [siteManagersData, sitesData] = await Promise.all([
          getUsersByRole("siteManager"),
          getSites(),
        ]);
        setSiteManagers(
          siteManagersData.map((user) => ({
            id: user.id,
            name: user.name,
            sites: user.assignedSites || [],
            email: user.email,
            password: user.password || "********",
            isBlocked: user.isBlocked,
            siteExpensesBalance: user.siteExpensesBalance || 0,
          })),
        );
        setAllSites(sitesData);
      } catch (err) {
        toast.error("Failed to fetch data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredSiteManagers = siteManagers.filter((manager) => {
    const matchesSearch =
      manager.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manager.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSite =
      !selectedSiteId || manager.sites.some((site) => site.id === selectedSiteId);
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "active" && !manager.isBlocked) ||
      (selectedStatus === "blocked" && manager.isBlocked);
    return matchesSearch && matchesSite && matchesStatus;
  });

  const totalPages = Math.ceil(filteredSiteManagers.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSiteManagers = filteredSiteManagers.slice(indexOfFirstItem, indexOfLastItem);

  const activeSiteManagers = siteManagers.filter((a) => !a.isBlocked).length;
  const blockedSiteManagers = siteManagers.filter((a) => a.isBlocked).length;

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) setCurrentPage(pageNumber);
  };

  const handleToggleStatus = (manager: SiteManager) => {
    const action = manager.isBlocked ? "unblock" : "block";
    setConfirmModal({
      isLoading: false,
      isOpen: true,
      title: `Confirm ${action}`,
      message: `Are you sure you want to ${action} ${manager.name}?`,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: true }));
        setIsToggling((prev) => ({ ...prev, [manager.id]: true }));
        try {
          const newIsBlocked = !manager.isBlocked;
          await toggleUserStatus(manager.id, newIsBlocked);
          setSiteManagers((prev) =>
            prev.map((a) => (a.id === manager.id ? { ...a, isBlocked: newIsBlocked } : a)),
          );
          toast.success(`SiteManager ${newIsBlocked ? "blocked" : "unblocked"} successfully!`);
        } catch (err) {
          toast.error("Failed to update status");
        } finally {
          setIsToggling((prev) => ({ ...prev, [manager.id]: false }));
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  const handleRegeneratePassword = (manager: SiteManager) => {
    setConfirmModal({
      isOpen: true,
      title: "Confirm Password Regeneration",
      message: `Are you sure you want to regenerate the password for ${manager.name}?`,
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        setIsRegenerating((prev) => ({ ...prev, [manager.id]: true }));
        try {
          const newPassword = await regeneratePassword(manager.id);
          navigator.clipboard
            .writeText(newPassword)
            .then(() => toast.success("Password copied to clipboard!"))
            .catch(() => toast.error("Failed to copy password."));
          setSiteManagers((prev) =>
            prev.map((a) => (a.id === manager.id ? { ...a, password: newPassword } : a)),
          );
          toast.success("Password regenerated successfully!");
        } catch (err) {
          toast.error("Failed to regenerate password.");
        } finally {
          setIsRegenerating((prev) => ({ ...prev, [manager.id]: false }));
          setConfirmModal((prev) => ({ ...prev, isLoading: false, isOpen: false }));
        }
      },
    });
  };

  const handleRemoveSite = (managerId: string, siteId: string) => {
    const manager = siteManagers.find((a) => a.id === managerId);
    const site = allSites.find((s) => s.id === siteId);
    if (!manager || !site) return;

    setConfirmModal({
      isLoading: false,
      isOpen: true,
      title: "Confirm Site Removal",
      message: `Are you sure you want to remove ${site.name} from ${manager.name}?`,
      onConfirm: async () => {
        try {
          const updatedSites = manager.sites.filter((s) => s.id !== siteId);
          await assignSitesToClients(
            managerId,
            updatedSites.map((s) => s.id),
          );
          setSiteManagers((prev) =>
            prev.map((a) => (a.id === managerId ? { ...a, sites: updatedSites } : a)),
          );
          toast.success("Site removed successfully!");
        } catch (err) {
          toast.error("Failed to remove site.");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleAssignSites = async (selectedSiteIds: string[]) => {
    if (!selectedSiteManager) return;
    try {
      const currentSiteIds = selectedSiteManager.sites.map((site) => site.id);
      const newSiteIds = [...new Set([...currentSiteIds, ...selectedSiteIds])];
      await assignSitesToClients(selectedSiteManager.id, newSiteIds);
      const updatedSites = allSites.filter((site) => newSiteIds.includes(site.id));
      setSiteManagers((prev) =>
        prev.map((a) => (a.id === selectedSiteManager.id ? { ...a, sites: updatedSites } : a)),
      );
      toast.success("Sites assigned successfully!");
    } catch (err) {
      toast.error("Failed to assign sites.");
    }
  };

  const handleAssignFunds = async (amount: number) => {
    if (!selectedSiteManager) return;
    try {
      await assignSiteExpenses(selectedSiteManager.id, amount);
      const updatedManagers = await getUsersByRole("siteManager");
      setSiteManagers(
        updatedManagers.map((user) => ({
          id: user.id,
          name: user.name,
          sites: user.assignedSites || [],
          email: user.email,
          password: user.password || "********",
          isBlocked: user.isBlocked,
          siteExpensesBalance: user.siteExpensesBalance || 0,
        })),
      );
      setIsAssignFundsModalOpen(false);
      toast.success("Funds assigned successfully!");
    } catch (err) {
      toast.error("Failed to assign funds.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-console-text">Site Managers</h1>
          <p className="mt-0.5 text-sm text-console-muted">
            Manage and oversee site managers across your organization
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus size={16} /> Add site manager
        </Button>
      </div>

      {loading ? (
        <div className="space-y-6">
          <SkeletonStatCards />
          <SkeletonTable />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Total Site Managers" value={siteManagers.length} icon={Users} />
            <StatCard label="Active" value={activeSiteManagers} icon={ShieldCheck} />
            <StatCard label="Blocked" value={blockedSiteManagers} icon={ShieldX} />
            <StatCard label="Total Sites" value={allSites.length} icon={Building2} />
            <StatCard
              label="Total Expenses Balance"
              value={`₹${siteManagers.reduce((sum, m) => sum + m.siteExpensesBalance, 0).toLocaleString("en-IN")}`}
              icon={Wallet}
            />
          </div>

          <Card>
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="relative flex-grow">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-console-muted" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search by name or email..."
                  className="w-full rounded-lg border border-console-border py-2.5 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="relative w-[200px]">
                  <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-console-muted" size={15} />
                  <select
                    value={selectedSiteId || "All Sites"}
                    onChange={(e) => {
                      setSelectedSiteId(e.target.value === "All Sites" ? null : e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full appearance-none rounded-lg border border-console-border py-2.5 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  >
                    <option value="All Sites">All Sites</option>
                    {allSites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative w-[160px]">
                  <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-console-muted" size={15} />
                  <select
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full appearance-none rounded-lg border border-console-border py-2.5 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-0">
            {currentSiteManagers.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No site managers found"
                description="Try adjusting your search or filter criteria."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-console-border">
                  <thead className="bg-console-bg">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Site Manager</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Assigned Sites</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-console-border">
                    {currentSiteManagers.map((manager) => (
                      <tr key={manager.id} className="hover:bg-console-bg">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <Link to={`/admin/site-managers/${manager.id}/dashboard`}>
                              <div className="relative">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800 transition-opacity hover:opacity-80">
                                  {manager.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()}
                                </div>
                                <div
                                  className={cn(
                                    "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white",
                                    manager.isBlocked ? "bg-danger-500" : "bg-success-500",
                                  )}
                                />
                              </div>
                            </Link>
                            <div>
                              <Link
                                to={`/admin/site-managers/${manager.id}/dashboard`}
                                className="text-sm font-medium text-console-text hover:text-brand-700"
                              >
                                {manager.name}
                              </Link>
                              <div className="text-xs text-console-muted">ID: {manager.id.slice(-8)}</div>
                              <div className="text-xs font-medium text-success-700">
                                ₹{manager.siteExpensesBalance.toLocaleString("en-IN")} balance
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex max-w-xs flex-wrap items-center gap-1.5">
                            {manager.sites.length === 0 ? (
                              <span className="rounded-full bg-console-bg px-2 py-1 text-xs text-console-muted">
                                No sites assigned
                              </span>
                            ) : (
                              <>
                                {manager.sites.slice(0, 2).map((site) => (
                                  <span
                                    key={site.id}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
                                  >
                                    {site.name}
                                    <Tooltip label={`Remove ${site.name}`}>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveSite(manager.id, site.id)}
                                        className="text-brand-600 transition-colors hover:text-danger-600"
                                        aria-label={`Remove ${site.name}`}
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    </Tooltip>
                                  </span>
                                ))}
                                {manager.sites.length > 2 && (
                                  <span className="rounded-full bg-console-bg px-2 py-1 text-xs text-console-muted">
                                    +{manager.sites.length - 2} more
                                  </span>
                                )}
                              </>
                            )}
                            <Tooltip label="Assign site">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSiteManager(manager);
                                  setIsAssignModalOpen(true);
                                }}
                                aria-label="Assign site"
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-success-600 text-white transition-colors hover:bg-success-700"
                              >
                                <Plus size={12} />
                              </button>
                            </Tooltip>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <Mail size={13} className="text-console-muted" />
                            <span className="text-sm text-console-text">{manager.email}</span>
                            <CopyButton value={manager.email} label="Email" />
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                              manager.isBlocked
                                ? "bg-danger-50 text-danger-700"
                                : "bg-success-50 text-success-700",
                            )}
                          >
                            {manager.isBlocked ? (
                              <>
                                <ShieldX size={11} /> Blocked
                              </>
                            ) : (
                              <>
                                <ShieldCheck size={11} /> Active
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(manager)}
                              disabled={isToggling[manager.id]}
                              aria-label={manager.isBlocked ? "Unblock manager" : "Block manager"}
                              className={cn(
                                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                                manager.isBlocked
                                  ? "bg-success-50 text-success-700 hover:bg-success-100"
                                  : "bg-console-bg text-console-text hover:bg-slate-200",
                              )}
                            >
                              {isToggling[manager.id] ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : manager.isBlocked ? (
                                "Unblock"
                              ) : (
                                "Block"
                              )}
                            </button>
                            <Tooltip label="Edit manager">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSiteManager(manager);
                                  setIsEditModalOpen(true);
                                }}
                                aria-label="Edit manager"
                                className="rounded-lg p-2 text-console-muted transition-colors hover:bg-warning-50 hover:text-warning-700"
                              >
                                <Pencil size={14} />
                              </button>
                            </Tooltip>
                            <Tooltip label="Regenerate password">
                              <button
                                type="button"
                                onClick={() => handleRegeneratePassword(manager)}
                                disabled={isRegenerating[manager.id]}
                                aria-label="Regenerate password"
                                className="rounded-lg p-2 text-console-muted transition-colors hover:bg-info-50 hover:text-info-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isRegenerating[manager.id] ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <RefreshCw size={14} />
                                )}
                              </button>
                            </Tooltip>
                            <Tooltip label="Assign funds">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSiteManager(manager);
                                  setIsAssignFundsModalOpen(true);
                                }}
                                aria-label="Assign funds"
                                className="rounded-lg p-2 text-console-muted transition-colors hover:bg-success-50 hover:text-success-700"
                              >
                                <Wallet size={14} />
                              </button>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {totalPages > 1 && (
            <div className="flex flex-col items-center justify-between gap-4 rounded-console bg-console-bg px-4 py-3 sm:flex-row">
              <p className="text-sm text-console-muted">
                Showing{" "}
                <span className="font-semibold text-console-text">{indexOfFirstItem + 1}</span> to{" "}
                <span className="font-semibold text-console-text">
                  {Math.min(indexOfLastItem, filteredSiteManagers.length)}
                </span>{" "}
                of <span className="font-semibold text-console-text">{filteredSiteManagers.length}</span> site managers
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-lg p-2 text-console-muted transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={18} />
                </button>
                {[...Array(totalPages)].map((_, index) => {
                  const pageNum = index + 1;
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
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors",
                          currentPage === pageNum ? "bg-brand-700 text-white" : "text-console-muted hover:bg-white",
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
                  disabled={currentPage === totalPages}
                  className="rounded-lg p-2 text-console-muted transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <AddSiteManagerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={async (newSiteManager: { name: string; email: string }) => {
          try {
            await createSiteManager({
              name: newSiteManager.name,
              email: newSiteManager.email,
              role: "siteManager",
            });
            const updatedSiteManagers = await getUsersByRole("siteManager");
            setSiteManagers(
              updatedSiteManagers.map((user) => ({
                id: user.id,
                name: user.name,
                sites: user.assignedSites || [],
                email: user.email,
                password: user.password || "********",
                isBlocked: user.isBlocked,
                siteExpensesBalance: user.siteExpensesBalance || 0,
              })),
            );
            setIsAddModalOpen(false);
            toast.success("SiteManager added successfully!");
          } catch (err) {
            toast.error("Failed to add manager.");
          }
        }}
      />

      {selectedSiteManager && (
        <>
          <EditSiteManagerModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            manager={selectedSiteManager}
            onSubmit={async (updatedSiteManager: { name: string; email: string }) => {
              try {
                await updateSiteManager(selectedSiteManager.id, updatedSiteManager);
                setSiteManagers((prev) =>
                  prev.map((a) => (a.id === selectedSiteManager.id ? { ...a, ...updatedSiteManager } : a)),
                );
                setIsEditModalOpen(false);
                toast.success("SiteManager updated successfully!");
              } catch (err) {
                toast.error("Failed to update manager.");
              }
            }}
          />
          <AssignSitesModal
            isOpen={isAssignModalOpen}
            onClose={() => setIsAssignModalOpen(false)}
            allSites={allSites}
            assignedSites={selectedSiteManager.sites}
            onAssign={handleAssignSites}
          />
          <AssignFundsModal
            isOpen={isAssignFundsModalOpen}
            onClose={() => setIsAssignFundsModalOpen(false)}
            onSubmit={handleAssignFunds}
          />
        </>
      )}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        isLoading={confirmModal.isLoading}
      />
    </div>
  );
};

export default SiteManagers;
