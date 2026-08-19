import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlignJustify,
  Users,
  Eye,
  MapPin,
  Grid as GridIcon,
  Activity,
  AlertCircle,
  Mail,
  Phone,
  ArrowLeft,
  DollarSign,
  Trash2,
  Pencil,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Inbox,
  Wallet,
} from "lucide-react";
import {
  getAllContractors,
  getContractorsPaginated,
  createContractor,
  assignSiteToContractor,
  getContractorTransactions,
  addTransaction,
  updateContractor,
  deleteContractor,
  deleteContractorTransaction,
  ContractorTransaction,
} from "@/services/contractorService";
import debounce from "lodash/debounce";
import { getSites } from "@/services/siteService";
import AddContractorModal from "./AddContractorModal";
import ContractorAssignSiteModal from "./ContractorAssignSiteModal";
import AddTransactionModal from "./AddContractorTransactionModal";
import DeleteContractorModal from "./DeleteContractorModal";
import { toast } from "sonner";
import { Card, StatCard } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonStatCards, SkeletonTable } from "@/components/ui/Skeleton";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Tooltip from "@/components/ui/Tooltip";
import GradientStatCard from "@/components/ui/GradientStatCard";
import CopyButton from "@/components/ui/CopyButton";
import { cn } from "@/lib/cn";
import { usePreferences } from "@/hooks/usePreferences";

interface Contractor {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: "active" | "blocked";
  siteAssignments: { site: { id: string; name: string }; totalAmount: number }[];
}

interface Site {
  id: string;
  name: string;
}

type SortField = "name" | "company" | "email" | "status";

