import React, { useState, useEffect, useRef } from "react";
import {
  Filter,
  RefreshCw,
  FileSpreadsheet,
  FileDown,
  Users,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
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
import Badge from "@/components/ui/Badge";
import { usePreferences } from "@/hooks/usePreferences";
import { privateClient } from "@/api";
import {
  getSalaryPayrollReport,
  SalaryPayrollReportData,
} from "@/services/reportService";
import { exportAnalyticsReportToPdf } from "./exportAnalyticsPdf";

interface SalaryReportViewProps {
  sites: Array<{ _id: string; name: string }>;
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4"];

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

const SalaryReportView: React.FC<SalaryReportViewProps> = ({ sites }) => {
  const { formatNumber } = usePreferences();
  const currentYear = new Date().getFullYear().toString();

  const [employees, setEmployees] = useState<Array<{ _id: string; name: string; position?: string }>>([]);
  const [siteId, setSiteId] = useState("all");
  const [employeeId, setEmployeeId] = useState("all");
  const [periodType, setPeriodType] = useState<"year" | "range" | "day">("year");
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [singleDate, setSingleDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SalaryPayrollReportData | null>(null);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const res = await privateClient.get("/employees");
        setEmployees(res.data || []);
      } catch (err) {
        console.error("Error loading employees list:", err);
      }
    };
    loadEmployees();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params: any = { siteId, employeeId };
      if (periodType === "year") {
        params.year = year;
        if (month !== "all") params.month = month;
      } else if (periodType === "range") {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      } else if (periodType === "day") {
        if (singleDate) params.date = singleDate;
      }

      const res = await getSalaryPayrollReport(params);
      setData(res);
    } catch (err) {
      console.error("Error fetching salary report:", err);
      toast.error("Failed to load salary payroll report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [siteId, employeeId, periodType, year, month]);

  const exportExcel = () => {
    if (!data) return;
    try {
      const rows = data.employeeRegister.map((e) => ({
        "Employee Name": e.name,
        Position: e.position,
        Phone: e.phone,
        "Total Days": e.totalDays,
        "Daily Wage": e.dailyWage,
        "Total Gross Earned": e.totalEarned,
        "Paid Amount": e.totalPaid,
        "Pending Balance": e.pendingAmount,
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Salary Payroll");
      XLSX.writeFile(wb, `Salary_Payroll_Report_${year}.xlsx`);
      toast.success("Exported payroll register to Excel");
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
        fileName: `Salary_Payroll_Report_${year}_${siteId}.pdf`,
        reportTitle: "Salary & Payroll Disbursement Report",
      });
      toast.success("Payroll report exported to PDF");
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
            Salary & Payroll Filters
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
              Project Site
            </label>
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="w-full rounded-lg border border-console-border bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="all">All Sites</option>
              {sites.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Employee Selector */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-console-muted">
              Employee / Worker
            </label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full rounded-lg border border-console-border bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="all">All Employees</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} {emp.position ? `(${emp.position})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Period Type */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-console-muted">
              Period Type
            </label>
            <select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value as any)}
              className="w-full rounded-lg border border-console-border bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="year">Year & Month</option>
              <option value="range">Custom Date Range</option>
              <option value="day">Single Specific Day</option>
            </select>
          </div>

          {periodType === "year" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-console-muted">
                  Year
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full rounded-lg border border-console-border bg-white px-2.5 py-2 text-sm focus:border-brand-500 focus:outline-none"
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
                  className="w-full rounded-lg border border-console-border bg-white px-2.5 py-2 text-sm focus:border-brand-500 focus:outline-none"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {periodType === "range" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-console-muted">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-console-border bg-white px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-console-muted">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-console-border bg-white px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {periodType === "day" && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-console-muted">
                Specific Day
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
        <PageLoader label="Calculating payroll figures" fullHeight={false} />
      ) : !data ? (
        <EmptyState
          icon={Users}
          title="No salary data"
          description="Adjust the filters to generate the payroll analytics."
        />
      ) : (
        <div className="space-y-6">
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label="Total Gross Earned"
              value={`₹${formatNumber(kpis?.totalGrossEarned || 0)}`}
              change="Wages Earned"
              trend="neutral"
            />
            <StatCard
              label="Total Disbursed"
              value={`₹${formatNumber(kpis?.totalDisbursed || 0)}`}
              change="Paid to Workers"
              trend="up"
            />
            <StatCard
              label="Pending Payouts"
              value={`₹${formatNumber(kpis?.totalPending || 0)}`}
              change="Wage Liabilities"
              trend={(kpis?.totalPending || 0) > 0 ? "down" : "neutral"}
            />
            <StatCard
              label="Total Man-Days"
              value={formatNumber(kpis?.totalManDays || 0)}
              change="Days of Work"
              trend="neutral"
            />
            <StatCard
              label="Active Employees"
              value={kpis?.activeEmployees || 0}
              change="Workers in Period"
              trend="neutral"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Monthly Trend Bar Chart */}
            <div className="rounded-console border border-console-border bg-white p-5 lg:col-span-2">
              <div className="mb-4">
                <h4 className="font-semibold text-console-text">
                  Monthly Wage Payout Trend
                </h4>
                <p className="text-xs text-console-muted">
                  Paid vs. pending wage disbursements over the year
                </p>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.monthlyTrend}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
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
                    <Bar
                      dataKey="paidAmount"
                      name="Paid Wages"
                      fill="#10B981"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="pendingAmount"
                      name="Pending Wages"
                      fill="#F59E0B"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Role Distribution Pie Chart */}
            <div className="rounded-console border border-console-border bg-white p-5">
              <div className="mb-4">
                <h4 className="font-semibold text-console-text">
                  Wages by Job Role
                </h4>
                <p className="text-xs text-console-muted">
                  Distribution across trade specializations
                </p>
              </div>
              <div className="h-64 w-full">
                {data.roleDistribution.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-xs text-console-muted">
                    No role data in period
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.roleDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {data.roleDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(val: any) => [`₹${formatNumber(Number(val))}`, ""]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="mt-2 space-y-1 text-xs">
                {data.roleDistribution.slice(0, 5).map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
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

          {/* Employee Register Table */}
          <div className="overflow-hidden rounded-console border border-console-border bg-white">
            <div className="border-b border-console-border bg-slate-50 px-5 py-3.5">
              <h4 className="font-semibold text-console-text">
                Employee Payroll & Attendance Register
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-console-border bg-slate-50 text-xs font-semibold uppercase text-console-muted">
                  <tr>
                    <th className="px-4 py-3">Employee Name</th>
                    <th className="px-4 py-3">Role / Position</th>
                    <th className="px-4 py-3 text-right">Days Worked</th>
                    <th className="px-4 py-3 text-right">Daily Wage</th>
                    <th className="px-4 py-3 text-right">Gross Earned</th>
                    <th className="px-4 py-3 text-right">Paid Amount</th>
                    <th className="px-4 py-3 text-right">Pending Balance</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.employeeRegister.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 text-center text-xs text-console-muted">
                        No employees recorded for this selection
                      </td>
                    </tr>
                  ) : (
                    data.employeeRegister.map((emp) => {
                      const isClear = emp.pendingAmount <= 0;
                      return (
                        <tr key={emp.employeeId} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-semibold text-console-text">
                            {emp.name}
                            {emp.phone && (
                              <span className="block text-xs font-normal text-console-muted">
                                {emp.phone}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-console-muted">{emp.position}</td>
                          <td className="px-4 py-3 text-right font-medium text-console-text">
                            {emp.totalDays} days
                          </td>
                          <td className="px-4 py-3 text-right text-console-muted">
                            ₹{formatNumber(emp.dailyWage)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-console-text">
                            ₹{formatNumber(emp.totalEarned)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-success-700">
                            ₹{formatNumber(emp.totalPaid)}
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-semibold ${
                              isClear ? "text-success-700" : "text-danger-600"
                            }`}
                          >
                            ₹{formatNumber(emp.pendingAmount)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant={isClear ? "success" : "warning"}>
                              {isClear ? "Settled" : "Pending"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryReportView;
