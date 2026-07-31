import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
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
  Plus,
  Compass,
  Wrench,
  Truck,
  LucideIcon,
} from "lucide-react";
import {
  getAllActivityLogs,
  getDashboardData,
} from "@/services/dashboardService";
import { getCompanySummary, getAmountToBeReceived } from "@/services/companyService";
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
import { cn } from "@/lib/cn";

interface DashboardData {
  totalEmployees: number;
  totalSites: number;
  totalStocks: number;
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

interface Site {
  _id: string;
  name: string;
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

const formatNumber = (num: number | undefined) => {
  return num?.toLocaleString("en-IN") || "0";
};

const AdminDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allActivityLogs, setAllActivityLogs] = useState<ActivityLog[] | null>(null);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [, setSites] = useState<Site[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [companyTotalAmount, setCompanyTotalAmount] = useState<number | null>(null);
  const [amountToBeReceived, setAmountToBeReceived] = useState<number | null>(null);
  const [isCompanyFundsModalOpen, setIsCompanyFundsModalOpen] = useState(false);
  const [isReceivableModalOpen, setIsReceivableModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const realData = await getDashboardData();
        setData(realData);
        setLastUpdated(new Date());
        setLoading(false);

        const [sitesRes, vendorsRes, employeesRes, stocksRes, contractorsRes, clientsRes] =
          await Promise.all([
            privateClient.get("/sites"),
            privateClient.get("/vendors"),
            privateClient.get("/employees"),
            privateClient.get("/stocks"),
            privateClient.get("/contractors"),
            privateClient.get("/users?role=client"),
          ]);
        setSites(sitesRes.data);
        setVendors(vendorsRes.data);
        setEmployees(employeesRes.data);
        setStocks(stocksRes.data);
        setContractors(contractorsRes.data);
        setClients(clientsRes.data);

        try {
          const [companySummary, receivableSummary] = await Promise.all([
            getCompanySummary(),
            getAmountToBeReceived(),
          ]);
          setCompanyTotalAmount(companySummary.totalAmount);
          setAmountToBeReceived(receivableSummary.total);
        } catch (financialErr) {
          toast.error("Failed to load company financial summary");
        }
      } catch (err) {
        setError("Failed to fetch dashboard data");
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  const handleViewAllActivity = async () => {
    try {
      const logs = await getAllActivityLogs();
      setAllActivityLogs(logs);
      setShowAllActivities(true);
    } catch (err) {
      toast.error("Failed to load activity logs");
    }
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

      <div className="flex flex-wrap gap-1 rounded-console border border-console-border bg-white p-1 shadow-console">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActiveSection(section.id)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              activeSection === section.id
                ? "bg-brand-700 text-white"
                : "text-console-muted hover:bg-console-bg hover:text-console-text",
            )}
          >
            <section.icon size={16} />
            {section.label}
          </button>
        ))}
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
        <>
          {activeSection === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card className="cursor-pointer transition-shadow hover:shadow-console-lg">
                  <button
                    type="button"
                    onClick={() => setIsCompanyFundsModalOpen(true)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-console-muted">
                        Company Funds
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-console-text">
                        ₹{companyTotalAmount !== null ? formatNumber(companyTotalAmount) : "—"}
                      </p>
                      <p className="mt-1 text-xs text-console-muted">View transaction history</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-50 text-success-700">
                        <DollarSign size={20} />
                      </div>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCompanyFundsModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-success-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-success-700"
                      >
                        <Plus size={13} /> Add funds
                      </span>
                    </div>
                  </button>
                </Card>

                <Card className="cursor-pointer transition-shadow hover:shadow-console-lg">
                  <button
                    type="button"
                    onClick={() => setIsReceivableModalOpen(true)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-console-muted">
                        Amount to be received
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-console-text">
                        ₹
                        {amountToBeReceived !== null
                          ? formatNumber(Math.round(amountToBeReceived))
                          : "—"}
                      </p>
                      <p className="mt-1 text-xs text-console-muted">View per-site breakdown</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-50 text-warning-700">
                      <AlertCircle size={20} />
                    </div>
                  </button>
                </Card>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total Employees" value={formatNumber(data?.totalEmployees)} icon={Briefcase} />
                <StatCard label="Active Sites" value={formatNumber(data?.totalSites)} icon={Building} />
                <StatCard label="Stock Items" value={formatNumber(data?.totalStocks)} icon={Package} />
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
                title="Live activity feed"
                description="Recent changes across the console"
                action={
                  <button
                    type="button"
                    onClick={handleViewAllActivity}
                    className="rounded-lg p-2 text-console-muted transition-colors hover:bg-console-bg hover:text-console-text"
                    aria-label="View all activity"
                  >
                    <Eye size={16} />
                  </button>
                }
              >
                {data?.recentActivity?.length ? (
                  <div className="h-80 space-y-3 overflow-y-auto">
                    {data.recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 rounded-lg border border-console-border p-3"
                      >
                        <div
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                            activity.type === "employee" && "bg-brand-50 text-brand-700",
                            activity.type === "site" && "bg-success-50 text-success-700",
                            activity.type === "stock" && "bg-warning-50 text-warning-700",
                          )}
                        >
                          {activity.type === "employee" && <Users size={15} />}
                          {activity.type === "site" && <Building size={15} />}
                          {activity.type === "stock" && <Package size={15} />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-console-text">{activity.description}</p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-console-muted">
                            <Clock size={11} />
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={Activity} title="No recent activity" description="New employees, sites, and stock updates will show up here." />
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
                              {new Date(transaction.createdAt).toLocaleDateString()}
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
              <BulkImportForm
                clients={clients}
                vendors={vendors}
                employees={employees}
                stocks={stocks}
                contractors={contractors}
              />
            </Card>
          )}
        </>
      )}

      <Modal
        isOpen={showAllActivities && !!allActivityLogs}
        onClose={() => setShowAllActivities(false)}
        title="Activity timeline"
        size="lg"
      >
        <div className="max-h-[60vh] space-y-3 overflow-y-auto">
          {allActivityLogs?.map((log) => (
            <div key={log._id} className="flex items-start gap-3 rounded-lg border border-console-border p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <Activity size={15} />
              </div>
              <div>
                <p className="text-sm font-medium text-console-text">
                  {log.details || `${log.user.name} performed ${log.action} on ${log.resource}`}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-console-muted">
                  <Clock size={11} />
                  {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Modal>

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
