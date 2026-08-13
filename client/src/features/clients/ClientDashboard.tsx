import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getClientDashboard,
  getClientSites,
  sendMoneyToAdmin,
} from "@/services/clientService";
import {
  BarChart,
  ShoppingCart,
  Package as PackageIcon,
  Construction,
  DollarSign,
  Building,
  Wallet,
  TrendingUp,
  Send,
  LucideIcon,
} from "lucide-react";
import SendMoneyCard from "./SendMoneyCard";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { toast } from "sonner";
import { Card, StatCard } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import PageLoader from "@/components/ui/PageLoader";
import GradientStatCard from "@/components/ui/GradientStatCard";
import { cn } from "@/lib/cn";

interface SectionState {
  data: any[];
  total: number;
  page: number;
  limit: number;
}

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart },
  { id: "purchases", label: "Purchases", icon: ShoppingCart },
  { id: "stocks", label: "Inventory", icon: PackageIcon },
  { id: "miscellaneous", label: "Miscellaneous", icon: Construction },
  { id: "transactions", label: "Transactions", icon: DollarSign },
] as const;

const emptySection = (): SectionState => ({ data: [], total: 0, page: 1, limit: 10 });

const badgeVariant = (status: string | undefined): "success" | "warning" | "error" | "neutral" => {
  switch (status) {
    case "completed":
      return "success";
    case "pending":
      return "warning";
    case "failed":
      return "error";
    default:
      return "neutral";
  }
};

