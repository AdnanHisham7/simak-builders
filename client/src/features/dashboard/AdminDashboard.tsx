import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow, format, isSameDay } from "date-fns";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Users,
  Briefcase,
  Package,
  TrendingUp,
  AlertCircle,
  Clock,
  Building,
  Activity,
  BarChart2,
  DollarSign,
  Eye,
  Import,
  Compass,
  Wrench,
  Truck,
  LucideIcon,
  Download,
  Calendar as CalendarIcon,
  Maximize2,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getAllActivityLogs,
  getDashboardData,
  ActivityLogItem,
} from "@/services/dashboardService";
import { getCompanySummary, getAmountToBeReceived } from "@/services/companyService";
import { useCompanyProfile } from "@/hooks/useCompanyProfile";
import DailyActivityModal from "./components/DailyActivityModal";
import { exportDailyActivityPdf } from "./components/exportDailyActivityPdf";
import { privateClient } from "@/api";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import BulkImportForm from "./BulkImportForm";
import CompanyFundsModal from "./CompanyFundsModal";
import AmountToBeReceivedModal from "./AmountToBeReceivedModal";
import { StatCard, Card } from "@/components/ui/Card";
import { SkeletonStatCards, SkeletonChart } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import GradientStatCard from "@/components/ui/GradientStatCard";
import HoverTooltip from "@/components/ui/Tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { usePreferences } from "@/hooks/usePreferences";

interface DashboardData {
  totalEmployees: number;
  totalSites: number;
  totalStocks: number;
  employeesLastMonth: number;
  sitesLastMonth: number;
  stocksLastMonth: number;
  clientsCount: number;
  architectsCount: number;
  vendorsCount: number;
  contractorsCount: number;
  recentActivity: DashboardActivity[];
  stockDistribution: StockItem[];
  monthlyRevenue: RevenueData[];
  sitePerformance: SitePerformance[];
  pendingTransactions: PendingTransaction[];
}

interface DashboardActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

interface ActivityLog {
  _id: string;
  user: { name: string };
  action: string;
  resource: string;
  resourceId: string;
  details?: string;
  timestamp: string;
}

interface StockItem {
  name: string;
  value: number;
}

interface RevenueData {
  month: string;
  revenue: number;
  expenses: number;
}

interface SitePerformance {
  name: string;
  efficiency: number;
  utilization: number;
}

interface PendingTransaction {
  _id: string;
  client: { name: string; email: string };
  amount: number;
  createdAt: string;
}

interface Vendor {
  _id: string;
  name: string;
}

interface Employee {
  _id: string;
  name: string;
}

interface Stock {
  _id: string;
  name: string;
}

interface Contractor {
  _id: string;
  name: string;
}

const CHART_COLORS = ["#8C6424", "#059669", "#2563EB", "#D97706", "#DC2626", "#64748B"];

