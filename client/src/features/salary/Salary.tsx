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
import { toast } from "sonner";
import { Lock, Users, Plus, FileText, CheckCircle2, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import Tooltip from "@/components/ui/Tooltip";

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

const sortAssignmentsNewestFirst = (assignments: SalaryAssignment[]) =>
  [...assignments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

interface SalaryHistoryPanelProps {
  user: UserWithSalary;
  editableAmounts: { [key: string]: number | undefined };
  editableAllowances: { [key: string]: number | undefined };
  editableNotes: { [key: string]: string | undefined };
  loadingStates: { [key: string]: boolean };
  onAmountChange: (assignmentId: string, value: number) => void;
  onAllowanceChange: (assignmentId: string, value: number) => void;
  onNotesChange: (assignmentId: string, value: string) => void;
  onSaveAmount: (assignmentId: string, sa: SalaryAssignment) => void;
  onVerify: (assignmentId: string, originalAmount: number) => void;
}

const SalaryHistoryPanel: React.FC<SalaryHistoryPanelProps> = ({
  user,
  editableAmounts,
  editableAllowances,
  editableNotes,
  loadingStates,
  onAmountChange,
  onAllowanceChange,
  onNotesChange,
  onSaveAmount,
  onVerify,
}) => {
  const sortedAssignments = useMemo(
    () => sortAssignmentsNewestFirst(user.salaryAssignments),
    [user.salaryAssignments],
  );

  return (
    <div className="flex h-full flex-col rounded-console border border-console-border bg-console-bg/60">
      <div className="flex shrink-0 items-center gap-2 border-b border-console-border px-4 py-3">
        <FileText size={16} className="text-brand-600" />
        <h3 className="text-sm font-semibold text-console-text">Salary history</h3>
        <span className="ml-auto text-xs text-console-muted">
          {sortedAssignments.length} {sortedAssignments.length === 1 ? "record" : "records"}
        </span>
      </div>

      {sortedAssignments.length === 0 ? (
        <p className="p-4 text-sm text-console-muted">No salary assignments yet.</p>
      ) : (
        <div className="no-scrollbar max-h-[420px] flex-1 space-y-3 overflow-y-auto p-4">
          {sortedAssignments.map((sa) => (
            <div
              key={sa._id}
              className="rounded-console border border-console-border bg-white p-4 shadow-console"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
                          value={editableAmounts[sa._id] !== undefined ? editableAmounts[sa._id] : sa.amount}
                          onChange={(e) => onAmountChange(sa._id, parseFloat(e.target.value) || 0)}
                          className="w-24 rounded-lg border border-console-border px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-console-muted">Allowance</p>
                    {sa.isVerified ? (
                      <p className="text-sm text-console-text">{formatCurrency(sa.allowance || 0)}</p>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        value={editableAllowances[sa._id] !== undefined ? editableAllowances[sa._id] : sa.allowance || 0}
                        onChange={(e) => onAllowanceChange(sa._id, parseFloat(e.target.value) || 0)}
                        className="w-24 rounded-lg border border-console-border px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
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
                  <div className="flex shrink-0 flex-col gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={loadingStates[`save-${sa._id}`]}
                      onClick={() => onSaveAmount(sa._id, sa)}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      loading={loadingStates[`verify-${sa._id}`]}
                      onClick={() => onVerify(sa._id, sa.amount)}
                    >
                      {!loadingStates[`verify-${sa._id}`] && <CheckCircle2 size={14} />}
                      Verify
                    </Button>
                  </div>
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
                      value={editableNotes[sa._id] !== undefined ? editableNotes[sa._id] : sa.notes || ""}
                      onChange={(e) => onNotesChange(sa._id, e.target.value)}
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
  );
};

const Salary: React.FC = () => {
  const [users, setUsers] = useState<UserWithSalary[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [fixedSalaries, setFixedSalaries] = useState<{ [key: string]: number | undefined }>({});
  const [editableAmounts, setEditableAmounts] = useState<{ [key: string]: number | undefined }>({});
  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});
  const [editableAllowances, setEditableAllowances] = useState<{ [key: string]: number | undefined }>({});
  const [editableNotes, setEditableNotes] = useState<{ [key: string]: string | undefined }>({});
  const [addSalaryTarget, setAddSalaryTarget] = useState<{ id: string; name: string } | null>(null);
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
      await updateSalaryAssignmentAmount(userId, assignmentId, { amount, allowance, notes });
      const updatedUsers = await listSalaries();
      setUsers(updatedUsers);
      setEditableAmounts((prev) => ({ ...prev, [assignmentId]: undefined }));
      setEditableAllowances((prev) => ({ ...prev, [assignmentId]: undefined }));
      setEditableNotes((prev) => ({ ...prev, [assignmentId]: undefined }));
      toast.success("Salary assignment updated");
    } catch (err) {
      toast.error("Failed to update salary assignment");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [`save-${assignmentId}`]: false }));
    }
  };

  const handleVerifySalary = async (userId: string, assignmentId: string, originalAmount: number) => {
    if (editableAmounts[assignmentId] !== undefined && editableAmounts[assignmentId] !== originalAmount) {
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
      setLoadingStates((prev) => ({ ...prev, [`verify-${assignmentId}`]: false }));
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
        <div className="space-y-5">
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
                  <Tooltip label="Assign a new salary payment to this employee">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setAddSalaryTarget({ id: user._id, name: user.name })}
                    >
                      <Plus size={14} /> Add salary
                    </Button>
                  </Tooltip>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]">
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-console border border-console-border bg-console-bg p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-console-muted">
                        To be paid
                      </p>
                      <p className="mt-1 text-lg font-semibold text-danger-600">
                        {formatCurrency(calculateTotalToBePaid(user.salaryAssignments))}
                      </p>
                    </div>
                    <div className="rounded-console border border-console-border bg-console-bg p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-console-muted">Paid</p>
                      <p className="mt-1 text-lg font-semibold text-success-700">
                        {formatCurrency(user.totalSalary)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-console border border-console-border bg-console-bg p-4">
                    <label className="mb-2 block text-sm font-medium text-console-text">Fixed salary</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={
                          fixedSalaries[user._id] !== undefined ? fixedSalaries[user._id] : user.fixedSalary
                        }
                        onChange={(e) =>
                          setFixedSalaries((prev) => ({
                            ...prev,
                            [user._id]: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-full min-w-0 rounded-lg border border-console-border bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
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
                </div>

                <SalaryHistoryPanel
                  user={user}
                  editableAmounts={editableAmounts}
                  editableAllowances={editableAllowances}
                  editableNotes={editableNotes}
                  loadingStates={loadingStates}
                  onAmountChange={(id, value) => setEditableAmounts((prev) => ({ ...prev, [id]: value }))}
                  onAllowanceChange={(id, value) => setEditableAllowances((prev) => ({ ...prev, [id]: value }))}
                  onNotesChange={(id, value) => setEditableNotes((prev) => ({ ...prev, [id]: value }))}
                  onSaveAmount={(assignmentId, sa) =>
                    handleSaveAmount(
                      user._id,
                      assignmentId,
                      editableAmounts[assignmentId] ?? sa.amount,
                      editableAllowances[assignmentId] ?? sa.allowance ?? 0,
                      editableNotes[assignmentId] ?? sa.notes ?? "",
                    )
                  }
                  onVerify={(assignmentId, originalAmount) =>
                    handleVerifySalary(user._id, assignmentId, originalAmount)
                  }
                />
              </div>
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
