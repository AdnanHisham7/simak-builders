import { useState, useEffect } from "react";
import {
  Filter,
  FileText,
  Calendar,
  Search,
  RefreshCw,
  FileDown,
  Receipt,
  Wallet,
  RotateCcw,
  BarChart3,
  Users,
  Truck,
  Briefcase,
  Coins,
} from "lucide-react";
import { privateClient } from "@/api";
import headerImg from "@/assets/header.png";
import footerImg from "@/assets/footer.png";
import ReportRowEditor from "./components/ReportRowEditor";
import EditableAmountField from "./components/EditableAmountField";
import {
  loadImage,
  generateProfessionalReportPdf,
} from "./components/reportPdf";
import {
  buildEditableRows,
  computeTotals,
  computeBalance,
  displayAmount,
} from "./components/editableReport";
import "@/assets/Roboto-Regular";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import PageLoader from "@/components/ui/PageLoader";
import EmptyState from "@/components/ui/EmptyState";
import Tooltip from "@/components/ui/Tooltip";
import Badge from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { usePreferences } from "@/hooks/usePreferences";
import AnnualReportView from "./components/AnnualReportView";
import SalaryReportView from "./components/SalaryReportView";
import VendorReportView from "./components/VendorReportView";
import ContractorReportView from "./components/ContractorReportView";
import CapitalLenderReportView from "./components/CapitalLenderReportView";

interface ReportSite {
  _id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  client?: { name: string };
  supervisionPercentage?: number;
}

const reportTypes = [
  {
    id: "annualReport",
    title: "Annual & Financials",
    description:
      "Executive overview, site vs company expenses, revenues & cash flow",
    icon: BarChart3,
    category: "Analytics",
  },
  {
    id: "salaryReport",
    title: "Salary & Payroll",
    description:
      "Employee wages, site & company payroll, role distribution & registers",
    icon: Users,
    category: "Analytics",
  },
  {
    id: "vendorReport",
    title: "Vendor Procurement",
    description:
      "Material purchases, vendor invoices, payment status & spend ranking",
    icon: Truck,
    category: "Analytics",
  },
  {
    id: "contractorReport",
    title: "Contractor Work & Payouts",
    description:
      "Committed contracts, advances, verified expenses & pending balances",
    icon: Briefcase,
    category: "Analytics",
  },
  {
    id: "capitalReport",
    title: "Capital & Debt Ledger",
    description:
      "Owner equity infusion, lended borrowings, settlements & debt balance",
    icon: Coins,
    category: "Analytics",
  },
  {
    id: "expenseReport",
    title: "Site Expense Statement",
    description:
      "Itemized site expenses with supervision calculation & PDF print",
    icon: Receipt,
    category: "Statements",
  },
  {
    id: "clientReport",
    title: "Client Statement",
    description:
      "Client statement with supervision, amount received, balance & PDF print",
    icon: Wallet,
    category: "Statements",
  },
] as const;

type ReportId = (typeof reportTypes)[number]["id"];

