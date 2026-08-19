import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Package,
  Phone,
  Mail,
  Users,
  Calendar,
  DollarSign,
  Grid as GridIcon,
  List,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import {
  getVendors,
  getVendorsPaginated,
  createVendor,
  updateVendor,
  deleteVendor,
  getPurchasesByVendor,
} from "@/services/vendorService";
import debounce from "lodash/debounce";
import SettleVendorModal from "./SettleVendorModal";
import VendorPurchaseHistoryModal from "./VendorPurchaseHistoryModal";
import { toast } from "sonner";
import { Card, StatCard } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonStatCards, SkeletonTable } from "@/components/ui/Skeleton";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Tooltip from "@/components/ui/Tooltip";
import GradientStatCard from "@/components/ui/GradientStatCard";
import CopyButton from "@/components/ui/CopyButton";
import { cn } from "@/lib/cn";
import { usePreferences } from "@/hooks/usePreferences";

interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt?: string;
  totalPurchases?: number;
  totalAmount?: number;
  outstandingAmount?: number;
  status?: "active" | "inactive";
}

interface Purchase {
  _id: string;
  site: { name: string } | null;
  createdAt: string;
  totalAmount: number;
  status: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    price: number;
    category: string;
  }>;
  billUpload: {
    name: string;
    url: string;
    uploadDate: string;
  };
  payment: {
    method: "cash" | "credit";
    isPaid: boolean;
  };
}

interface VendorFormData {
  name: string;
  email: string;
  phone: string;
}

const formatCurrencyBase = (amount: number | undefined, numberFormat: string) =>
  `₹${(amount || 0).toLocaleString(numberFormat, { maximumFractionDigits: 2 })}`;

