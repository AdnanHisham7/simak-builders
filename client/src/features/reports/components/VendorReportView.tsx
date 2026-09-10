import React, { useState, useEffect, useRef } from "react";
import {
  Filter,
  RefreshCw,
  FileSpreadsheet,
  FileDown,
  Truck,
  DollarSign,
  ShoppingCart,
  Calendar,
  Building,
  FileText,
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
  getComprehensiveVendorsReport,
  VendorProcurementReportData,
} from "@/services/reportService";
import { exportAnalyticsReportToPdf } from "./exportAnalyticsPdf";

interface VendorReportViewProps {
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

const VendorReportView: React.FC<VendorReportViewProps> = ({ sites }) => {
  const { formatNumber, formatDate } = usePreferences();
  const currentYear = new Date().getFullYear().toString();

  const [vendors, setVendors] = useState<Array<{ _id: string; name: string }>>([]);
  const [siteId, setSiteId] = useState("all");
  const [vendorId, setVendorId] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [periodType, setPeriodType] = useState<"year" | "range" | "day">("year");
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [singleDate, setSingleDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<VendorProcurementReportData | null>(null);

  useEffect(() => {
    const loadVendors = async () => {
      try {
        const res = await privateClient.get("/vendors");
        setVendors(res.data || []);
      } catch (err) {
        console.error("Error loading vendors list:", err);
      }
    };
    loadVendors();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params: any = { siteId, vendorId, paymentStatus };
      if (periodType === "year") {
        params.year = year;
        if (month !== "all") params.month = month;
      } else if (periodType === "range") {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      } else if (periodType === "day") {
        if (singleDate) params.date = singleDate;
      }

      const res = await getComprehensiveVendorsReport(params);
      setData(res);
    } catch (err) {
      console.error("Error fetching vendor report:", err);
      toast.error("Failed to load vendor procurement report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [siteId, vendorId, paymentStatus, periodType, year, month]);

  const exportExcel = () => {
    if (!data) return;
    try {
      const rows = data.purchases.map((p) => ({
        Date: p.date ? p.date.split("T")[0] : "",
        Vendor: p.vendorName,
        Site: p.siteName,
        "Items Count": p.itemsCount,
        "Total Amount": p.totalAmount,
        "Payment Method": p.paymentMethod,
        "Paid Status": p.isPaid ? "Paid" : "Credit",
        Notes: p.notes || "",
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Vendor Purchases");
      XLSX.writeFile(wb, `Vendor_Procurement_Report_${year}.xlsx`);
      toast.success("Exported vendor purchases to Excel");
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
        fileName: `Vendor_Procurement_Report_${year}_${siteId}.pdf`,
        reportTitle: "Vendor Procurement & Payables Report",
      });
      toast.success("Vendor procurement report exported to PDF");
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
            Vendor Procurement Filters
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
              Site / Destination
            </label>
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="w-full rounded-lg border border-console-border bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="all">All Sites & Warehouse</option>
              <option value="company">Company Warehouse</option>
              {sites.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Vendor Selector */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-console-muted">
              Vendor
            </label>
            <select
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="w-full rounded-lg border border-console-border bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="all">All Vendors</option>
              {vendors.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-console-muted">
              Payment Status
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full rounded-lg border border-console-border bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid (Cash)</option>
              <option value="credit">Credit / Unpaid</option>
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
            <div className="grid grid-cols-2 gap-2 sm:col-span-2">
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
            <div className="grid grid-cols-2 gap-2 sm:col-span-2">
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
            <div className="sm:col-span-2">
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
        <PageLoader label="Analyzing vendor procurement data" fullHeight={false} />
      ) : !data ? (
        <EmptyState
          icon={Truck}
          title="No procurement data"
          description="Adjust the filters to generate the vendor report."
        />
      ) : (
        <div className="space-y-6">
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Procurement Spend"
              value={`₹${formatNumber(kpis?.totalPurchasesAmount || 0)}`}
              change="Invoice Volume"
              trend="neutral"
            />
            <StatCard
              label="Total Amount Paid"
              value={`₹${formatNumber(kpis?.totalPaid || 0)}`}
              change="Disbursed to Vendors"
              trend="up"
            />
            <StatCard
              label="Outstanding Vendor Credit"
              value={`₹${formatNumber(kpis?.totalCredit || 0)}`}
              change="Payables to Vendors"
              trend={(kpis?.totalCredit || 0) > 0 ? "down" : "neutral"}
            />
            <StatCard
              label="Purchase Invoices"
              value={kpis?.totalInvoices || 0}
              change="Total Orders"
              trend="neutral"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Monthly Procurement Trend Bar Chart */}
            <div className="rounded-console border border-console-border bg-white p-5 lg:col-span-2">
              <div className="mb-4">
                <h4 className="font-semibold text-console-text">
                  Monthly Procurement Spend (Paid vs. Credit)
                </h4>
                <p className="text-xs text-console-muted">
                  Material purchasing volume across the year
                </p>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.monthlySpendTrend}
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
                      name="Paid Spend"
                      fill="#10B981"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="creditAmount"
                      name="Credit / Payables"
                      fill="#F59E0B"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Material Category Breakdown Pie Chart */}
            <div className="rounded-console border border-console-border bg-white p-5">
              <div className="mb-4">
                <h4 className="font-semibold text-console-text">
                  Spend by Material Category
                </h4>
                <p className="text-xs text-console-muted">
                  Procurement shares across construction disciplines
                </p>
              </div>
              <div className="h-64 w-full">
                {data.categoryBreakdown.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-xs text-console-muted">
                    No material category data
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {data.categoryBreakdown.map((entry, index) => (
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
                {data.categoryBreakdown.slice(0, 5).map((item, index) => (
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

          {/* Top Vendors Table */}
          <div className="overflow-hidden rounded-console border border-console-border bg-white">
            <div className="border-b border-console-border bg-slate-50 px-5 py-3.5">
              <h4 className="font-semibold text-console-text">
                Vendor Performance & Payables Summary
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-console-border bg-slate-50 text-xs font-semibold uppercase text-console-muted">
                  <tr>
                    <th className="px-4 py-3">Vendor Name</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3 text-right">Orders</th>
                    <th className="px-4 py-3 text-right">Total Invoiced</th>
                    <th className="px-4 py-3 text-right">Paid Amount</th>
                    <th className="px-4 py-3 text-right">Credit Balance</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.topVendors.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-xs text-console-muted">
                        No vendors found for this selection
                      </td>
                    </tr>
                  ) : (
                    data.topVendors.map((v) => {
                      const isClear = v.balance <= 0;
                      return (
                        <tr key={v.vendorId} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-semibold text-console-text">
                            {v.name}
                          </td>
                          <td className="px-4 py-3 text-xs text-console-muted">{v.phone || "—"}</td>
                          <td className="px-4 py-3 text-right text-console-text">
                            {v.invoiceCount}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-console-text">
                            ₹{formatNumber(v.totalAmount)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-success-700">
                            ₹{formatNumber(v.paidAmount)}
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-semibold ${
                              isClear ? "text-success-700" : "text-danger-600"
                            }`}
                          >
                            ₹{formatNumber(v.balance)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant={isClear ? "success" : "warning"}>
                              {isClear ? "Paid Up" : "Credit Pending"}
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

          {/* Itemized Purchases Records Table */}
          <div className="overflow-hidden rounded-console border border-console-border bg-white">
            <div className="border-b border-console-border bg-slate-50 px-5 py-3.5">
              <h4 className="font-semibold text-console-text">
                Itemized Purchase Orders ({data.purchases.length})
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-console-border bg-slate-50 text-xs font-semibold uppercase text-console-muted">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Vendor</th>
                    <th className="px-4 py-3">Destination Site</th>
                    <th className="px-4 py-3 text-right">Items</th>
                    <th className="px-4 py-3 text-right">Total Amount</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.purchases.slice(0, 50).map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-xs text-console-muted">
                        {formatDate(p.date)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-console-text">
                        {p.vendorName}
                      </td>
                      <td className="px-4 py-3 text-xs text-console-muted">{p.siteName}</td>
                      <td className="px-4 py-3 text-right text-xs">{p.itemsCount}</td>
                      <td className="px-4 py-3 text-right font-semibold text-console-text">
                        ₹{formatNumber(p.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-xs uppercase text-console-muted">
                        {p.paymentMethod}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={p.isPaid ? "success" : "warning"}>
                          {p.isPaid ? "Paid" : "Credit"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.billUrl ? (
                          <a
                            href={p.billUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                          >
                            <FileText size={13} /> View
                          </a>
                        ) : (
                          <span className="text-xs text-console-muted">—</span>
                        )}
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

export default VendorReportView;