const SECTIONS = [
  { id: "overview", label: "Overview", icon: BarChart2 },
  { id: "analytics", label: "Analytics", icon: TrendingUp },
  { id: "operations", label: "Operations", icon: Activity },
  { id: "transactions", label: "Transactions", icon: DollarSign },
  { id: "bulkImport", label: "Bulk Import", icon: Import },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const ECOSYSTEM_ICON_BG: Record<string, string> = {
  brand: "bg-brand-50 text-brand-700",
  success: "bg-success-50 text-success-700",
  info: "bg-info-50 text-info-700",
  warning: "bg-warning-50 text-warning-700",
  danger: "bg-danger-50 text-danger-700",
};

const AdminDashboard = () => {
  const { formatNumber, formatDate } = usePreferences();
  const { profile: companyProfile } = useCompanyProfile();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allActivityLogs, setAllActivityLogs] = useState<ActivityLogItem[] | null>(null);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [bulkImportDataLoaded, setBulkImportDataLoaded] = useState(false);
  const [bulkImportDataLoading, setBulkImportDataLoading] = useState(false);
  const [companyTotalAmount, setCompanyTotalAmount] = useState<number | null>(null);
  const [amountToBeReceived, setAmountToBeReceived] = useState<number | null>(null);
  const [financialSummaryLoading, setFinancialSummaryLoading] = useState(true);
  const [isCompanyFundsModalOpen, setIsCompanyFundsModalOpen] = useState(false);
  const [isReceivableModalOpen, setIsReceivableModalOpen] = useState(false);

  // Daily Activity State for Operations Tab
  const [operationsSelectedDate, setOperationsSelectedDate] = useState<Date>(new Date());
  const [operationsDateLogs, setOperationsDateLogs] = useState<ActivityLogItem[]>([]);
  const [operationsLogsLoading, setOperationsLogsLoading] = useState(false);
  const [isDailyActivityModalOpen, setIsDailyActivityModalOpen] = useState(false);
  const [operationsIsExporting, setOperationsIsExporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const realData = await getDashboardData();
        setData(realData);
        setLastUpdated(new Date());
        setLoading(false);

        try {
          const [companySummary, receivableSummary] = await Promise.all([
            getCompanySummary(),
            getAmountToBeReceived(),
          ]);
          setCompanyTotalAmount(companySummary.totalAmount);
          setAmountToBeReceived(receivableSummary.total);
        } catch (financialErr) {
          toast.error("Failed to load company financial summary");
        } finally {
          setFinancialSummaryLoading(false);
        }
      } catch (err) {
        setError("Failed to fetch dashboard data");
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (activeSection !== "bulkImport" || bulkImportDataLoaded) return;

    const fetchBulkImportData = async () => {
      setBulkImportDataLoading(true);
      try {
        const [vendorsRes, employeesRes, stocksRes, contractorsRes, clientsRes] =
          await Promise.all([
            privateClient.get("/vendors"),
            privateClient.get("/employees"),
            privateClient.get("/stocks"),
            privateClient.get("/contractors"),
            privateClient.get("/users?role=client"),
          ]);
        setVendors(vendorsRes.data);
        setEmployees(employeesRes.data);
        setStocks(stocksRes.data);
        setContractors(contractorsRes.data);
        setClients(clientsRes.data);
        setBulkImportDataLoaded(true);
      } catch (err) {
        toast.error("Failed to load bulk import data");
      } finally {
        setBulkImportDataLoading(false);
      }
    };
    fetchBulkImportData();
  }, [activeSection, bulkImportDataLoaded]);

  const handleVerifyTransaction = async (transactionId: string) => {
    try {
      await privateClient.put(`/client/transactions/${transactionId}/verify`);
      const realData = await getDashboardData();
      setData(realData);
      setLastUpdated(new Date());
      toast.success("Payment verified");
    } catch (err) {
      toast.error("Failed to verify transaction");
    }
  };

  // Fetch operations activities whenever Operations tab is active or selected date changes
  useEffect(() => {
    if (activeSection !== "operations") return;

    const fetchDateLogs = async () => {
      setOperationsLogsLoading(true);
      try {
        const start = new Date(operationsSelectedDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(operationsSelectedDate);
        end.setHours(23, 59, 59, 999);

        const logs = await getAllActivityLogs({
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          limit: 100,
        });
        setOperationsDateLogs(Array.isArray(logs) ? logs : []);
      } catch (err) {
        toast.error("Failed to load activities for the selected date");
      } finally {
        setOperationsLogsLoading(false);
      }
    };

    fetchDateLogs();
  }, [activeSection, operationsSelectedDate]);

  const handleOperationsCardExportPdf = () => {
    if (operationsDateLogs.length === 0) {
      toast.error("No activities to export for this date");
      return;
    }
    setOperationsIsExporting(true);
    try {
      exportDailyActivityPdf({
        activities: operationsDateLogs,
        selectedDate: operationsSelectedDate,
        companyProfile,
      });
      toast.success("Activity audit report exported successfully");
    } catch (err) {
      toast.error("Failed to generate PDF report");
    } finally {
      setOperationsIsExporting(false);
    }
  };

  const handleViewAllActivity = () => {
    setIsDailyActivityModalOpen(true);
  };

  const latestRevenue = useMemo(() => {
    if (!data?.monthlyRevenue?.length) return 0;
    return data.monthlyRevenue[data.monthlyRevenue.length - 1].revenue;
  }, [data]);

  const revenueTrend = useMemo(() => {
    const months = data?.monthlyRevenue;
    if (!months || months.length < 2) return null;
    const previous = months[months.length - 2].revenue;
    const current = months[months.length - 1].revenue;
    if (previous === 0) return null;
    const changePercent = ((current - previous) / previous) * 100;
    return {
      direction: (changePercent >= 0 ? "up" : "down") as "up" | "down",
      value: `${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(1)}%`,
      label: "vs last month",
    };
  }, [data]);

  const computeGrowthTrend = (
    current: number | undefined,
    previous: number | undefined,
  ) => {
    if (current === undefined || current === null) return null;
    if (previous === undefined || previous === null || previous === 0) return null;
    const changePercent = ((current - previous) / previous) * 100;
    return {
      direction: (changePercent >= 0 ? "up" : "down") as "up" | "down",
      value: `${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(1)}%`,
      label: "vs last month",
    };
  };

  const employeesTrend = useMemo(
    () => computeGrowthTrend(data?.totalEmployees, data?.employeesLastMonth),
    [data],
  );

  const sitesTrend = useMemo(
    () => computeGrowthTrend(data?.totalSites, data?.sitesLastMonth),
    [data],
  );

  const stocksTrend = useMemo(
    () => computeGrowthTrend(data?.totalStocks, data?.stocksLastMonth),
    [data],
  );

  const ecosystemStats: Array<{
    label: string;
    value: number | undefined;
    icon: LucideIcon;
    tone: keyof typeof ECOSYSTEM_ICON_BG;
    path: string;
  }> = [
    { label: "Clients", value: data?.clientsCount, icon: Users, tone: "brand", path: "/admin/clients" },
    { label: "Employees", value: data?.totalEmployees, icon: Briefcase, tone: "success", path: "/admin/employees" },
    { label: "Vendors", value: data?.vendorsCount, icon: Truck, tone: "info", path: "/admin/vendors" },
    { label: "Contractors", value: data?.contractorsCount, icon: Wrench, tone: "warning", path: "/admin/contractors" },
    { label: "Architects", value: data?.architectsCount, icon: Compass, tone: "danger", path: "/admin/architects" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-console-text">Admin Dashboard</h1>
          <p className="mt-0.5 text-sm text-console-muted">
            {lastUpdated
              ? `Updated ${formatDistanceToNow(lastUpdated, { addSuffix: true })}`
              : "Loading the latest figures"}
          </p>
        </div>
      </div>

      <div className="relative flex flex-wrap gap-1 rounded-console border border-console-border bg-white p-1 shadow-console">
        {SECTIONS.map((section) => {
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "relative z-10 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200",
                isActive ? "text-white" : "text-console-muted hover:bg-console-bg hover:text-console-text",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="admin-dashboard-section-pill"
                  className="absolute inset-0 -z-10 rounded-lg bg-brand-700"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <section.icon size={16} />
              {section.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-6">
          <SkeletonStatCards />
          <SkeletonChart />
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-console border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          <AlertCircle size={18} />
          <p>{error}</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
          {activeSection === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <GradientStatCard
                  label="Company Funds"
                  value={companyTotalAmount ?? 0}
                  prefix="₹"
                  loading={financialSummaryLoading}
                  helperText="View transaction history"
                  icon={DollarSign}
                  onClick={() => setIsCompanyFundsModalOpen(true)}
                  action={{
                    label: "Add funds",
                    onClick: () => setIsCompanyFundsModalOpen(true),
                  }}
                />

                <GradientStatCard
                  label="Amount to be received"
                  value={amountToBeReceived !== null ? Math.round(amountToBeReceived) : 0}
                  prefix="₹"
                  loading={financialSummaryLoading}
                  helperText="View per-site breakdown"
                  icon={AlertCircle}
                  onClick={() => setIsReceivableModalOpen(true)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Total Employees"
                  value={formatNumber(data?.totalEmployees)}
                  icon={Briefcase}
                  trend={employeesTrend ?? undefined}
                />
                <StatCard
                  label="Active Sites"
                  value={formatNumber(data?.totalSites)}
                  icon={Building}
                  trend={sitesTrend ?? undefined}
                />
                <StatCard
                  label="Stock Items"
                  value={formatNumber(data?.totalStocks)}
                  icon={Package}
                  trend={stocksTrend ?? undefined}
                />
                <StatCard
                  label="Monthly Revenue"
                  value={`₹${formatNumber(latestRevenue)}`}
                  icon={DollarSign}
                  trend={revenueTrend ?? undefined}
                />
              </div>

              <Card title="Company Ecosystem" description="Overview of all stakeholders">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {ecosystemStats.map((stat) => (
                    <Link
                      to={stat.path}
                      key={stat.label}
                      className="rounded-console border border-console-border p-4 text-center transition-colors hover:border-brand-300 hover:bg-brand-50/40"
                    >
                      <div
                        className={cn(
                          "mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full",
                          ECOSYSTEM_ICON_BG[stat.tone],
                        )}
                      >
                        <stat.icon size={20} />
                      </div>
                      <h4 className="text-xl font-semibold text-console-text">
                        {formatNumber(stat.value)}
                      </h4>
                      <p className="text-xs font-medium text-console-muted">{stat.label}</p>
                    </Link>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeSection === "analytics" && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card title="Revenue analytics" description="Monthly performance overview">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data?.monthlyRevenue || []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E7EC" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#5B6472" }} />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#5B6472" }}
                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip formatter={(value) => [`₹${formatNumber(Number(value))}`, "Amount"]} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#8C6424" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="expenses" stroke="#DC2626" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title="Inventory overview" description="Stock distribution by category">
                {data?.stockDistribution?.length ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.stockDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={90}
                          dataKey="value"
                        >
                          {data.stockDistribution.map((_, index) => (
                            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} units`, "Quantity"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState icon={Package} title="No stock data yet" description="Stock categories will appear here once inventory is recorded." />
                )}
              </Card>
            </div>
          )}

          {activeSection === "operations" && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card title="Site performance" description="Efficiency and attendance-based utilization, last 30 days">
                {data?.sitePerformance?.length ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.sitePerformance} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E7EC" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#5B6472" }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#5B6472" }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="efficiency" fill="#8C6424" name="Efficiency %" barSize={22} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="utilization" fill="#059669" name="Utilization %" barSize={22} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState icon={Building} title="No site data yet" description="Site performance will appear here once phases and attendance are recorded." />
                )}
              </Card>

              <Card
                title="Daily Activity Log"
                description={`Audit for ${format(operationsSelectedDate, "EEEE, dd MMMM yyyy")}`}
                action={
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Inline Date Selector */}
                    <div className="flex items-center gap-1">
                      {!isSameDay(operationsSelectedDate, new Date()) && (
                        <button
                          type="button"
                          onClick={() => setOperationsSelectedDate(new Date())}
                          className="rounded-md bg-brand-50 px-2 py-1 text-[11px] font-medium text-brand-700 hover:bg-brand-100 transition-colors"
                        >
                          Today
                        </button>
                      )}
                      <input
                        type="date"
                        value={format(operationsSelectedDate, "yyyy-MM-dd")}
                        onChange={(e) => {
                          if (e.target.value) {
                            const [y, m, d] = e.target.value
                              .split("-")
                              .map(Number);
                            setOperationsSelectedDate(new Date(y, m - 1, d));
                          }
                        }}
                        className="rounded-lg border border-console-border bg-white px-2 py-1 text-xs text-console-text shadow-sm focus:border-brand-500 focus:outline-none"
                      />
                    </div>

                    {/* Export PDF Button */}
                    <HoverTooltip label="Export this date as PDF">
                      <button
                        type="button"
                        onClick={handleOperationsCardExportPdf}
                        disabled={operationsIsExporting || operationsDateLogs.length === 0}
                        className="rounded-lg p-1.5 text-console-muted transition-colors hover:bg-console-bg hover:text-console-text disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Export date activity as PDF"
                      >
                        <Download size={15} />
                      </button>
                    </HoverTooltip>

                    {/* Full Audit View Button */}
                    <HoverTooltip label="Open full detailed activity audit">
                      <button
                        type="button"
                        onClick={() => setIsDailyActivityModalOpen(true)}
                        className="rounded-lg p-1.5 text-console-muted transition-colors hover:bg-console-bg hover:text-console-text"
                        aria-label="Open full detailed activity audit"
                      >
                        <Maximize2 size={15} />
                      </button>
                    </HoverTooltip>
                  </div>
                }
              >
                {operationsLogsLoading ? (
                  <div className="flex h-80 flex-col items-center justify-center text-console-muted">
                    <RefreshCw size={22} className="animate-spin text-brand-600 mb-2" />
                    <p className="text-xs">Loading activities for {format(operationsSelectedDate, "dd MMM yyyy")}...</p>
                  </div>
                ) : operationsDateLogs.length > 0 ? (
                  <div className="flex flex-col h-80">
                    <div className="flex-1 space-y-2.5 overflow-y-auto pr-1 [scrollbar-width:thin]">
                      {operationsDateLogs.map((activity) => {
                        const isPurchase = activity.resource === "purchase";
                        const isMisc =
                          activity.resource === "miscellaneousExpense" ||
                          activity.resource === "miscellaneous";
                        const detailUrl =
                          isPurchase && activity.resourceId
                            ? `/admin/purchases/${activity.resourceId}`
                            : isMisc && activity.resourceId
                            ? `/admin/miscellaneous-expenses/${activity.resourceId}`
                            : null;

                        return (
                          <div
                            key={activity._id}
                            className={cn(
                              "flex items-start gap-2.5 rounded-lg border border-console-border bg-white p-2.5 transition-colors shadow-xs",
                              detailUrl
                                ? "hover:border-brand-300 hover:bg-slate-50/50 cursor-pointer"
                                : "hover:border-brand-200"
                            )}
                            onClick={() => {
                              if (detailUrl) navigate(detailUrl);
                            }}
                          >
                            <div
                              className={cn(
                                "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                                isPurchase
                                  ? "bg-amber-50 text-amber-700"
                                  : isMisc
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-brand-50 text-brand-700"
                              )}
                            >
                              {isPurchase ? (
                                <ShoppingCart size={14} />
                              ) : isMisc ? (
                                <Wrench size={14} />
                              ) : (
                                <Activity size={14} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="text-xs font-semibold text-console-text truncate">
                                    {activity.user?.name || "System"}
                                  </span>
                                  {activity.resource && (
                                    <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-medium text-slate-600">
                                      {activity.resource}
                                    </span>
                                  )}
                                </div>
                                <span className="flex items-center gap-0.5 text-[10px] font-medium text-console-muted shrink-0">
                                  <Clock size={10} />
                                  {activity.timestamp
                                    ? format(new Date(activity.timestamp), "hh:mm a")
                                    : "-"}
                                </span>
                              </div>
                              <p className="mt-0.5 text-xs text-slate-700 line-clamp-2">
                                {activity.details || `${activity.action} on ${activity.resource}`}
                              </p>
                              {detailUrl && (
                                <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-800">
                                  View {isPurchase ? "purchase" : "expense"} details →
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between border-t border-console-border pt-2 text-xs">
                      <span className="text-console-muted">
                        Total: <strong>{operationsDateLogs.length}</strong> activities
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsDailyActivityModalOpen(true)}
                        className="font-medium text-brand-600 hover:text-brand-700"
                      >
                        Detailed view & filters →
                      </button>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon={CalendarIcon}
                    title={`No activity on ${format(operationsSelectedDate, "dd MMM yyyy")}`}
                    description="Pick another date or open the detailed audit modal to search records across any time period."
                    action={
                      <div className="flex items-center gap-2">
                        {!isSameDay(operationsSelectedDate, new Date()) && (
                          <button
                            type="button"
                            onClick={() => setOperationsSelectedDate(new Date())}
                            className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-700"
                          >
                            Go to Today
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsDailyActivityModalOpen(true)}
                          className="rounded-lg border border-console-border bg-white px-3 py-1.5 text-xs font-medium text-console-text transition-colors hover:bg-slate-50"
                        >
                          Open Audit Tool
                        </button>
                      </div>
                    }
                  />
                )}
              </Card>
            </div>
          )}

          {activeSection === "transactions" && (
            <Card title="Pending transactions" description="Client payments awaiting verification">
              {data?.pendingTransactions?.length ? (
                <div className="space-y-3">
                  {data.pendingTransactions.map((transaction) => (
                    <div
                      key={transaction._id}
                      className="flex flex-col gap-3 rounded-console border border-console-border p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-50 text-success-700">
                          <DollarSign size={18} />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-console-text">{transaction.client.name}</h4>
                          <p className="text-xs text-console-muted">{transaction.client.email}</p>
                          <div className="mt-1.5 flex items-center gap-3">
                            <span className="text-lg font-semibold text-success-700">
                              ₹{formatNumber(transaction.amount)}
                            </span>
                            <span className="rounded-full bg-console-bg px-2 py-0.5 text-xs text-console-muted">
                              {formatDate(transaction.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleVerifyTransaction(transaction._id)}
                        className="rounded-lg bg-success-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-success-700"
                      >
                        Verify payment
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={DollarSign} title="No pending transactions" description="Client payments will appear here once submitted for verification." />
              )}
            </Card>
          )}

          {activeSection === "bulkImport" && (
            <Card title="Bulk import site data" description="Enter past or forgotten data for a site">
              {bulkImportDataLoading && !bulkImportDataLoaded ? (
                <div className="flex items-center justify-center py-12 text-console-muted">
                  Loading form data…
                </div>
              ) : (
                <BulkImportForm
                  clients={clients}
                  vendors={vendors}
                  employees={employees}
                  stocks={stocks}
                  contractors={contractors}
                />
              )}
            </Card>
          )}
        </motion.div>
        </AnimatePresence>
      )}

      <DailyActivityModal
        isOpen={isDailyActivityModalOpen}
        onClose={() => setIsDailyActivityModalOpen(false)}
        initialDate={operationsSelectedDate}
      />

      <CompanyFundsModal
        isOpen={isCompanyFundsModalOpen}
        onClose={() => setIsCompanyFundsModalOpen(false)}
        onUpdated={(newTotal) => setCompanyTotalAmount(newTotal)}
      />
      <AmountToBeReceivedModal
        isOpen={isReceivableModalOpen}
        onClose={() => setIsReceivableModalOpen(false)}
      />
    </div>
  );
};

export default AdminDashboard;