const Contractors: React.FC = () => {
  const { formatDecimal, formatDate } = usePreferences();
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageContractors, setPageContractors] = useState<Contractor[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [tableLoading, setTableLoading] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAssignSiteModalOpen, setIsAssignSiteModalOpen] = useState(false);
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] =
    useState(false);

  const [selectedContractor, setSelectedContractor] =
    useState<Contractor | null>(null);
  const [selectedSiteIdForTx, setSelectedSiteIdForTx] = useState("");

  const [viewMode, setViewMode] = useState<
    "list" | "grid" | "details" | "transactions"
  >("list");

  const [selectedCompany, setSelectedCompany] = useState("All Companies");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [companies, setCompanies] = useState<string[]>(["All Companies"]);
  const [sites, setSites] = useState<Site[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [contractorToEdit, setContractorToEdit] = useState<Contractor | null>(
    null,
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [contractorToDelete, setContractorToDelete] =
    useState<Contractor | null>(null);

  const [newContractor, setNewContractor] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
  });
  const [inputErrors, setInputErrors] = useState({
    name: false,
    email: false,
    phone: false,
    company: false,
  });

  const [transactions, setTransactions] = useState<ContractorTransaction[]>([]);
  const [deleteTxTarget, setDeleteTxTarget] = useState<string | null>(null);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);

  const [sortBy, setSortBy] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const itemsPerPage = 6;

  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        const contractorsData = await getAllContractors();
        const sitesData = await getSites();
        setContractors(contractorsData);
        setSites(sitesData);
        const uniqueCompanies = Array.from(
          new Set(contractorsData.map((c) => c.company).filter(Boolean)),
        );
        setCompanies(["All Companies", ...uniqueCompanies]);
      } catch (err) {
        setPageError("Failed to fetch data. Please try again later.");
      }
    };
    fetchPortfolioData();
  }, []);

  useEffect(() => {
    const debounced = debounce((value: string) => {
      setDebouncedSearchTerm(value);
      setCurrentPage(1);
    }, 350);
    debounced(searchTerm);
    return () => debounced.cancel();
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCompany, statusFilter, sortBy, sortOrder]);

  const fetchPage = async () => {
    setTableLoading(true);
    try {
      const result = await getContractorsPaginated({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm,
        status: statusFilter === "All Statuses" ? "" : statusFilter,
        company: selectedCompany === "All Companies" ? "" : selectedCompany,
        sortBy,
        sortOrder,
      });
      setPageContractors(result.contractors);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setPageError(null);
    } catch (err) {
      setPageError("Failed to fetch data. Please try again later.");
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchPage();
  }, [
    currentPage,
    debouncedSearchTerm,
    selectedCompany,
    statusFilter,
    sortBy,
    sortOrder,
  ]);

  const currentContractors = pageContractors;
  const indexOfFirstItem = total === 0 ? 0 : (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = currentPage * itemsPerPage;

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) setCurrentPage(pageNumber);
  };

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleAddContractor = async (e: React.MouseEvent) => {
    e.preventDefault();
    const errors = {
      name: !newContractor.name.trim(),
      email: !newContractor.email.trim() || !isValidEmail(newContractor.email),
      phone: false,
      company: false,
    };
    setInputErrors(errors);
    if (errors.name || errors.email) return;

    try {
      const createdContractor = await createContractor(newContractor);
      setContractors((prev) => [...prev, createdContractor]);
      if (newContractor.company && !companies.includes(newContractor.company)) {
        setCompanies((prev) => [...prev, newContractor.company]);
      }
      setNewContractor({ name: "", email: "", phone: "", company: "" });
      setIsAddModalOpen(false);
      toast.success("Contractor added");
      if (currentPage === 1) {
        fetchPage();
      } else {
        setCurrentPage(1);
      }
    } catch (err) {
      toast.error("Failed to add contractor");
    }
  };

  const openDetails = (contractor: Contractor) => {
    setSelectedContractor(contractor);
    setViewMode("details");
  };

  const openTransactions = async (contractor: Contractor, siteId: string) => {
    setSelectedContractor(contractor);
    setSelectedSiteIdForTx(siteId);
    try {
      const txs = await getContractorTransactions(contractor.id, siteId);
      setTransactions(txs);
      setViewMode("transactions");
    } catch (err) {
      toast.error("Failed to fetch transactions");
    }
  };

  const handleAssignSite = async (siteId: string) => {
    if (!selectedContractor) return;
    try {
      await assignSiteToContractor(selectedContractor.id, siteId);
      const newAssignment = {
        site: {
          id: siteId,
          name: sites.find((s) => s.id === siteId)?.name || "",
        },
        totalAmount: 0,
      };
      setSelectedContractor((prev) => ({
        ...prev!,
        siteAssignments: [...(prev?.siteAssignments || []), newAssignment],
      }));
      setContractors((prev) =>
        prev.map((c) =>
          c.id === selectedContractor.id
            ? { ...c, siteAssignments: [...c.siteAssignments, newAssignment] }
            : c,
        ),
      );
      setIsAssignSiteModalOpen(false);
      toast.success("Site assigned");
      fetchPage();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to assign site");
      throw err;
    }
  };

  const handleAddTransaction = async (data: any) => {
    const response = await addTransaction(data);
    setContractors((prev) =>
      prev.map((c) =>
        c.id === response.updatedContractor.id ? response.updatedContractor : c,
      ),
    );
    if (
      selectedContractor &&
      selectedContractor.id === response.updatedContractor.id
    ) {
      setSelectedContractor(response.updatedContractor);
    }
    fetchPage();
    return response;
  };

  const handleDeleteTransaction = async () => {
    if (!deleteTxTarget) return;
    setDeletingTxId(deleteTxTarget);
    try {
      const { updatedContractor } =
        await deleteContractorTransaction(deleteTxTarget);
      setTransactions((prev) => prev.filter((tx) => tx.id !== deleteTxTarget));
      setContractors((prev) =>
        prev.map((c) =>
          c.id === updatedContractor.id ? updatedContractor : c,
        ),
      );
      if (selectedContractor && selectedContractor.id === updatedContractor.id) {
        setSelectedContractor(updatedContractor);
      }
      toast.success("Transaction deleted");
      setDeleteTxTarget(null);
      fetchPage();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete transaction");
    } finally {
      setDeletingTxId(null);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return <ArrowUpDown size={13} className="text-console-muted" />;
    return sortOrder === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />;
  };

  const openEditModal = (contractor: Contractor) => {
    setContractorToEdit(contractor);
    setNewContractor({
      name: contractor.name,
      email: contractor.email,
      phone: contractor.phone || "",
      company: contractor.company || "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateContractor = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!contractorToEdit) return;

    const errors = {
      name: !newContractor.name.trim(),
      email: !newContractor.email.trim() || !isValidEmail(newContractor.email),
      phone: false,
      company: false,
    };

    setInputErrors(errors);
    if (errors.name || errors.email) return;

    try {
      const updated = await updateContractor(contractorToEdit.id, {
        name: newContractor.name,
        email: newContractor.email,
        phone: newContractor.phone,
        company: newContractor.company,
      });

      setContractors((prev) =>
        prev.map((c) =>
          c.id === contractorToEdit.id ? { ...c, ...updated, siteAssignments: c.siteAssignments } : c,
        ),
      );

      setIsEditModalOpen(false);
      setContractorToEdit(null);
      setNewContractor({ name: "", email: "", phone: "", company: "" });
      toast.success("Contractor updated");
      fetchPage();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update contractor");
    }
  };

  const openDeleteModal = (contractor: Contractor) => {
    setContractorToDelete(contractor);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteContractor = async () => {
    if (!contractorToDelete) return;

    try {
      await deleteContractor(contractorToDelete.id);
      setContractors((prev) =>
        prev.filter((c) => c.id !== contractorToDelete.id),
      );
      setIsDeleteModalOpen(false);
      setContractorToDelete(null);
      toast.success("Contractor deleted");

      if (selectedContractor?.id === contractorToDelete.id) {
        setViewMode("list");
        setSelectedContractor(null);
      }

      if (currentPage === 1) {
        fetchPage();
      } else {
        setCurrentPage(1);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete contractor");
    }
  };

  const getSizeStyles = () => "max-w-2xl w-full mx-4";

  const ContractorCard = ({ contractor }: { contractor: Contractor }) => {
    const totalBalance = contractor.siteAssignments.reduce(
      (sum, assignment) => sum + assignment.totalAmount,
      0,
    );
    return (
      <Card className="transition-shadow hover:shadow-console-lg">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-base font-semibold text-brand-800">
              {contractor.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-console-text">{contractor.name}</h3>
              <p className="text-xs text-console-muted">{contractor.company || "No company"}</p>
            </div>
          </div>
          <Badge variant={contractor.status === "active" ? "success" : "error"}>
            {contractor.status === "active" ? "Active" : "Blocked"}
          </Badge>
        </div>
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-console-muted">
            <Mail size={13} />
            {contractor.email}
            <CopyButton value={contractor.email} label="Email" />
          </div>
          {contractor.phone && (
            <div className="flex items-center gap-2 text-sm text-console-muted">
              <Phone size={13} />
              {contractor.phone}
              <CopyButton value={contractor.phone} label="Phone" />
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-console-muted">
            <MapPin size={13} />
            {contractor.siteAssignments.length} sites assigned
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-console-border pt-4">
          <div className="text-sm text-console-muted">
            Total balance:{" "}
            <span className="font-semibold text-console-text">
              ₹{formatDecimal(totalBalance)}
            </span>
          </div>
          <div className="flex gap-1">
            <Tooltip label="Edit contractor">
              <button
                type="button"
                onClick={() => openEditModal(contractor)}
                aria-label="Edit contractor"
                className="rounded-lg p-2 text-console-muted transition-colors hover:bg-warning-50 hover:text-warning-700"
              >
                <Pencil size={15} />
              </button>
            </Tooltip>
            <Tooltip label="Delete contractor">
              <button
                type="button"
                onClick={() => openDeleteModal(contractor)}
                aria-label="Delete contractor"
                className="rounded-lg p-2 text-console-muted transition-colors hover:bg-danger-50 hover:text-danger-700"
              >
                <Trash2 size={15} />
              </button>
            </Tooltip>
            <Tooltip label="View contractor details">
              <button
                type="button"
                onClick={() => openDetails(contractor)}
                aria-label="View contractor"
                className="rounded-lg p-2 text-console-muted transition-colors hover:bg-brand-50 hover:text-brand-700"
              >
                <Eye size={15} />
              </button>
            </Tooltip>
          </div>
        </div>
      </Card>
    );
  };

  if (pageError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-50 text-danger-600">
            <AlertCircle size={22} />
          </div>
          <h3 className="text-lg font-semibold text-console-text">Something went wrong</h3>
          <p className="mt-1 text-sm text-console-muted">{pageError}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-console-text">Contractor Management</h1>
          <p className="mt-0.5 text-sm text-console-muted">
            Manage your contractors and their site assignments
          </p>
        </div>
        {viewMode === "list" || viewMode === "grid" ? (
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} /> Add contractor
          </Button>
        ) : (
          <Button
            variant="secondary"
            onClick={() => setViewMode(viewMode === "transactions" ? "details" : "list")}
          >
            <ArrowLeft size={16} /> Back
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-6">
          <SkeletonStatCards count={3} />
          <SkeletonTable />
        </div>
      ) : (
        <>
          {(viewMode === "list" || viewMode === "grid") && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total Contractors" value={contractors.length} icon={Users} />
              <StatCard
                label="Active Contractors"
                value={contractors.filter((c) => c.status === "active").length}
                icon={Activity}
              />
              <StatCard
                label="Blocked Contractors"
                value={contractors.filter((c) => c.status === "blocked").length}
                icon={AlertCircle}
              />
              <GradientStatCard
                label="Total Balance"
                value={contractors.reduce(
                  (sum, c) => sum + c.siteAssignments.reduce((s, a) => s + a.totalAmount, 0),
                  0,
                )}
                prefix="₹"
                tone="danger"
                icon={Wallet}
              />
            </div>
          )}

          {viewMode === "details" && selectedContractor && (
            <Card>
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-xl font-semibold text-brand-800">
                  {selectedContractor.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-console-text">{selectedContractor.name}</h2>
                  <p className="text-sm text-console-muted">{selectedContractor.company || "No company"}</p>
                  <Badge
                    className="mt-2"
                    variant={selectedContractor.status === "active" ? "success" : "error"}
                  >
                    {selectedContractor.status === "active" ? "Active" : "Blocked"}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="rounded-console border border-console-border bg-console-bg p-5 lg:col-span-1">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-console-text">
                    <Users size={16} className="text-brand-600" />
                    Contact information
                  </h3>
                  <div className="space-y-3 text-sm text-console-text">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-console-muted" />
                      {selectedContractor.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-console-muted" />
                      {selectedContractor.phone || "Not provided"}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-console-muted" />
                      {selectedContractor.company || "Not provided"}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="rounded-console border border-console-border p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-console-text">
                        <MapPin size={16} className="text-success-600" />
                        Site assignments ({selectedContractor.siteAssignments.length})
                      </h3>
                      <Button size="sm" variant="secondary" onClick={() => setIsAssignSiteModalOpen(true)}>
                        <Plus size={14} /> Assign site
                      </Button>
                    </div>

                    {selectedContractor.siteAssignments.length > 0 ? (
                      <div className="space-y-3">
                        {selectedContractor.siteAssignments.map((assignment) => (
                          <div
                            key={assignment.site.id}
                            className="flex items-center justify-between rounded-console border border-console-border p-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-50 text-success-700">
                                <MapPin size={16} />
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-console-text">
                                  {assignment.site.name}
                                </h4>
                                <p
                                  className={cn(
                                    "text-xs font-medium",
                                    assignment.totalAmount >= 0 ? "text-success-700" : "text-danger-700",
                                  )}
                                >
                                  Total amount: ₹
                                  {formatDecimal(assignment.totalAmount)}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => openTransactions(selectedContractor, assignment.site.id)}
                              className="flex items-center gap-1.5 rounded-lg border border-console-border px-3 py-1.5 text-xs font-medium text-console-text transition-colors hover:bg-console-bg"
                            >
                              <Activity size={13} /> Transactions
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState icon={MapPin} title="No sites assigned yet" />
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-console-border pt-5">
                <Button variant="secondary" onClick={() => setIsAddTransactionModalOpen(true)}>
                  <DollarSign size={16} /> Add transaction
                </Button>
              </div>
            </Card>
          )}

          {viewMode === "transactions" && selectedContractor && (
            <Card>
              <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-console-text">
                <Activity size={20} className="text-brand-600" />
                Transactions for {selectedContractor.name}
              </h2>

              <div className="mb-6">
                <label className="mb-1.5 block text-sm font-medium text-console-text">Select site</label>
                <select
                  value={selectedSiteIdForTx}
                  onChange={async (e) => {
                    const siteId = e.target.value;
                    setSelectedSiteIdForTx(siteId);
                    if (siteId) {
                      try {
                        const txs = await getContractorTransactions(selectedContractor.id, siteId);
                        setTransactions(txs);
                      } catch (err) {
                        toast.error("Failed to fetch transactions");
                      }
                    } else {
                      setTransactions([]);
                    }
                  }}
                  className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  <option value="">Select a site to view transactions</option>
                  {selectedContractor.siteAssignments.map((assignment) => (
                    <option key={assignment.site.id} value={assignment.site.id}>
                      {assignment.site.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSiteIdForTx && (
                <div>
                  <h3 className="mb-4 text-sm font-semibold text-console-text">
                    Transactions for{" "}
                    {selectedContractor.siteAssignments.find((a) => a.site.id === selectedSiteIdForTx)
                      ?.site.name || "Unknown Site"}
                  </h3>

                  {transactions.length > 0 ? (
                    <div className="max-h-[400px] overflow-y-auto rounded-console border border-console-border">
                      <table className="min-w-full divide-y divide-console-border">
                        <thead className="sticky top-0 bg-console-bg">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Description</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Date</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-console-muted">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-console-border bg-white">
                          {transactions.map((tx) => (
                            <tr key={tx.id}>
                              <td className="px-4 py-3 text-sm text-console-text capitalize">{tx.type.replace("_", " ")}</td>
                              <td className="px-4 py-3 text-sm font-medium text-console-text">
                                ₹{formatDecimal(tx.amount)}
                              </td>
                              <td className="px-4 py-3 text-sm text-console-muted">{tx.description || "N/A"}</td>
                              <td className="px-4 py-3 text-sm text-console-muted">
                                {formatDate(tx.date)}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Tooltip label="Delete transaction">
                                  <button
                                    type="button"
                                    onClick={() => setDeleteTxTarget(tx.id)}
                                    disabled={deletingTxId === tx.id}
                                    aria-label="Delete transaction"
                                    className="rounded-lg p-2 text-danger-600 transition-colors hover:bg-danger-50 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </Tooltip>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState icon={Inbox} title="No transactions found for this site" />
                  )}
                </div>
              )}
            </Card>
          )}

          {(viewMode === "list" || viewMode === "grid") && (
            <>
              <Card>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-console-text">
                      Search contractors
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-console-muted" size={16} />
                      <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full rounded-lg border border-console-border py-2.5 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-console-text">
                      Filter by company
                    </label>
                    <select
                      value={selectedCompany}
                      onChange={(e) => {
                        setSelectedCompany(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full rounded-lg border border-console-border px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    >
                      {companies.map((company) => (
                        <option key={company} value={company}>
                          {company}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-console-text">
                      Filter by status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full rounded-lg border border-console-border px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    >
                      <option value="All Statuses">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>

                  <div className="flex items-end gap-2">
                    <div className="flex items-center gap-1 rounded-lg border border-console-border p-1">
                      <Tooltip label="List view">
                        <button
                          type="button"
                          onClick={() => setViewMode("list")}
                          aria-label="List view"
                          className={cn(
                            "rounded-md p-1.5 transition-colors",
                            viewMode === "list" ? "bg-brand-50 text-brand-700" : "text-console-muted hover:bg-console-bg",
                          )}
                        >
                          <AlignJustify size={16} />
                        </button>
                      </Tooltip>
                      <Tooltip label="Grid view">
                        <button
                          type="button"
                          onClick={() => setViewMode("grid")}
                          aria-label="Grid view"
                          className={cn(
                            "rounded-md p-1.5 transition-colors",
                            viewMode === "grid" ? "bg-brand-50 text-brand-700" : "text-console-muted hover:bg-console-bg",
                          )}
                        >
                          <GridIcon size={16} />
                        </button>
                      </Tooltip>
                    </div>
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedCompany("All Companies");
                        setStatusFilter("All Statuses");
                        setCurrentPage(1);
                      }}
                    >
                      Clear filters
                    </Button>
                  </div>
                </div>
              </Card>

              {!tableLoading && total === 0 ? (
                <Card>
                  <EmptyState
                    icon={Users}
                    title="No contractors found"
                    description="Try adjusting your search criteria or filters."
                  />
                </Card>
              ) : viewMode === "list" ? (
                <Card className="p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-console-border">
                      <thead className="bg-console-bg">
                        <tr>
                          <th
                            className="cursor-pointer px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted"
                            onClick={() => handleSort("name")}
                          >
                            <span className="flex items-center gap-1.5">Name <SortIcon field="name" /></span>
                          </th>
                          <th
                            className="cursor-pointer px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted"
                            onClick={() => handleSort("company")}
                          >
                            <span className="flex items-center gap-1.5">Company <SortIcon field="company" /></span>
                          </th>
                          <th
                            className="cursor-pointer px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted"
                            onClick={() => handleSort("email")}
                          >
                            <span className="flex items-center gap-1.5">Email <SortIcon field="email" /></span>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">
                            Phone
                          </th>
                          <th
                            className="cursor-pointer px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted"
                            onClick={() => handleSort("status")}
                          >
                            <span className="flex items-center gap-1.5">Status <SortIcon field="status" /></span>
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-console-muted">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-console-border">
                        {currentContractors.map((contractor) => (
                          <tr key={contractor.id} className="hover:bg-console-bg">
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800">
                                  {contractor.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-console-text">{contractor.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <Badge variant="info">{contractor.company || "N/A"}</Badge>
                            </td>
                            <td className="px-4 py-3.5 text-sm text-console-muted">
                              <div className="flex items-center gap-2">
                                <span>{contractor.email}</span>
                                <CopyButton value={contractor.email} label="Email" />
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-sm text-console-muted">
                              {contractor.phone ? (
                                <div className="flex items-center gap-2">
                                  <span>{contractor.phone}</span>
                                  <CopyButton value={contractor.phone} label="Phone" />
                                </div>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              <Badge variant={contractor.status === "active" ? "success" : "error"}>
                                {contractor.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center justify-center gap-1">
                                <Tooltip label="View contractor details">
                                  <button
                                    type="button"
                                    onClick={() => openDetails(contractor)}
                                    aria-label="View contractor"
                                    className="rounded-lg p-2 text-console-muted transition-colors hover:bg-brand-50 hover:text-brand-700"
                                  >
                                    <Eye size={16} />
                                  </button>
                                </Tooltip>
                                <Tooltip label="Edit contractor">
                                  <button
                                    type="button"
                                    onClick={() => openEditModal(contractor)}
                                    aria-label="Edit contractor"
                                    className="rounded-lg p-2 text-console-muted transition-colors hover:bg-warning-50 hover:text-warning-700"
                                  >
                                    <Pencil size={16} />
                                  </button>
                                </Tooltip>
                                <Tooltip label="Delete contractor">
                                  <button
                                    type="button"
                                    onClick={() => openDeleteModal(contractor)}
                                    aria-label="Delete contractor"
                                    className="rounded-lg p-2 text-console-muted transition-colors hover:bg-danger-50 hover:text-danger-700"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </Tooltip>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {currentContractors.map((contractor) => (
                    <ContractorCard key={contractor.id} contractor={contractor} />
                  ))}
                </div>
              )}

              <div className="flex flex-col items-center justify-between gap-4 rounded-console bg-console-bg px-4 py-3 sm:flex-row">
                <p className="text-sm text-console-muted">
                  Showing{" "}
                  <span className="font-semibold text-console-text">{indexOfFirstItem + 1}</span> to{" "}
                  <span className="font-semibold text-console-text">
                    {Math.min(indexOfLastItem, total)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-console-text">
                    {total}
                  </span>{" "}
                  contractors
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
            </>
          )}
        </>
      )}

      <AddContractorModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setNewContractor({ name: "", email: "", phone: "", company: "" });
          setInputErrors({ name: false, email: false, phone: false, company: false });
        }}
        onSubmit={handleAddContractor}
        newContractor={newContractor}
        setNewContractor={setNewContractor}
        inputErrors={inputErrors}
        sizeStyles={getSizeStyles()}
      />

      <AddContractorModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setContractorToEdit(null);
          setNewContractor({ name: "", email: "", phone: "", company: "" });
          setInputErrors({ name: false, email: false, phone: false, company: false });
        }}
        onSubmit={handleUpdateContractor}
        newContractor={newContractor}
        setNewContractor={setNewContractor}
        inputErrors={inputErrors}
        sizeStyles={getSizeStyles()}
        isEditMode={true}
      />

      <ContractorAssignSiteModal
        isOpen={isAssignSiteModalOpen && !!selectedContractor}
        onClose={() => setIsAssignSiteModalOpen(false)}
        contractor={selectedContractor}
        sites={sites}
        onAssign={handleAssignSite}
        setError={(msg) => {
          if (msg) toast.error(msg);
        }}
        sizeStyles={getSizeStyles()}
      />

      {selectedContractor && (
        <AddTransactionModal
          isOpen={isAddTransactionModalOpen}
          onClose={() => setIsAddTransactionModalOpen(false)}
          contractor={selectedContractor}
          onAddTransaction={handleAddTransaction}
        />
      )}

      <DeleteContractorModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setContractorToDelete(null);
        }}
        onConfirm={handleDeleteContractor}
        contractorName={contractorToDelete?.name || ""}
      />

      <ConfirmDialog
        isOpen={!!deleteTxTarget}
        onClose={() => setDeleteTxTarget(null)}
        onConfirm={handleDeleteTransaction}
        title="Delete transaction"
        message="This will reverse the contractor balance, the site's expenses, and the original payment source (company or site manager balance). This cannot be undone."
        variant="danger"
        confirmText="Delete"
        isLoading={!!deletingTxId}
      />
    </div>
  );
};

export default Contractors;
