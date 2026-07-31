import { useEffect, useState } from "react";
import {
  getStocks,
  getStockTransfers,
  approveStockTransfer,
  rejectStockTransfer,
  requestStockTransfer,
  logStockUsage,
  addStock,
  Stock,
  StockTransfer,
} from "@/services/stockService";
import { getSites, Site } from "@/services/siteService";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import RequestTransferModal from "./RequestTransferModal";
import AddStockModal from "./AddStockModal";
import LogUsageModal from "./LogUsageModal";
import { toast } from "sonner";
import {
  Search,
  Plus,
  ArrowLeftRight,
  ClipboardList,
  Package,
  Grid as GridIcon,
  List,
  Building2,
  MapPin,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonStatCards, SkeletonTable } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

const getStockStatusVariant = (
  quantity: number,
): "error" | "warning" | "success" => {
  if (quantity <= 10) return "error";
  if (quantity <= 50) return "warning";
  return "success";
};

const getStockStatusText = (quantity: number) => {
  if (quantity <= 10) return "Low stock";
  if (quantity <= 50) return "Medium stock";
  return "In stock";
};

const Stocks: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [filterSite, setFilterSite] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isRequestTransferOpen, setIsRequestTransferOpen] = useState(false);
  const [isLogUsageOpen, setIsLogUsageOpen] = useState(false);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const { userType } = useSelector((state: RootState) => state.auth);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stocksData, sitesData, transfersData] = await Promise.all([
        getStocks(),
        getSites(),
        getStockTransfers(),
      ]);
      setStocks(stocksData);
      setSites(sitesData);
      setTransfers(transfersData);
      setPageError(null);
    } catch (err) {
      setPageError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApproveTransfer = async (transferId: string) => {
    setApprovingId(transferId);
    try {
      await approveStockTransfer(transferId);
      setTransfers((prev) =>
        prev.map((t) => (t._id === transferId ? { ...t, status: "Approved" } : t)),
      );
      toast.success("Transfer approved");
      fetchData();
    } catch (err) {
      toast.error("Failed to approve transfer");
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectTransfer = async (transferId: string) => {
    setRejectingId(transferId);
    try {
      await rejectStockTransfer(transferId);
      setTransfers((prev) =>
        prev.map((t) => (t._id === transferId ? { ...t, status: "Rejected" } : t)),
      );
      toast.success("Transfer rejected");
    } catch (err) {
      toast.error("Failed to reject transfer");
    } finally {
      setRejectingId(null);
    }
  };

  const handleRequestTransfer = async (transferData: any) => {
    try {
      await requestStockTransfer(transferData);
      const updatedTransfers = await getStockTransfers();
      setTransfers(updatedTransfers);
      setIsRequestTransferOpen(false);
      toast.success("Transfer requested");
    } catch (err) {
      toast.error("Failed to request transfer");
    }
  };

  const handleLogUsage = async (usageData: any) => {
    try {
      await logStockUsage(usageData);
      const updatedStocks = await getStocks();
      setStocks(updatedStocks);
      setIsLogUsageOpen(false);
      toast.success("Usage logged");
    } catch (err) {
      toast.error("Failed to log usage");
    }
  };

  const handleAddStock = async (stockData: any) => {
    try {
      await addStock(stockData);
      const updatedStocks = await getStocks();
      setStocks(updatedStocks);
      setIsAddStockOpen(false);
      toast.success("Stock added");
    } catch (err) {
      toast.error("Failed to add stock");
    }
  };

  const filteredStocks = stocks.filter((stock) => {
    const matchesSearch = stock.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesSite = filterSite
      ? stock.site?._id === filterSite ||
        (filterSite === "company" && !stock.site)
      : true;
    return matchesSearch && matchesSite;
  });

  const canManageStocks = userType === "siteManager" || userType === "admin";

  const companyStocks = filteredStocks.filter((s) => !s.site);
  const siteStocksList = filteredStocks.filter((s) => s.site);
  const showCompanySection = !filterSite || filterSite === "company";
  const showSiteSection = !filterSite || filterSite !== "company";

  const renderInventorySection = (title: string, icon: React.ReactNode, list: Stock[]) => (
    <Card>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-console-text">
          {icon}
          {title}
        </h2>
        <span className="text-sm text-console-muted">
          {list.length} item{list.length !== 1 ? "s" : ""}
        </span>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No stocks found"
          description="Try adjusting your search or filter criteria."
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((stock) => (
            <button
              type="button"
              key={stock._id}
              onClick={() =>
                setSelectedStock(selectedStock === stock._id ? null : stock._id)
              }
              className={cn(
                "rounded-console border p-4 text-left transition-shadow hover:shadow-console-lg",
                selectedStock === stock._id
                  ? "border-brand-400 ring-2 ring-brand-100"
                  : "border-console-border",
              )}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-console-text" title={stock.name}>
                    {stock.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-console-muted">
                    {stock.site ? stock.site.name : "Company"}
                  </p>
                </div>
                <Badge variant={getStockStatusVariant(stock.quantity)}>
                  {getStockStatusText(stock.quantity)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-semibold text-console-text">{stock.quantity}</div>
                  <div className="text-xs uppercase tracking-wide text-console-muted">{stock.unit}</div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <Package size={18} />
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-console border border-console-border">
          <table className="min-w-full divide-y divide-console-border">
            <thead className="bg-console-bg">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Item</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Quantity</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Site</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-console-border bg-white">
              {list.map((stock) => (
                <tr key={stock._id} className="hover:bg-console-bg">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                        <Package size={16} />
                      </div>
                      <span className="text-sm font-medium text-console-text">{stock.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-semibold text-console-text">{stock.quantity}</span>{" "}
                    <span className="text-xs text-console-muted">{stock.unit}</span>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-console-text">
                    {stock.site ? stock.site.name : "Company"}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={getStockStatusVariant(stock.quantity)}>
                      {getStockStatusText(stock.quantity)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );

  const transferStatusVariant = (status: StockTransfer["status"]) => {
    switch (status) {
      case "Approved":
        return "success";
      case "Rejected":
        return "error";
      default:
        return "warning";
    }
  };

  const transferStatusIcon = (status: StockTransfer["status"]) => {
    switch (status) {
      case "Approved":
        return <CheckCircle2 size={12} />;
      case "Rejected":
        return <XCircle size={12} />;
      default:
        return <Clock size={12} />;
    }
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
          <Button className="mt-5" onClick={fetchData}>
            Try again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-console-text">Stock Management</h1>
          <p className="mt-0.5 text-sm text-console-muted">
            Manage your inventory across all sites
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManageStocks && (
            <>
              <Button variant="secondary" onClick={() => setIsRequestTransferOpen(true)}>
                <ArrowLeftRight size={16} /> Request transfer
              </Button>
              <Button variant="secondary" onClick={() => setIsLogUsageOpen(true)}>
                <ClipboardList size={16} /> Log usage
              </Button>
            </>
          )}
          {userType === "admin" && (
            <Button onClick={() => setIsAddStockOpen(true)}>
              <Plus size={16} /> Add stock
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <SkeletonStatCards count={2} />
          <SkeletonTable />
        </div>
      ) : (
        <>
          <Card>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-console-muted" size={16} />
                <input
                  type="text"
                  placeholder="Search stocks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-console-border py-2.5 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={filterSite || ""}
                  onChange={(e) => setFilterSite(e.target.value || null)}
                  className="rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  <option value="">All Sites</option>
                  <option value="company">Company Stocks</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1 rounded-lg border border-console-border p-1">
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
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    aria-label="Table view"
                    className={cn(
                      "rounded-md p-1.5 transition-colors",
                      viewMode === "table" ? "bg-brand-50 text-brand-700" : "text-console-muted hover:bg-console-bg",
                    )}
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {showCompanySection &&
            renderInventorySection(
              "Company Stocks",
              <Building2 size={18} className="text-brand-600" />,
              companyStocks,
            )}

          {showSiteSection &&
            renderInventorySection(
              "Site Stocks",
              <MapPin size={18} className="text-success-600" />,
              siteStocksList,
            )}

          {userType === "admin" && (
            <Card>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-semibold text-console-text">
                  <ArrowLeftRight size={18} className="text-warning-600" />
                  Stock Transfers
                </h2>
                <span className="text-sm text-console-muted">
                  {transfers.length} transfer{transfers.length !== 1 ? "s" : ""}
                </span>
              </div>
              {transfers.length === 0 ? (
                <EmptyState icon={ArrowLeftRight} title="No stock transfers yet" />
              ) : (
                <div className="overflow-hidden rounded-console border border-console-border">
                  <table className="min-w-full divide-y divide-console-border">
                    <thead className="bg-console-bg">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Item</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Quantity</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">From</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">To</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-console-muted">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-console-border bg-white">
                      {transfers.map((transfer) => (
                        <tr key={transfer._id} className="hover:bg-console-bg">
                          <td className="px-4 py-3.5 text-sm font-medium text-console-text">{transfer.stock.name}</td>
                          <td className="px-4 py-3.5 text-sm text-console-text">{transfer.quantity}</td>
                          <td className="px-4 py-3.5 text-sm text-console-muted">
                            {transfer.fromSite ? transfer.fromSite.name : "Company"}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-console-muted">{transfer.toSite.name}</td>
                          <td className="px-4 py-3.5">
                            <Badge variant={transferStatusVariant(transfer.status)}>
                              {transferStatusIcon(transfer.status)}
                              {transfer.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            {transfer.status === "Requested" && (
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  loading={approvingId === transfer._id}
                                  onClick={() => handleApproveTransfer(transfer._id)}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  loading={rejectingId === transfer._id}
                                  onClick={() => handleRejectTransfer(transfer._id)}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}
        </>
      )}

      {isRequestTransferOpen && (
        <RequestTransferModal
          isOpen={isRequestTransferOpen}
          onClose={() => setIsRequestTransferOpen(false)}
          onSubmit={handleRequestTransfer}
          stocks={stocks}
          sites={sites}
          allowedToSites={sites.map((s) => s.id)}
        />
      )}
      {isLogUsageOpen && (
        <LogUsageModal
          isOpen={isLogUsageOpen}
          onClose={() => setIsLogUsageOpen(false)}
          onSubmit={handleLogUsage}
          stocks={stocks}
          sites={sites}
        />
      )}
      {isAddStockOpen && (
        <AddStockModal
          isOpen={isAddStockOpen}
          onClose={() => setIsAddStockOpen(false)}
          onSubmit={handleAddStock}
          sites={sites}
        />
      )}
    </div>
  );
};

export default Stocks;
