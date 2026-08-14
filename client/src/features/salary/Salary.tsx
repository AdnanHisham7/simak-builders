import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  listSalaries,
  verifySalaryAssignment,
  updateFixedSalary,
  updateSalaryAssignmentAmount,
  UserWithSalary,
  SalaryAssignment,
} from "@/services/userService";
import AddSalaryModal from "./AddSalaryModal";
import SalaryHistoryModal from "./SalaryHistoryModal";
import EditFixedSalaryModal from "./EditFixedSalaryModal";
import { toast } from "sonner";
import {
  Lock,
  Users,
  Plus,
  Eye,
  Pencil,
  Clock,
  Search,
  ChevronDown,
  ChevronUp,
  Wallet,
  BadgeIndianRupee,
  DollarSign,
  Grid as GridIcon,
  List,
  Mail,
  AlertCircle,
} from "lucide-react";
import { Card, StatCard } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonStatCards, SkeletonTable } from "@/components/ui/Skeleton";
import Tooltip from "@/components/ui/Tooltip";
import GradientStatCard from "@/components/ui/GradientStatCard";
import CopyButton from "@/components/ui/CopyButton";
import Avatar from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";

const formatCurrency = (amount: number | undefined) =>
  `₹${(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const roleBadgeVariant = (
  role: string
): "error" | "info" | "success" | "neutral" => {
  switch (role.toLowerCase()) {
    case "admin":
      return "error";
    case "manager":
    case "sitemanager":
      return "info";
    case "employee":
      return "success";
    default:
      return "neutral";
  }
};

type SortOption =
  | "pending-desc"
  | "pending-asc"
  | "name-asc"
  | "name-desc"
  | "paid-desc";
type StatusFilter = "all" | "pending" | "clear";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "pending-desc", label: "Pending payout (high to low)" },
  { value: "pending-asc", label: "Pending payout (low to high)" },
  { value: "paid-desc", label: "Total paid (high to low)" },
  { value: "name-asc", label: "Name (A to Z)" },
  { value: "name-desc", label: "Name (Z to A)" },
];

const Salary: React.FC = () => {
  const [users, setUsers] = useState<UserWithSalary[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});

  // Filters & Controls
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("pending-desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [expandedStats, setExpandedStats] = useState<boolean>(true);

  // Modals state
  const [addSalaryTarget, setAddSalaryTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [historyModalUser, setHistoryModalUser] =
    useState<UserWithSalary | null>(null);
  const [editFixedSalaryUser, setEditFixedSalaryUser] =
    useState<UserWithSalary | null>(null);
  const [isUpdatingFixed, setIsUpdatingFixed] = useState(false);

  const userType = useSelector((state: RootState) => state.auth.userType);

  const fetchSalaryData = async () => {
    try {
      setLoading(true);
      const data = await listSalaries();
      setUsers(data);
      setPageError(null);

      // Keep active history modal in sync with refreshed data
      if (historyModalUser) {
        const refreshed = data.find((u) => u._id === historyModalUser._id);
        if (refreshed) setHistoryModalUser(refreshed);
      }
    } catch (err) {
      setPageError("Failed to fetch salary records");
      toast.error("Failed to load salary data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userType === "admin") {
      fetchSalaryData();
    }
  }, [userType]);

  const calculateTotalToBePaid = (salaryAssignments: SalaryAssignment[]) => {
    return salaryAssignments
      .filter((sa) => !sa.isVerified)
      .reduce((sum, sa) => sum + sa.amount + (sa.allowance || 0), 0);
  };

  const calculatePendingCount = (salaryAssignments: SalaryAssignment[]) =>
    salaryAssignments.filter((sa) => !sa.isVerified).length;

  const availableRoles = useMemo(() => {
    const roles = new Set(users.map((u) => u.role));
    return Array.from(roles).sort();
  }, [users]);

  const stats = useMemo(() => {
    return users.reduce(
      (acc, user) => {
        const pendingAmount = calculateTotalToBePaid(user.salaryAssignments);
        acc.totalEmployees += 1;
        acc.totalPending += pendingAmount;
        acc.totalPaid += user.totalSalary;
        if (pendingAmount > 0) acc.pendingEmployeesCount += 1;
        return acc;
      },
      {
        totalEmployees: 0,
        totalPending: 0,
        totalPaid: 0,
        pendingEmployeesCount: 0,
      }
    );
  }, [users]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let result = users.filter((user) => {
      const matchesTerm =
        term.length === 0 ||
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const pending = calculateTotalToBePaid(user.salaryAssignments);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "pending" && pending > 0) ||
        (statusFilter === "clear" && pending === 0);
      return matchesTerm && matchesRole && matchesStatus;
    });

    result = [...result].sort((a, b) => {
      switch (sortOption) {
        case "pending-desc":
          return (
            calculateTotalToBePaid(b.salaryAssignments) -
            calculateTotalToBePaid(a.salaryAssignments)
          );
        case "pending-asc":
          return (
            calculateTotalToBePaid(a.salaryAssignments) -
            calculateTotalToBePaid(b.salaryAssignments)
          );
        case "paid-desc":
          return b.totalSalary - a.totalSalary;
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    return result;
  }, [users, searchTerm, roleFilter, statusFilter, sortOption]);

  const handleSaveFixedSalary = async (userId: string, newAmount: number) => {
    setIsUpdatingFixed(true);
    try {
      await updateFixedSalary(userId, newAmount);
      await fetchSalaryData();
      setEditFixedSalaryUser(null);
      toast.success("Fixed salary updated successfully");
    } catch (err) {
      toast.error("Failed to update fixed salary");
    } finally {
      setIsUpdatingFixed(false);
    }
  };

  const handleSaveAmount = async (
    userId: string,
    assignmentId: string,
    amount: number,
    allowance?: number,
    notes?: string
  ) => {
    setLoadingStates((prev) => ({ ...prev, [`save-${assignmentId}`]: true }));
    try {
      await updateSalaryAssignmentAmount(userId, assignmentId, {
        amount,
        allowance,
        notes,
      });
      await fetchSalaryData();
      toast.success("Salary assignment updated");
    } catch (err) {
      toast.error("Failed to update salary assignment");
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        [`save-${assignmentId}`]: false,
      }));
    }
  };

  const handleVerifySalary = async (
    userId: string,
    assignmentId: string,
    originalAmount: number
  ) => {
    setLoadingStates((prev) => ({ ...prev, [`verify-${assignmentId}`]: true }));
    try {
      await verifySalaryAssignment(userId, assignmentId);
      await fetchSalaryData();
      toast.success("Salary assignment verified");
    } catch (err) {
      toast.error("Failed to verify salary assignment");
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        [`verify-${assignmentId}`]: false,
      }));
    }
  };

  if (userType !== "admin") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-50 text-danger-600">
            <Lock size={22} />
          </div>
          <h2 className="text-lg font-semibold text-console-text">Access denied</h2>
          <p className="mt-1 text-sm text-console-muted">
            Only administrators can manage salary information.
          </p>
        </Card>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-50 text-danger-600">
            <AlertCircle size={22} />
          </div>
          <h3 className="text-lg font-semibold text-console-text">
            Something went wrong
          </h3>
          <p className="mt-1 text-sm text-console-muted">{pageError}</p>
          <Button className="mt-5" onClick={fetchSalaryData}>
            Try again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-console-text">
            Salary Management
          </h1>
          <p className="mt-0.5 text-sm text-console-muted">
            Manage employee compensation, fixed salaries, and verify payouts
          </p>
        </div>
        <Badge variant="default">{users.length} Employees</Badge>
      </div>

      {loading ? (
        <div className="space-y-6">
          <SkeletonStatCards count={4} />
          <SkeletonTable />
        </div>
      ) : (
        <>
          {/* Overview Statistics Card */}
          <Card>
            <button
              type="button"
              onClick={() => setExpandedStats((v) => !v)}
              className="mb-4 flex w-full items-center justify-between"
            >
              <h2 className="text-sm font-semibold text-console-text">
                Overview statistics
              </h2>
              {expandedStats ? (
                <ChevronUp size={18} className="text-console-muted" />
              ) : (
                <ChevronDown size={18} className="text-console-muted" />
              )}
            </button>
            {expandedStats && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Total Employees"
                  value={stats.totalEmployees}
                  icon={Users}
                />
                <StatCard
                  label="Pending Approvals"
                  value={stats.pendingEmployeesCount}
                  icon={Clock}
                />
                <GradientStatCard
                  label="Total Paid"
                  value={stats.totalPaid}
                  prefix="₹"
                  icon={Wallet}
                />
                <GradientStatCard
                  label="Total Outstanding"
                  value={stats.totalPending}
                  prefix="₹"
                  tone="danger"
                  icon={DollarSign}
                />
              </div>
            )}
          </Card>

          {/* Filter & View Toolbar */}
          <Card>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-console-text">
                  Search employees
                </label>
                <div className="relative">
                  <Search
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-console-muted"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-console-border py-2.5 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-console-text">
                  Filter by role
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full rounded-lg border border-console-border px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  <option value="all">All Roles</option>
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-console-text">
                  Filter by status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="w-full rounded-lg border border-console-border px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending Payout</option>
                  <option value="clear">Fully Settled</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-console-text">
                  Sort by
                </label>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="w-full rounded-lg border border-console-border px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <div className="flex items-center gap-1 rounded-lg border border-console-border p-1">
                  <Tooltip label="Grid view">
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      aria-label="Grid view"
                      className={cn(
                        "rounded-md p-1.5 transition-colors",
                        viewMode === "grid"
                          ? "bg-brand-50 text-brand-700"
                          : "text-console-muted hover:bg-console-bg"
                      )}
                    >
                      <GridIcon size={16} />
                    </button>
                  </Tooltip>
                  <Tooltip label="List view">
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      aria-label="List view"
                      className={cn(
                        "rounded-md p-1.5 transition-colors",
                        viewMode === "list"
                          ? "bg-brand-50 text-brand-700"
                          : "text-console-muted hover:bg-console-bg"
                      )}
                    >
                      <List size={16} />
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>
          </Card>

          {/* Results Views */}
          {filteredUsers.length === 0 ? (
            <Card>
              <EmptyState
                icon={Users}
                title="No employees found"
                description="Try adjusting your search or filters."
              />
            </Card>
          ) : viewMode === "grid" ? (
            /* Grid Card View */
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredUsers.map((user) => {
                const pending = calculateTotalToBePaid(user.salaryAssignments);
                const pendingCount = calculatePendingCount(user.salaryAssignments);

                return (
                  <Card
                    key={user._id}
                    className="transition-shadow hover:shadow-console-lg"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={user.name}
                          imageUrl={(user as any).profileImage}
                          className="h-11 w-11 shrink-0 text-base"
                        />
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-console-text">
                            {user.name}
                          </h3>
                          <Badge variant={roleBadgeVariant(user.role)}>
                            {user.role}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-console-muted">
                        <Mail size={13} className="shrink-0" />
                        <span className="truncate">{user.email}</span>
                        <CopyButton value={user.email} label="Email" />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-console-muted">
                        <BadgeIndianRupee size={13} className="shrink-0" /> Fixed:{" "}
                        <span className="font-medium text-console-text">
                          {formatCurrency(user.fixedSalary)}
                        </span>
                      </div>
                    </div>

                    {/* Stats Grid Pill */}
                    <div className="mb-4 grid grid-cols-2 gap-2 rounded-console bg-console-bg p-3 text-center">
                      <div>
                        <p className="text-lg font-semibold text-success-700">
                          {formatCurrency(user.totalSalary)}
                        </p>
                        <p className="text-xs text-console-muted">Total Paid</p>
                      </div>
                      <div>
                        <p
                          className={cn(
                            "text-lg font-semibold",
                            pending > 0 ? "text-danger-700" : "text-console-muted"
                          )}
                        >
                          {formatCurrency(pending)}
                        </p>
                        <p className="text-xs text-console-muted">
                          Pending {pendingCount > 0 && `(${pendingCount})`}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setHistoryModalUser(user)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-console-bg px-3 py-2 text-sm font-medium text-console-text transition-colors hover:bg-slate-200"
                      >
                        <Eye size={14} /> History
                      </button>
                      <Tooltip label="Add salary assignment">
                        <button
                          type="button"
                          onClick={() =>
                            setAddSalaryTarget({ id: user._id, name: user.name })
                          }
                          aria-label="Add salary"
                          className="rounded-lg p-2 text-console-muted transition-colors hover:bg-brand-50 hover:text-brand-700"
                        >
                          <Plus size={16} />
                        </button>
                      </Tooltip>
                      <Tooltip label="Edit fixed salary">
                        <button
                          type="button"
                          onClick={() => setEditFixedSalaryUser(user)}
                          aria-label="Edit fixed salary"
                          className="rounded-lg p-2 text-console-muted transition-colors hover:bg-warning-50 hover:text-warning-700"
                        >
                          <Pencil size={16} />
                        </button>
                      </Tooltip>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* Table List View */
            <Card className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-console-border">
                  <thead className="bg-console-bg">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">
                        Employee
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">
                        Contact
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">
                        Role & Fixed Base
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">
                        Compensation Stats
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-console-muted">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-console-border">
                    {filteredUsers.map((user) => {
                      const pending = calculateTotalToBePaid(
                        user.salaryAssignments
                      );
                      const pendingCount = calculatePendingCount(
                        user.salaryAssignments
                      );

                      return (
                        <tr key={user._id} className="hover:bg-console-bg">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <Avatar
                                name={user.name}
                                imageUrl={(user as any).profileImage}
                                className="h-9 w-9 shrink-0 text-sm"
                              />
                              <div>
                                <div className="text-sm font-medium text-console-text">
                                  {user.name}
                                </div>
                                <div className="text-xs text-console-muted">
                                  {user.salaryAssignments?.length || 0} assignments
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2 text-sm text-console-text">
                              {user.email}
                              <CopyButton value={user.email} label="Email" />
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <Badge variant={roleBadgeVariant(user.role)}>
                                {user.role}
                              </Badge>
                              <span className="text-xs font-medium text-console-muted">
                                {formatCurrency(user.fixedSalary)} / mo
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="text-sm font-medium text-success-700">
                              {formatCurrency(user.totalSalary)} total paid
                            </div>
                            <div
                              className={cn(
                                "text-xs",
                                pending > 0
                                  ? "font-medium text-danger-600"
                                  : "text-console-muted"
                              )}
                            >
                              {formatCurrency(pending)} pending
                              {pendingCount > 0 && ` (${pendingCount})`}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center justify-center gap-1">
                              <Tooltip label="View salary history">
                                <button
                                  type="button"
                                  onClick={() => setHistoryModalUser(user)}
                                  aria-label="View history"
                                  className="rounded-lg p-2 text-console-muted transition-colors hover:bg-success-50 hover:text-success-700"
                                >
                                  <Eye size={16} />
                                </button>
                              </Tooltip>
                              <Tooltip label="Add salary assignment">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAddSalaryTarget({
                                      id: user._id,
                                      name: user.name,
                                    })
                                  }
                                  aria-label="Add salary assignment"
                                  className="rounded-lg p-2 text-console-muted transition-colors hover:bg-brand-50 hover:text-brand-700"
                                >
                                  <Plus size={16} />
                                </button>
                              </Tooltip>
                              <Tooltip label="Edit fixed salary">
                                <button
                                  type="button"
                                  onClick={() => setEditFixedSalaryUser(user)}
                                  aria-label="Edit fixed salary"
                                  className="rounded-lg p-2 text-console-muted transition-colors hover:bg-warning-50 hover:text-warning-700"
                                >
                                  <Pencil size={16} />
                                </button>
                              </Tooltip>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Salary History Modal */}
      <SalaryHistoryModal
        isOpen={!!historyModalUser}
        onClose={() => setHistoryModalUser(null)}
        user={historyModalUser}
        onSaveAmount={handleSaveAmount}
        onVerify={handleVerifySalary}
        loadingStates={loadingStates}
      />

      {/* Add Salary Modal */}
      {addSalaryTarget && (
        <AddSalaryModal
          isOpen={!!addSalaryTarget}
          onClose={() => setAddSalaryTarget(null)}
          userId={addSalaryTarget.id}
          userName={addSalaryTarget.name}
          onAssigned={async () => {
            await fetchSalaryData();
          }}
        />
      )}

      {/* Edit Fixed Salary Modal */}
      <EditFixedSalaryModal
        isOpen={!!editFixedSalaryUser}
        onClose={() => setEditFixedSalaryUser(null)}
        user={editFixedSalaryUser}
        onSave={handleSaveFixedSalary}
        isLoading={isUpdatingFixed}
      />
    </div>
  );
};

export default Salary;