import { useEffect, useState } from "react";
import {
  createClient,
  regeneratePassword,
  toggleUserStatus,
  updateClient,
  deleteClient,
  restoreClient,
  assignSitesToClients,
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
  Copy,
  Trash2,
  RotateCcw,
  Plus,
  Loader2,
} from "lucide-react";
import AddClientModal from "./AddClientModal";
import EditClientModal from "./EditClientModal";
import AssignSitesModal from "./AssignSitesModal";
import ConfirmModal from "./ConfirmModal";
import { toast } from "sonner";
import { Card, StatCard } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonStatCards, SkeletonTable } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

interface Client {
  id: string;
  name: string;
  email: string;
  isBlocked: boolean;
  isDeleted?: boolean;
  assignedSites: Site[];
}

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [allSites, setAllSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isToggling, setIsToggling] = useState<{ [key: string]: boolean }>({});
  const [isRegenerating, setIsRegenerating] = useState<{
    [key: string]: boolean;
  }>({});
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isDeleting, setIsDeleting] = useState<{ [key: string]: boolean }>({});
  const [isRestoring, setIsRestoring] = useState<{ [key: string]: boolean }>(
    {},
  );
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
        const [clientsData, sitesData] = await Promise.all([
          getUsersByRole("client", showDeleted),
          getSites(),
        ]);
        setClients(clientsData);
        setAllSites(sitesData);
      } catch (err) {
        toast.error("Failed to fetch data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showDeleted]);

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSite =
      !selectedSiteId ||
      client.assignedSites?.some((site) => site.id === selectedSiteId);
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "active" && !client.isBlocked && !client.isDeleted) ||
      (selectedStatus === "blocked" && client.isBlocked && !client.isDeleted);
    return matchesSearch && matchesSite && matchesStatus;
  });

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentClients = filteredClients.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const activeClients = clients.filter(
    (c) => !c.isBlocked && !c.isDeleted,
  ).length;
  const blockedClients = clients.filter(
    (c) => c.isBlocked && !c.isDeleted,
  ).length;
  const deletedClientsCount = clients.filter((c) => c.isDeleted).length;

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(`${label} copied to clipboard!`))
      .catch(() => toast.error(`Failed to copy ${label}`));
  };

  const handleToggleStatus = (client: Client) => {
    const action = client.isBlocked ? "unblock" : "block";
    setConfirmModal({
      isLoading: false,
      isOpen: true,
      title: `Confirm ${action}`,
      message: `Are you sure you want to ${action} ${client.name}?`,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: true }));
        setIsToggling((prev) => ({ ...prev, [client.id]: true }));
        try {
          const newIsBlocked = !client.isBlocked;
          await toggleUserStatus(client.id, newIsBlocked);
          setClients((prev) =>
            prev.map((c) =>
              c.id === client.id ? { ...c, isBlocked: newIsBlocked } : c
            )
          );
          toast.success(`Client ${newIsBlocked ? "blocked" : "unblocked"} successfully!`);
        } catch (err) {
          toast.error("Failed to update status");
        } finally {
          setIsToggling((prev) => ({ ...prev, [client.id]: false }));
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  const handleRegeneratePassword = (client: Client) => {
    setConfirmModal({
      isOpen: true,
      title: "Confirm Password Regeneration",
      message: `Are you sure you want to regenerate the password for ${client.name}?`,
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        setIsRegenerating((prev) => ({ ...prev, [client.id]: true }));
        try {
          const newPassword = await regeneratePassword(client.id);
          navigator.clipboard
            .writeText(newPassword)
            .then(() => toast.success("Password copied to clipboard!"))
            .catch(() => toast.error("Failed to copy password."));
          toast.success("Password regenerated successfully!");
        } catch (err) {
          toast.error("Failed to regenerate password.");
        } finally {
          setIsRegenerating((prev) => ({ ...prev, [client.id]: false }));
          setConfirmModal((prev) => ({ ...prev, isLoading: false, isOpen: false }));
        }
      },
    });
  };

  const handleDeleteClient = (client: Client) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Client",
      message: `Are you sure you want to delete ${client.name}? This is a soft delete — the client's historical data (sites, transactions, reports) is preserved, but they will no longer appear in active lists or be able to log in. You can restore them later.`,
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: true }));
        setIsDeleting((prev) => ({ ...prev, [client.id]: true }));
        try {
          await deleteClient(client.id);
          if (showDeleted) {
            setClients((prev) =>
              prev.map((c) => (c.id === client.id ? { ...c, isDeleted: true } : c)),
            );
          } else {
            setClients((prev) => prev.filter((c) => c.id !== client.id));
          }
          toast.success(`${client.name} has been deleted.`);
        } catch (err: any) {
          toast.error(err?.response?.data?.message || "Failed to delete client.");
        } finally {
          setIsDeleting((prev) => ({ ...prev, [client.id]: false }));
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  const handleRestoreClient = (client: Client) => {
    setConfirmModal({
      isOpen: true,
      title: "Restore Client",
      message: `Restore ${client.name}? They will reappear in active client lists and be able to log in again.`,
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: true }));
        setIsRestoring((prev) => ({ ...prev, [client.id]: true }));
        try {
          await restoreClient(client.id);
          setClients((prev) =>
            prev.map((c) => (c.id === client.id ? { ...c, isDeleted: false } : c)),
          );
          toast.success(`${client.name} has been restored.`);
        } catch (err: any) {
          toast.error(err?.response?.data?.message || "Failed to restore client.");
        } finally {
          setIsRestoring((prev) => ({ ...prev, [client.id]: false }));
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  const handleRemoveSite = (clientId: string, siteId: string) => {
    const client = clients.find((c) => c.id === clientId);
    const site = allSites.find((s) => s.id === siteId);
    if (!client || !site) return;

    setConfirmModal({
      isLoading: false,
      isOpen: true,
      title: "Confirm Site Removal",
      message: `Are you sure you want to remove ${site.name} from ${client.name}?`,
      onConfirm: async () => {
        try {
          const updatedSites = (client.assignedSites || []).filter(
            (s) => s.id !== siteId
          );
          await assignSitesToClients(
            clientId,
            updatedSites.map((s) => s.id)
          );
          setClients((prev) =>
            prev.map((c) =>
              c.id === clientId ? { ...c, assignedSites: updatedSites } : c
            )
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
    if (!selectedClient) return;
    try {
      const currentSiteIds = (selectedClient.assignedSites || []).map((site) => site.id);
      const newSiteIds = [...new Set([...currentSiteIds, ...selectedSiteIds])];
      await assignSitesToClients(selectedClient.id, newSiteIds);
      const updatedSites = allSites.filter((site) => newSiteIds.includes(site.id));
      setClients((prev) =>
        prev.map((c) =>
          c.id === selectedClient.id ? { ...c, assignedSites: updatedSites } : c
        )
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
          <h1 className="text-xl font-semibold text-console-text">Clients</h1>
          <p className="mt-0.5 text-sm text-console-muted">
            Manage and oversee clients across your organization
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus size={16} /> Add client
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
            <StatCard label="Total Clients" value={clients.length} icon={Users} />
            <StatCard label="Active" value={activeClients} icon={ShieldCheck} />
            <StatCard label="Blocked" value={blockedClients} icon={ShieldX} />
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
                  Show deleted{deletedClientsCount > 0 ? ` (${deletedClientsCount})` : ""}
                </label>
              </div>
            </div>
          </Card>

          <Card className="p-0">
            {currentClients.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No clients found"
                description="Try adjusting your search or filter criteria."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-console-border">
                  <thead className="bg-console-bg">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Assigned Sites</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-console-border">
                    {currentClients.map((client) => (
                      <tr key={client.id} className="hover:bg-console-bg">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800">
                                {client.name
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </div>
                              <div
                                className={cn(
                                  "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white",
                                  client.isBlocked ? "bg-danger-500" : "bg-success-500",
                                )}
                              />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-console-text">{client.name}</div>
                              <div className="text-xs text-console-muted">ID: {client.id.slice(-8)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex max-w-xs flex-wrap items-center gap-1.5">
                            {(client.assignedSites || []).length === 0 ? (
                              <span className="rounded-full bg-console-bg px-2 py-1 text-xs text-console-muted">
                                No sites assigned
                              </span>
                            ) : (
                              <>
                                {client.assignedSites.slice(0, 2).map((site) => (
                                  <span
                                    key={site.id}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
                                  >
                                    {site.name}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSite(client.id, site.id)}
                                      className="text-brand-600 transition-colors hover:text-danger-600"
                                      aria-label={`Remove ${site.name}`}
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </span>
                                ))}
                                {client.assignedSites.length > 2 && (
                                  <span className="rounded-full bg-console-bg px-2 py-1 text-xs text-console-muted">
                                    +{client.assignedSites.length - 2} more
                                  </span>
                                )}
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedClient(client);
                                setIsAssignModalOpen(true);
                              }}
                              aria-label="Assign site"
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-success-600 text-white transition-colors hover:bg-success-700"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <Mail size={13} className="text-console-muted" />
                            <span className="text-sm text-console-text">{client.email}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(client.email, "Email")}
                              aria-label="Copy email"
                              className="text-console-muted transition-colors hover:text-brand-700"
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                              client.isDeleted
                                ? "bg-slate-100 text-slate-600"
                                : client.isBlocked
                                  ? "bg-danger-50 text-danger-700"
                                  : "bg-success-50 text-success-700",
                            )}
                          >
                            {client.isDeleted ? (
                              <>
                                <Trash2 size={11} /> Deleted
                              </>
                            ) : client.isBlocked ? (
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
                            {client.isDeleted ? (
                              <button
                                type="button"
                                onClick={() => handleRestoreClient(client)}
                                disabled={isRestoring[client.id]}
                                className="flex items-center gap-1.5 rounded-lg bg-success-50 px-3 py-1.5 text-xs font-medium text-success-700 transition-colors hover:bg-success-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isRestoring[client.id] ? (
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
                                  onClick={() => handleToggleStatus(client)}
                                  disabled={isToggling[client.id]}
                                  aria-label={client.isBlocked ? "Unblock client" : "Block client"}
                                  className={cn(
                                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                                    client.isBlocked
                                      ? "bg-success-50 text-success-700 hover:bg-success-100"
                                      : "bg-console-bg text-console-text hover:bg-slate-200",
                                  )}
                                >
                                  {isToggling[client.id] ? (
                                    <Loader2 size={13} className="animate-spin" />
                                  ) : client.isBlocked ? (
                                    "Unblock"
                                  ) : (
                                    "Block"
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedClient(client);
                                    setIsEditModalOpen(true);
                                  }}
                                  aria-label="Edit client"
                                  className="rounded-lg p-2 text-console-muted transition-colors hover:bg-warning-50 hover:text-warning-700"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRegeneratePassword(client)}
                                  disabled={isRegenerating[client.id]}
                                  aria-label="Regenerate password"
                                  className="rounded-lg p-2 text-console-muted transition-colors hover:bg-info-50 hover:text-info-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isRegenerating[client.id] ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <RefreshCw size={14} />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteClient(client)}
                                  disabled={isDeleting[client.id]}
                                  aria-label="Delete client"
                                  title="Delete client"
                                  className="rounded-lg p-2 text-console-muted transition-colors hover:bg-danger-50 hover:text-danger-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isDeleting[client.id] ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <Trash2 size={14} />
                                  )}
                                </button>
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
                  {Math.min(indexOfLastItem, filteredClients.length)}
                </span>{" "}
                of <span className="font-semibold text-console-text">{filteredClients.length}</span> clients
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

      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={async (newClient) => {
          try {
            const createdClient = await createClient(newClient);
            setClients((prev) => [...prev, createdClient]);
            setIsAddModalOpen(false);
            toast.success("Client added successfully!");
          } catch (err) {
            toast.error("Failed to add client.");
          }
        }}
      />

      {selectedClient && (
        <>
          <EditClientModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            client={selectedClient}
            onSubmit={async (updatedClientData) => {
              try {
                const updatedClient = await updateClient(selectedClient.id, updatedClientData);
                setClients((prev) =>
                  prev.map((c) => (c.id === updatedClient.id ? { ...c, ...updatedClient } : c))
                );
                setIsEditModalOpen(false);
                toast.success("Client updated successfully!");
              } catch (err) {
                toast.error("Failed to update client.");
              }
            }}
          />
          <AssignSitesModal
            isOpen={isAssignModalOpen}
            onClose={() => setIsAssignModalOpen(false)}
            allSites={allSites}
            assignedSites={selectedClient.assignedSites}
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

export default Clients;
