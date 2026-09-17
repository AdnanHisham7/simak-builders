import React, { useEffect, useState } from "react";
import {
  SiteBudgetAnalysis,
  getSiteBudgetAnalysis,
} from "@/services/siteService";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  LineChart as LineChartIcon,
  RefreshCw,
  Info,
  ArrowUpRight,
  Package,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface SiteBudgetDashboardProps {
  siteId: string;
  siteBudget?: number;
}

const formatCurrency = (val: number | undefined): string => {
  if (val === undefined || isNaN(val)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
};

export const SiteBudgetDashboard: React.FC<SiteBudgetDashboardProps> = ({
  siteId,
  siteBudget: propBudget,
}) => {
  const [data, setData] = useState<SiteBudgetAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [chartView, setChartView] = useState<"burn_rate" | "monthly_bars" | "category_pie">("burn_rate");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getSiteBudgetAnalysis(siteId);
      setData(res);
    } catch (err: any) {
      console.error("Error loading budget analysis:", err);
      setError(err?.response?.data?.message || "Failed to load budget analysis data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (siteId) {
      fetchData();
    }
  }, [siteId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white/60 p-12 backdrop-blur-sm">
        <RefreshCw className="h-8 w-8 animate-spin text-brand-600" />
        <p className="mt-3 text-sm font-medium text-slate-600">
          Analyzing site budget, burn rate, and transactions...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-red-500" />
        <h4 className="mt-2 text-sm font-semibold text-slate-800">Budget Analysis Unavailable</h4>
        <p className="mt-1 text-xs text-slate-600">{error || "Could not retrieve spend analytics"}</p>
        <button
          onClick={fetchData}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
    );
  }

  const effectiveBudget = data.totalBudget || propBudget || 0;
  const isOverBudget = data.healthStatus === "exceeded";
  const isWarning = data.healthStatus === "warning";

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Budget Card */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Planned Budget
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900">
              {formatCurrency(effectiveBudget)}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Allocated for entire project lifecycle
            </p>
          </div>
          <div className="absolute -right-3 -bottom-3 h-16 w-16 rounded-full bg-blue-500/5 pointer-events-none" />
        </div>

        {/* Total Actual Spend */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Actual Spend
            </span>
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                isOverBudget
                  ? "bg-rose-50 text-rose-600"
                  : isWarning
                  ? "bg-amber-50 text-amber-600"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900">
              {formatCurrency(data.totalSpent)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600">
                {data.budgetUtilization}% utilized
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  isOverBudget
                    ? "bg-rose-100 text-rose-700"
                    : isWarning
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {isOverBudget ? "Over Budget" : isWarning ? "Budget Alert" : "On Track"}
              </span>
            </div>
            {/* Progress bar */}
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full transition-all duration-500 ${
                  isOverBudget
                    ? "bg-rose-500"
                    : isWarning
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(100, data.budgetUtilization)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Remaining / Variance */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {data.remainingBudget >= 0 ? "Remaining Budget" : "Budget Overrun"}
            </span>
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                data.remainingBudget >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              }`}
            >
              {data.remainingBudget >= 0 ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-2xl font-bold tracking-tight ${
                data.remainingBudget >= 0 ? "text-emerald-700" : "text-rose-600"
              }`}
            >
              {formatCurrency(Math.abs(data.remainingBudget))}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {data.remainingBudget >= 0
                ? `${((data.remainingBudget / (effectiveBudget || 1)) * 100).toFixed(1)}% of total capital available`
                : "Deficit beyond initial allocation"}
            </p>
          </div>
        </div>

        {/* Burn Rate & Runway */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Avg. Monthly Burn Rate
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900">
              {formatCurrency(data.averageMonthlyBurnRate)}
              <span className="text-xs font-normal text-slate-500"> /mo</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {data.estimatedMonthsRemaining > 0
                ? `Est. runway: ~${data.estimatedMonthsRemaining} months at this pace`
                : data.remainingBudget <= 0
                ? "Budget fully consumed"
                : "Runway calculation active"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Spend Velocity & Burn-Rate Analytics
            </h3>
            <p className="text-xs text-slate-500">
              Comparing planned expenditure pace against actual aggregated transactions
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl bg-slate-100/80 p-1">
            <button
              type="button"
              onClick={() => setChartView("burn_rate")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                chartView === "burn_rate"
                  ? "bg-white text-brand-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LineChartIcon className="h-3.5 w-3.5" />
              Burn-Rate Curve
            </button>
            <button
              type="button"
              onClick={() => setChartView("monthly_bars")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                chartView === "monthly_bars"
                  ? "bg-white text-brand-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Monthly Streams
            </button>
            <button
              type="button"
              onClick={() => setChartView("category_pie")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                chartView === "category_pie"
                  ? "bg-white text-brand-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <PieChartIcon className="h-3.5 w-3.5" />
              Cost Distribution
            </button>
          </div>
        </div>

        {/* Chart View Content */}
        <div className="pt-6">
          {chartView === "burn_rate" && (
            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                    <span className="font-medium text-slate-700">Actual Cumulative Spend</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span className="font-medium text-slate-700">Planned Budget Pace</span>
                  </div>
                </div>
                <span className="rounded-md bg-slate-50 px-2 py-1 text-[11px] font-mono text-slate-600 border border-slate-100">
                  {data.activeMonths} Recorded Months
                </span>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.monthlyTrends} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                    <YAxis
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      tickFormatter={(v) => `₹${v >= 100000 ? (v / 100000).toFixed(1) + "L" : (v / 1000).toFixed(0) + "k"}`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload || !payload.length) return null;
                        const cum = payload.find((p) => p.dataKey === "cumulativeSpend")?.value;
                        const plan = payload.find((p) => p.dataKey === "plannedSpend")?.value;
                        return (
                          <div className="rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm">
                            <p className="text-xs font-semibold text-slate-800">{label}</p>
                            <div className="mt-2 space-y-1 text-xs">
                              <p className="flex justify-between gap-4 text-blue-600">
                                <span>Actual Spend:</span>
                                <span className="font-semibold font-mono">{formatCurrency(Number(cum))}</span>
                              </p>
                              <p className="flex justify-between gap-4 text-amber-600">
                                <span>Planned Pace:</span>
                                <span className="font-semibold font-mono">{formatCurrency(Number(plan))}</span>
                              </p>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="cumulativeSpend"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorCumulative)"
                      name="Actual Cumulative Spend"
                    />
                    <Line
                      type="monotone"
                      dataKey="plannedSpend"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 3, fill: "#f59e0b" }}
                      name="Planned Budget Pace"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {chartView === "monthly_bars" && (
            <div>
              <div className="mb-4 text-xs text-slate-500">
                Monthly breakdown showing spending across Material Purchases, Contractors, Miscellaneous, and Attendance.
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthlyTrends} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                    <YAxis
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      tickFormatter={(v) => `₹${v >= 100000 ? (v / 100000).toFixed(1) + "L" : (v / 1000).toFixed(0) + "k"}`}
                    />
                    <Tooltip
                      formatter={(val: any, name: any) => [formatCurrency(Number(val)), name]}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderRadius: "12px",
                        borderColor: "#e2e8f0",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                    <Bar dataKey="purchases" name="Purchases & Materials" fill="#3b82f6" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="contractor" name="Contractor Payments" fill="#8b5cf6" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="miscellaneous" name="Misc & Rentals" fill="#f59e0b" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="attendance" name="Labor / Attendance" fill="#ec4899" stackId="a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {chartView === "category_pie" && (
            <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-2">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categoryBreakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={105}
                      paddingAngle={3}
                    >
                      {data.categoryBreakdown.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val)), "Spent"]}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderRadius: "12px",
                        borderColor: "#e2e8f0",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend & Breakdown List */}
              <div className="space-y-2.5">
                {data.categoryBreakdown.map((cat, idx) => {
                  const pct = data.totalSpent > 0 ? ((cat.value / data.totalSpent) * 100).toFixed(1) : "0";
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl bg-slate-50/80 p-2.5 border border-slate-100 transition-colors hover:bg-slate-100"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-xs font-medium text-slate-700">{cat.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold font-mono text-slate-900">
                          {formatCurrency(cat.value)}
                        </span>
                        <span className="ml-2 text-[10px] text-slate-500 font-mono">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stream Summary & Top Cost Drivers */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Stream Breakdown Highlights */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-1">
          <h4 className="text-sm font-semibold text-slate-900">Expense Stream Distribution</h4>
          <p className="text-xs text-slate-500">Aggregated source totals for this site</p>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-blue-50/50 p-3 border border-blue-100/60">
              <div>
                <p className="text-xs font-medium text-blue-900">Purchases & Materials</p>
                <p className="text-[11px] text-blue-600">
                  Paid: {formatCurrency(data.breakdown.purchasesPaid)} | Pending: {formatCurrency(data.breakdown.purchasesPending)}
                </p>
              </div>
              <span className="text-sm font-bold text-blue-900 font-mono">
                {formatCurrency(data.breakdown.purchases)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-purple-50/50 p-3 border border-purple-100/60">
              <div>
                <p className="text-xs font-medium text-purple-900">Contractor Payments</p>
                <p className="text-[11px] text-purple-600">Advances and work settlements</p>
              </div>
              <span className="text-sm font-bold text-purple-900 font-mono">
                {formatCurrency(data.breakdown.contractor)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-amber-50/50 p-3 border border-amber-100/60">
              <div>
                <p className="text-xs font-medium text-amber-900">Miscellaneous & Rentals</p>
                <p className="text-[11px] text-amber-600">Machinery, tools, and direct services</p>
              </div>
              <span className="text-sm font-bold text-amber-900 font-mono">
                {formatCurrency(data.breakdown.miscellaneous)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-pink-50/50 p-3 border border-pink-100/60">
              <div>
                <p className="text-xs font-medium text-pink-900">Labor & Attendance</p>
                <p className="text-[11px] text-pink-600">Worker wages & supervision logs</p>
              </div>
              <span className="text-sm font-bold text-pink-900 font-mono">
                {formatCurrency(data.breakdown.attendance)}
              </span>
            </div>
          </div>
        </div>

        {/* Top Cost Drivers */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Top Cost Drivers</h4>
              <p className="text-xs text-slate-500">Highest-impact purchase line items on this site</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
              <Package className="h-3 w-3" />
              {data.topCostDrivers.length} Items Analyzed
            </span>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
            {data.topCostDrivers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No purchase line item details recorded yet for this site.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 font-medium text-slate-600">
                  <tr>
                    <th className="p-3">Item Name</th>
                    <th className="p-3 text-right">Quantity</th>
                    <th className="p-3 text-right">Total Amount</th>
                    <th className="p-3 text-right">% of Purchases</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {data.topCostDrivers.map((item, idx) => {
                    const itemShare =
                      data.breakdown.purchases > 0
                        ? ((item.totalAmount / data.breakdown.purchases) * 100).toFixed(1)
                        : "0";
                    return (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3 font-medium text-slate-900 flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                            {idx + 1}
                          </span>
                          {item.name}
                        </td>
                        <td className="p-3 text-right font-mono">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="p-3 text-right font-semibold font-mono text-slate-900">
                          {formatCurrency(item.totalAmount)}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-500">
                          {itemShare}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteBudgetDashboard;
