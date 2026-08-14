import React, { useMemo, useState } from "react";
import {
  Search,
  Package,
  ChevronDown,
  ChevronRight,
  FileText,
  ArrowUpDown,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/Card";

interface PurchaseItem {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  category: string;
}

interface Purchase {
  _id: string;
  site: { name: string } | null;
  createdAt: string;
  totalAmount: number;
  status: string;
  items: PurchaseItem[];
  billUpload?: {
    name: string;
    url: string;
    uploadDate: string;
  } | null;
  payment: {
    method: "cash" | "credit";
    isPaid: boolean;
  };
}

interface VendorPurchaseHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorName: string;
  purchases: Purchase[];
  loading?: boolean;
}

type StatusFilter = "all" | "pending" | "verified";
type PaymentFilter = "all" | "paid" | "unpaid";
type SortKey = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";

const formatCurrency = (amount: number | undefined) =>
  `₹${(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const VendorPurchaseHistoryModal: React.FC<VendorPurchaseHistoryModalProps> = ({
  isOpen,
  onClose,
  vendorName,
  purchases,
  loading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date_desc");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const summary = useMemo(() => {
    const totalAmount = purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const paidAmount = purchases
      .filter((p) => p.payment?.isPaid)
      .reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const unpaidAmount = totalAmount - paidAmount;
    const verifiedCount = purchases.filter((p) => p.status === "verified").length;
    const pendingCount = purchases.filter((p) => p.status !== "verified").length;
    return {
      count: purchases.length,
      totalAmount,
      paidAmount,
      unpaidAmount,
      verifiedCount,
      pendingCount,
    };
  }, [purchases]);

  const filteredPurchases = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    let result = purchases.filter((purchase) => {
      const matchesStatus =
        statusFilter === "all" || purchase.status === statusFilter;
      const matchesPayment =
        paymentFilter === "all" ||
        (paymentFilter === "paid" ? purchase.payment?.isPaid : !purchase.payment?.isPaid);
      const matchesQuery =
        !query ||
        purchase.site?.name?.toLowerCase().includes(query) ||
        purchase.items?.some((item) => item.name.toLowerCase().includes(query));
      return matchesStatus && matchesPayment && matchesQuery;
    });

    result = [...result].sort((a, b) => {
      switch (sortKey) {
        case "date_asc":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "amount_desc":
          return (b.totalAmount || 0) - (a.totalAmount || 0);
        case "amount_asc":
          return (a.totalAmount || 0) - (b.totalAmount || 0);
        case "date_desc":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [purchases, searchTerm, statusFilter, paymentFilter, sortKey]);

  const hasActiveFilters =
    searchTerm.trim() !== "" || statusFilter !== "all" || paymentFilter !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPaymentFilter("all");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Purchase history — ${vendorName}`}
      description={`${summary.count} purchase${summary.count === 1 ? "" : "s"} on record`}
      size="full"
    >
      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-console-muted">
          Loading purchase history...
        </div>
      ) : purchases.length === 0 ? (
        <EmptyState icon={Package} title="No purchases found for this vendor" />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard label="Purchases" value={summary.count} icon={Package} />
            <StatCard label="Total value" value={formatCurrency(summary.totalAmount)} icon={Package} />
            <StatCard label="Paid" value={formatCurrency(summary.paidAmount)} icon={Package} />
            <StatCard label="Unpaid" value={formatCurrency(summary.unpaidAmount)} icon={Package} />
            <StatCard
              label="Pending verification"
              value={summary.pendingCount}
              icon={Package}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-console-muted" size={15} />
                <input
                  type="text"
                  placeholder="Search by item or site..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-console-border py-2.5 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full rounded-lg border border-console-border px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="all">All statuses</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
            </select>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}
              className="w-full rounded-lg border border-console-border px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="all">All payments</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-console-muted">
              <ArrowUpDown size={14} />
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="rounded-lg border border-console-border px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              >
                <option value="date_desc">Newest first</option>
                <option value="date_asc">Oldest first</option>
                <option value="amount_desc">Amount: high to low</option>
                <option value="amount_asc">Amount: low to high</option>
              </select>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-medium text-brand-700 hover:text-brand-800"
              >
                Clear filters
              </button>
            )}
          </div>

          {filteredPurchases.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No purchases match your filters"
              description="Try adjusting the search term or filters."
            />
          ) : (
            <div className="overflow-x-auto rounded-console border border-console-border">
              <table className="min-w-full divide-y divide-console-border">
                <thead className="bg-console-bg">
                  <tr>
                    <th className="w-10 px-4 py-3" />
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Site</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Items</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Payment</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-console-border">
                  {filteredPurchases.map((purchase) => {
                    const isExpanded = expandedIds.has(purchase._id);
                    return (
                      <React.Fragment key={purchase._id}>
                        <tr
                          onClick={() => toggleExpanded(purchase._id)}
                          className="cursor-pointer hover:bg-console-bg"
                        >
                          <td className="px-4 py-3.5 text-console-muted">
                            {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-sm text-console-text">
                            {new Date(purchase.createdAt).toLocaleDateString()}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-sm text-console-text">
                            {purchase.site ? purchase.site.name : "N/A"}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-console-muted">
                            {purchase.items.length} item{purchase.items.length === 1 ? "" : "s"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-sm font-semibold text-console-text">
                            {formatCurrency(purchase.totalAmount)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5">
                            <Badge variant={purchase.payment?.isPaid ? "success" : "warning"}>
                              {purchase.payment?.isPaid ? "Paid" : "Unpaid"}
                            </Badge>
                            <span className="ml-1.5 text-xs capitalize text-console-muted">
                              {purchase.payment?.method}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5">
                            <Badge variant={purchase.status === "verified" ? "success" : "warning"}>
                              {purchase.status}
                            </Badge>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={7} className="bg-console-bg px-4 py-4">
                              <div className="space-y-2">
                                {purchase.items.map((item, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between rounded-lg border border-console-border bg-white px-3.5 py-2.5"
                                  >
                                    <div>
                                      <p className="text-sm font-medium text-console-text">{item.name}</p>
                                      <p className="text-xs text-console-muted">Category: {item.category}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-medium text-console-text">
                                        {item.quantity} {item.unit}
                                      </p>
                                      <p className="text-xs text-console-muted">
                                        {formatCurrency(item.price)} each
                                      </p>
                                    </div>
                                  </div>
                                ))}
                                {purchase.billUpload && (
                                  <a
                                    href={purchase.billUpload.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 inline-flex items-center gap-1.5 text-sm text-brand-700 hover:underline"
                                  >
                                    <FileText size={14} />
                                    {purchase.billUpload.name}
                                  </a>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default VendorPurchaseHistoryModal;
