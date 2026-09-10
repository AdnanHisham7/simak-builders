import React, { useState, useEffect, useRef } from "react";
import {
  Filter,
  RefreshCw,
  FileSpreadsheet,
  FileDown,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Building,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import PageLoader from "@/components/ui/PageLoader";
import EmptyState from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/Card";
import { usePreferences } from "@/hooks/usePreferences";
import {
  getAnnualFinancialReport,
  AnnualFinancialReportData,
} from "@/services/reportService";
import { exportAnalyticsReportToPdf } from "./exportAnalyticsPdf";

interface AnnualReportViewProps {
  sites: Array<{ _id: string; name: string }>;
}

const MONTHS = [
  { value: "all", label: "Full Year (All Months)" },
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const AnnualReportView: React.FC<AnnualReportViewProps> = ({ sites }) => {
  const { formatNumber } = usePreferences();
  const currentYear = new Date().getFullYear().toString();

  const [siteId, setSiteId] = useState("all");
  const [periodType, setPeriodType] = useState<"year" | "range" | "day">("year");
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [singleDate, setSingleDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnnualFinancialReportData | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params: any = { siteId };
      if (periodType === "year") {
        params.year = year;
        if (month !== "all") params.month = month;
      } else if (periodType === "range") {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      } else if (periodType === "day") {
        if (singleDate) params.date = singleDate;
      }

      const res = await getAnnualFinancialReport(params);
      setData(res);
    } catch (err) {
      console.error("Error fetching annual financial report:", err);
      toast.error("Failed to load financial report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [siteId, periodType, year, month]);

  const exportExcel = () => {
    if (!data) return;
    try {
      const rows = data.monthlyTrends.map((t) => ({
        Month: t.month,
        Revenue: t.revenue,
        "Material Purchases": t.materials,
        "Contractor Payouts": t.contractors,
        "Labor Wages": t.labor,
        "Site Misc": t.misc,
        "Total Expenses": t.expense,
        "Net Profit": t.profit,
        "Margin %": `${t.margin}%`,
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Financial Overview");
      XLSX.writeFile(wb, `Financial_Report_${year}_${siteId}.xlsx`);
      toast.success("Exported report to Excel");
    } catch (err) {
      toast.error("Failed to export Excel");
    }
  };

  const kpis = data?.kpis;
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    if (!reportRef.current || !data) return;
    setIsExportingPdf(true);
    try {
      await exportAnalyticsReportToPdf({
        element: reportRef.current,
        fileName: `Annual_Financial_Report_${year}_${siteId}.pdf`,
        reportTitle: "Annual Financial & Performance Report",
      });
      toast.success("Financial report exported to PDF");
    } catch (err) {
      console.error("Failed to export PDF:", err);
      toast.error("Failed to export PDF");
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div ref={reportRef} className="space-y-6">
      {/* Filter Bar */}
      <div
        data-report-filters="true"
        className="rounded-console border border-console-border bg-console-bg p-4 sm:p-5"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-console-text">
            <Filter size={16} className="text-brand-600" />
            Financial Report Filters
          </h3>
          <div className="flex items-center gap-2" data-html2canvas-ignore="true">
            <Button variant="secondary" size="sm" onClick={fetchReport} loading={loading}>
              <RefreshCw size={14} /> Refresh
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={exportExcel}
              disabled={!data || loading}
            >
              <FileSpreadsheet size={14} className="text-success-700" /> Export Excel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportPdf}
              disabled={!data || loading}
              loading={isExportingPdf}
            >
              <FileDown size={14} className="text-brand-600" /> Export PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Site Selector */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-console-muted">
              Site Scope
            </label>
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="w-full rounded-lg border border-console-border bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="all">All Sites (Company-wide)</option>
              {sites.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Period Type */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-console-muted">
              Filter By
            </label>
            <select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value as any)}
              className="w-full rounded-lg border border-console-border bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="year">Year & Month</option>
              <option value="range">Custom Date Period</option>
              <option value="day">Single Specific Day</option>
            </select>
          </div>

          {periodType === "year" && (
            <>
              <div>
                <label className="mb-1 block text-xs font-semibold text-console-muted">
                  Year
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full rounded-lg border border-console-border bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                >
                  <option value="2027">2027</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-console-muted">
                  Month
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full rounded-lg border border-console-border bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {periodType === "range" && (
            <>
              <div>
                <label className="mb-1 block text-xs font-semibold text-console-muted">
                  From Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-console-border bg-white px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-console-muted">
                  To Date
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-console-border bg-white px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
                  />
                  <Button size="sm" onClick={fetchReport} loading={loading}>
                    Apply
                  </Button>
                </div>
              </div>
            </>
          )}

          {periodType === "day" && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-console-muted">
                Select Day
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={singleDate}
                  onChange={(e) => setSingleDate(e.target.value)}
                  className="w-full rounded-lg border border-console-border bg-white px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
                />
                <Button size="sm" onClick={fetchReport} loading={loading}>
                  Apply
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <PageLoader label="Crunching annual analytics" fullHeight={false} />
      ) : !data ? (
        <EmptyState
          icon={BarChart3}
          title="No Report Data"
          description="Adjust the filters and generate the financial report."
        />
      ) : (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Revenue (Client Payments)"
              value={`₹${formatNumber(kpis?.totalRevenue || 0)}`}
              change="Total Inflow"
              trend="up"
            />
            <StatCard
              label="Total Expenses"
              value={`₹${formatNumber(kpis?.totalExpenses || 0)}`}
              change="Materials, Labor, Contractors"
              trend="down"
            />
            <StatCard
              label="Net Operating Profit"
              value={`₹${formatNumber(kpis?.netProfit || 0)}`}
              change={`${kpis?.margin || 0}% Profit Margin`}
              trend={(kpis?.netProfit || 0) >= 0 ? "up" : "down"}
            />
            <StatCard
              label="Material Purchases Spend"
              value={`₹${formatNumber(kpis?.materialSpend || 0)}`}
              change="Procurement Total"
              trend="neutral"
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Revenue vs Expense Trend Area Chart */}
            <div className="rounded-console border border-console-border bg-white p-5 lg:col-span-2">
              <div className="mb-4">
                <h4 className="font-semibold text-console-text">
                  Monthly Revenue vs. Expenditure Trend
                </h4>
                <p className="text-xs text-console-muted">
                  Visual cashflow comparison across the financial year
                </p>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.monthlyTrends}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={12}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <RechartsTooltip
                      formatter={(val: any) => [`₹${formatNumber(Number(val))}`, ""]}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#10B981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRev)"
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      name="Expense"
                      stroke="#EF4444"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorExp)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Expense Categories Breakdown Pie Chart */}
            <div className="rounded-console border border-console-border bg-white p-5">
              <div className="mb-4">
                <h4 className="font-semibold text-console-text">
                  Expense Category Distribution
                </h4>
                <p className="text-xs text-console-muted">
                  Spend breakdown by operational domain
                </p>
              </div>
              <div className="h-64 w-full">
                {data.categoryBreakdown.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-xs text-console-muted">
                    No expense data for chart
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {data.categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(val: any) => [`₹${formatNumber(Number(val))}`, ""]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="mt-2 space-y-1.5 text-xs">
                {data.categoryBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-console-text">{item.name}</span>
                    </span>
                    <span className="font-semibold text-console-text">
                      ₹{formatNumber(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Site Financial Comparison (if All Sites selected) */}
          {siteId === "all" && data.siteComparison.length > 0 && (
            <div className="rounded-console border border-console-border bg-white p-5">
              <div className="mb-4">
                <h4 className="font-semibold text-console-text">
                  Site Profitability & Cost Comparison
                </h4>
                <p className="text-xs text-console-muted">
                  Revenue vs. Expenses across active project sites
                </p>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.siteComparison}
                    margin={{ top: 10, right: 10, left: 0, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="siteName"
                      stroke="#94a3b8"
                      fontSize={11}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={12}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <RechartsTooltip
                      formatter={(val: any) => [`₹${formatNumber(Number(val))}`, ""]}
                    />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expense" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Monthly Breakdown Ledger Table */}
          <div className="overflow-hidden rounded-console border border-console-border bg-white">
            <div className="border-b border-console-border bg-slate-50 px-5 py-3.5">
              <h4 className="font-semibold text-console-text">
                Detailed Monthly Financial Statement
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-console-border bg-slate-50 text-xs font-semibold uppercase text-console-muted">
                  <tr>
                    <th className="px-4 py-3">Month</th>
                    <th className="px-4 py-3 text-right">Revenue</th>
                    <th className="px-4 py-3 text-right">Materials</th>
                    <th className="px-4 py-3 text-right">Contractors</th>
                    <th className="px-4 py-3 text-right">Labor</th>
                    <th className="px-4 py-3 text-right">Misc</th>
                    <th className="px-4 py-3 text-right">Total Expenses</th>
                    <th className="px-4 py-3 text-right">Net Profit</th>
                    <th className="px-4 py-3 text-right">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.monthlyTrends.map((row) => (
                    <tr key={row.month} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-console-text">{row.month}</td>
                      <td className="px-4 py-3 text-right font-medium text-success-700">
                        ₹{formatNumber(row.revenue)}
                      </td>
                      <td className="px-4 py-3 text-right text-console-muted">
                        ₹{formatNumber(row.materials)}
                      </td>
                      <td className="px-4 py-3 text-right text-console-muted">
                        ₹{formatNumber(row.contractors)}
                      </td>
                      <td className="px-4 py-3 text-right text-console-muted">
                        ₹{formatNumber(row.labor)}
                      </td>
                      <td className="px-4 py-3 text-right text-console-muted">
                        ₹{formatNumber(row.misc)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-danger-700">
                        ₹{formatNumber(row.expense)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-semibold ${
                          row.profit >= 0 ? "text-success-700" : "text-danger-700"
                        }`}
                      >
                        ₹{formatNumber(row.profit)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-console-text">
                        {row.margin}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnualReportView;
