import React, { useState, useEffect } from "react";
import {
  Building2,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowRightLeft,
  Search,
  Filter,
  Users,
  HandCoins,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Card, StatCard } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import PageLoader from "@/components/ui/PageLoader";
import Tooltip from "@/components/ui/Tooltip";
import { cn } from "@/lib/cn";
import { usePreferences } from "@/hooks/usePreferences";
import {
  getCompanySummary,
  getCompanyProfile,
  getLenders,
  settleLender,
  CompanyProfile,
  CompanyTransaction,
  Lender,
} from "@/services/companyService";
import {
  getStocks,
  getStocksPaginated,
  addStock,
  requestStockTransfer,
  Stock,
} from "@/services/stockService";
import { getPurchases, verifyPurchase } from "@/services/purchaseService";
import { getSites, Site } from "@/services/siteService";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import CompanyFundsModal from "@/features/dashboard/CompanyFundsModal";
import AddStockModal from "@/features/stocks/AddStockModal";
import RequestTransferModal from "@/features/stocks/RequestTransferModal";
import AddPurchaseModal from "@/features/sites/AddPurchaseModal";

type CompanyTab = "overview" | "stocks" | "purchases" | "lenders";

const CompanyPage: React.FC = () => {
  const { formatNumber, formatDate } = usePreferences();
  const userType = useSelector((state: RootState) => state.auth.userType);
  const canVerifyPurchase = userType === "admin";
  const [activeTab, setActiveTab] = useState<CompanyTab>("overview");
  const [loading, setLoading] = useState(true);

  // Data states
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [transactions, setTransactions] = useState<CompanyTransaction[]>([]);
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [companyStocks, setCompanyStocks] = useState<Stock[]>([]);
  const [companyPurchases, setCompanyPurchases] = useState<any[]>([]);
  const [sites, setSites] = useState<Site[]>([]);

  // Search & Filter states
  const [stockSearch, setStockSearch] = useState("");
  const [selectedStockCategory, setSelectedStockCategory] =
    useState<string>("all");
  const [purchaseSearch, setPurchaseSearch] = useState("");
  const [purchaseStatusFilter, setPurchaseStatusFilter] =
    useState<string>("all");

  // Modals state
  const [isFundsModalOpen, setIsFundsModalOpen] = useState(false);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isAddPurchaseOpen, setIsAddPurchaseOpen] = useState(false);
  const [settlingLender, setSettlingLender] = useState<Lender | null>(null);
  const [settleAmount, setSettleAmount] = useState<number | "">("");
  const [settleNotes, setSettleNotes] = useState("");
  const [isSettling, setIsSettling] = useState(false);
  const [verifyingPurchaseIds, setVerifyingPurchaseIds] = useState<Set<string>>(
    new Set(),
  );
  const [expandedPurchaseIds, setExpandedPurchaseIds] = useState<Set<string>>(
    new Set(),
  );

  const togglePurchaseExpand = (purchaseId: string) => {
    setExpandedPurchaseIds((prev) => {
      const next = new Set(prev);
      if (next.has(purchaseId)) {
        next.delete(purchaseId);
      } else {
        next.add(purchaseId);
      }
      return next;
    });
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [
        summaryRes,
        profileRes,
        lendersRes,
        allStocks,
        allPurchases,
        sitesRes,
      ] = await Promise.all([
        getCompanySummary(),
        getCompanyProfile().catch(() => null),
        getLenders().catch(() => []),
        getStocks().catch(() => []),
        getPurchases().catch(() => []),
        getSites().catch(() => []),
      ]);

      setTotalAmount(summaryRes.totalAmount);
      setTransactions(summaryRes.transactions);
      if (profileRes) setProfile(profileRes);
      setLenders(lendersRes);

      // Filter Company-only stocks: site is null/undefined
      const warehouseStocks = (allStocks || []).filter((s) => !s.site);
      setCompanyStocks(warehouseStocks);

      // Filter Company-only purchases: site is null/undefined or sourceOfFunds === "company"
      const coPurchases = (allPurchases || []).filter(
        (p: any) => !p.site || p.sourceOfFunds === "company",
      );
      setCompanyPurchases(coPurchases);
      setSites(sitesRes || []);
    } catch (err) {
      console.error("Error loading company hub data:", err);
      toast.error("Failed to load company hub data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleVerifyPurchase = async (purchaseId: string) => {
    if (verifyingPurchaseIds.has(purchaseId)) return;
    setVerifyingPurchaseIds((prev) => new Set(prev).add(purchaseId));
    try {
      await verifyPurchase(purchaseId);
      toast.success("Purchase verified successfully");
      setCompanyPurchases((prev) =>
        prev.map((p) =>
          p._id === purchaseId ? { ...p, status: "verified" } : p,
        ),
      );
      fetchAllData();
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Failed to verify purchase";
      toast.error(message);
    } finally {
      setVerifyingPurchaseIds((prev) => {
        const next = new Set(prev);
        next.delete(purchaseId);
        return next;
      });
    }
  };

  const handleSettle = async () => {
    if (!settlingLender || isSettling) return;
    const num = Number(settleAmount);
    if (!settleAmount || num <= 0) {
      toast.error("Enter a valid settlement amount");
      return;
    }
    if (num > settlingLender.outstandingBalance) {
      toast.error(
        `Settlement amount cannot exceed outstanding balance of ₹${formatNumber(settlingLender.outstandingBalance)}`,
      );
      return;
    }
    if (num > totalAmount) {
      toast.error(
        `Insufficient company funds. Available: ₹${formatNumber(totalAmount)}`,
      );
      return;
    }

    setIsSettling(true);
    try {
      const res = await settleLender(
        settlingLender._id,
        num,
        settleNotes.trim(),
      );
      toast.success(res.message || "Settlement recorded successfully");
      setSettlingLender(null);
      setSettleAmount("");
      setSettleNotes("");
      fetchAllData();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to record settlement",
      );
    } finally {
      setIsSettling(false);
    }
  };

  const handleAddStockSubmit = async (stockData: any) => {
    try {
      await addStock(stockData);
      toast.success("Stock added to Company Warehouse");
      setIsAddStockOpen(false);
      fetchAllData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to add stock");
    }
  };

  const handleRequestTransferSubmit = async (transferData: any) => {
    try {
      await requestStockTransfer(transferData);
      toast.success("Stock transfer requested successfully");
      setIsTransferOpen(false);
      fetchAllData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to request transfer");
    }
  };

  // Calculations
  const totalDebt = lenders.reduce(
    (sum, l) => sum + (l.outstandingBalance || 0),
    0,
  );
  const totalStockValuation = companyStocks.reduce(
    (sum, s) => sum + (s.quantity || 0) * (s.averagePrice || 0),
    0,
  );
  const lowStockCount = companyStocks.filter((s) => s.quantity <= 10).length;
  const totalCompanyPurchasesAmount = companyPurchases.reduce(
    (sum, p) => sum + (p.totalAmount || 0),
    0,
  );

  // Filtered Company Stocks
  const filteredStocks = companyStocks.filter((s) => {
    const matchesSearch = s.name
      .toLowerCase()
      .includes(stockSearch.toLowerCase());
    const matchesCat =
      selectedStockCategory === "all" || s.category === selectedStockCategory;
    return matchesSearch && matchesCat;
  });

  // Filtered Company Purchases (latest first)
  const filteredPurchases = companyPurchases
    .filter((p) => {
      const vendorName = p.vendor?.name?.toLowerCase() || "";
      const notesText = p.notes?.toLowerCase() || "";
      const matchesSearch =
        vendorName.includes(purchaseSearch.toLowerCase()) ||
        notesText.includes(purchaseSearch.toLowerCase());
      const matchesStatus =
        purchaseStatusFilter === "all" ||
        (purchaseStatusFilter === "verified" && p.status === "verified") ||
        (purchaseStatusFilter === "pending" && p.status === "pending") ||
        (purchaseStatusFilter === "paid" && p.payment?.isPaid) ||
        (purchaseStatusFilter === "credit" && !p.payment?.isPaid);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const timeA = new Date(a.date || a.createdAt || 0).getTime();
      const timeB = new Date(b.date || b.createdAt || 0).getTime();
      return timeB - timeA;
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-console-text">
              {profile?.name || "Company Management Hub"}
            </h1>
            <Badge variant="brand" className="text-xs">
              Headquarters
            </Badge>
          </div>
          <p className="mt-0.5 text-sm text-console-muted">
            Centralized operations for company funds, capital infusion,
            warehouse stocks, and procurement
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchAllData}
            loading={loading}
          >
            <RefreshCw size={15} /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setIsFundsModalOpen(true)}
            className="bg-brand-600 hover:bg-brand-700"
          >
            <DollarSign size={15} /> Manage Funds & Capital
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Available Company Funds"
          value={`₹${formatNumber(totalAmount)}`}
          change="Liquidity Balance"
          trend="up"
        />
        <StatCard
          label="Outstanding Loan Liabilities"
          value={`₹${formatNumber(totalDebt)}`}
          change={`${lenders.filter((l) => l.outstandingBalance > 0).length} Active Lenders`}
          trend={totalDebt > 0 ? "down" : "neutral"}
        />
        <StatCard
          label="Warehouse Stock Valuation"
          value={`₹${formatNumber(totalStockValuation)}`}
          change={`${companyStocks.length} Unique Items`}
          trend="up"
        />
        <StatCard
          label="Company Purchases"
          value={`₹${formatNumber(totalCompanyPurchasesAmount)}`}
          change={`${companyPurchases.length} Total Procurement Orders`}
          trend="neutral"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-console-border">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-all",
            activeTab === "overview"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-console-muted hover:text-console-text",
          )}
        >
          <Building2 size={16} /> Overview & Funds
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("stocks")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-all",
            activeTab === "stocks"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-console-muted hover:text-console-text",
          )}
        >
          <Package size={16} /> Company Stocks ({companyStocks.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("purchases")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-all",
            activeTab === "purchases"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-console-muted hover:text-console-text",
          )}
        >
          <ShoppingCart size={16} /> Company Purchases (
          {companyPurchases.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("lenders")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-all",
            activeTab === "lenders"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-console-muted hover:text-console-text",
          )}
        >
          <HandCoins size={16} /> Lenders Ledger ({lenders.length})
        </button>
      </div>

      {loading ? (
        <PageLoader label="Loading company hub" fullHeight={false} />
      ) : (
        <>
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Profile Card */}
              <Card className="space-y-4 p-5 lg:col-span-1">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-console-text">
                      {profile?.name || "Company Information"}
                    </h3>
                    <p className="text-xs text-console-muted">
                      Simak Constructions
                    </p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-3 text-xs text-console-muted">
                  {profile?.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-brand-500" />
                      <span>{profile.email}</span>
                    </div>
                  )}
                  {profile?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-brand-500" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  {profile?.address && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-brand-500" />
                      <span>{`${profile.address}, ${profile.city || ""} ${profile.state || ""}`}</span>
                    </div>
                  )}
                  {profile?.taxId && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-console-text">
                        GSTIN / Tax ID:
                      </span>
                      <span>{profile.taxId}</span>
                    </div>
                  )}
                </div>

                <div className="rounded-lg bg-slate-50 p-3 text-xs text-console-muted">
                  Company funds are pooled centrally to finance site purchases,
                  contractor advances, and daily wage disbursements.
                </div>
              </Card>

              {/* Recent Transactions & Lenders preview */}
              <div className="space-y-6 lg:col-span-2">
                <Card className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-console-text">
                        Recent Fund Transactions
                      </h3>
                      <p className="text-xs text-console-muted">
                        Latest incoming capital and outgoing settlements
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsFundsModalOpen(true)}
                    >
                      View All
                    </Button>
                  </div>

                  {transactions.length === 0 ? (
                    <EmptyState
                      icon={DollarSign}
                      title="No transactions"
                      description="Fund transactions will appear here."
                    />
                  ) : (
                    <div className="space-y-2">
                      {transactions.slice(0, 6).map((tx) => {
                        const isIncoming = tx.amount >= 0;
                        return (
                          <div
                            key={tx._id}
                            className="flex items-center justify-between rounded-lg border border-console-border p-3"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs",
                                  isIncoming
                                    ? "bg-success-50 text-success-700"
                                    : "bg-danger-50 text-danger-700",
                                )}
                              >
                                {isIncoming ? (
                                  <TrendingUp size={14} />
                                ) : (
                                  <TrendingDown size={14} />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-console-text">
                                    {tx.description || tx.type}
                                  </p>
                                  {tx.isCapitalInfusion && (
                                    <Badge
                                      variant={
                                        tx.capitalType === "lended"
                                          ? "warning"
                                          : "success"
                                      }
                                      className="text-[10px]"
                                    >
                                      {tx.capitalType === "lended"
                                        ? "Loan"
                                        : "Own Capital"}
                                    </Badge>
                                  )}
                                  {tx.settlementFor && (
                                    <Badge
                                      variant="brand"
                                      className="text-[10px]"
                                    >
                                      Settlement
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-console-muted">
                                  {formatDate(tx.date)}
                                  {tx.site?.name
                                    ? ` • Site: ${tx.site.name}`
                                    : ""}
                                </p>
                              </div>
                            </div>
                            <span
                              className={cn(
                                "font-semibold",
                                isIncoming
                                  ? "text-success-700"
                                  : "text-danger-700",
                              )}
                            >
                              {isIncoming ? "+" : ""}
                              {formatNumber(tx.amount)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}

          {/* TAB 2: COMPANY STOCKS (WAREHOUSE) */}
          {activeTab === "stocks" && (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 rounded-console border border-console-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-64">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-console-muted"
                    />
                    <input
                      type="text"
                      placeholder="Search warehouse items..."
                      value={stockSearch}
                      onChange={(e) => setStockSearch(e.target.value)}
                      className="w-full rounded-lg border border-console-border bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none"
                    />
                  </div>

                  <select
                    value={selectedStockCategory}
                    onChange={(e) => setSelectedStockCategory(e.target.value)}
                    className="rounded-lg border border-console-border bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  >
                    <option value="all">All Categories</option>
                    <option value="Concrete Work">Concrete Work</option>
                    <option value="Earth Work">Earth Work</option>
                    <option value="Wood Work">Wood Work</option>
                    <option value="Plastering Wiring Plumbing">
                      Plumbing & Wiring
                    </option>
                    <option value="Paint Work">Paint Work</option>
                    <option value="Floor Work">Floor Work</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsTransferOpen(true)}
                    disabled={companyStocks.length === 0}
                  >
                    <ArrowRightLeft size={14} /> Transfer to Site
                  </Button>
                  <Button size="sm" onClick={() => setIsAddStockOpen(true)}>
                    <Plus size={14} /> Add Company Stock
                  </Button>
                </div>
              </div>

              {filteredStocks.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="No warehouse stock items"
                  description="Add new stock to the central company warehouse or adjust your filters."
                />
              ) : (
                <div className="overflow-hidden rounded-console border border-console-border bg-white">
                  <table className="w-full text-left text-sm text-console-text">
                    <thead className="border-b border-console-border bg-slate-50 text-xs font-semibold uppercase text-console-muted">
                      <tr>
                        <th className="px-5 py-3">Item Name</th>
                        <th className="px-5 py-3">Category</th>
                        <th className="px-5 py-3">Quantity</th>
                        <th className="px-5 py-3">Avg Price</th>
                        <th className="px-5 py-3">Total Value</th>
                        <th className="px-5 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStocks.map((stk) => {
                        const isLow = stk.quantity <= 10;
                        const valuation =
                          (stk.quantity || 0) * (stk.averagePrice || 0);
                        return (
                          <tr key={stk._id} className="hover:bg-slate-50/50">
                            <td className="px-5 py-3.5 font-medium text-console-text">
                              {stk.name}
                            </td>
                            <td className="px-5 py-3.5 text-console-muted">
                              {stk.category || "General"}
                            </td>
                            <td className="px-5 py-3.5 font-semibold">
                              {stk.quantity} {stk.unit}
                            </td>
                            <td className="px-5 py-3.5 text-console-muted">
                              ₹{formatNumber(stk.averagePrice || 0)} /{" "}
                              {stk.unit}
                            </td>
                            <td className="px-5 py-3.5 font-semibold text-console-text">
                              ₹{formatNumber(valuation)}
                            </td>
                            <td className="px-5 py-3.5">
                              <Badge variant={isLow ? "error" : "success"}>
                                {isLow ? "Low Stock" : "In Stock"}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COMPANY PURCHASES */}
          {activeTab === "purchases" && (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 rounded-console border border-console-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-64">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-console-muted"
                    />
                    <input
                      type="text"
                      placeholder="Search by vendor or notes..."
                      value={purchaseSearch}
                      onChange={(e) => setPurchaseSearch(e.target.value)}
                      className="w-full rounded-lg border border-console-border bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none"
                    />
                  </div>

                  <select
                    value={purchaseStatusFilter}
                    onChange={(e) => setPurchaseStatusFilter(e.target.value)}
                    className="rounded-lg border border-console-border bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  >
                    <option value="all">All Purchases</option>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending Verification</option>
                    <option value="paid">Paid (Cash)</option>
                    <option value="credit">Credit / Unpaid</option>
                  </select>
                </div>

                <Button size="sm" onClick={() => setIsAddPurchaseOpen(true)}>
                  <Plus size={14} /> Add Company Purchase
                </Button>
              </div>

              {filteredPurchases.length === 0 ? (
                <EmptyState
                  icon={ShoppingCart}
                  title="No company purchases"
                  description="Procurement orders assigned to Company will be listed here."
                />
              ) : (
                <div className="overflow-hidden rounded-console border border-console-border bg-white">
                  <table className="w-full text-left text-sm text-console-text">
                    <thead className="border-b border-console-border bg-slate-50 text-xs font-semibold uppercase text-console-muted">
                      <tr>
                        <th className="w-9 px-3 py-3"></th>
                        <th className="px-5 py-3">Date</th>
                        <th className="px-5 py-3">Scope / Site</th>
                        <th className="px-5 py-3">Vendor</th>
                        <th className="px-5 py-3">Items</th>
                        <th className="px-5 py-3">Total Amount</th>
                        <th className="px-5 py-3">Payment</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Invoice</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPurchases.map((pur) => {
                        const isPaid = pur.payment?.isPaid;
                        const isPending = pur.status === "pending";
                        const isVerifying = verifyingPurchaseIds.has(pur._id);
                        const isExpanded = expandedPurchaseIds.has(pur._id);
                        return (
                          <React.Fragment key={pur._id}>
                            <tr
                              onClick={() => togglePurchaseExpand(pur._id)}
                              className={cn(
                                "cursor-pointer transition-colors hover:bg-slate-50/80",
                                isExpanded && "bg-slate-50/40",
                              )}
                            >
                              <td className="px-3 py-3.5 text-center text-console-muted">
                                {isExpanded ? (
                                  <ChevronDown
                                    size={15}
                                    className="inline-block text-brand-600"
                                  />
                                ) : (
                                  <ChevronRight
                                    size={15}
                                    className="inline-block text-console-muted"
                                  />
                                )}
                              </td>
                              <td className="px-5 py-3.5 text-console-muted whitespace-nowrap">
                                {formatDate(pur.date)}
                              </td>
                              <td className="px-5 py-3.5 whitespace-nowrap">
                                {!pur.site ? (
                                  <Badge variant="brand" className="text-[10px]">
                                    Central Warehouse
                                  </Badge>
                                ) : (
                                  <Badge variant="neutral" className="text-[10px]">
                                    {pur.site?.name || "Site"}
                                  </Badge>
                                )}
                              </td>
                              <td className="px-5 py-3.5 font-medium text-console-text">
                                {pur.vendor?.name || pur.vendor || "Vendor"}
                              </td>
                              <td className="px-5 py-3.5 text-console-muted">
                                {pur.items?.length || 0} items
                              </td>
                              <td className="px-5 py-3.5 font-semibold text-console-text whitespace-nowrap">
                                ₹{formatNumber(pur.totalAmount)}
                              </td>
                              <td className="px-5 py-3.5">
                                <Badge variant={isPaid ? "success" : "warning"}>
                                  {isPaid ? "Paid" : "Credit"}
                                </Badge>
                              </td>
                              <td className="px-5 py-3.5">
                                <Badge
                                  variant={
                                    pur.status === "verified"
                                      ? "brand"
                                      : "warning"
                                  }
                                >
                                  {pur.status === "verified"
                                    ? "Verified"
                                    : "Pending"}
                                </Badge>
                              </td>
                              <td
                                className="px-5 py-3.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {pur.billUpload?.url ? (
                                  <a
                                    href={pur.billUpload.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                                  >
                                    <FileText size={14} /> View
                                  </a>
                                ) : (
                                  <span className="text-xs text-console-muted">
                                    No Bill
                                  </span>
                                )}
                              </td>
                              <td
                                className="px-5 py-3.5 text-right whitespace-nowrap"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {isPending && canVerifyPurchase ? (
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => handleVerifyPurchase(pur._id)}
                                    disabled={isVerifying}
                                    loading={isVerifying}
                                    className="h-7 px-2.5 text-xs bg-brand-600 hover:bg-brand-700"
                                  >
                                    <CheckCircle2 size={13} className="mr-1" />
                                    Verify
                                  </Button>
                                ) : pur.status === "verified" ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-success-700">
                                    <CheckCircle2 size={13} /> Verified
                                  </span>
                                ) : (
                                  <span className="text-xs text-console-muted">
                                    -
                                  </span>
                                )}
                              </td>
                            </tr>

                            {isExpanded && (
                              <tr className="bg-slate-50/60">
                                <td
                                  colSpan={10}
                                  className="border-b border-console-border p-4 sm:p-5"
                                >
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <h4 className="flex items-center text-xs font-semibold uppercase tracking-wider text-console-muted">
                                        <Package
                                          size={14}
                                          className="mr-1.5 text-brand-600"
                                        />
                                        Purchased Items ({pur.items?.length || 0})
                                      </h4>
                                      {pur.vendor?.phone && (
                                        <span className="text-xs text-console-muted">
                                          Vendor Contact: {pur.vendor.phone}
                                        </span>
                                      )}
                                    </div>

                                    {!pur.items || pur.items.length === 0 ? (
                                      <p className="text-xs italic text-console-muted">
                                        No detailed line items recorded for this purchase.
                                      </p>
                                    ) : (
                                      <div className="grid gap-2.5">
                                        {pur.items.map(
                                          (item: any, idx: number) => (
                                            <div
                                              key={idx}
                                              className="flex flex-col justify-between gap-3 rounded-lg border border-console-border bg-white p-3 shadow-xs sm:flex-row sm:items-center"
                                            >
                                              <div className="min-w-0 flex-1">
                                                <div className="text-sm font-semibold text-console-text">
                                                  {item.name || "Item"}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-console-muted">
                                                  {item.category && (
                                                    <span>{item.category}</span>
                                                  )}
                                                  {item.category && item.unit && (
                                                    <span>•</span>
                                                  )}
                                                  {item.unit && (
                                                    <span>
                                                      Unit: {item.unit}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>

                                              <div className="flex items-center gap-5 self-end text-right sm:self-center">
                                                <div>
                                                  <div className="text-[10px] font-semibold uppercase text-console-muted">
                                                    Qty
                                                  </div>
                                                  <div className="text-xs font-semibold text-console-text">
                                                    {item.quantity} {item.unit}
                                                  </div>
                                                </div>
                                                <div>
                                                  <div className="text-[10px] font-semibold uppercase text-console-muted">
                                                    Unit Price
                                                  </div>
                                                  <div className="text-xs font-medium text-console-text">
                                                    ₹
                                                    {formatNumber(
                                                      item.price ||
                                                        item.unitPrice ||
                                                        0,
                                                    )}
                                                  </div>
                                                </div>
                                                <div className="min-w-[70px]">
                                                  <div className="text-[10px] font-semibold uppercase text-console-muted">
                                                    Total
                                                  </div>
                                                  <div className="text-sm font-bold text-success-700">
                                                    ₹
                                                    {formatNumber(
                                                      item.totalAmount ||
                                                        item.quantity *
                                                          (item.price ||
                                                            item.unitPrice ||
                                                            0),
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    )}

                                    {Number(pur.transportationFee || 0) > 0 && (
                                      <div className="mt-3 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/70 px-4 py-2.5">
                                        <div className="flex items-center gap-2">
                                          <DollarSign
                                            size={15}
                                            className="text-amber-600"
                                          />
                                          <span className="text-xs font-medium text-amber-800">
                                            Transportation Fee
                                          </span>
                                        </div>
                                        <span className="text-xs font-bold text-amber-900">
                                          ₹{formatNumber(pur.transportationFee)}
                                        </span>
                                      </div>
                                    )}

                                    {pur.notes && (
                                      <div className="mt-2 rounded-lg border border-console-border bg-white p-3 text-xs text-console-muted">
                                        <span className="font-semibold text-console-text">
                                          Notes:{" "}
                                        </span>
                                        {pur.notes}
                                      </div>
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

          {/* TAB 4: LENDERS & DEBT LEDGER */}
          {activeTab === "lenders" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-console-text">
                    Lenders & Loan Tracking Ledger
                  </h3>
                  <p className="text-xs text-console-muted">
                    Track borrowings infused into company funds and settle
                    amounts at any time
                  </p>
                </div>
                <Button size="sm" onClick={() => setIsFundsModalOpen(true)}>
                  <Plus size={14} /> Infuse Capital / New Loan
                </Button>
              </div>

              {lenders.length === 0 ? (
                <EmptyState
                  icon={HandCoins}
                  title="No lenders on record"
                  description="When you add funds marked as Lended Capital, lenders and loans will appear here."
                />
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {lenders.map((lender) => (
                    <Card key={lender._id} className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-semibold text-console-text">
                              {lender.name}
                            </h4>
                            <Badge
                              variant={
                                lender.outstandingBalance === 0
                                  ? "success"
                                  : "warning"
                              }
                            >
                              {lender.outstandingBalance === 0
                                ? "Settled"
                                : "Outstanding"}
                            </Badge>
                          </div>
                          {lender.phone && (
                            <p className="mt-0.5 text-xs text-console-muted">
                              {lender.phone}
                            </p>
                          )}
                        </div>

                        <Button
                          size="sm"
                          variant={
                            lender.outstandingBalance > 0
                              ? "primary"
                              : "secondary"
                          }
                          disabled={lender.outstandingBalance <= 0}
                          onClick={() => {
                            setSettlingLender(lender);
                            setSettleAmount(lender.outstandingBalance);
                            setSettleNotes("");
                          }}
                        >
                          <HandCoins size={14} /> Settle
                        </Button>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-3 text-center text-xs">
                        <div>
                          <p className="text-console-muted">Total Lended</p>
                          <p className="mt-1 font-semibold text-console-text">
                            ₹{formatNumber(lender.totalLended)}
                          </p>
                        </div>
                        <div>
                          <p className="text-console-muted">Settled</p>
                          <p className="mt-1 font-semibold text-success-700">
                            ₹{formatNumber(lender.totalSettled)}
                          </p>
                        </div>
                        <div>
                          <p className="text-console-muted">Balance</p>
                          <p
                            className={cn(
                              "mt-1 font-semibold",
                              lender.outstandingBalance > 0
                                ? "text-danger-600"
                                : "text-success-700",
                            )}
                          >
                            ₹{formatNumber(lender.outstandingBalance)}
                          </p>
                        </div>
                      </div>

                      {lender.history && lender.history.length > 0 && (
                        <div className="mt-3 border-t border-slate-100 pt-3">
                          <p className="mb-2 text-[11px] font-semibold uppercase text-console-muted">
                            Recent History
                          </p>
                          <div className="space-y-1.5 text-xs">
                            {lender.history
                              .slice(-3)
                              .reverse()
                              .map((h) => (
                                <div
                                  key={h._id}
                                  className="flex items-center justify-between text-console-muted"
                                >
                                  <span>
                                    {h.type === "borrow"
                                      ? "Borrowed"
                                      : "Settled"}{" "}
                                    • {formatDate(h.date)}
                                  </span>
                                  <span
                                    className={cn(
                                      "font-medium",
                                      h.type === "borrow"
                                        ? "text-brand-600"
                                        : "text-success-700",
                                    )}
                                  >
                                    {h.type === "borrow" ? "+" : "-"}₹
                                    {formatNumber(h.amount)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Reusable Modals */}
      <CompanyFundsModal
        isOpen={isFundsModalOpen}
        onClose={() => setIsFundsModalOpen(false)}
        onUpdated={() => fetchAllData()}
      />

      {isAddStockOpen && (
        <AddStockModal
          isOpen={isAddStockOpen}
          onClose={() => setIsAddStockOpen(false)}
          onSubmit={handleAddStockSubmit}
          sites={sites}
        />
      )}

      {isTransferOpen && (
        <RequestTransferModal
          isOpen={isTransferOpen}
          onClose={() => setIsTransferOpen(false)}
          onSubmit={handleRequestTransferSubmit}
          sites={sites}
          stocks={companyStocks}
          allowedToSites={sites}
        />
      )}

      {isAddPurchaseOpen && (
        <AddPurchaseModal
          siteId={null}
          isAdmin={true}
          onClose={() => {
            setIsAddPurchaseOpen(false);
            fetchAllData();
          }}
        />
      )}

      {/* Settle Loan Repayment Sub-Modal */}
      {settlingLender && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-console border border-console-border bg-white p-5 shadow-console-lg">
            <h3 className="text-base font-semibold text-console-text">
              Settle Loan with {settlingLender.name}
            </h3>
            <p className="mt-0.5 text-xs text-console-muted">
              Outstanding debt: ₹
              {formatNumber(settlingLender.outstandingBalance)}
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-console-text">
                  Settlement Amount (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={settlingLender.outstandingBalance}
                  step="0.01"
                  value={settleAmount}
                  onChange={(e) =>
                    setSettleAmount(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2",
                    settleAmount !== "" &&
                      (Number(settleAmount) >
                        settlingLender.outstandingBalance ||
                        Number(settleAmount) > totalAmount)
                      ? "border-danger-500 focus:border-danger-500 focus:ring-danger-100"
                      : "border-console-border focus:border-brand-500 focus:ring-brand-100",
                  )}
                  placeholder="0.00"
                  disabled={isSettling}
                />
                {settleAmount !== "" &&
                  Number(settleAmount) >
                    settlingLender.outstandingBalance && (
                    <p className="mt-1 text-xs text-danger-600">
                      Amount cannot exceed outstanding balance of ₹
                      {formatNumber(settlingLender.outstandingBalance)}.
                    </p>
                  )}
                {settleAmount !== "" &&
                  Number(settleAmount) <=
                    settlingLender.outstandingBalance &&
                  Number(settleAmount) > totalAmount && (
                    <p className="mt-1 text-xs text-danger-600">
                      Amount exceeds available company funds (₹
                      {formatNumber(totalAmount)}).
                    </p>
                  )}
                <p className="mt-1 text-[11px] text-console-muted">
                  Will be deducted from Company Funds (Available: ₹
                  {formatNumber(totalAmount)})
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-console-text">
                  Settlement Notes / Bank Reference
                </label>
                <input
                  type="text"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  className="w-full rounded-lg border border-console-border px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  placeholder="e.g. Bank IMPS / Cheque #12345"
                  disabled={isSettling}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isSettling}
                  onClick={() => setSettlingLender(null)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  loading={isSettling}
                  disabled={
                    !settleAmount ||
                    Number(settleAmount) <= 0 ||
                    Number(settleAmount) > settlingLender.outstandingBalance ||
                    Number(settleAmount) > totalAmount
                  }
                  onClick={handleSettle}
                >
                  Confirm Settlement
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyPage;
