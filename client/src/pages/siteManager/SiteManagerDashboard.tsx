import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCurrentUser, getUserById } from "@/services/userService";
import {
  DollarSign,
  CreditCard,
  Building2,
  MapPin,
  ChevronRight,
  Check,
  Clock,
  ChevronLeft,
} from "lucide-react";
import { Card, StatCard } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import PageLoader from "@/components/ui/PageLoader";
import { cn } from "@/lib/cn";

const ITEMS_PER_PAGE = 10;

const SiteManagerDashboard: React.FC = () => {
  const { managerId } = useParams<{ managerId: string }>();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTable, setActiveTable] = useState<"salary" | "expense" | null>(null);
  const [salaryPage, setSalaryPage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = managerId
          ? await getUserById(managerId)
          : await getCurrentUser();

        const safe = {
          name: data?.name ?? "User",
          totalSalary: Number(data?.totalSalary ?? 0),
          salaryAssignments: Array.isArray(data?.salaryAssignments)
            ? data.salaryAssignments
            : [],
          siteExpensesBalance: Number(data?.siteExpensesBalance ?? 0),
          siteExpensesTransactions: Array.isArray(data?.siteExpensesTransactions)
            ? [...data.siteExpensesTransactions].sort((a: any, b: any) => {
                const dateA = new Date(a.date || 0).getTime();
                const dateB = new Date(b.date || 0).getTime();
                return dateB - dateA;
              })
            : [],
          assignedSites: Array.isArray(data?.assignedSites) ? data.assignedSites : [],
        };

        setUserData(safe);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Failed to fetch user data");
        setLoading(false);
      }
    };
    fetchUserData();
  }, [managerId]);

  if (loading) {
    return <PageLoader label="Loading dashboard" />;
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <h3 className="text-lg font-semibold text-console-text">Something went wrong</h3>
          <p className="mt-1 text-sm text-danger-600">{error}</p>
        </Card>
      </div>
    );
  }

  const {
    name,
    totalSalary,
    salaryAssignments = [],
    siteExpensesBalance,
    siteExpensesTransactions = [],
    assignedSites = [],
  } = userData ?? {};

  const handleStatCardClick = (type: "salary" | "expense") => {
    if (activeTable === type) {
      setActiveTable(null);
    } else {
      setActiveTable(type);
      if (type === "salary") setSalaryPage(1);
      if (type === "expense") setExpensePage(1);
    }
  };

  const TransactionTable = ({
    title,
    transactions,
    type,
    currentPage,
    setCurrentPage,
  }: {
    title: string;
    transactions: any[];
    type: "salary" | "expense";
    currentPage: number;
    setCurrentPage: (page: number) => void;
  }) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginated = transactions.slice(startIndex, endIndex);
    const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);

    return (
      <Card
        title={title}
        action={
          <button
            type="button"
            onClick={() => setActiveTable(null)}
            className="rounded-lg p-1.5 text-console-muted transition-colors hover:bg-console-bg hover:text-console-text"
          >
            Close
          </button>
        }
      >
        {transactions.length === 0 ? (
          <EmptyState icon={Clock} title={`No ${type} transactions yet`} />
        ) : (
          <>
            <div className="overflow-x-auto rounded-console border border-console-border">
              <table className="min-w-full divide-y divide-console-border">
                <thead className="bg-console-bg">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Amount</th>
                    {type === "salary" ? (
                      <>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Given By</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Status</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Description</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Site</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Given By</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-console-border bg-white">
                  {paginated.map((transaction: any, idx: number) => (
                    <tr key={idx} className="hover:bg-console-bg">
                      <td className="whitespace-nowrap px-4 py-3.5 text-sm text-console-text">
                        {transaction.date ? new Date(transaction.date).toLocaleDateString() : "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-sm font-semibold text-success-700">
                        ₹{(transaction.amount ?? 0).toLocaleString()}
                      </td>
                      {type === "salary" ? (
                        <>
                          <td className="whitespace-nowrap px-4 py-3.5 text-sm text-console-muted">
                            {transaction.givenBy?.name ?? "auto"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5">
                            <Badge variant={transaction.isVerified ? "success" : "warning"}>
                              {transaction.isVerified ? <Check size={11} /> : <Clock size={11} />}
                              {transaction.isVerified ? "Verified" : "Pending"}
                            </Badge>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="whitespace-nowrap px-4 py-3.5">
                            <Badge variant="info">{transaction.type ?? "-"}</Badge>
                          </td>
                          <td className="max-w-48 truncate whitespace-nowrap px-4 py-3.5 text-sm text-console-muted">
                            {transaction.description ?? "-"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-sm text-console-muted">
                            {transaction.site?.name ?? "-"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-sm text-console-muted">
                            {transaction.givenBy?.name ?? "-"}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex flex-col items-center justify-between gap-3 rounded-console bg-console-bg px-4 py-3 sm:flex-row">
                <p className="text-sm text-console-muted">
                  Showing {startIndex + 1} to {Math.min(endIndex, transactions.length)} of{" "}
                  {transactions.length} results
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg p-2 text-console-muted transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors",
                        p === currentPage ? "bg-brand-700 text-white" : "text-console-muted hover:bg-white",
                      )}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg p-2 text-console-muted transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    );
  };

  const siteBasePath = managerId ? "/admin/sites" : "/siteManager/sites";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-console-text">
          {managerId ? `${name}'s Dashboard` : "Dashboard"}
        </h1>
        <p className="mt-0.5 text-sm text-console-muted">
          {managerId
            ? `Viewing dashboard for ${name}.`
            : "Welcome back! Here's your account overview and site management hub."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button type="button" onClick={() => handleStatCardClick("salary")} className="text-left">
          <StatCard
            label="Total Salary Account"
            value={`₹${totalSalary.toLocaleString()}`}
            icon={DollarSign}
            className={cn(activeTable === "salary" && "ring-2 ring-brand-300")}
          />
        </button>
        <button type="button" onClick={() => handleStatCardClick("expense")} className="text-left">
          <StatCard
            label="In-Site Expenses Balance"
            value={`₹${siteExpensesBalance.toLocaleString()}`}
            icon={CreditCard}
            className={cn(activeTable === "expense" && "ring-2 ring-brand-300")}
          />
        </button>
      </div>

      {activeTable === "salary" && (
        <TransactionTable
          title="Salary Transaction History"
          transactions={salaryAssignments}
          type="salary"
          currentPage={salaryPage}
          setCurrentPage={setSalaryPage}
        />
      )}

      {activeTable === "expense" && (
        <TransactionTable
          title="Site Expenses Transaction History"
          transactions={siteExpensesTransactions}
          type="expense"
          currentPage={expensePage}
          setCurrentPage={setExpensePage}
        />
      )}

      <div>
        <h2 className="mb-4 flex items-center gap-2.5 text-base font-semibold text-console-text">
          <Building2 size={20} className="text-brand-600" />
          Assigned Sites
        </h2>

        {assignedSites.length === 0 ? (
          <Card>
            <EmptyState icon={Building2} title="No sites assigned yet" />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {assignedSites.map((site: any, index: number) => (
              <Card key={site._id ?? index} className="transition-shadow hover:shadow-console-lg">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <Building2 size={18} />
                  </div>
                  <Badge variant="success">Active Site</Badge>
                </div>
                <h3 className="text-sm font-semibold text-console-text">
                  {site.name ?? "Unnamed Site"}
                </h3>
                <div className="mt-2 mb-5 flex items-start gap-2">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-console-muted" />
                  <p className="text-sm text-console-muted">
                    {site.address
                      ? `${site.address}, ${site.city ?? ""}, ${site.state ?? ""} ${site.zip ?? ""}`
                      : "No address provided"}
                  </p>
                </div>
                <Link
                  to={`${siteBasePath}/${site._id}`}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-800"
                >
                  View &amp; edit details
                  <ChevronRight size={14} />
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SiteManagerDashboard;
