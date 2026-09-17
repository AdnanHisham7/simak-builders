import { useEffect, useState } from "react";
import {
  getStocks,
  getStocksPaginated,
  getStockTransfers,
  approveStockTransfer,
  rejectStockTransfer,
  requestStockTransfer,
  logStockUsage,
  addStock,
  getLowStockAlerts,
  runLowStockCheck,
  Stock,
  StockTransfer,
  LowStockAlertsResponse,
} from "@/services/stockService";
import debounce from "lodash/debounce";
import { getSites, Site } from "@/services/siteService";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import RequestTransferModal from "./RequestTransferModal";
import AddStockModal from "./AddStockModal";
import LogUsageModal from "./LogUsageModal";
import EditThresholdModal from "./EditThresholdModal";
import { toast } from "sonner";
import { Link, useSearchParams } from "react-router-dom";
import AddPurchaseModal from "@/features/sites/AddPurchaseModal";
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
  Boxes,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
  BellRing,
  Sliders,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";
import { Card, StatCard } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonStatCards, SkeletonTable } from "@/components/ui/Skeleton";
import Tooltip from "@/components/ui/Tooltip";
import GradientStatCard from "@/components/ui/GradientStatCard";
import { cn } from "@/lib/cn";

const getStockStatusVariant = (
  quantity: number,
  threshold: number = 10,
): "error" | "warning" | "success" => {
  if (quantity <= 0) return "error";
  if (quantity <= threshold) return "warning";
  return "success";
};