const Reports = () => {
  const [selectedReport, setSelectedReport] =
    useState<ReportId>("clientReport");
  const [sites, setSites] = useState<ReportSite[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);

  const fetchSites = async () => {
    setLoadingSites(true);
    try {
      const res = await privateClient.get("/sites");
      setSites(res.data);
    } catch (err) {
      console.error("Error fetching sites:", err);
    } finally {
      setLoadingSites(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-console-text">
            Reports & Analytics
          </h1>
          <p className="mt-0.5 text-sm text-console-muted">
            Generate executive business analytics, contractor/vendor ledgers,
            and site client statements
          </p>
        </div>
        <Button variant="secondary" onClick={fetchSites} loading={loadingSites}>
          <RefreshCw size={16} /> Refresh sites
        </Button>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          const isSelected = selectedReport === report.id;
          return (
            <button
              type="button"
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={cn(
                "group relative flex flex-col justify-between rounded-console border p-4 text-left transition-all duration-200",
                isSelected
                  ? "border-brand-500 bg-brand-50/40 shadow-console-lg ring-2 ring-brand-500/20"
                  : "border-console-border bg-white hover:border-brand-200 hover:bg-slate-50/70 hover:shadow-console",
              )}
            >
              <div>
                <div className="mb-2.5 flex items-center justify-between">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                      isSelected
                        ? "bg-brand-600 text-white shadow-sm"
                        : "bg-brand-50 text-brand-700 group-hover:bg-brand-100/70",
                    )}
                  >
                    <Icon size={18} />
                  </div>
                  <Badge
                    variant={
                      report.category === "Analytics" ? "info" : "secondary"
                    }
                    className="text-[10px] py-0.5 px-2 font-medium"
                  >
                    {report.category}
                  </Badge>
                </div>
                <h3
                  className={cn(
                    "text-sm font-semibold transition-colors",
                    isSelected
                      ? "text-brand-950"
                      : "text-console-text group-hover:text-brand-800",
                  )}
                >
                  {report.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-console-muted line-clamp-2">
                  {report.description}
                </p>
              </div>
              {isSelected && (
                <div className="mt-3 pt-2 border-t border-brand-200/60 flex items-center gap-1.5 text-[11px] font-semibold text-brand-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-600 animate-pulse" />
                  Active Report
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Report Content */}
      <div className="w-full">
        {loadingSites ? (
          <Card>
            <PageLoader
              label="Loading site configurations"
              fullHeight={false}
            />
          </Card>
        ) : (
          <>
            {selectedReport === "annualReport" && (
              <AnnualReportView sites={sites} />
            )}
            {selectedReport === "salaryReport" && (
              <SalaryReportView sites={sites} />
            )}
            {selectedReport === "vendorReport" && (
              <VendorReportView sites={sites} />
            )}
            {selectedReport === "contractorReport" && (
              <ContractorReportView sites={sites} />
            )}
            {selectedReport === "capitalReport" && <CapitalLenderReportView />}
            {selectedReport === "expenseReport" && (
              <Card>
                <ExpenseReport sites={sites} />
              </Card>
            )}
            {selectedReport === "clientReport" && (
              <Card>
                <ClientSiteReport sites={sites} />
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const ExpenseReport = ({ sites }: { sites: ReportSite[] }) => {
  const { formatNumber, numberFormat } = usePreferences();
  const [filters, setFilters] = useState({
    siteId: "",
    supervisionPercentage: "",
    startDate: "",
    endDate: "",
  });
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [editableRows, setEditableRows] = useState<any[]>([]);
  const [roundAmounts, setRoundAmounts] = useState(false);
  const [supervisionOverride, setSupervisionOverride] = useState<number | null>(
    null,
  );
  const [exporting, setExporting] = useState(false);

  const handleSiteChange = (siteId: string) => {
    const selectedSite = sites.find((s) => s._id === siteId);
    setFilters((prev) => ({
      ...prev,
      siteId,
      supervisionPercentage: String(selectedSite?.supervisionPercentage ?? 0),
    }));
    setReportData(null);
    setEditableRows([]);
    setRoundAmounts(false);
    setSupervisionOverride(null);
  };

  const handleSupervisionChange = (value: string) => {
    setFilters((prev) => ({ ...prev, supervisionPercentage: value }));
  };

  const fetchData = async () => {
    if (!filters.siteId) {
      setReportData(null);
      setEditableRows([]);
      return;
    }
    setLoading(true);
    try {
      const res = await privateClient.get("/reports/expense-report", {
        params: {
          siteId: filters.siteId,
          supervisionPercentage:
            filters.supervisionPercentage !== ""
              ? filters.supervisionPercentage
              : undefined,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        },
      });
      setReportData(res.data);
      setEditableRows(buildEditableRows(res.data.transactions));
      setRoundAmounts(false);
      setSupervisionOverride(null);
    } catch (err) {
      console.error("Error fetching expense report:", err);
      setReportData(null);
      setEditableRows([]);
    }
    setLoading(false);
  };

  const totals = reportData
    ? computeTotals(
        editableRows,
        Number(reportData.supervisionPercentage) || 0,
        roundAmounts,
        supervisionOverride,
      )
    : { totalAmount: 0, supervisionAmount: 0, netTotal: 0 };

  const exportToPDF = async () => {
    if (!reportData || editableRows.length === 0) return;
    setExporting(true);
    try {
      const headerData = await loadImage(headerImg);
      const footerData = await loadImage(footerImg);

      generateProfessionalReportPdf({
        title: `Expense Report - ${reportData.site.name}`,
        siteName: reportData.site.name,
        address: `${reportData.site.address}, ${reportData.site.city}, ${reportData.site.state} ${reportData.site.zip}`,
        periodLabel:
          filters.startDate && filters.endDate
            ? `${filters.startDate} to ${filters.endDate}`
            : null,
        rows: editableRows.map((row) => ({
          itemOfWork: row.itemOfWork,
          quantity: row.quantity,
          amount: displayAmount(row.amount, roundAmounts),
        })),
        summaryRows: [
          { label: "TOTAL", amount: totals.totalAmount },
          {
            label: `SUPERVISION (${reportData.supervisionPercentage}%)`,
            amount: totals.supervisionAmount,
          },
          { label: "NET TOTAL (With Supervision)", amount: totals.netTotal },
        ],
        headerImage: headerData,
        footerImage: footerData,
        fileName: `expense-report-${reportData.site.name}-${new Date().toISOString().split("T")[0]}.pdf`,
        numberFormat,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
    setExporting(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-console border border-console-border bg-console-bg p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-console-text">
          <Filter size={16} className="text-brand-600" />
          Report filters
        </h3>
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <select
            value={filters.siteId}
            onChange={(e) => handleSiteChange(e.target.value)}
            className="w-full rounded-lg border border-console-border bg-white px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            <option value="">Select site</option>
            {sites.map((site) => (
              <option key={site._id} value={site._id}>
                {site.name}
              </option>
            ))}
          </select>
          <div className="relative">
            <Receipt
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-console-muted"
              size={15}
            />
            <input
              type="number"
              min={0}
              max={100}
              step="0.01"
              placeholder="Supervision %"
              value={filters.supervisionPercentage}
              onChange={(e) => handleSupervisionChange(e.target.value)}
              className="w-full rounded-lg border border-console-border bg-white py-2.5 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div className="relative">
            <Calendar
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-console-muted"
              size={15}
            />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value })
              }
              className="w-full rounded-lg border border-console-border bg-white py-2.5 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div className="relative">
            <Calendar
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-console-muted"
              size={15}
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value })
              }
              className="w-full rounded-lg border border-console-border bg-white py-2.5 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchData}
            loading={loading}
            disabled={!filters.siteId}
          >
            <RefreshCw size={15} />{" "}
            {loading ? "Generating..." : "Generate report"}
          </Button>
          <Button
            variant="danger"
            onClick={exportToPDF}
            loading={exporting}
            disabled={loading || !reportData || editableRows.length === 0}
          >
            <FileDown size={15} /> {exporting ? "Exporting..." : "Export PDF"}
          </Button>
        </div>
      </div>

      {!filters.siteId ? (
        <EmptyState
          icon={Search}
          title="Select a site"
          description="Please select a site to view its expense report."
        />
      ) : loading ? (
        <PageLoader label="Fetching expense data" fullHeight={false} />
      ) : !reportData ? (
        <EmptyState
          icon={FileText}
          title="Generate report"
          description='Click "Generate report" to load the expense report for this site.'
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-console border border-console-border bg-white p-5">
              <p className="text-sm text-console-muted">
                Total amount (without supervision)
              </p>
              <p className="mt-1 text-xl font-semibold text-console-text">
                ₹{formatNumber(totals.totalAmount)}
              </p>
            </div>
            <div className="rounded-console border border-console-border bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-console-muted">
                  Supervision amount ({reportData.supervisionPercentage}%)
                </p>
                {supervisionOverride !== null && (
                  <Tooltip label="Reset to computed supervision">
                    <button
                      type="button"
                      onClick={() => setSupervisionOverride(null)}
                      aria-label="Reset to computed supervision"
                      className="text-console-muted hover:text-console-text"
                    >
                      <RotateCcw size={13} />
                    </button>
                  </Tooltip>
                )}
              </div>
              <div className="mt-1">
                <EditableAmountField
                  value={totals.supervisionAmount}
                  onCommit={(value: number) => setSupervisionOverride(value)}
                  inputClassName="w-full border-0 border-b border-transparent bg-transparent px-0 py-0 text-right text-xl font-semibold text-warning-600 transition-colors hover:border-slate-300 focus:border-brand-500 focus:ring-0"
                  currencyClassName="mr-1 text-xl font-semibold text-warning-600"
                />
              </div>
              {supervisionOverride !== null && (
                <p className="mt-1 text-[11px] text-warning-600">
                  Manually overridden
                </p>
              )}
            </div>
            <div className="rounded-console border border-console-border bg-white p-5">
              <p className="text-sm text-console-muted">
                Net total (with supervision)
              </p>
              <p className="mt-1 text-xl font-semibold text-success-700">
                ₹{formatNumber(totals.netTotal)}
              </p>
            </div>
          </div>

          <div className="rounded-console border border-console-border bg-white p-5">
            {editableRows.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No expenses found"
                description="No expenses recorded for this site in the selected period."
              />
            ) : (
              <ReportRowEditor
                rows={editableRows}
                onRowsChange={setEditableRows}
                roundAmounts={roundAmounts}
                onToggleRoundAmounts={setRoundAmounts}
                disabled={loading || exporting}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

const ClientSiteReport = ({ sites }: { sites: ReportSite[] }) => {
  const { formatNumber, numberFormat } = usePreferences();
  const [filters, setFilters] = useState({
    siteId: "",
    supervisionPercentage: "",
    startDate: "",
    endDate: "",
  });
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [editableRows, setEditableRows] = useState<any[]>([]);
  const [roundAmounts, setRoundAmounts] = useState(false);
  const [roundBalance, setRoundBalance] = useState(false);
  const [balanceOverride, setBalanceOverride] = useState<number | null>(null);
  const [varavOverride, setVaravOverride] = useState<number | null>(null);
  const [supervisionOverride, setSupervisionOverride] = useState<number | null>(
    null,
  );
  const [exporting, setExporting] = useState(false);

  const handleSiteChange = (siteId: string) => {
    const selectedSite = sites.find((s) => s._id === siteId);
    setFilters((prev) => ({
      ...prev,
      siteId,
      supervisionPercentage: String(selectedSite?.supervisionPercentage ?? 0),
    }));
    setReportData(null);
    setEditableRows([]);
    setRoundAmounts(false);
    setRoundBalance(false);
    setBalanceOverride(null);
    setVaravOverride(null);
    setSupervisionOverride(null);
  };

  const fetchData = async () => {
    if (!filters.siteId) {
      setReportData(null);
      setEditableRows([]);
      return;
    }
    setLoading(true);
    try {
      const res = await privateClient.get("/reports/client-report", {
        params: {
          siteId: filters.siteId,
          supervisionPercentage:
            filters.supervisionPercentage !== ""
              ? filters.supervisionPercentage
              : undefined,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        },
      });
      setReportData(res.data);
      setEditableRows(buildEditableRows(res.data.transactions));
      setRoundAmounts(false);
      setRoundBalance(false);
      setBalanceOverride(null);
      setVaravOverride(null);
      setSupervisionOverride(null);
    } catch (err) {
      console.error("Error fetching client report:", err);
      setReportData(null);
      setEditableRows([]);
    }
    setLoading(false);
  };

  const totals = reportData
    ? computeTotals(
        editableRows,
        Number(reportData.supervisionPercentage) || 0,
        roundAmounts,
        supervisionOverride,
      )
    : { totalAmount: 0, supervisionAmount: 0, netTotal: 0 };
  const effectiveVarav = reportData
    ? varavOverride !== null
      ? varavOverride
      : Number(reportData.varav) || 0
    : 0;
  const rawBalance = reportData
    ? balanceOverride !== null
      ? balanceOverride
      : totals.netTotal - effectiveVarav
    : 0;
  const balance = reportData ? computeBalance(rawBalance, roundBalance) : 0;

  const handleVaravCommit = (value: number) => {
    setVaravOverride(value);
    // Varav drives balance automatically, so drop any manual balance
    // override and let it recompute from the new received amount.
    setBalanceOverride(null);
  };

  const exportToPDF = async () => {
    if (!reportData || editableRows.length === 0) return;
    setExporting(true);
    try {
      const headerData = await loadImage(headerImg);
      const footerData = await loadImage(footerImg);

      generateProfessionalReportPdf({
        title: `Client Report - ${reportData.site.name}`,
        siteName: reportData.site.name,
        address: `${reportData.site.address}, ${reportData.site.city}, ${reportData.site.state} ${reportData.site.zip}`,
        clientName: reportData.site.client?.name || null,
        periodLabel:
          filters.startDate && filters.endDate
            ? `${filters.startDate} to ${filters.endDate}`
            : null,
        rows: editableRows.map((row) => ({
          itemOfWork: row.itemOfWork,
          quantity: row.quantity,
          amount: displayAmount(row.amount, roundAmounts),
        })),
        summaryRows: [
          { label: "TOTAL", amount: totals.totalAmount },
          {
            label: `SUPERVISION (${reportData.supervisionPercentage}%)`,
            amount: totals.supervisionAmount,
          },
          { label: "NET TOTAL", amount: totals.netTotal },
          { label: "VARAV", amount: effectiveVarav },
          { label: "BALANCE", amount: balance },
        ],
        headerImage: headerData,
        footerImage: footerData,
        fileName: `client-report-${reportData.site.name}-${new Date().toISOString().split("T")[0]}.pdf`,
        numberFormat,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
    setExporting(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-console border border-console-border bg-console-bg p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-console-text">
          <Filter size={16} className="text-brand-600" />
          Report filters
        </h3>
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <select
            value={filters.siteId}
            onChange={(e) => handleSiteChange(e.target.value)}
            className="w-full rounded-lg border border-console-border bg-white px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            <option value="">Select site</option>
            {sites.map((site) => (
              <option key={site._id} value={site._id}>
                {site.name}
              </option>
            ))}
          </select>
          <div className="relative">
            <Wallet
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-console-muted"
              size={15}
            />
            <input
              type="number"
              min={0}
              max={100}
              step="0.01"
              placeholder="Supervision %"
              value={filters.supervisionPercentage}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  supervisionPercentage: e.target.value,
                })
              }
              className="w-full rounded-lg border border-console-border bg-white py-2.5 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div className="relative">
            <Calendar
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-console-muted"
              size={15}
            />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value })
              }
              className="w-full rounded-lg border border-console-border bg-white py-2.5 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div className="relative">
            <Calendar
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-console-muted"
              size={15}
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value })
              }
              className="w-full rounded-lg border border-console-border bg-white py-2.5 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchData}
            loading={loading}
            disabled={!filters.siteId}
          >
            <RefreshCw size={15} />{" "}
            {loading ? "Generating..." : "Generate report"}
          </Button>
          <Button
            variant="danger"
            onClick={exportToPDF}
            loading={exporting}
            disabled={loading || !reportData || editableRows.length === 0}
          >
            <FileDown size={15} /> {exporting ? "Exporting..." : "Export PDF"}
          </Button>
        </div>
      </div>

      {!filters.siteId ? (
        <EmptyState
          icon={Search}
          title="Select a site"
          description="Please select a site to view its client report."
        />
      ) : loading ? (
        <PageLoader label="Fetching client report data" fullHeight={false} />
      ) : !reportData ? (
        <EmptyState
          icon={FileText}
          title="Generate report"
          description='Click "Generate report" to load the client report for this site.'
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
            <div className="rounded-console border border-console-border bg-white p-5">
              <p className="text-sm text-console-muted">Total</p>
              <p className="mt-1 text-xl font-semibold text-console-text">
                ₹{formatNumber(totals.totalAmount)}
              </p>
            </div>
            <div className="rounded-console border border-console-border bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-console-muted">
                  Supervision ({reportData.supervisionPercentage}%)
                </p>
                {supervisionOverride !== null && (
                  <Tooltip label="Reset to computed supervision">
                    <button
                      type="button"
                      onClick={() => setSupervisionOverride(null)}
                      aria-label="Reset to computed supervision"
                      className="text-console-muted hover:text-console-text"
                    >
                      <RotateCcw size={13} />
                    </button>
                  </Tooltip>
                )}
              </div>
              <div className="mt-1">
                <EditableAmountField
                  value={totals.supervisionAmount}
                  onCommit={(value: number) => setSupervisionOverride(value)}
                  inputClassName="w-full border-0 border-b border-transparent bg-transparent px-0 py-0 text-right text-xl font-semibold text-warning-600 transition-colors hover:border-slate-300 focus:border-brand-500 focus:ring-0"
                  currencyClassName="mr-1 text-xl font-semibold text-warning-600"
                />
              </div>
              {supervisionOverride !== null && (
                <p className="mt-1 text-[11px] text-warning-600">
                  Manually overridden
                </p>
              )}
            </div>
            <div className="rounded-console border border-console-border bg-white p-5">
              <p className="text-sm text-console-muted">Net total</p>
              <p className="mt-1 text-xl font-semibold text-console-text">
                ₹{formatNumber(totals.netTotal)}
              </p>
            </div>
            <div className="rounded-console border border-console-border bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-console-muted">Varav (Received)</p>
                {varavOverride !== null && (
                  <Tooltip label="Reset to original varav">
                    <button
                      type="button"
                      onClick={() => setVaravOverride(null)}
                      aria-label="Reset to original varav"
                      className="text-console-muted hover:text-console-text"
                    >
                      <RotateCcw size={13} />
                    </button>
                  </Tooltip>
                )}
              </div>
              <div className="mt-1">
                <EditableAmountField
                  value={effectiveVarav}
                  onCommit={handleVaravCommit}
                  inputClassName="w-full border-0 border-b border-transparent bg-transparent px-0 py-0 text-right text-xl font-semibold text-success-700 transition-colors hover:border-slate-300 focus:border-brand-500 focus:ring-0"
                  currencyClassName="mr-1 text-xl font-semibold text-success-700"
                />
              </div>
              {varavOverride !== null && (
                <p className="mt-1 text-[11px] text-warning-600">
                  Manually overridden
                </p>
              )}
            </div>
            <div className="rounded-console border border-console-border bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-console-muted">Balance</p>
                <div className="flex items-center gap-2">
                  {balanceOverride !== null && (
                    <Tooltip label="Reset to computed balance">
                      <button
                        type="button"
                        onClick={() => setBalanceOverride(null)}
                        aria-label="Reset to computed balance"
                        className="text-console-muted hover:text-console-text"
                      >
                        <RotateCcw size={13} />
                      </button>
                    </Tooltip>
                  )}
                  <label className="flex cursor-pointer select-none items-center gap-1.5 text-xs text-console-muted">
                    <input
                      type="checkbox"
                      checked={roundBalance}
                      onChange={(e) => setRoundBalance(e.target.checked)}
                      className="rounded border-console-border text-brand-600 focus:ring-brand-500"
                    />
                    Round off
                  </label>
                </div>
              </div>
              <div className="mt-1">
                <EditableAmountField
                  value={balance}
                  onCommit={(value: number) => setBalanceOverride(value)}
                  inputClassName={cn(
                    "w-full border-0 border-b border-transparent bg-transparent px-0 py-0 text-right text-xl font-semibold transition-colors hover:border-slate-300 focus:border-brand-500 focus:ring-0",
                    balance > 0 ? "text-danger-600" : "text-success-700",
                  )}
                  currencyClassName={cn(
                    "mr-1 text-xl font-semibold",
                    balance > 0 ? "text-danger-600" : "text-success-700",
                  )}
                />
              </div>
              {balanceOverride !== null && (
                <p className="mt-1 text-[11px] text-warning-600">
                  Manually overridden
                </p>
              )}
            </div>
          </div>

          <div className="rounded-console border border-console-border bg-white p-5">
            {editableRows.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No expenses found"
                description="No expenses recorded for this site in the selected period."
              />
            ) : (
              <ReportRowEditor
                rows={editableRows}
                onRowsChange={setEditableRows}
                roundAmounts={roundAmounts}
                onToggleRoundAmounts={setRoundAmounts}
                disabled={loading || exporting}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
