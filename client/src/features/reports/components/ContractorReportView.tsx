import React, { useState, useEffect, useRef } from "react";
import {
  Filter,
  RefreshCw,
  FileSpreadsheet,
  FileDown,
  Briefcase,
  DollarSign,
  TrendingUp,
  Calendar,
  Building,
  FileText,
  Search,
  CheckCircle2,
  Clock,
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
  getComprehensiveContractorsReport,
  ContractorReportData,
} from "@/services/reportService";
import { exportAnalyticsReportToPdf } from "./exportAnalyticsPdf";

interface ContractorReportViewProps {
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

export const ContractorReportView: React.FC<ContractorReportViewProps> = ({ sites }) => {
  const { formatNumber, formatDate } = usePreferences();
  const currentYear = new Date().getFullYear().toString();

  const [contractors, setContractors] = useState<Array<{ _id: string; name: string }>>([]);
  const [siteId, setSiteId] = useState("all");
  const [contractorId, setContractorId] = useState("all");
  const [type, setType] = useState("all");
  const [periodType, setPeriodType] = useState<"year" | "range" | "day">("year");
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [singleDate, setSingleDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ContractorReportData | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "transactions">("summary");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadContractors = async () => {
      try {
        const res = await privateClient.get("/contractors");
        setContractors(res.data || []);
      } catch (err) {
        console.error("Error loading contractors:", err);
      }
    };
    loadContractors();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params: any = { siteId, contractorId, type };
      if (periodType === "year") {
        params.year = year;
        if (month !== "all") params.month = month;
      } else if (periodType === "range") {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      } else if (periodType === "day") {
        if (singleDate) params.date = singleDate;
      }

      const res = await getComprehensiveContractorsReport(params);
      setData(res);
    } catch (err: any) {
      console.error("Error loading contractor report:", err);
      toast.error(err.response?.data?.message || "Failed to load contractor report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [siteId, contractorId, type, periodType, year, month, startDate, endDate, singleDate]);

  const handleExportExcel = () => {
    if (!data) return;

    try {
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Summaries
      const summaryRows = data.contractorSummaries.map((c) => ({
        "Contractor Name": c.name,
        Phone: c.phone || "-",
        Category: c.category || "-",
        "Assigned Site": c.siteName || "All Sites",
        "Contract Amount (₹)": c.contractAmount,
        "Advances Paid (₹)": c.advances,
        "Verified Expenses (₹)": c.expenses,
        "Additional Work (₹)": c.additional,
        "Total Net Paid (₹)": c.netPaid,
        "Pending Balance (₹)": c.balance,
      }));
      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(workbook, wsSummary, "Contractor Balances");

      // Sheet 2: Transactions
      const txRows = data.transactions.map((t) => ({
        Date: formatDate(t.date),
        Contractor: t.contractorName,
        Site: t.siteName,
        Type: t.type.toUpperCase(),
        "Amount (₹)": t.amount,
        Category: t.category || "-",
        Description: t.description || "-",
      }));
      const wsTx = XLSX.utils.json_to_sheet(txRows);
      XLSX.utils.book_append_sheet(workbook, wsTx, "Itemized Payouts");

      XLSX.writeFile(workbook, `Contractor_Report_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Contractor report exported to Excel successfully");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export Excel spreadsheet");
    }
  };

  const filteredSummaries = data?.contractorSummaries.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.phone.toLowerCase().includes(term) ||
      c.category.toLowerCase().includes(term) ||
      c.siteName.toLowerCase().includes(term)
    );
  }) || [];

  const filteredTransactions = data?.transactions.filter((t) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      t.contractorName.toLowerCase().includes(term) ||
      t.siteName.toLowerCase().includes(term) ||
      t.type.toLowerCase().includes(term) ||
      (t.description && t.description.toLowerCase().includes(term))
    );
  }) || [];

  const reportRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    if (!reportRef.current || !data) return;
    setIsExportingPdf(true);
    try {
      await exportAnalyticsReportToPdf({
        element: reportRef.current,
        fileName: `Contractor_Work_Report_${year}_${siteId}.pdf`,
        reportTitle: "Contractor Work & Payouts Report",
      });
      toast.success("Contractor work report exported to PDF");
    } catch (err) {
      console.error("Failed to export PDF:", err);
      toast.error("Failed to export PDF");
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div ref={reportRef} className="space-y-6">
      {/* Top Filter Bar */}
      <div
        data-report-filters="true"
        className="bg-white p-5 rounded-console border border-console-border shadow-sm"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-console-primary" />
            <h3 className="font-semibold text-gray-900">
              Contractor Work & Payout Analytics Filters
            </h3>
          </div>
          <div className="flex items-center gap-2" data-html2canvas-ignore="true">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchReport}
              icon={<RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />}
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={!data || loading}
              icon={<FileSpreadsheet className="w-4 h-4 text-success-700" />}
            >
              Export Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              disabled={!data || loading}
              loading={isExportingPdf}
              icon={<FileDown className="w-4 h-4 text-brand-600" />}
            >
              Export PDF
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {/* Site Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Construction Site
            </label>
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="w-full text-sm rounded-lg border-gray-300 bg-white text-gray-900 shadow-sm focus:border-console-primary focus:ring-console-primary"
            >
              <option value="all">All Sites</option>
              {sites.map((site) => (
                <option key={site._id} value={site._id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>

          {/* Contractor Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Contractor
            </label>
            <select
              value={contractorId}
              onChange={(e) => setContractorId(e.target.value)}
              className="w-full text-sm rounded-lg border-gray-300 bg-white text-gray-900 shadow-sm focus:border-console-primary focus:ring-console-primary"
            >
              <option value="all">All Contractors</option>
              {contractors.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Payment Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full text-sm rounded-lg border-gray-300 bg-white text-gray-900 shadow-sm focus:border-console-primary focus:ring-console-primary"
            >
              <option value="all">All Types</option>
              <option value="advance">Advance</option>
              <option value="expense">Verified Expense</option>
              <option value="additional">Additional Work</option>
            </select>
          </div>

          {/* Period Mode */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Time Horizon
            </label>
            <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setPeriodType("year")}
                className={`text-xs py-1.5 rounded-md font-medium transition ${
                  periodType === "year"
                    ? "bg-white text-console-primary shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Year
              </button>
              <button
                type="button"
                onClick={() => setPeriodType("range")}
                className={`text-xs py-1.5 rounded-md font-medium transition ${
                  periodType === "range"
                    ? "bg-white text-console-primary shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Range
              </button>
              <button
                type="button"
                onClick={() => setPeriodType("day")}
                className={`text-xs py-1.5 rounded-md font-medium transition ${
                  periodType === "day"
                    ? "bg-white text-console-primary shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Day
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Period Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-3 pt-3 border-t border-dashed border-gray-200">
          {periodType === "year" && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Fiscal Year
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  min="2020"
                  max="2035"
                  className="w-full text-sm rounded-lg border-gray-300 bg-white text-gray-900 shadow-sm focus:border-console-primary focus:ring-console-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Month Filter
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full text-sm rounded-lg border-gray-300 bg-white text-gray-900 shadow-sm focus:border-console-primary focus:ring-console-primary"
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
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-sm rounded-lg border-gray-300 bg-white text-gray-900 shadow-sm focus:border-console-primary focus:ring-console-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-sm rounded-lg border-gray-300 bg-white text-gray-900 shadow-sm focus:border-console-primary focus:ring-console-primary"
                />
              </div>
            </>
          )}

          {periodType === "day" && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Specific Date
              </label>
              <input
                type="date"
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
                className="w-full text-sm rounded-lg border-gray-300 bg-white text-gray-900 shadow-sm focus:border-console-primary focus:ring-console-primary"
              />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center">
          <PageLoader />
        </div>
      ) : !data ? (
        <EmptyState
          title="No Data Available"
          description="Adjust the filter criteria above to query contractor payouts."
          icon={Briefcase}
        />
      ) : (
        <>
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Contract Commitments"
              value={`₹${formatNumber(data.kpis.totalContractValue || 0)}`}
              icon={Briefcase}
              tone="info"
              subtitle={`${data.kpis.totalContractors} Active Contractors`}
            />
            <StatCard
              title="Total Advances Given"
              value={`₹${formatNumber(data.kpis.totalAdvances || 0)}`}
              icon={Clock}
              tone="warning"
              subtitle="Pre-settlement disbursements"
            />
            <StatCard
              title="Verified Contractor Work"
              value={`₹${formatNumber(data.kpis.totalExpenses || 0)}`}
              icon={CheckCircle2}
              tone="success"
              subtitle={`+ ₹${formatNumber(data.kpis.totalAdditional || 0)} additional`}
            />
            <StatCard
              title="Net Outstanding Balance"
              value={`₹${formatNumber(data.kpis.pendingBalance || 0)}`}
              icon={DollarSign}
              tone={data.kpis.pendingBalance > 0 ? "danger" : "default"}
              subtitle={`Total Paid: ₹${formatNumber(data.kpis.totalPaid || 0)}`}
            />
          </div>

          {/* Analytical Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Trend Chart */}
            <div className="lg:col-span-2 bg-white p-5 rounded-console border border-console-border shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-1">
                Contractor Payout Distribution Trend
              </h4>
              <p className="text-xs text-gray-500 mb-4">
                Advances vs Verified Completed Work vs Additional Claims
              </p>
              <div className="h-72 w-full">
                {data.monthlyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.monthlyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                      <RechartsTooltip
                        formatter={(val: any) => [`₹${formatNumber(Number(val))}`, ""]}
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="advance" name="Advances" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="Verified Work" fill="#10B981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="additional" name="Additional Work" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-gray-400">
                    No trend records for selected range
                  </div>
                )}
              </div>
            </div>

            {/* Payout Type Donut */}
            <div className="bg-white p-5 rounded-console border border-console-border shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-1">
                Payout Composition
              </h4>
              <p className="text-xs text-gray-500 mb-4">
                Proportion by payment category
              </p>
              <div className="h-56 w-full flex items-center justify-center">
                {data.typeDistribution.some((d) => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.typeDistribution.filter((d) => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {data.typeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(val: any) => [`₹${formatNumber(Number(val))}`, ""]}
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-sm text-gray-400">No payment data</div>
                )}
              </div>
              <div className="mt-2 space-y-1.5 text-xs">
                {data.typeDistribution.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-gray-600">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span className="font-medium text-gray-900">
                      ₹{formatNumber(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Table Section */}
          <div className="bg-white rounded-console border border-console-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("summary")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                    activeTab === "summary"
                      ? "bg-console-primary text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Contractor Balances ({data.contractorSummaries.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("transactions")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                    activeTab === "transactions"
                      ? "bg-console-primary text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Itemized Transactions ({data.transactions.length})
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search table..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:border-console-primary"
                />
              </div>
            </div>

            {/* Table Content */}
            {activeTab === "summary" ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Contractor</th>
                      <th className="py-3 px-4">Site / Category</th>
                      <th className="py-3 px-4 text-right">Contract Amount</th>
                      <th className="py-3 px-4 text-right">Advances</th>
                      <th className="py-3 px-4 text-right">Verified Work</th>
                      <th className="py-3 px-4 text-right">Additional</th>
                      <th className="py-3 px-4 text-right">Total Paid</th>
                      <th className="py-3 px-4 text-right">Balance Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {filteredSummaries.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-gray-400">
                          No contractors match your criteria
                        </td>
                      </tr>
                    ) : (
                      filteredSummaries.map((c) => (
                        <tr key={c.contractorId} className="hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-gray-900">{c.name}</div>
                            <div className="text-[11px] text-gray-400">{c.phone || "No phone"}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-gray-900 font-medium">{c.siteName}</div>
                            <Badge variant="secondary" className="text-[10px] mt-0.5">
                              {c.category || "General"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right font-medium">
                            ₹{formatNumber(c.contractAmount)}
                          </td>
                          <td className="py-3 px-4 text-right text-amber-600">
                            ₹{formatNumber(c.advances)}
                          </td>
                          <td className="py-3 px-4 text-right text-emerald-600">
                            ₹{formatNumber(c.expenses)}
                          </td>
                          <td className="py-3 px-4 text-right text-purple-600">
                            ₹{formatNumber(c.additional)}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-900">
                            ₹{formatNumber(c.netPaid)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold">
                            <span
                              className={
                                c.balance > 0
                                  ? "text-rose-600"
                                  : "text-emerald-600"
                              }
                            >
                              ₹{formatNumber(c.balance)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Contractor</th>
                      <th className="py-3 px-4">Site</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-gray-400">
                          No transactions found
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4 whitespace-nowrap text-gray-500">
                            {formatDate(tx.date)}
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-900">
                            {tx.contractorName}
                          </td>
                          <td className="py-3 px-4 text-gray-600">{tx.siteName}</td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                tx.type === "advance"
                                  ? "warning"
                                  : tx.type === "expense"
                                  ? "success"
                                  : "info"
                              }
                              className="uppercase text-[10px]"
                            >
                              {tx.type}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-gray-500">{tx.category || "-"}</td>
                          <td className="py-3 px-4 text-right font-bold text-gray-900">
                            ₹{formatNumber(tx.amount)}
                          </td>
                          <td className="py-3 px-4 text-gray-500 max-w-xs truncate">
                            {tx.description || "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
export default ContractorReportView;
