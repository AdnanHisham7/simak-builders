import React, { useEffect, useState } from "react";
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
  Calendar,
  Clock,
  ArrowUpRight,
  Building,
  Activity,
  BarChart2,
  DollarSign,
  Eye,
  X,
  Filter,
  Download,
  Settings,
  Bell,
  ChevronDown,
  Search,
  RefreshCw,
  MoreVertical,
  Star,
  Zap,
  Shield,
  Globe,
  Import,
  Plus,
  Trash2,
} from "lucide-react";
import {
  getAllActivityLogs,
  getDashboardData,
} from "@/services/dashboardService";
import { privateClient } from "@/api";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import BulkImportForm from "./BulkImportForm";

// Define interfaces for data structures
interface DashboardData {
  totalEmployees: number;
  totalSites: number;
  totalStocks: number;
  clientsCount: number;
  architectsCount: number;
  vendorsCount: number;
  contractorsCount: number;
  recentActivity: Activity[];
  stockDistribution: StockItem[];
  monthlyRevenue: RevenueData[];
  sitePerformance: SitePerformance[];
  pendingTransactions: PendingTransaction[];
}

interface Activity {
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

interface PurchaseItem {
  name: string;
  unit: string;
  category: string;
  quantity: number;
  price: number;
}

interface Purchase {
  vendor: string;
  items: PurchaseItem[];
  totalAmount: number;
  billUpload: {
    name: string;
    size: number;
    type: string;
    uploadDate: string;
    url: string;
  };
}

interface BulkImportForm {
  siteUpdates: {
    budget: number;
    status: string;
  };
  phases: Array<{
    name: string;
    status: string;
    completionDate: string;
  }>;
  documents: Array<{
    name: string;
    size: number;
    type: string;
    url: string;
  }>;
  purchases: Purchase[];
  machineryRentals: Array<{
    description: string;
    amount: number;
    date: string;
  }>;
  attendances: Array<{
    employee: string;
    date: string;
    status: number;
    dailyWage: number;
  }>;
  stockUsages: Array<{
    stock: string;
    quantity: number;
    usageDate: string;
  }>;
  contractorTransactions: Array<{
    contractor: string;
    type: string;
    amount: number;
    description: string;
    date: string;
  }>;
}

const AdminDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allActivityLogs, setAllActivityLogs] = useState<ActivityLog[] | null>(
    null
  );
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const realData = await getDashboardData();
        setData(realData);
        setLastUpdated(new Date());
        setLoading(false);
        setIsAnimating(true);

        // Fetch sites, vendors, employees, stocks, contractors
        const [
          sitesRes,
          vendorsRes,
          employeesRes,
          stocksRes,
          contractorsRes,
          clientsRes,
        ] = await Promise.all([
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

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  const formatNumber = (num: number | undefined) => {
    return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") || "0";
  };

  const sections = [
    { id: "overview", label: "Overview", icon: BarChart2 },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "operations", label: "Operations", icon: Activity },
    { id: "transactions", label: "Transactions", icon: DollarSign },
    { id: "bulkImport", label: "Bulk Import", icon: Import },
  ];

  const StatCard = ({
    icon: Icon,
    title,
    value,
    change,
    color,
    trend,
    lastUpdated,
    prefix = "",
  }: any) => (
    <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300 transform hover:scale-105 hover:shadow-3xl overflow-hidden group">
      <div
        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color} rounded-t-2xl`}
      />
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div
            className={`p-3 rounded-2xl bg-gradient-to-br ${color} bg-opacity-10`}
          >
            <Icon
              size={24}
              className={`${
                color.includes("blue")
                  ? "text-blue-600"
                  : color.includes("green")
                  ? "text-green-600"
                  : color.includes("purple")
                  ? "text-purple-600"
                  : "text-indigo-600"
              }`}
            />
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-3xl font-bold text-gray-900">
                {prefix}
                {formatNumber(value)}
              </p>
              <div
                className={`flex items-center text-sm font-medium ${
                  trend === "up" ? "text-green-600" : "text-red-600"
                }`}
              >
                <ArrowUpRight
                  size={14}
                  className={`mr-1 ${trend === "down" ? "rotate-90" : ""}`}
                />
                {change}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="px-6 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-100">
        <p className="text-xs text-gray-500 flex items-center">
          <Clock size={12} className="mr-1" />
          {lastUpdated
            ? `Updated ${formatDistanceToNow(lastUpdated)} ago`
            : "Updating..."}
        </p>
      </div>
    </div>
  );

  const ChartCard = ({
    title,
    subtitle,
    icon: Icon,
    children,
    actions,
  }: any) => (
    <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300 hover:shadow-3xl overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
          <div className="flex items-center space-x-3">
            {actions && (
              <div className="flex space-x-2">
                {actions.map((action: any, index: any) => (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                  >
                    <action.icon size={16} className="text-gray-600" />
                  </button>
                ))}
              </div>
            )}
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50">
              <Icon size={20} className="text-blue-600" />
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );

  const SkeletonLoader = () => (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array(4)
          .fill(1)
          .map((_, index) => (
            <div key={index} className="bg-gray-200 rounded-2xl h-32"></div>
          ))}
      </div>
      <div className="bg-gray-200 rounded-2xl h-64"></div>
    </div>
  );

  let latestRevenue = 0;
  if (data?.monthlyRevenue) {
    latestRevenue =
      data?.monthlyRevenue?.length > 0
        ? data.monthlyRevenue[data.monthlyRevenue.length - 1].revenue
        : 0;
  }

  return (
    <div
      className={`relative bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 min-h-screen transition-all duration-500 ${
        isAnimating ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600">
                <Shield size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Admin Command Center
                </h1>
                <p className="text-gray-500 flex items-center mt-1">
                  <Globe size={14} className="mr-2" />
                  Real-time insights and control panel
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-6 py-4">
        <div className="flex space-x-1 bg-white rounded-2xl p-1 shadow-lg border border-gray-200">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeSection === section.id
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <section.icon size={16} />
              <span>{section.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-6">
        {loading ? (
          <SkeletonLoader />
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center">
            <AlertCircle className="mr-2" size={20} />
            <p>{error}</p>
          </div>
        ) : (
          <>
            {activeSection === "overview" && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    icon={Users}
                    title="Total Employees"
                    value={data?.totalEmployees}
                    change="3.2%"
                    color="from-blue-500 to-blue-600"
                    trend="up"
                    lastUpdated={lastUpdated}
                  />
                  <StatCard
                    icon={Building}
                    title="Active Sites"
                    value={data?.totalSites}
                    change="1.1%"
                    color="from-green-500 to-green-600"
                    trend="up"
                    lastUpdated={lastUpdated}
                  />
                  <StatCard
                    icon={Package}
                    title="Stock Items"
                    value={data?.totalStocks}
                    change="0.8%"
                    color="from-purple-500 to-purple-600"
                    trend="down"
                    lastUpdated={lastUpdated}
                  />
                  <StatCard
                    icon={DollarSign}
                    title="Monthly Revenue"
                    value={latestRevenue}
                    change="12.5%"
                    color="from-indigo-500 to-indigo-600"
                    trend="up"
                    lastUpdated={lastUpdated}
                    prefix="₹"
                  />
                </div>
                <ChartCard
                  title="Company Ecosystem"
                  subtitle="Overview of all stakeholders"
                  icon={Globe}
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {[
                      {
                        label: "Clients",
                        value: data?.clientsCount,
                        icon: Users,
                        color: "blue",
                        path: "/admin/clients",
                      },
                      {
                        label: "Employees",
                        value: data?.totalEmployees,
                        icon: Briefcase,
                        color: "green",
                        path: "/admin/employees",
                      },
                      {
                        label: "Vendors",
                        value: data?.vendorsCount,
                        icon: Package,
                        color: "yellow",
                        path: "/admin/vendors",
                      },
                      {
                        label: "Contractors",
                        value: data?.contractorsCount,
                        icon: Users,
                        color: "purple",
                        path: "/admin/contractors",
                      },
                      {
                        label: "Architects",
                        value: data?.architectsCount,
                        icon: Building,
                        color: "red",
                        path: "/admin/architects",
                      },
                    ].map((stat, index) => (
                      <Link to={stat.path} key={index}>
                        <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:shadow-lg transition-all duration-200 cursor-pointer">
                          <div
                            className={`inline-flex p-4 rounded-2xl bg-${stat.color}-50 mb-3`}
                          >
                            <stat.icon
                              size={24}
                              className={`text-${stat.color}-600`}
                            />
                          </div>
                          <h4 className="text-2xl font-bold text-gray-900">
                            {formatNumber(stat.value)}
                          </h4>
                          <p className="text-sm text-gray-500 font-medium">
                            {stat.label}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </ChartCard>
              </div>
            )}

            {activeSection === "analytics" && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ChartCard
                    title="Revenue Analytics"
                    subtitle="Monthly performance overview"
                    icon={TrendingUp}
                    actions={[
                      { icon: Download, onClick: () => {} },
                      { icon: RefreshCw, onClick: () => {} },
                    ]}
                  >
                    <div className="lg:col-span-2 h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={data?.monthlyRevenue || []}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#f0f0f0"
                          />
                          <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) =>
                              `₹${(value / 1000).toFixed(0)}k`
                            }
                          />
                          <Tooltip
                            formatter={(value) => [`₹${value}`, "Amount"]}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#4f46e5"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                            activeDot={{ r: 7 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="expenses"
                            stroke="#ef4444"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                            activeDot={{ r: 7 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </ChartCard>
                  <ChartCard
                    title="Inventory Overview"
                    subtitle="Stock distribution by category"
                    icon={Package}
                  >
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data?.stockDistribution || []}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) =>
                              `${name}: ${(percent * 100).toFixed(0)}%`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {data?.stockDistribution?.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => [
                              `${value} units`,
                              "Quantity",
                            ]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </ChartCard>
                </div>
              </div>
            )}

            {activeSection === "operations" && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ChartCard
                    title="Site Performance"
                    subtitle="Efficiency and utilization metrics"
                    icon={Activity}
                  >
                    <div className="lg:col-span-2 h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={data?.sitePerformance || []}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#f0f0f0"
                          />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis axisLine={false} tickLine={false} />
                          <Tooltip />
                          <Legend />
                          <Bar
                            dataKey="efficiency"
                            fill="#3b82f6"
                            name="Efficiency %"
                            barSize={24}
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="utilization"
                            fill="#10b981"
                            name="Utilization %"
                            barSize={24}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </ChartCard>
                  <ChartCard
                    title="Live Activity Feed"
                    subtitle="Real-time updates"
                    icon={Clock}
                    actions={[{ icon: Eye, onClick: handleViewAllActivity }]}
                  >
                    <div className="space-y-4 h-80 overflow-y-auto">
                      {data?.recentActivity?.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:shadow-md transition-all duration-200"
                        >
                          <div
                            className={`p-2 rounded-xl mr-3 flex-shrink-0 ${
                              activity.type === "employee"
                                ? "bg-blue-100"
                                : activity.type === "site"
                                ? "bg-green-100"
                                : "bg-amber-100"
                            }`}
                          >
                            {activity.type === "employee" && (
                              <Users size={16} className="text-blue-600" />
                            )}
                            {activity.type === "site" && (
                              <Building size={16} className="text-green-600" />
                            )}
                            {activity.type === "stock" && (
                              <Package size={16} className="text-amber-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-800 font-medium">
                              {activity.description}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 flex items-center">
                              <Clock size={10} className="mr-1" />
                              {formatDistanceToNow(
                                new Date(activity.timestamp),
                                { addSuffix: true }
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ChartCard>
                </div>
              </div>
            )}

            {activeSection === "transactions" && (
              <ChartCard
                title="Pending Transactions"
                subtitle="Client payments awaiting verification"
                icon={DollarSign}
                actions={[
                  { icon: Filter, onClick: () => {} },
                  { icon: Download, onClick: () => {} },
                ]}
              >
                <div className="space-y-4">
                  {data?.pendingTransactions?.map((transaction) => (
                    <div
                      key={transaction._id}
                      className="flex items-center justify-between p-6 rounded-2xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:shadow-lg transition-all duration-200"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-green-50 to-green-100">
                          <DollarSign size={20} className="text-green-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            {transaction.client.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {transaction.client.email}
                          </p>
                          <div className="flex items-center mt-2 space-x-4">
                            <span className="text-2xl font-bold text-green-600">
                              ₹{formatNumber(transaction.amount)}
                            </span>
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                              {new Date(
                                transaction.createdAt
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleVerifyTransaction(transaction._id)}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                      >
                        Verify Payment
                      </button>
                    </div>
                  ))}
                  {data?.pendingTransactions?.length === 0 && (
                    <div className="text-center py-12">
                      <div className="p-4 rounded-2xl bg-gray-100 inline-block mb-4">
                        <DollarSign size={32} className="text-gray-400" />
                      </div>
                      <p className="text-gray-500">No pending transactions</p>
                    </div>
                  )}
                </div>
              </ChartCard>
            )}

            {activeSection === "bulkImport" && (
              <ChartCard
                title="Bulk Import Site Data"
                subtitle="Enter past or forgotten data for a site"
                icon={Import}
              >
                <BulkImportForm
                  clients={clients}
                  vendors={vendors}
                  employees={employees}
                  stocks={stocks}
                  contractors={contractors}
                />
              </ChartCard>
            )}
          </>
        )}
      </div>

      {/* Activity Modal */}
      {showAllActivities && allActivityLogs && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl" />
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  Activity Timeline
                </h2>
                <button
                  onClick={() => setShowAllActivities(false)}
                  className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-96">
              <div className="space-y-4">
                {allActivityLogs.map((log) => (
                  <div
                    key={log._id}
                    className="flex items-start p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-white border border-gray-100"
                  >
                    <div className="p-2 rounded-xl mr-3 flex-shrink-0 bg-blue-100">
                      <Activity size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-800 font-medium">
                        {log.details ||
                          `${log.user.name} performed ${log.action} on ${log.resource}`}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center">
                        <Clock size={10} className="mr-1" />
                        {formatDistanceToNow(new Date(log.timestamp), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      {/* <div className="px-6 py-8 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500 flex items-center">
            <Shield size={14} className="mr-2" />© 2025 Your Company. All rights
            reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200">
              Generate Reports
            </button>
            <button className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl font-medium hover:shadow-lg transition-all duration-200">
              Export Data
            </button>
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default AdminDashboard;
