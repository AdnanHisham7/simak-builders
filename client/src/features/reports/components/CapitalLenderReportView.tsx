import React, { useState, useEffect, useRef } from "react";
import {
  Filter,
  RefreshCw,
  FileSpreadsheet,
  FileDown,
  Coins,
  DollarSign,
  TrendingUp,
  Calendar,
  HandCoins,
  CheckCircle2,
  AlertCircle,
  Search,
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  User,
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
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { usePreferences } from "@/hooks/usePreferences";
import { getLenders, settleLender, Lender } from "@/services/companyService";
import {
  getCapitalLendersReport,
  CapitalLendersReportData,
} from "@/services/reportService";
import { exportAnalyticsReportToPdf } from "./exportAnalyticsPdf";

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

export const CapitalLenderReportView: React.FC = () => {
  const { formatNumber, formatDate } = usePreferences();
  const currentYear = new Date().getFullYear().toString();

  const [lenders, setLenders] = useState<Lender[]>([]);
  const [lenderId, setLenderId] = useState("all");
  const [capitalType, setCapitalType] = useState("all");
  const [periodType, setPeriodType] = useState<"year" | "range" | "day">("year");
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [singleDate, setSingleDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CapitalLendersReportData | null>(null);
  const [activeTab, setActiveTab] = useState<"lenders" | "transactions">("lenders");
  const [searchTerm, setSearchTerm] = useState("");

  // Settle modal state
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [selectedLender, setSelectedLender] = useState<any>(null);
  const [settleAmount, setSettleAmount] = useState("");
  const [settleNotes, setSettleNotes] = useState("");
  const [settleDate, setSettleDate] = useState(new Date().toISOString().split("T")[0]);
  const [settling, setSettling] = useState(false);

  const loadLenders = async () => {
    try {
      const res = await getLenders();
      setLenders(res || []);
    } catch (err) {
      console.error("Error loading lenders:", err);
    }
  };

  useEffect(() => {
    loadLenders();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params: any = { lenderId, capitalType };
      if (periodType === "year") {
        params.year = year;
        if (month !== "all") params.month = month;
      } else if (periodType === "range") {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      } else if (periodType === "day") {
        if (singleDate) params.date = singleDate;
      }

      const res = await getCapitalLendersReport(params);
      setData(res);
    } catch (err: any) {
      console.error("Error loading capital report:", err);
      toast.error(err.response?.data?.message || "Failed to load capital report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [lenderId, capitalType, periodType, year, month, startDate, endDate, singleDate]);

  const handleOpenSettle = (lender: any) => {
    setSelectedLender(lender);
    setSettleAmount(lender.outstandingBalance?.toString() || "");
    setSettleNotes(`Debt settlement to ${lender.name}`);
    setSettleDate(new Date().toISOString().split("T")[0]);
    setSettleModalOpen(true);
  };

  const handleConfirmSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLender) return;
    const amt = parseFloat(settleAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid repayment amount");
      return;
    }
    if (amt > selectedLender.outstandingBalance) {
      toast.error("Amount exceeds outstanding balance");
      return;
    }

    setSettling(true);
    try {
      await settleLender(selectedLender.id || selectedLender._id, {
        amount: amt,
        notes: settleNotes,
        date: settleDate,
      });
      toast.success(`Successfully settled ₹${formatNumber(amt)} to ${selectedLender.name}`);
      setSettleModalOpen(false);
      fetchReport();
      loadLenders();
    } catch (err: any) {
      console.error("Settle error:", err);
      toast.error(err.response?.data?.message || "Failed to process settlement");
    } finally {
      setSettling(false);
    }
  };

  const handleExportExcel = () => {
    if (!data) return;

    try {
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Lender Summaries
      const lenderRows = data.lenderSummaries.map((l) => ({
        "Lender Name": l.name,
        Phone: l.phone || "-",
        Notes: l.notes || "-",
        "Total Borrowed (₹)": l.totalLended,
        "Total Settled (₹)": l.totalSettled,
        "Outstanding Debt (₹)": l.outstandingBalance,
      }));
      const wsLenders = XLSX.utils.json_to_sheet(lenderRows);
      XLSX.utils.book_append_sheet(workbook, wsLenders, "Lender Debt Status");

      // Sheet 2: Transactions
      const txRows = data.transactions.map((t) => ({
        Date: formatDate(t.date),
        Type: t.type.toUpperCase(),
        Category: t.category,
        "Amount (₹)": t.amount,
        Lender: t.lenderName || "-",
        Description: t.description || "-",
      }));
      const wsTx = XLSX.utils.json_to_sheet(txRows);
      XLSX.utils.book_append_sheet(workbook, wsTx, "Capital & Settlement Ledger");

      XLSX.writeFile(workbook, `Capital_Lenders_Report_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Capital & Lender report exported to Excel successfully");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export Excel spreadsheet");
    }
  };

  const filteredLenders = data?.lenderSummaries.filter((l) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      l.name.toLowerCase().includes(term) ||
      (l.phone && l.phone.toLowerCase().includes(term)) ||
      (l.notes && l.notes.toLowerCase().includes(term))
    );
  }) || [];

  const filteredTransactions = data?.transactions.filter((t) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (t.lenderName && t.lenderName.toLowerCase().includes(term)) ||
      t.type.toLowerCase().includes(term) ||
      t.category.toLowerCase().includes(term) ||
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
        fileName: `Capital_Lenders_Report_${new Date().toISOString().split("T")[0]}.pdf`,
        reportTitle: "Capital Infusion & Debt Ledger Report",
      });
      toast.success("Capital & lender report exported to PDF");
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
              Capital Infusion & Lender Debt Analytics
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
          {/* Lender Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Lender / Creditor
            </label>
            <select
              value={lenderId}
              onChange={(e) => setLenderId(e.target.value)}
              className="w-full text-sm rounded-lg border-gray-300 bg-white text-gray-900 shadow-sm focus:border-console-primary focus:ring-console-primary"
            >
              <option value="all">All Lenders</option>
              {lenders.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.name} {l.outstandingBalance > 0 ? `(₹${formatNumber(l.outstandingBalance)} due)` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Capital Type Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Source / Category
            </label>
            <select
              value={capitalType}
              onChange={(e) => setCapitalType(e.target.value)}
              className="w-full text-sm rounded-lg border-gray-300 bg-white text-gray-900 shadow-sm focus:border-console-primary focus:ring-console-primary"
            >
              <option value="all">All Capital & Debt</option>
              <option value="own">Own Capital Infusion</option>
              <option value="lended">Lended / Borrowed</option>
              <option value="settlement">Settlement Repayments</option>
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
          title="No Capital Records"
          description="Adjust the filters above to retrieve capital infusion and lender logs."
          icon={Coins}
        />
      ) : (
        <>
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Capital Infused"
              value={`₹${formatNumber(data.kpis.totalInfused || 0)}`}
              icon={Coins}
              tone="info"
              subtitle="All equity & loan infusions"
            />
            <StatCard
              title="Owner's Own Capital"
              value={`₹${formatNumber(data.kpis.totalOwnCapital || 0)}`}
              icon={TrendingUp}
              tone="success"
              subtitle="Personal equity injected"
            />
            <StatCard
              title="Lended / Borrowed Capital"
              value={`₹${formatNumber(data.kpis.totalLendedCapital || 0)}`}
              icon={HandCoins}
              tone="warning"
              subtitle={`From ${data.kpis.activeLenders} lenders`}
            />
            <StatCard
              title="Net Outstanding Debt"
              value={`₹${formatNumber(data.kpis.totalOutstandingDebt || 0)}`}
              icon={AlertCircle}
              tone={data.kpis.totalOutstandingDebt > 0 ? "danger" : "default"}
              subtitle={`Repaid: ₹${formatNumber(data.kpis.totalSettled || 0)}`}
            />
          </div>

          {/* Analytical Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Trend Chart */}
            <div className="lg:col-span-2 bg-white p-5 rounded-console border border-console-border shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-1">
                Capital Infusions vs Debt Settlements Trend
              </h4>
              <p className="text-xs text-gray-500 mb-4">
                Monthly own injections, borrowings, and repayments
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
                      <Bar dataKey="ownInfusion" name="Own Capital" fill="#10B981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="lendedInfusion" name="Lended Capital" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="settlement" name="Settlements / Repaid" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-gray-400">
                    No capital infusion records for this range
                  </div>
                )}
              </div>
            </div>

            {/* Capital Type Donut */}
            <div className="bg-white p-5 rounded-console border border-console-border shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-1">
                Capital Portfolio
              </h4>
              <p className="text-xs text-gray-500 mb-4">
                Breakdown of total capital & repayments
              </p>
              <div className="h-56 w-full flex items-center justify-center">
                {data.capitalDistribution.some((d) => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.capitalDistribution.filter((d) => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {data.capitalDistribution.map((entry, index) => (
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
                  <div className="text-sm text-gray-400">No capital distribution data</div>
                )}
              </div>
              <div className="mt-2 space-y-1.5 text-xs">
                {data.capitalDistribution.map((item, idx) => (
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
                  onClick={() => setActiveTab("lenders")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                    activeTab === "lenders"
                      ? "bg-console-primary text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Lender Ledgers ({data.lenderSummaries.length})
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
                  Capital & Settlement Log ({data.transactions.length})
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
            {activeTab === "lenders" ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Lender / Creditor</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Notes</th>
                      <th className="py-3 px-4 text-right">Total Borrowed</th>
                      <th className="py-3 px-4 text-right">Total Settled</th>
                      <th className="py-3 px-4 text-right">Outstanding Debt</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {filteredLenders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-gray-400">
                          No lenders registered
                        </td>
                      </tr>
                    ) : (
                      filteredLenders.map((l) => (
                        <tr key={l.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4 font-semibold text-gray-900">
                            {l.name}
                          </td>
                          <td className="py-3 px-4 text-gray-500">{l.phone || "-"}</td>
                          <td className="py-3 px-4 text-gray-500 max-w-xs truncate">{l.notes || "-"}</td>
                          <td className="py-3 px-4 text-right font-medium text-amber-600">
                            ₹{formatNumber(l.totalLended)}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-emerald-600">
                            ₹{formatNumber(l.totalSettled)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold">
                            <span
                              className={
                                l.outstandingBalance > 0
                                  ? "text-rose-600"
                                  : "text-emerald-600"
                              }
                            >
                              ₹{formatNumber(l.outstandingBalance)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {l.outstandingBalance > 0 ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenSettle(l)}
                                className="text-xs py-1 px-2.5 h-auto text-console-primary border-console-primary hover:bg-console-primary/10"
                              >
                                Settle Loan
                              </Button>
                            ) : (
                              <span className="text-[11px] text-emerald-600 font-medium flex items-center justify-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Settled
                              </span>
                            )}
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
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Lender / Source</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-400">
                          No transactions found
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4 whitespace-nowrap text-gray-500">
                            {formatDate(tx.date)}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                tx.type === "credit" || tx.type === "inflow"
                                  ? "success"
                                  : "warning"
                              }
                              className="uppercase text-[10px]"
                            >
                              {tx.type}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-900">
                            {tx.category}
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {tx.lenderName || "Owner"}
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-bold ${
                              tx.type === "credit" || tx.type === "inflow"
                                ? "text-emerald-600"
                                : "text-rose-600"
                            }`}
                          >
                            {tx.type === "credit" || tx.type === "inflow" ? "+" : "-"}₹
                            {formatNumber(tx.amount)}
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

          {/* Settle Loan Modal */}
          {settleModalOpen && selectedLender && (
            <Modal
              isOpen={settleModalOpen}
              onClose={() => setSettleModalOpen(false)}
              title={`Settle Debt to ${selectedLender.name}`}
            >
              <form onSubmit={handleConfirmSettle} className="space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1">
                  <div className="font-semibold text-amber-800">
                    Debt Settlement Details
                  </div>
                  <div className="flex justify-between text-amber-700">
                    <span>Total Borrowed:</span>
                    <span className="font-medium">₹{formatNumber(selectedLender.totalLended || 0)}</span>
                  </div>
                  <div className="flex justify-between text-amber-700">
                    <span>Current Outstanding:</span>
                    <span className="font-bold text-rose-600">
                      ₹{formatNumber(selectedLender.outstandingBalance || 0)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Repayment Amount (₹) *
                  </label>
                  <Input
                    type="number"
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(e.target.value)}
                    max={selectedLender.outstandingBalance}
                    min="1"
                    step="any"
                    required
                    placeholder="Enter amount to pay"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Payment Date
                  </label>
                  <Input
                    type="date"
                    value={settleDate}
                    onChange={(e) => setSettleDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Notes / Reference
                  </label>
                  <Input
                    type="text"
                    value={settleNotes}
                    onChange={(e) => setSettleNotes(e.target.value)}
                    placeholder="e.g., Bank transfer, Cheque #12345"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSettleModalOpen(false)}
                    disabled={settling}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={settling}>
                    {settling ? "Processing..." : "Confirm Settlement"}
                  </Button>
                </div>
              </form>
            </Modal>
          )}
        </>
      )}
    </div>
  );
};
export default CapitalLenderReportView;
