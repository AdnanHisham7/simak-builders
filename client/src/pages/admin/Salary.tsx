import React, { useEffect, useState } from "react";
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
import { toast } from "sonner";
import {
  Lock,
  Users,
  Plus,
  ChevronDown,
  FileText,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

const formatCurrency = (amount: number) =>
  `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const roleBadgeVariant = (role: string): "error" | "info" | "success" | "neutral" => {
  switch (role.toLowerCase()) {
    case "admin":
      return "error";
    case "manager":
      return "info";
    case "employee":
      return "success";
    default:
      return "neutral";
  }
};

const Salary: React.FC = () => {
  const [users, setUsers] = useState<UserWithSalary[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [fixedSalaries, setFixedSalaries] = useState<{ [key: string]: number | undefined }>(
    {}
  );
  const [editableAmounts, setEditableAmounts] = useState<{
    [key: string]: number | undefined;
  }>({});
  const [loadingStates, setLoadingStates] = useState<{
    [key: string]: boolean;
  }>({});
  const [expandedUsers, setExpandedUsers] = useState<{
    [key: string]: boolean;
  }>({});
  const [editableAllowances, setEditableAllowances] = useState<{
    [key: string]: number | undefined;
  }>({});
  const [editableNotes, setEditableNotes] = useState<{
    [key: string]: string | undefined;
  }>({});
  const [addSalaryTarget, setAddSalaryTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const userType = useSelector((state: RootState) => state.auth.userType);

  useEffect(() => {
    if (userType === "admin") {
      setIsLoadingUsers(true);
      listSalaries()
        .then((data) => setUsers(data))
        .catch(() => toast.error("Failed to load salary data"))
        .finally(() => setIsLoadingUsers(false));
    }
  }, [userType]);

  const calculateTotalToBePaid = (salaryAssignments: SalaryAssignment[]) => {
    return salaryAssignments
      .filter((sa) => !sa.isVerified)
      .reduce((sum, sa) => sum + sa.amount + (sa.allowance || 0), 0);
  };

  const handleSaveFixedSalary = async (userId: string) => {
    const fixedSalary = fixedSalaries[userId];
    if (fixedSalary !== undefined) {
      setLoadingStates((prev) => ({ ...prev, [`fixed-${userId}`]: true }));
      try {
        await updateFixedSalary(userId, fixedSalary);
        const updatedUsers = await listSalaries();
        setUsers(updatedUsers);
        setFixedSalaries((prev) => ({ ...prev, [userId]: undefined }));
        toast.success("Fixed salary updated");
      } catch (err) {
        toast.error("Failed to update fixed salary");
      } finally {
        setLoadingStates((prev) => ({ ...prev, [`fixed-${userId}`]: false }));
      }
    }
  };

  const handleSaveAmount = async (
    userId: string,
    assignmentId: string,
    amount: number,
    allowance?: number,
    notes?: string,
  ) => {
    setLoadingStates((prev) => ({ ...prev, [`save-${assignmentId}`]: true }));
    try {
      await updateSalaryAssignmentAmount(userId, assignmentId, {
        amount,
        allowance,
        notes,
      });
      const updatedUsers = await listSalaries();
      setUsers(updatedUsers);
      setEditableAmounts((prev) => ({ ...prev, [assignmentId]: undefined }));
      setEditableAllowances((prev) => ({ ...prev, [assignmentId]: undefined }));
      setEditableNotes((prev) => ({ ...prev, [assignmentId]: undefined }));
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
    if (
      editableAmounts[assignmentId] !== undefined &&
      editableAmounts[assignmentId] !== originalAmount
    ) {
      toast.error("Please save the changes before verifying.");
      return;
    }

    setLoadingStates((prev) => ({ ...prev, [`verify-${assignmentId}`]: true }));
    try {
      await verifySalaryAssignment(userId, assignmentId);
      const updatedUsers = await listSalaries();
      setUsers(updatedUsers);
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

  const toggleUserExpansion = (userId: string) => {
    setExpandedUsers((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-console-text">Salary Management</h1>
          <p className="mt-0.5 text-sm text-console-muted">
            Manage employee compensation and verify salary assignments
          </p>
        </div>
        <Badge variant="default">{users.length} Employees</Badge>
      </div>

      {isLoadingUsers ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="No employees found" description="Employee data will appear here once available." />
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <Card key={user._id} className="overflow-visible">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-console-text">{user.name}</h2>
                    <p className="text-sm text-console-muted">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={roleBadgeVariant(user.role)}>{user.role}</Badge>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setAddSalaryTarget({ id: user._id, name: user.name })}
                  >
                    <Plus size={14} /> Add salary
                  </Button>
                  <button
                    type="button"
                    onClick={() => toggleUserExpansion(user._id)}
                    aria-label="Toggle salary history"
                    className="rounded-lg p-2 text-console-muted transition-colors hover:bg-console-bg hover:text-console-text"
                  >
                    <ChevronDown
                      size={18}
                      className={cn("transition-transform", expandedUsers[user._id] && "rotate-180")}
                    />
                  </button>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-console border border-console-border bg-console-bg p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-console-muted">To be paid</p>
                  <p className="mt-1 text-xl font-semibold text-danger-600">
                    {formatCurrency(calculateTotalToBePaid(user.salaryAssignments))}
                  </p>
                </div>
                <div className="rounded-console border border-console-border bg-console-bg p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-console-muted">Paid</p>
                  <p className="mt-1 text-xl font-semibold text-success-700">
                    {formatCurrency(user.totalSalary)}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-1 block text-sm font-medium text-console-text">Fixed salary</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={
                      fixedSalaries[user._id] !== undefined
                        ? fixedSalaries[user._id]
                        : user.fixedSalary
                    }
                    onChange={(e) =>
                      setFixedSalaries((prev) => ({
                        ...prev,
                        [user._id]: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-36 rounded-lg border border-console-border px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={loadingStates[`fixed-${user._id}`]}
                    onClick={() => handleSaveFixedSalary(user._id)}
                  >
                    Save
                  </Button>
                </div>
              </div>

              {expandedUsers[user._id] && (
                <div className="mt-6 border-t border-console-border pt-5">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-console-text">
                    <FileText size={16} className="text-brand-600" />
                    Salary history
                  </h3>
                  {user.salaryAssignments.length === 0 ? (
                    <p className="text-sm text-console-muted">No salary assignments yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {user.salaryAssignments.map((sa) => (
                        <div
                          key={sa._id}
                          className="rounded-console border border-console-border p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-5">
                              <div>
                                <p className="text-xs font-medium text-console-muted">Date</p>
                                <p className="text-sm text-console-text">
                                  {new Date(sa.date).toLocaleDateString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-console-muted">Amount</p>
                                {sa.isVerified ? (
                                  <p className="text-sm font-semibold text-console-text">
                                    {formatCurrency(sa.amount)}
                                  </p>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      value={
                                        editableAmounts[sa._id] !== undefined
                                          ? editableAmounts[sa._id]
                                          : sa.amount
                                      }
                                      onChange={(e) =>
                                        setEditableAmounts((prev) => ({
                                          ...prev,
                                          [sa._id]: parseFloat(e.target.value) || 0,
                                        }))
                                      }
                                      className="w-28 rounded-lg border border-console-border px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                                    />
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      loading={loadingStates[`save-${sa._id}`]}
                                      onClick={() =>
                                        handleSaveAmount(
                                          user._id,
                                          sa._id,
                                          editableAmounts[sa._id] ?? sa.amount,
                                          editableAllowances[sa._id] ?? sa.allowance ?? 0,
                                          editableNotes[sa._id] ?? sa.notes ?? "",
                                        )
                                      }
                                    >
                                      Save
                                    </Button>
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-xs font-medium text-console-muted">Allowance</p>
                                {sa.isVerified ? (
                                  <p className="text-sm text-console-text">
                                    {formatCurrency(sa.allowance || 0)}
                                  </p>
                                ) : (
                                  <input
                                    type="number"
                                    min="0"
                                    value={
                                      editableAllowances[sa._id] !== undefined
                                        ? editableAllowances[sa._id]
                                        : sa.allowance || 0
                                    }
                                    onChange={(e) =>
                                      setEditableAllowances((prev) => ({
                                        ...prev,
                                        [sa._id]: parseFloat(e.target.value) || 0,
                                      }))
                                    }
                                    className="w-28 rounded-lg border border-console-border px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                                  />
                                )}
                              </div>
                              <div>
                                <p className="text-xs font-medium text-console-muted">Assigned by</p>
                                <p className="text-sm text-console-text">{sa.givenBy?.name || "auto"}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-console-muted">Status</p>
                                {sa.isVerified ? (
                                  <Badge variant="success">
                                    <CheckCircle2 size={12} /> Verified
                                  </Badge>
                                ) : (
                                  <Badge variant="warning">
                                    <Clock size={12} /> Pending
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {!sa.isVerified && (
                              <Button
                                size="sm"
                                loading={loadingStates[`verify-${sa._id}`]}
                                onClick={() => handleVerifySalary(user._id, sa._id, sa.amount)}
                              >
                                {!loadingStates[`verify-${sa._id}`] && <CheckCircle2 size={14} />}
                                Verify
                              </Button>
                            )}
                          </div>
                          {(sa.notes || !sa.isVerified) && (
                            <div className="mt-3">
                              <p className="text-xs font-medium text-console-muted">Notes</p>
                              {sa.isVerified ? (
                                <p className="text-sm text-console-text">{sa.notes || "—"}</p>
                              ) : (
                                <input
                                  type="text"
                                  value={
                                    editableNotes[sa._id] !== undefined
                                      ? editableNotes[sa._id]
                                      : sa.notes || ""
                                  }
                                  onChange={(e) =>
                                    setEditableNotes((prev) => ({
                                      ...prev,
                                      [sa._id]: e.target.value,
                                    }))
                                  }
                                  placeholder="Optional notes..."
                                  className="mt-1 w-full rounded-lg border border-console-border px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {addSalaryTarget && (
        <AddSalaryModal
          isOpen={!!addSalaryTarget}
          onClose={() => setAddSalaryTarget(null)}
          userId={addSalaryTarget.id}
          userName={addSalaryTarget.name}
          onAssigned={async () => {
            const updatedUsers = await listSalaries();
            setUsers(updatedUsers);
          }}
        />
      )}
    </div>
  );
};

export default Salary;
