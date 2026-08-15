import { useEffect, useState } from "react";
import {
  createSupervisor,
  regeneratePassword,
  toggleUserStatus,
  updateSupervisor,
  assignSitesToClients,
  getUsersByRole,
  deleteStaffMember,
  restoreStaffMember,
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
  RotateCcw,
  Plus,
  Loader2,
} from "lucide-react";
import AddSupervisorModal from "./AddSupervisorModal";
import EditSupervisorModal from "./EditSupervisorModal";
import AssignSitesModal from "@/features/sites/AssignSitesModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { toast } from "sonner";
import { Card, StatCard } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonStatCards, SkeletonTable } from "@/components/ui/Skeleton";
import Tooltip from "@/components/ui/Tooltip";
import CopyButton from "@/components/ui/CopyButton";
import Avatar from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";

interface Supervisor {
  id: string;
  name: string;
  email: string;
  password: string;
  isBlocked: boolean;
  isDeleted?: boolean;
  sites: Site[];
  profileImage?: string;
}

const Supervisors: React.FC = () => {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [allSites, setAllSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState<Supervisor | null>(null);
  const [isToggling, setIsToggling] = useState<{ [key: string]: boolean }>({});
  const [isRegenerating, setIsRegenerating] = useState<{ [key: string]: boolean }>({});
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isDeleting, setIsDeleting] = useState<{ [key: string]: boolean }>({});
  const [isRestoring, setIsRestoring] = useState<{ [key: string]: boolean }>({});
  const [showDeleted, setShowDeleted] = useState(false);

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
        const [supervisorsData, sitesData] = await Promise.all([
          getUsersByRole("supervisor", showDeleted),
          getSites(),
        ]);
        setSupervisors(
          supervisorsData.map((user) => ({
            id: user.id,
            name: user.name,
            sites: user.assignedSites || [],
            email: user.email,
            password: user.password || "********",
            isBlocked: user.isBlocked,
            isDeleted: user.isDeleted || false,
            profileImage: user.profileImage,
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
  }, [showDeleted]);

  const filteredSupervisors = supervisors.filter((supervisor) => {
    const matchesSearch =
      supervisor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supervisor.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSite =
      !selectedSiteId || supervisor.sites.some((site) => site.id === selectedSiteId);
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "active" && !supervisor.isBlocked && !supervisor.isDeleted) ||
      (selectedStatus === "blocked" && supervisor.isBlocked && !supervisor.isDeleted);
    return matchesSearch && matchesSite && matchesStatus;
  });

  const totalPages = Math.ceil(filteredSupervisors.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSupervisors = filteredSupervisors.slice(indexOfFirstItem, indexOfLastItem);

  const activeSupervisors = supervisors.filter((a) => !a.isBlocked && !a.isDeleted).length;
  const blockedSupervisors = supervisors.filter((a) => a.isBlocked && !a.isDeleted).length;
  const deletedSupervisorsCount = supervisors.filter((a) => a.isDeleted).length;

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) setCurrentPage(pageNumber);
  };

  const handleToggleStatus = (supervisor: Supervisor) => {
    const action = supervisor.isBlocked ? "unblock" : "block";
    setConfirmModal({
      isLoading: false,
      isOpen: true,
      title: `Confirm ${action}`,
      message: `Are you sure you want to ${action} ${supervisor.name}?`,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: true }));
        setIsToggling((prev) => ({ ...prev, [supervisor.id]: true }));
        try {
          const newIsBlocked = !supervisor.isBlocked;
          await toggleUserStatus(supervisor.id, newIsBlocked);
          setSupervisors((prev) =>
            prev.map((a) => (a.id === supervisor.id ? { ...a, isBlocked: newIsBlocked } : a)),
          );
          toast.success(`Supervisor ${newIsBlocked ? "blocked" : "unblocked"} successfully!`);
        } catch (err) {
          toast.error("Failed to update status");
        } finally {
          setIsToggling((prev) => ({ ...prev, [supervisor.id]: false }));
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  const handleRegeneratePassword = (supervisor: Supervisor) => {
    setConfirmModal({
      isOpen: true,
      title: "Confirm Password Regeneration",
      message: `Are you sure you want to regenerate the password for ${supervisor.name}?`,
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        setIsRegenerating((prev) => ({ ...prev, [supervisor.id]: true }));
        try {
          const newPassword = await regeneratePassword(supervisor.id);
          navigator.clipboard
            .writeText(newPassword)
            .then(() => toast.success("Password copied to clipboard!"))
            .catch(() => toast.error("Failed to copy password."));
          setSupervisors((prev) =>
            prev.map((a) => (a.id === supervisor.id ? { ...a, password: newPassword } : a)),
          );
          toast.success("Password regenerated successfully!");
        } catch (err) {
          toast.error("Failed to regenerate password.");
        } finally {
          setIsRegenerating((prev) => ({ ...prev, [supervisor.id]: false }));
          setConfirmModal((prev) => ({ ...prev, isLoading: false, isOpen: false }));
        }
      },
    });
  };

  const handleDeleteSupervisor = (supervisor: Supervisor) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Supervisor",
      message: `Are you sure you want to delete ${supervisor.name}? This is a soft delete — their historical data is preserved, but they will no longer appear in active lists or be able to log in. You can restore them later.`,
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: true }));
        setIsDeleting((prev) => ({ ...prev, [supervisor.id]: true }));
        try {
          await deleteStaffMember("supervisors", supervisor.id);
          if (showDeleted) {
            setSupervisors((prev) =>
              prev.map((s) => (s.id === supervisor.id ? { ...s, isDeleted: true } : s)),
            );
          } else {
            setSupervisors((prev) => prev.filter((s) => s.id !== supervisor.id));
          }
          toast.success(`${supervisor.name} has been deleted.`);
        } catch (err: any) {
          toast.error(err?.response?.data?.error || "Failed to delete supervisor.");
        } finally {
          setIsDeleting((prev) => ({ ...prev, [supervisor.id]: false }));
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  const handleRestoreSupervisor = (supervisor: Supervisor) => {
    setConfirmModal({
      isOpen: true,
      title: "Restore Supervisor",
      message: `Restore ${supervisor.name}? They will reappear in active lists and be able to log in again.`,
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: true }));
        setIsRestoring((prev) => ({ ...prev, [supervisor.id]: true }));
        try {
          await restoreStaffMember("supervisors", supervisor.id);
          setSupervisors((prev) =>
            prev.map((s) => (s.id === supervisor.id ? { ...s, isDeleted: false } : s)),
          );
          toast.success(`${supervisor.name} has been restored.`);
        } catch (err: any) {
          toast.error(err?.response?.data?.error || "Failed to restore supervisor.");
        } finally {
          setIsRestoring((prev) => ({ ...prev, [supervisor.id]: false }));
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  const handleRemoveSite = (supervisorId: string, siteId: string) => {
    const supervisor = supervisors.find((a) => a.id === supervisorId);
    const site = allSites.find((s) => s.id === siteId);
    if (!supervisor || !site) return;

    setConfirmModal({
      isLoading: false,
      isOpen: true,
      title: "Confirm Site Removal",
      message: `Are you sure you want to remove ${site.name} from ${supervisor.name}?`,
      onConfirm: async () => {
        try {
          const updatedSites = supervisor.sites.filter((s) => s.id !== siteId);
          await assignSitesToClients(
            supervisorId,
            updatedSites.map((s) => s.id),
          );
          setSupervisors((prev) =>
            prev.map((a) => (a.id === supervisorId ? { ...a, sites: updatedSites } : a)),
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
    if (!selectedSupervisor) return;
    try {
      const currentSiteIds = selectedSupervisor.sites.map((site) => site.id);
      const newSiteIds = [...new Set([...currentSiteIds, ...selectedSiteIds])];
      await assignSitesToClients(selectedSupervisor.id, newSiteIds);
      const updatedSites = allSites.filter((site) => newSiteIds.includes(site.id));
      setSupervisors((prev) =>
        prev.map((a) => (a.id === selectedSupervisor.id ? { ...a, sites: updatedSites } : a)),
      );
      toast.success("Sites assigned successfully!");
    } catch (err) {
      toast.error("Failed to assign sites.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-console-text">Supervisors</h1>
          <p className="mt-0.5 text-sm text-console-muted">
            Manage and oversee supervisors across your organization
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus size={16} /> Add supervisor
        </Button>
      </div>

      {loading ? (
        <div className="space-y-6">
          <SkeletonStatCards />
          <SkeletonTable />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Supervisors" value={supervisors.length} icon={Users} />
            <StatCard label="Active" value={activeSupervisors} icon={ShieldCheck} />
            <StatCard label="Blocked" value={blockedSupervisors} icon={ShieldX} />
            <StatCard label="Total Sites" value={allSites.length} icon={Building2} />
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
                <label className="flex cursor-pointer select-none items-center gap-2 rounded-lg border border-console-border bg-console-bg px-4 py-2.5 text-sm text-console-text">
                  <input
                    type="checkbox"
                    checked={showDeleted}
                    onChange={(e) => {
                      setShowDeleted(e.target.checked);
                      setCurrentPage(1);
                    }}
                    className="rounded border-console-border text-brand-600 focus:ring-brand-500"
                  />
                  Show deleted{deletedSupervisorsCount > 0 ? ` (${deletedSupervisorsCount})` : ""}
                </label>
              </div>
            </div>
          </Card>

          <Card className="p-0">
            {currentSupervisors.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No supervisors found"
                description="Try adjusting your search or filter criteria."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-console-border">
                  <thead className="bg-console-bg">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Supervisor</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Assigned Sites</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-console-border">
                    {currentSupervisors.map((supervisor) => (
                      <tr key={supervisor.id} className="hover:bg-console-bg">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar name={supervisor.name} imageUrl={supervisor.profileImage} />
                              <div
                                className={cn(
                                  "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white",
                                  supervisor.isBlocked ? "bg-danger-500" : "bg-success-500",
                                )}
                              />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-console-text">{supervisor.name}</div>
                              <div className="text-xs text-console-muted">ID: {supervisor.id.slice(-8)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex max-w-xs flex-wrap items-center gap-1.5">
                            {supervisor.sites.length === 0 ? (
                              <span className="rounded-full bg-console-bg px-2 py-1 text-xs text-console-muted">
                                No sites assigned
                              </span>
                            ) : (
                              <>
                                {supervisor.sites.slice(0, 2).map((site) => (
                                  <span
                                    key={site.id}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
                                  >
                                    {site.name}
                                    <Tooltip label={`Remove ${site.name}`}>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveSite(supervisor.id, site.id)}
                                        className="text-brand-600 transition-colors hover:text-danger-600"
                                        aria-label={`Remove ${site.name}`}
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    </Tooltip>
                                  </span>
                                ))}
                                {supervisor.sites.length > 2 && (
                                  <span className="rounded-full bg-console-bg px-2 py-1 text-xs text-console-muted">
                                    +{supervisor.sites.length - 2} more
                                  </span>
                                )}
                              </>
                            )}
                            <Tooltip label="Assign site">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSupervisor(supervisor);
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
                            <span className="text-sm text-console-text">{supervisor.email}</span>
                            <CopyButton value={supervisor.email} label="Email" />
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                              supervisor.isDeleted
                                ? "bg-slate-100 text-slate-600"
                                : supervisor.isBlocked
                                  ? "bg-danger-50 text-danger-700"
                                  : "bg-success-50 text-success-700",
                            )}
                          >
                            {supervisor.isDeleted ? (
                              <>
                                <Trash2 size={11} /> Deleted
                              </>
                            ) : supervisor.isBlocked ? (
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
                            {supervisor.isDeleted ? (
                              <button
                                type="button"
                                onClick={() => handleRestoreSupervisor(supervisor)}
                                disabled={isRestoring[supervisor.id]}
                                className="flex items-center gap-1.5 rounded-lg bg-success-50 px-3 py-1.5 text-xs font-medium text-success-700 transition-colors hover:bg-success-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isRestoring[supervisor.id] ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : (
                                  <RotateCcw size={13} />
                                )}
                                Restore
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(supervisor)}
                                  disabled={isToggling[supervisor.id]}
                                  aria-label={supervisor.isBlocked ? "Unblock supervisor" : "Block supervisor"}
                                  className={cn(
                                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                                    supervisor.isBlocked
                                      ? "bg-success-50 text-success-700 hover:bg-success-100"
                                      : "bg-console-bg text-console-text hover:bg-slate-200",
                                  )}
                                >
                                  {isToggling[supervisor.id] ? (
                                    <Loader2 size={13} className="animate-spin" />
                                  ) : supervisor.isBlocked ? (
                                    "Unblock"
                                  ) : (
                                    "Block"
                                  )}
                                </button>
                                <Tooltip label="Edit supervisor">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedSupervisor(supervisor);
                                      setIsEditModalOpen(true);
                                    }}
                                    aria-label="Edit supervisor"
                                    className="rounded-lg p-2 text-console-muted transition-colors hover:bg-warning-50 hover:text-warning-700"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                </Tooltip>
                                <Tooltip label="Regenerate password">
                                  <button
                                    type="button"
                                    onClick={() => handleRegeneratePassword(supervisor)}
                                    disabled={isRegenerating[supervisor.id]}
                                    aria-label="Regenerate password"
                                    className="rounded-lg p-2 text-console-muted transition-colors hover:bg-info-50 hover:text-info-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {isRegenerating[supervisor.id] ? (
                                      <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                      <RefreshCw size={14} />
                                    )}
                                  </button>
                                </Tooltip>
                                <Tooltip label="Delete supervisor">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSupervisor(supervisor)}
                                    disabled={isDeleting[supervisor.id]}
                                    aria-label="Delete supervisor"
                                    className="rounded-lg p-2 text-console-muted transition-colors hover:bg-danger-50 hover:text-danger-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {isDeleting[supervisor.id] ? (
                                      <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                      <Trash2 size={14} />
                                    )}
                                  </button>
                                </Tooltip>
                              </>
                            )}
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
                  {Math.min(indexOfLastItem, filteredSupervisors.length)}
                </span>{" "}
                of <span className="font-semibold text-console-text">{filteredSupervisors.length}</span> supervisors
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

      <AddSupervisorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={async (newSupervisor: { name: string; email: string }) => {
          try {
            await createSupervisor(newSupervisor);
            const updatedSupervisors = await getUsersByRole("supervisor", showDeleted);
            setSupervisors(
              updatedSupervisors.map((user) => ({
                id: user.id,
                name: user.name,
                sites: user.assignedSites || [],
                email: user.email,
                password: user.password || "********",
                isBlocked: user.isBlocked,
              })),
            );
            setIsAddModalOpen(false);
            toast.success("Supervisor added successfully!");
          } catch (err) {
            toast.error("Failed to add supervisor.");
          }
        }}
      />

      {selectedSupervisor && (
        <>
          <EditSupervisorModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            supervisor={selectedSupervisor}
            onSubmit={async (updatedSupervisor: { name: string; email: string }) => {
              try {
                await updateSupervisor(selectedSupervisor.id, updatedSupervisor);
                setSupervisors((prev) =>
                  prev.map((a) => (a.id === selectedSupervisor.id ? { ...a, ...updatedSupervisor } : a)),
                );
                setIsEditModalOpen(false);
                toast.success("Supervisor updated successfully!");
              } catch (err) {
                toast.error("Failed to update supervisor.");
              }
            }}
          />
          <AssignSitesModal
            isOpen={isAssignModalOpen}
            onClose={() => setIsAssignModalOpen(false)}
            allSites={allSites}
            assignedSites={selectedSupervisor.sites}
            onAssign={handleAssignSites}
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

export default Supervisors;
