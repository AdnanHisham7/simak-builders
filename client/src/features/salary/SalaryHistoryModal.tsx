import React, { useState, useMemo, useEffect } from "react";
import {
  FileText,
  CheckCircle2,
  Clock,
  Save,
  Calendar,
  User,
  BadgeIndianRupee,
  StickyNote,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Avatar from "@/components/ui/Avatar";
import { UserWithSalary } from "@/services/userService";

interface SalaryHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserWithSalary | null;
  onSaveAmount: (
    userId: string,
    assignmentId: string,
    amount: number,
    allowance?: number,
    notes?: string
  ) => Promise<void>;
  onVerify: (
    userId: string,
    assignmentId: string,
    originalAmount: number
  ) => Promise<void>;
  loadingStates: { [key: string]: boolean };
}

const formatCurrency = (amount: number | undefined) =>
  `₹${(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const SalaryHistoryModal: React.FC<SalaryHistoryModalProps> = ({
  isOpen,
  onClose,
  user,
  onSaveAmount,
  onVerify,
  loadingStates,
}) => {
  const [editableAmounts, setEditableAmounts] = useState<{
    [key: string]: number;
  }>({});
  const [editableAllowances, setEditableAllowances] = useState<{
    [key: string]: number;
  }>({});
  const [editableNotes, setEditableNotes] = useState<{
    [key: string]: string;
  }>({});

  useEffect(() => {
    if (user) {
      const amounts: { [key: string]: number } = {};
      const allowances: { [key: string]: number } = {};
      const notes: { [key: string]: string } = {};

      user.salaryAssignments.forEach((sa) => {
        amounts[sa._id] = sa.amount;
        allowances[sa._id] = sa.allowance || 0;
        notes[sa._id] = sa.notes || "";
      });

      setEditableAmounts(amounts);
      setEditableAllowances(allowances);
      setEditableNotes(notes);
    }
  }, [user, isOpen]);

  const sortedAssignments = useMemo(() => {
    if (!user?.salaryAssignments) return [];
    return [...user.salaryAssignments].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [user?.salaryAssignments]);

  const totalPending = useMemo(() => {
    if (!user) return 0;
    return user.salaryAssignments
      .filter((sa) => !sa.isVerified)
      .reduce((sum, sa) => sum + sa.amount + (sa.allowance || 0), 0);
  }, [user]);

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Salary History - ${user.name}`}
      description={`View and verify payment records and allowances for ${user.email}`}
      size="xl"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-5">
        {/* Top Summary Banner with Avatar */}
        <div className="flex flex-col gap-4 rounded-xl border border-console-border bg-console-bg/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Avatar
              name={user.name}
              imageUrl={(user as any).profileImage}
              className="h-12 w-12 text-base"
            />
            <div>
              <h3 className="text-base font-semibold text-console-text">
                {user.name}
              </h3>
              <p className="text-xs text-console-muted">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 sm:justify-end">
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-console-muted">
                Total Paid
              </p>
              <p className="text-base font-semibold text-success-700">
                {formatCurrency(user.totalSalary)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-console-muted">
                Pending Payout
              </p>
              <p className="text-base font-semibold text-danger-600">
                {formatCurrency(totalPending)}
              </p>
            </div>
          </div>
        </div>

        {/* Assignment Records List */}
        {sortedAssignments.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No salary records"
            description="No salary assignments have been recorded for this employee yet."
          />
        ) : (
          <div className="space-y-3.5">
            {sortedAssignments.map((sa) => {
              const currentAmount =
                editableAmounts[sa._id] !== undefined
                  ? editableAmounts[sa._id]
                  : sa.amount;
              const currentAllowance =
                editableAllowances[sa._id] !== undefined
                  ? editableAllowances[sa._id]
                  : sa.allowance || 0;
              const currentNote =
                editableNotes[sa._id] !== undefined
                  ? editableNotes[sa._id]
                  : sa.notes || "";

              const hasModifications =
                currentAmount !== sa.amount ||
                currentAllowance !== (sa.allowance || 0) ||
                currentNote !== (sa.notes || "");

              return (
                <div
                  key={sa._id}
                  className="rounded-xl border border-console-border bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <span className="flex items-center gap-1.5 text-xs font-medium text-console-muted">
                          <Calendar size={13} /> Date
                        </span>
                        <p className="mt-1 text-sm font-medium text-console-text">
                          {new Date(sa.date).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>

                      <div>
                        <span className="flex items-center gap-1.5 text-xs font-medium text-console-muted">
                          <BadgeIndianRupee size={13} /> Base Amount
                        </span>
                        {sa.isVerified ? (
                          <p className="mt-1 text-sm font-semibold text-console-text">
                            {formatCurrency(sa.amount)}
                          </p>
                        ) : (
                          <input
                            type="number"
                            value={currentAmount}
                            onChange={(e) =>
                              setEditableAmounts((prev) => ({
                                ...prev,
                                [sa._id]: parseFloat(e.target.value) || 0,
                              }))
                            }
                            className="mt-1 w-full rounded-lg border border-console-border px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                          />
                        )}
                      </div>

                      <div>
                        <span className="flex items-center gap-1.5 text-xs font-medium text-console-muted">
                          <BadgeIndianRupee size={13} /> Allowance
                        </span>
                        {sa.isVerified ? (
                          <p className="mt-1 text-sm text-console-text">
                            {formatCurrency(sa.allowance || 0)}
                          </p>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            value={currentAllowance}
                            onChange={(e) =>
                              setEditableAllowances((prev) => ({
                                ...prev,
                                [sa._id]: parseFloat(e.target.value) || 0,
                              }))
                            }
                            className="mt-1 w-full rounded-lg border border-console-border px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                          />
                        )}
                      </div>

                      <div>
                        <span className="flex items-center gap-1.5 text-xs font-medium text-console-muted">
                          <User size={13} /> Assigned By
                        </span>
                        <p className="mt-1 truncate text-sm text-console-text">
                          {sa.givenBy?.name || "System"}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center justify-between gap-3 border-t border-console-border pt-3 sm:justify-end lg:border-t-0 lg:pt-0">
                      <div>
                        {sa.isVerified ? (
                          <Badge variant="success">
                            <CheckCircle2 size={12} className="mr-1 inline" /> Verified
                          </Badge>
                        ) : (
                          <Badge variant="warning">
                            <Clock size={12} className="mr-1 inline" /> Pending
                          </Badge>
                        )}
                      </div>

                      {!sa.isVerified && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={loadingStates[`save-${sa._id}`]}
                            disabled={!hasModifications}
                            onClick={() =>
                              onSaveAmount(
                                user._id,
                                sa._id,
                                currentAmount,
                                currentAllowance,
                                currentNote
                              )
                            }
                          >
                            <Save size={13} /> Save
                          </Button>
                          <Button
                            size="sm"
                            loading={loadingStates[`verify-${sa._id}`]}
                            onClick={() =>
                              onVerify(user._id, sa._id, sa.amount)
                            }
                          >
                            <CheckCircle2 size={13} /> Verify
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {(sa.notes || !sa.isVerified) && (
                    <div className="mt-3 border-t border-slate-100 pt-2.5">
                      <span className="flex items-center gap-1 text-xs font-medium text-console-muted">
                        <StickyNote size={12} /> Notes
                      </span>
                      {sa.isVerified ? (
                        <p className="mt-0.5 text-xs text-console-text">
                          {sa.notes || "—"}
                        </p>
                      ) : (
                        <input
                          type="text"
                          value={currentNote}
                          onChange={(e) =>
                            setEditableNotes((prev) => ({
                              ...prev,
                              [sa._id]: e.target.value,
                            }))
                          }
                          placeholder="Optional notes or remarks..."
                          className="mt-1 w-full rounded-lg border border-console-border px-3 py-1.5 text-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SalaryHistoryModal;