const Vendors: React.FC = () => {
  const { numberFormat, formatDate } = usePreferences();
  const formatCurrency = (amount: number | undefined) => formatCurrencyBase(amount, numberFormat);
  const [pageVendors, setPageVendors] = useState<Vendor[]>([]);
  const [portfolioVendors, setPortfolioVendors] = useState<Vendor[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [tableLoading, setTableLoading] = useState<boolean>(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentVendor, setCurrentVendor] = useState<Vendor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<VendorFormData>({
    name: "",
    email: "",
    phone: "",
  });
  const [selectedVendorPurchases, setSelectedVendorPurchases] = useState<
    Purchase[]
  >([]);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] =
    useState<boolean>(false);
  const [purchaseModalVendorName, setPurchaseModalVendorName] = useState("");
  const [isLoadingPurchases, setIsLoadingPurchases] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [expandedStats, setExpandedStats] = useState<boolean>(true);

  const itemsPerPage = 10;

  const fetchPortfolioStats = async () => {
    try {
      const data = await getVendors();
      setPortfolioVendors(data);
      setPageError(null);
    } catch (err) {
      setPageError("Failed to fetch vendors");
    }
  };

  const fetchPage = async () => {
    setTableLoading(true);
    try {
      const result = await getVendorsPaginated({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm,
      });
      setPageVendors(result.vendors);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setPageError(null);
    } catch (err) {
      setPageError("Failed to fetch vendors");
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolioStats();
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
    fetchPage();
  }, [currentPage, debouncedSearchTerm]);

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const refreshAfterMutation = async () => {
    if (currentPage === 1) {
      await fetchPage();
    } else {
      setCurrentPage(1);
    }
    await fetchPortfolioStats();
  };

  const filteredVendors = pageVendors.filter((vendor) => {
    const matchesFilter =
      filterStatus === "all" || vendor.status === filterStatus;
    return matchesFilter;
  });

  const stats = {
    total: portfolioVendors.length,
    totalAmount: portfolioVendors.reduce((sum, v) => sum + (v.totalAmount || 0), 0),
    totalPurchases: portfolioVendors.reduce((sum, v) => sum + (v.totalPurchases || 0), 0),
    totalOutstanding: portfolioVendors.reduce(
      (sum, v) => sum + (v.outstandingAmount || 0),
      0
    ),
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setFormData({ name: "", email: "", phone: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (vendor: Vendor) => {
    setIsEditMode(true);
    setCurrentVendor(vendor);
    setFormData({
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentVendor(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isEditMode && currentVendor) {
        await updateVendor(currentVendor.id, formData);
        toast.success("Vendor updated");
      } else {
        await createVendor(formData);
        toast.success("Vendor created");
      }
      closeModal();
      await refreshAfterMutation();
    } catch (err) {
      toast.error("Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteVendor(deleteTarget.id);
      toast.success("Vendor deleted");
      setDeleteTarget(null);
      await refreshAfterMutation();
    } catch (err) {
      toast.error("Failed to delete vendor");
    } finally {
      setIsDeleting(false);
    }
  };

  const openPurchaseModal = async (vendorId: string, vendorName: string) => {
    setPurchaseModalVendorName(vendorName);
    setIsPurchaseModalOpen(true);
    setIsLoadingPurchases(true);
    try {
      const purchases = await getPurchasesByVendor(vendorId);
      setSelectedVendorPurchases(purchases);
    } catch (err) {
      toast.error("Failed to fetch purchases");
      setIsPurchaseModalOpen(false);
    } finally {
      setIsLoadingPurchases(false);
    }
  };

  const closePurchaseModal = () => {
    setIsPurchaseModalOpen(false);
    setSelectedVendorPurchases([]);
  };

  const [settleTarget, setSettleTarget] = useState<{
    id: string;
    name: string;
    outstandingAmount: number;
  } | null>(null);

  const openSettleModal = (vendor: Vendor) => {
    setSettleTarget({
      id: vendor.id,
      name: vendor.name,
      outstandingAmount: vendor.outstandingAmount || 0,
    });
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
          <Button className="mt-5" onClick={() => { fetchPortfolioStats(); fetchPage(); }}>
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
          <h1 className="text-xl font-semibold text-console-text">Vendor Management</h1>
          <p className="mt-0.5 text-sm text-console-muted">
            Manage your vendors, track purchases, and monitor relationships
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus size={16} /> Add vendor
        </Button>
      </div>

      {loading ? (
        <div className="space-y-6">
          <SkeletonStatCards count={4} />
          <SkeletonTable />
        </div>
      ) : (
        <>
          <Card>
            <button
              type="button"
              onClick={() => setExpandedStats((v) => !v)}
              className="mb-4 flex w-full items-center justify-between"
            >
              <h2 className="text-sm font-semibold text-console-text">Overview statistics</h2>
              {expandedStats ? <ChevronUp size={18} className="text-console-muted" /> : <ChevronDown size={18} className="text-console-muted" />}
            </button>
            {expandedStats && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total Vendors" value={stats.total} icon={Users} />
                <StatCard label="Total Purchases" value={stats.totalPurchases} icon={Package} />
                <GradientStatCard label="Total Value" value={stats.totalAmount} prefix="₹" icon={DollarSign} />
                <GradientStatCard
                  label="Total Outstanding"
                  value={stats.totalOutstanding}
                  prefix="₹"
                  tone="danger"
                  icon={DollarSign}
                />
              </div>
            )}
          </Card>

          <Card>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-console-text">Search vendors</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-console-muted" size={16} />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-console-border py-2.5 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-console-text">Filter by status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full rounded-lg border border-console-border px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex items-end">
                <div className="flex items-center gap-1 rounded-lg border border-console-border p-1">
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
                      <List size={16} />
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>
          </Card>

          {!tableLoading && filteredVendors.length === 0 ? (
            <Card>
              <EmptyState icon={Users} title="No vendors found" description="Try adjusting your search or filters." />
            </Card>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredVendors.map((vendor) => (
                <Card key={vendor.id} className="transition-shadow hover:shadow-console-lg">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-base font-semibold text-brand-800">
                        {vendor.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-console-text">{vendor.name}</h3>
                        <Badge variant={vendor.status === "active" ? "success" : "error"}>
                          {vendor.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-console-muted">
                      <Mail size={13} /> {vendor.email}
                      <CopyButton value={vendor.email} label="Email" />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-console-muted">
                      <Phone size={13} /> {vendor.phone}
                      <CopyButton value={vendor.phone} label="Phone" />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-console-muted">
                      <Calendar size={13} /> Since {vendor.createdAt ? formatDate(vendor.createdAt) : "N/A"}
                    </div>
                  </div>
                  <div className="mb-4 grid grid-cols-3 gap-2 rounded-console bg-console-bg p-3 text-center">
                    <div>
                      <p className="text-lg font-semibold text-brand-700">{vendor.totalPurchases}</p>
                      <p className="text-xs text-console-muted">Purchases</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-success-700">{formatCurrency(vendor.totalAmount)}</p>
                      <p className="text-xs text-console-muted">Total value</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-danger-700">{formatCurrency(vendor.outstandingAmount)}</p>
                      <p className="text-xs text-console-muted">Outstanding</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openPurchaseModal(vendor.id, vendor.name)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-console-bg px-3 py-2 text-sm font-medium text-console-text transition-colors hover:bg-slate-200"
                    >
                      <Eye size={14} /> Purchases
                    </button>
                    <Tooltip label="Edit vendor">
                      <button
                        type="button"
                        onClick={() => openEditModal(vendor)}
                        aria-label="Edit vendor"
                        className="rounded-lg p-2 text-console-muted transition-colors hover:bg-warning-50 hover:text-warning-700"
                      >
                        <Pencil size={16} />
                      </button>
                    </Tooltip>
                    <Tooltip label="Delete vendor">
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(vendor)}
                        aria-label="Delete vendor"
                        className="rounded-lg p-2 text-console-muted transition-colors hover:bg-danger-50 hover:text-danger-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </Tooltip>
                    {(vendor.outstandingAmount || 0) > 0 && (
                      <Button size="sm" onClick={() => openSettleModal(vendor)}>
                        Settle {formatCurrency(vendor.outstandingAmount)}
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-console-border">
                  <thead className="bg-console-bg">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Vendor</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Statistics</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-console-muted">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-console-border">
                    {filteredVendors.map((vendor) => (
                      <tr key={vendor.id} className="hover:bg-console-bg">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800">
                              {vendor.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-console-text">{vendor.name}</div>
                              <div className="text-xs text-console-muted">
                                Since {vendor.createdAt ? formatDate(vendor.createdAt) : "N/A"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2 text-sm text-console-text">
                            {vendor.email}
                            <CopyButton value={vendor.email} label="Email" />
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-console-muted">
                            {vendor.phone}
                            <CopyButton value={vendor.phone} label="Phone" />
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge variant={vendor.status === "active" ? "success" : "error"}>
                            {vendor.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="text-sm text-console-text">{vendor.totalPurchases} purchases</div>
                          <div className="text-xs text-console-muted">{formatCurrency(vendor.totalAmount)} total</div>
                          <div className="text-xs text-danger-600">{formatCurrency(vendor.outstandingAmount)} outstanding</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center gap-1">
                            <Tooltip label="View purchases">
                              <button
                                type="button"
                                onClick={() => openPurchaseModal(vendor.id, vendor.name)}
                                aria-label="View purchases"
                                className="rounded-lg p-2 text-console-muted transition-colors hover:bg-success-50 hover:text-success-700"
                              >
                                <Eye size={16} />
                              </button>
                            </Tooltip>
                            <Tooltip label="Edit vendor">
                              <button
                                type="button"
                                onClick={() => openEditModal(vendor)}
                                aria-label="Edit vendor"
                                className="rounded-lg p-2 text-console-muted transition-colors hover:bg-warning-50 hover:text-warning-700"
                              >
                                <Pencil size={16} />
                              </button>
                            </Tooltip>
                            <Tooltip label="Delete vendor">
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(vendor)}
                                aria-label="Delete vendor"
                                className="rounded-lg p-2 text-console-muted transition-colors hover:bg-danger-50 hover:text-danger-700"
                              >
                                <Trash2 size={16} />
                              </button>
                            </Tooltip>
                            {(vendor.outstandingAmount || 0) > 0 && (
                              <button
                                type="button"
                                onClick={() => openSettleModal(vendor)}
                                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-50"
                              >
                                Settle
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
          {total > 0 && (
            <div className="flex flex-col items-center justify-between gap-4 rounded-console bg-white px-4 py-3 shadow-sm sm:flex-row">
              <p className="text-sm text-console-muted">
                Showing{" "}
                <span className="font-semibold text-console-text">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-console-text">
                  {Math.min(currentPage * itemsPerPage, total)}
                </span>{" "}
                of <span className="font-semibold text-console-text">{total}</span> vendors
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-lg p-2 text-console-muted transition-colors hover:bg-console-bg disabled:cursor-not-allowed disabled:opacity-40"
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
                        className={
                          currentPage === pageNum
                            ? "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium bg-brand-700 text-white transition-colors"
                            : "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium text-console-muted transition-colors hover:bg-console-bg"
                        }
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
                  className="rounded-lg p-2 text-console-muted transition-colors hover:bg-console-bg disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={isEditMode ? "Edit Vendor" : "Add New Vendor"}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-console-text">Vendor name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder="Enter vendor name"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-console-text">Email address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder="Enter email address"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-console-text">Phone number</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder="Enter phone number"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEditMode ? "Update vendor" : "Create vendor"}
            </Button>
          </div>
        </form>
      </Modal>

      <VendorPurchaseHistoryModal
        isOpen={isPurchaseModalOpen}
        onClose={closePurchaseModal}
        vendorName={purchaseModalVendorName}
        purchases={selectedVendorPurchases}
        loading={isLoadingPurchases}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete vendor"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`}
        variant="danger"
        confirmText="Delete"
        isLoading={isDeleting}
      />

      {settleTarget && (
        <SettleVendorModal
          isOpen={!!settleTarget}
          onClose={() => setSettleTarget(null)}
          vendorId={settleTarget.id}
          vendorName={settleTarget.name}
          outstandingAmount={settleTarget.outstandingAmount}
          onSettled={refreshAfterMutation}
        />
      )}
    </div>
  );
};

export default Vendors;