const ClientDashboard: React.FC = () => {
  const [site, setSite] = useState<any>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [purchases, setPurchases] = useState<SectionState>(emptySection());
  const [stocks, setStocks] = useState<SectionState>(emptySection());
  const [miscellaneousExpenses, setMiscellaneousExpenses] = useState<SectionState>(emptySection());
  const [transactions, setTransactions] = useState<SectionState>(emptySection());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["id"]>("overview");
  const [amountStr, setAmountStr] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const fetchSites = async () => {
    try {
      const sitesData = await getClientSites();
      setSites(sitesData);
      if (sitesData.length > 0) {
        setSelectedSite(sitesData[0]);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch sites");
    }
  };

  const fetchData = async (params: any) => {
    try {
      const data = await getClientDashboard(params);
      setSite(data.site);
      setPurchases({
        data: data.purchases.data,
        total: data.purchases.total,
        page: Number(params.purchasesPage),
        limit: Number(params.purchasesLimit),
      });
      setStocks({
        data: data.stocks.data,
        total: data.stocks.total,
        page: Number(params.stocksPage),
        limit: Number(params.stocksLimit),
      });
      setMiscellaneousExpenses({
        data: data.miscellaneousExpenses.data,
        total: data.miscellaneousExpenses.total,
        page: Number(params.miscellaneousPage),
        limit: Number(params.miscellaneousLimit),
      });
      setTransactions({
        data: data.transactions.data,
        total: data.transactions.total,
        page: Number(params.transactionsPage),
        limit: Number(params.transactionsLimit),
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  useEffect(() => {
    if (selectedSite) {
      fetchData({
        siteId: selectedSite._id,
        purchasesPage: 1,
        purchasesLimit: 10,
        stocksPage: 1,
        stocksLimit: 10,
        miscellaneousPage: 1,
        miscellaneousLimit: 10,
        transactionsPage: 1,
        transactionsLimit: 10,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSite]);

  const getCurrentParams = () => ({
    siteId: selectedSite?._id,
    purchasesPage: purchases.page,
    purchasesLimit: purchases.limit,
    stocksPage: stocks.page,
    stocksLimit: stocks.limit,
    miscellaneousPage: miscellaneousExpenses.page,
    miscellaneousLimit: miscellaneousExpenses.limit,
    transactionsPage: transactions.page,
    transactionsLimit: transactions.limit,
  });

  const refreshDashboard = async () => {
    await fetchData(getCurrentParams());
  };

  const sectionFor = (section: string): SectionState =>
    section === "purchases"
      ? purchases
      : section === "stocks"
        ? stocks
        : section === "miscellaneous"
          ? miscellaneousExpenses
          : transactions;

  const handlePageChange = (section: string, newPage: number) => {
    const currentParams = getCurrentParams();
    const sectionData = sectionFor(section);
    const totalPages = Math.ceil(sectionData.total / sectionData.limit);
    if (newPage < 1 || newPage > totalPages) return;

    fetchData({
      ...currentParams,
      [`${section}Page`]: newPage,
    });
  };

  const handleSendMoneyRequest = () => {
    const num = parseFloat(amountStr);
    if (isNaN(num) || num <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setIsModalOpen(true);
  };

  const handleConfirmSendMoney = async () => {
    setIsSending(true);
    try {
      const amountNum = parseFloat(amountStr);
      await sendMoneyToAdmin(amountNum, selectedSite._id);
      toast.success("Money sent successfully, pending admin verification.");
      setAmountStr("");
      refreshDashboard();
    } catch (err) {
      toast.error("Failed to send money.");
    } finally {
      setIsSending(false);
      setIsModalOpen(false);
    }
  };

  if (loading) {
    return <PageLoader label="Loading dashboard" />;
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <h2 className="text-lg font-semibold text-console-text">Something went wrong</h2>
          <p className="mt-1 text-sm text-danger-600">{error}</p>
        </Card>
      </div>
    );
  }

  const DashStatCard = ({
    title,
    value,
    icon,
  }: {
    title: string;
    value: React.ReactNode;
    icon: LucideIcon;
  }) => <StatCard label={title} value={value} icon={icon} />;

  const TableCard = ({
    title,
    children,
    icon,
    section,
  }: {
    title: string;
    children: React.ReactNode;
    icon: LucideIcon;
    section: string;
  }) => {
    const Icon = icon;
    const sectionData = sectionFor(section);
    const totalPages = Math.ceil(sectionData.total / sectionData.limit) || 1;

    return (
      <Card>
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <Icon size={16} />
          </div>
          <h3 className="text-base font-semibold text-console-text">{title}</h3>
        </div>
        {children}
        {section !== "overview" && (
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => handlePageChange(section, sectionData.page - 1)}
              disabled={sectionData.page <= 1}
              className="rounded-lg bg-console-bg px-4 py-2 text-sm font-medium text-console-text transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-console-muted">
              Page {sectionData.page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => handlePageChange(section, sectionData.page + 1)}
              disabled={sectionData.page >= totalPages}
              className="rounded-lg bg-console-bg px-4 py-2 text-sm font-medium text-console-text transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-console-text">Client Dashboard</h1>
          <p className="mt-0.5 text-sm text-console-muted">Welcome back! Here's your project overview.</p>
        </div>
        <div>
          <label htmlFor="site-select" className="mb-1 block text-xs font-medium text-console-muted">
            Select site
          </label>
          <select
            id="site-select"
            value={selectedSite?._id || ""}
            onChange={(e) => {
              const nextSite = sites.find((s) => s._id === e.target.value);
              setSelectedSite(nextSite);
            }}
            className="rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            {sites.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <DashStatCard title="Site Name" value={site?.name || "N/A"} icon={Building} />
        <GradientStatCard label="Budget" value={site?.budget || 0} prefix="₹" icon={Wallet} />
        <GradientStatCard label="Expenses" value={site?.expenses || 0} prefix="₹" icon={BarChart} />
      </div>

      <div className="relative flex flex-wrap gap-1 rounded-console border border-console-border bg-console-bg p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative z-10 flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-200",
                isActive ? "text-brand-700" : "text-console-muted hover:bg-white/60",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="client-dashboard-tab-pill"
                  className="absolute inset-0 -z-10 rounded-lg bg-white shadow-console"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <SendMoneyCard
                amountStr={amountStr}
                setAmountStr={setAmountStr}
                onSendMoneyRequest={handleSendMoneyRequest}
              />
              <TableCard title="Quick Statistics" icon={TrendingUp} section="overview">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-console bg-console-bg p-4 text-center">
                    <div className="text-2xl font-semibold text-brand-700">{purchases.total || 0}</div>
                    <div className="text-sm text-console-muted">Total purchases</div>
                  </div>
                  <div className="rounded-console bg-console-bg p-4 text-center">
                    <div className="text-2xl font-semibold text-brand-700">{stocks.total || 0}</div>
                    <div className="text-sm text-console-muted">Stock items</div>
                  </div>
                  <div className="rounded-console bg-console-bg p-4 text-center">
                    <div className="text-2xl font-semibold text-brand-700">
                      {miscellaneousExpenses.total || 0}
                    </div>
                    <div className="text-sm text-console-muted">Miscellaneous expenses</div>
                  </div>
                  <div className="rounded-console bg-console-bg p-4 text-center">
                    <div className="text-2xl font-semibold text-brand-700">{transactions.total || 0}</div>
                    <div className="text-sm text-console-muted">Transactions</div>
                  </div>
                </div>
              </TableCard>
            </div>
          )}

          {activeTab === "purchases" && (
            <TableCard title="Purchase Orders" icon={ShoppingCart} section="purchases">
              {purchases.data?.length === 0 ? (
                <EmptyState icon={ShoppingCart} title="No purchases found" />
              ) : (
                <div className="overflow-x-auto rounded-console border border-console-border">
                  <table className="min-w-full divide-y divide-console-border">
                    <thead className="bg-console-bg">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Vendor</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Total amount</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-console-border bg-white">
                      {purchases.data?.map((pur: any) => (
                        <tr key={pur._id}>
                          <td className="px-4 py-3.5 text-sm font-medium text-console-text">
                            {pur.vendor?.name || "N/A"}
                          </td>
                          <td className="px-4 py-3.5 text-sm font-semibold text-success-700">
                            ₹{pur.totalAmount?.toLocaleString() || 0}
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge variant={badgeVariant(pur.status)}>{pur.status || "Unknown"}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TableCard>
          )}

          {activeTab === "stocks" && (
            <TableCard title="Inventory Management" icon={PackageIcon} section="stocks">
              {stocks.data?.length === 0 ? (
                <EmptyState icon={PackageIcon} title="No stock items found" />
              ) : (
                <div className="overflow-x-auto rounded-console border border-console-border">
                  <table className="min-w-full divide-y divide-console-border">
                    <thead className="bg-console-bg">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Item name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Quantity</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-console-border bg-white">
                      {stocks.data?.map((stock: any) => (
                        <tr key={stock._id}>
                          <td className="px-4 py-3.5 text-sm font-medium text-console-text">{stock.name || "N/A"}</td>
                          <td className="px-4 py-3.5 text-sm text-info-700">{stock.quantity || 0}</td>
                          <td className="px-4 py-3.5 text-sm text-console-muted">{stock.unit || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TableCard>
          )}

          {activeTab === "miscellaneous" && (
            <TableCard title="Miscellaneous Expenses" icon={Construction} section="miscellaneous">
              {miscellaneousExpenses.data?.length === 0 ? (
                <EmptyState icon={Construction} title="No miscellaneous expenses found" />
              ) : (
                <div className="overflow-x-auto rounded-console border border-console-border">
                  <table className="min-w-full divide-y divide-console-border">
                    <thead className="bg-console-bg">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Description</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-console-border bg-white">
                      {miscellaneousExpenses.data?.map((expense: any) => (
                        <tr key={expense._id}>
                          <td className="px-4 py-3.5 text-sm font-medium text-console-text">
                            {expense.description || "N/A"}
                          </td>
                          <td className="px-4 py-3.5 text-sm font-semibold text-success-700">
                            ₹{expense.amount?.toLocaleString() || 0}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-console-muted">
                            {expense.date ? new Date(expense.date).toLocaleDateString() : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TableCard>
          )}

          {activeTab === "transactions" && (
            <TableCard title="Transaction History" icon={DollarSign} section="transactions">
              {transactions.data?.length === 0 ? (
                <EmptyState icon={DollarSign} title="No transactions found" />
              ) : (
                <div className="overflow-x-auto rounded-console border border-console-border">
                  <table className="min-w-full divide-y divide-console-border">
                    <thead className="bg-console-bg">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-console-border bg-white">
                      {transactions.data?.map((trans: any) => (
                        <tr key={trans._id}>
                          <td className="px-4 py-3.5 text-sm font-semibold text-success-700">
                            ₹{trans.amount?.toLocaleString() || 0}
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge variant={badgeVariant(trans.status)}>{trans.status || "Unknown"}</Badge>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-console-muted">
                            {trans.createdAt ? new Date(trans.createdAt).toLocaleDateString() : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TableCard>
          )}
        </motion.div>
      </AnimatePresence>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmSendMoney}
        title="Confirm Send Money"
        description={`Are you sure you want to send ₹${parseFloat(amountStr || "0").toLocaleString()} to the admin for ${selectedSite?.name}?`}
        confirmText="Send"
        cancelText="Cancel"
        isLoading={isSending}
        icon={<Send className="h-5 w-5 text-success-600" />}
        theme="success"
      />
    </div>
  );
};

export default ClientDashboard;