const getStockStatusText = (quantity: number, threshold: number = 10) => {
  if (quantity <= 0) return "Out of stock";
  if (quantity <= threshold) return `Low stock (≤${threshold})`;
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

  const [alertsData, setAlertsData] = useState<LowStockAlertsResponse | null>(null);
  const [runningCheck, setRunningCheck] = useState(false);
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [editingStockThreshold, setEditingStockThreshold] = useState<{
    id: string;
    name: string;
    unit: string;
    currentThreshold?: number;
  } | null>(null);

  const [scopedStocks, setScopedStocks] = useState<Stock[]>([]);
  const [scopedTotal, setScopedTotal] = useState(0);
  const [scopedTotalPages, setScopedTotalPages] = useState(1);
  const [scopedPage, setScopedPage] = useState(1);
  const [scopedLoading, setScopedLoading] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const scopedItemsPerPage = 12;

  const [searchParams, setSearchParams] = useSearchParams();
  const [reorderSiteId, setReorderSiteId] = useState<string | null>(null);
  const [reorderInitialItem, setReorderInitialItem] = useState<{
    name?: string;
    unit?: string;
    category?: string;
    quantity?: string | number;
    price?: string | number;
  } | null>(null);
  const [isAddPurchaseModalOpen, setIsAddPurchaseModalOpen] = useState(false);

  const { userType } = useSelector((state: RootState) => state.auth);

  const fetchAlerts = async (siteIdFilter?: string | null) => {
    try {
      const siteIdParam = siteIdFilter && siteIdFilter !== "company" ? siteIdFilter : undefined;
      const data = await getLowStockAlerts(siteIdParam);
      setAlertsData(data);
    } catch {
      // ignore
    }
  };

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
      await fetchAlerts(filterSite);
    } catch (err) {
      setPageError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchAlerts(filterSite);
  }, [filterSite]);

  useEffect(() => {
    const debounced = debounce((value: string) => {
      setDebouncedSearchTerm(value);
    }, 350);
    debounced(searchTerm);
    return () => debounced.cancel();
  }, [searchTerm]);

  useEffect(() => {
    setScopedPage(1);
  }, [filterSite, debouncedSearchTerm]);

  useEffect(() => {
    if (!filterSite) return;

    const fetchScopedPage = async () => {
      setScopedLoading(true);
      try {
        const result = await getStocksPaginated({
          page: scopedPage,
          limit: scopedItemsPerPage,
          search: debouncedSearchTerm,
          site: filterSite,
        });
        setScopedStocks(result.stocks);
        setScopedTotal(result.total);
        setScopedTotalPages(result.totalPages);
      } catch (err) {
        toast.error("Failed to fetch stocks");
      } finally {
        setScopedLoading(false);
      }
    };
    fetchScopedPage();
  }, [filterSite, debouncedSearchTerm, scopedPage]);

  const paginateScoped = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= scopedTotalPages) {
      setScopedPage(pageNumber);
    }
  };

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

  const refetchScopedIfActive = async () => {
    if (!filterSite) return;
    setScopedLoading(true);
    try {
      const result = await getStocksPaginated({
        page: scopedPage,
        limit: scopedItemsPerPage,
        search: debouncedSearchTerm,
        site: filterSite,
      });
      setScopedStocks(result.stocks);
      setScopedTotal(result.total);
      setScopedTotalPages(result.totalPages);
    } catch (err) {
      toast.error("Failed to fetch stocks");
    } finally {
      setScopedLoading(false);
    }
  };

  const handleLogUsage = async (usageData: any) => {
    try {
      await logStockUsage(usageData);
      const updatedStocks = await getStocks();
      setStocks(updatedStocks);
      await refetchScopedIfActive();
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
      await refetchScopedIfActive();
      setIsAddStockOpen(false);
      toast.success("Stock added");
    } catch (err) {
      toast.error("Failed to add stock");
    }
  };

  const handleQuickReorder = (stock: Stock) => {
    const thresh = stock.lowStockThreshold ?? 10;
    const suggestedQty = Math.max(thresh * 2 - (stock.quantity || 0), 10);
    const siteObj = stock.site as any;
    const siteId = siteObj?._id
      ? String(siteObj._id)
      : siteObj?.id
        ? String(siteObj.id)
        : stock.site
          ? String(stock.site)
          : null;

    setReorderSiteId(siteId);
    setReorderInitialItem({
      name: stock.name,
      unit: stock.unit,
      category: stock.category || "",
      quantity: suggestedQty,
      price: stock.averagePrice || "",
    });
    setIsAddPurchaseModalOpen(true);
  };

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "reorder") {
      const stockName = searchParams.get("stockName");
      if (stocks.length > 0) {
        const matched = stocks.find(
          (s) => s.name.toLowerCase() === (stockName || "").toLowerCase(),
        );
        if (matched) {
          handleQuickReorder(matched);
        } else if (stockName) {
          setReorderSiteId(null);
          setReorderInitialItem({ name: stockName });
          setIsAddPurchaseModalOpen(true);
        } else {
          setIsAddPurchaseModalOpen(true);
        }
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete("action");
        nextParams.delete("stockName");
        setSearchParams(nextParams, { replace: true });
      }
    }
  }, [stocks, searchParams]);

  const handleRunHealthCheck = async () => {
    setRunningCheck(true);
    try {
      const res = await runLowStockCheck();
      toast.success(res.message || "Inventory stock check completed");
      await fetchAlerts(filterSite);
      await fetchData();
    } catch {
      toast.error("Failed to run stock check");
    } finally {
      setRunningCheck(false);
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
    const matchesLowStock = onlyLowStock
      ? stock.quantity <= (stock.lowStockThreshold ?? 10)
      : true;
    return matchesSearch && matchesSite && matchesLowStock;
  });

  const canManageStocks = userType === "siteManager" || userType === "admin";

  const companyStocks = filteredStocks.filter((s) => !s.site);
  const siteStocksList = filteredStocks.filter((s) => s.site);

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
          {list.map((stock) => {
            const thresh = stock.lowStockThreshold ?? 10;
            const isLow = stock.quantity <= thresh;
            const isOut = stock.quantity <= 0;
            return (
              <div
                key={stock._id}
                onClick={() =>
                  setSelectedStock(selectedStock === stock._id ? null : stock._id)
                }
                className={cn(
                  "rounded-console border p-4 text-left transition-shadow cursor-pointer relative",
                  isOut
                    ? "border-danger-300 bg-danger-50/20 hover:shadow-console-lg"
                    : isLow
                    ? "border-amber-300 bg-amber-50/20 hover:shadow-console-lg"
                    : selectedStock === stock._id
                    ? "border-brand-400 ring-2 ring-brand-100"
                    : "border-console-border hover:shadow-console-lg",
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
                  <Badge variant={getStockStatusVariant(stock.quantity, thresh)}>
                    {getStockStatusText(stock.quantity, thresh)}
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
                <div className="mt-3 flex items-center justify-between border-t border-console-border/70 pt-2.5 text-xs text-console-muted">
                  <span>
                    Reorder min: <strong className="text-console-text">{thresh} {stock.unit}</strong>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickReorder(stock);
                      }}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold transition-colors shadow-2xs",
                        isLow
                          ? "bg-amber-600 text-white hover:bg-amber-700"
                          : "border border-console-border bg-white text-console-text hover:bg-console-bg"
                      )}
                      title="Submit purchase order to replenish this stock"
                    >
                      <ShoppingCart size={11} /> Reorder
                    </button>
                    {canManageStocks && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingStockThreshold({
                            id: stock._id,
                            name: stock.name,
                            unit: stock.unit,
                            currentThreshold: thresh,
                          });
                        }}
                        className="flex items-center gap-1 font-medium text-brand-600 hover:text-brand-800 hover:underline"
                        title="Set minimum threshold"
                      >
                        <Sliders size={12} /> Set min
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-console border border-console-border">
          <table className="min-w-full divide-y divide-console-border">
            <thead className="bg-console-bg">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Item</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Quantity</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Reorder Threshold</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Site</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Status</th>
                {canManageStocks && (
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-console-muted">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-console-border bg-white">
              {list.map((stock) => {
                const thresh = stock.lowStockThreshold ?? 10;
                const isLow = stock.quantity <= thresh;
                const isOut = stock.quantity <= 0;
                return (
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
                    <td className="px-4 py-3.5 text-sm text-console-muted">
                      <span className="font-medium text-console-text">{thresh}</span> {stock.unit}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-console-text">
                      {stock.site ? stock.site.name : "Company"}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={getStockStatusVariant(stock.quantity, thresh)}>
                        {getStockStatusText(stock.quantity, thresh)}
                      </Badge>
                    </td>
                    {canManageStocks && (
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleQuickReorder(stock)}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors shadow-2xs",
                              isLow
                                ? "bg-amber-600 text-white hover:bg-amber-700"
                                : "border border-console-border bg-white text-console-text hover:bg-console-bg"
                            )}
                            title="Submit purchase order to replenish this stock"
                          >
                            <ShoppingCart size={12} />
                            <span>Reorder</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingStockThreshold({
                                id: stock._id,
                                name: stock.name,
                                unit: stock.unit,
                                currentThreshold: thresh,
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-md border border-console-border bg-white px-2.5 py-1 text-xs font-medium text-console-text hover:bg-console-bg"
                            title="Set minimum threshold"
                          >
                            <Sliders size={12} /> Set min
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
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
              <Button
                variant="secondary"
                onClick={() => {
                  setReorderSiteId(
                    filterSite && filterSite !== "company" ? filterSite : null,
                  );
                  setReorderInitialItem(null);
                  setIsAddPurchaseModalOpen(true);
                }}
                className="border-console-border text-console-text hover:bg-console-bg"
                title="Add a purchase order to replenish stocks"
              >
                <ShoppingCart size={16} /> Reorder purchase
              </Button>
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

      {/* Low Stock Alert Banner */}
      {alertsData && alertsData.totalLowStock > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50/90 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm">
              <BellRing size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-amber-950">
                  Low Stock Reorder Alert
                </h3>
                <Badge variant={alertsData.criticalCount > 0 ? "error" : "warning"}>
                  {alertsData.totalLowStock} item{alertsData.totalLowStock !== 1 ? "s" : ""} need attention
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-amber-800">
                {alertsData.criticalCount > 0 && (
                  <span className="font-semibold text-rose-700 mr-2">
                    • {alertsData.criticalCount} depleted / zero-stock
                  </span>
                )}
                <span>
                  • {alertsData.warningCount} below configured site threshold. Automated cron checks run daily at 08:00 AM.
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {alertsData.lowStockItems && alertsData.lowStockItems.length > 0 && (
              <Button
                size="sm"
                onClick={() => {
                  const firstLow = alertsData.lowStockItems[0];
                  const matched = stocks.find(
                    (s) => String(s._id) === String(firstLow._id),
                  );
                  if (matched) {
                    handleQuickReorder(matched);
                  } else {
                    const siteObj = firstLow.site as any;
                    const siteId = siteObj?._id
                      ? String(siteObj._id)
                      : firstLow.site
                        ? String(firstLow.site)
                        : null;
                    setReorderSiteId(siteId);
                    setReorderInitialItem({
                      name: firstLow.name,
                      unit: firstLow.unit,
                      category: firstLow.category,
                      quantity: Math.max(
                        (firstLow.lowStockThreshold ?? 10) * 2 -
                          (firstLow.quantity || 0),
                        10,
                      ),
                      price: firstLow.averagePrice || "",
                    });
                    setIsAddPurchaseModalOpen(true);
                  }
                }}
                className="bg-amber-800 hover:bg-amber-900 text-white border-transparent text-xs"
                title="Create purchase to replenish lowest stock item"
              >
                <ShoppingCart size={13} />
                <span>Reorder {alertsData.lowStockItems[0].name} (Add Purchase)</span>
              </Button>
            )}
            <Button
              size="sm"
              variant={onlyLowStock ? "primary" : "secondary"}
              onClick={() => setOnlyLowStock(!onlyLowStock)}
              className={
                onlyLowStock
                  ? "bg-amber-600 hover:bg-amber-700 text-white border-transparent"
                  : "border-amber-300 text-amber-950 bg-white hover:bg-amber-100"
              }
            >
              <AlertTriangle size={14} />
              {onlyLowStock ? "Show All Stocks" : "Show Low Stock Only"}
            </Button>
            {userType === "admin" && (
              <Button
                size="sm"
                variant="secondary"
                loading={runningCheck}
                onClick={handleRunHealthCheck}
                className="border-amber-300 text-amber-950 bg-white hover:bg-amber-100"
              >
                <RefreshCw size={14} className={runningCheck ? "animate-spin" : ""} />
                Check Now
              </Button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <SkeletonStatCards count={2} />
          <SkeletonTable />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard
              label="Total Stock Items"
              value={filteredStocks.length}
              icon={Boxes}
            />
            <GradientStatCard
              label="Total Inventory Value"
              value={filteredStocks.reduce(
                (sum, s) => sum + (s.quantity || 0) * (s.averagePrice || 0),
                0,
              )}
              prefix="₹"
              icon={DollarSign}
            />
          </div>

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
                  <Tooltip label="Table view">
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
                  </Tooltip>
                </div>
              </div>
            </div>
          </Card>

          {userType === "admin" && (
            <div className="flex flex-col gap-2 rounded-lg border border-brand-200 bg-brand-50/60 p-3.5 text-xs text-brand-900 sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-center gap-2">
                <Building2 size={16} className="text-brand-600 shrink-0" />
                <span>
                  Looking to manage <strong>Company Warehouse Stocks</strong>, procure <strong>Company Purchases</strong>, and track <strong>Capital Infusions</strong>?
                </span>
              </span>
              <Link
                to="/admin/company"
                className="flex items-center gap-1 font-semibold text-brand-700 hover:text-brand-800 hover:underline shrink-0"
              >
                Open Company Hub <ExternalLink size={13} />
              </Link>
            </div>
          )}

          {!filterSite && (
            <>
              {renderInventorySection(
                "Company Stocks",
                <Building2 size={18} className="text-brand-600" />,
                companyStocks,
              )}
              {renderInventorySection(
                "Site Stocks",
                <MapPin size={18} className="text-success-600" />,
                siteStocksList,
              )}
            </>
          )}

          {filterSite && (
            <>
              {scopedLoading && scopedStocks.length === 0 ? (
                <Card>
                  <SkeletonTable rows={4} />
                </Card>
              ) : (
                renderInventorySection(
                  filterSite === "company" ? "Company Stocks" : "Site Stocks",
                  filterSite === "company" ? (
                    <Building2 size={18} className="text-brand-600" />
                  ) : (
                    <MapPin size={18} className="text-success-600" />
                  ),
                  scopedStocks,
                )
              )}
              {scopedTotal > 0 && (
                <div className="flex flex-col items-center justify-between gap-4 rounded-console bg-white px-4 py-3 shadow-sm sm:flex-row">
                  <p className="text-sm text-console-muted">
                    Showing{" "}
                    <span className="font-semibold text-console-text">
                      {(scopedPage - 1) * scopedItemsPerPage + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold text-console-text">
                      {Math.min(scopedPage * scopedItemsPerPage, scopedTotal)}
                    </span>{" "}
                    of <span className="font-semibold text-console-text">{scopedTotal}</span> items
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => paginateScoped(scopedPage - 1)}
                      disabled={scopedPage === 1}
                      className="rounded-lg p-2 text-console-muted transition-colors hover:bg-console-bg disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    {[...Array(scopedTotalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      if (
                        pageNum === 1 ||
                        pageNum === scopedTotalPages ||
                        (pageNum >= scopedPage - 1 && pageNum <= scopedPage + 1)
                      ) {
                        return (
                          <button
                            type="button"
                            key={pageNum}
                            onClick={() => paginateScoped(pageNum)}
                            className={
                              scopedPage === pageNum
                                ? "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium bg-brand-700 text-white transition-colors"
                                : "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium text-console-muted transition-colors hover:bg-console-bg"
                            }
                          >
                            {pageNum}
                          </button>
                        );
                      }
                      if (
                        pageNum === scopedPage - 2 ||
                        pageNum === scopedPage + 2
                      ) {
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
                      onClick={() => paginateScoped(scopedPage + 1)}
                      disabled={scopedPage === scopedTotalPages}
                      className="rounded-lg p-2 text-console-muted transition-colors hover:bg-console-bg disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
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
      {editingStockThreshold && (
        <EditThresholdModal
          isOpen={!!editingStockThreshold}
          onClose={() => setEditingStockThreshold(null)}
          stock={editingStockThreshold}
          onSuccess={(newThreshold) => {
            setStocks((prev) =>
              prev.map((s) =>
                s._id === editingStockThreshold.id
                  ? { ...s, lowStockThreshold: newThreshold }
                  : s,
              ),
            );
            fetchAlerts(filterSite);
          }}
        />
      )}
      {isAddPurchaseModalOpen && (
        <AddPurchaseModal
          siteId={reorderSiteId}
          isAdmin={userType === "admin"}
          initialItem={reorderInitialItem || undefined}
          onClose={() => {
            setIsAddPurchaseModalOpen(false);
            setReorderInitialItem(null);
            setReorderSiteId(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default Stocks;
