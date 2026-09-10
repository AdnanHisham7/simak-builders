import React, { useState, useEffect } from "react";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  HandCoins,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import {
  getCompanySummary,
  addCompanyFunds,
  getLenders,
  settleLender,
  CompanyTransaction,
  Lender,
} from "@/services/companyService";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import PageLoader from "@/components/ui/PageLoader";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { usePreferences } from "@/hooks/usePreferences";

interface CompanyFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (totalAmount: number) => void;
}

const CompanyFundsModal: React.FC<CompanyFundsModalProps> = ({
  isOpen,
  onClose,
  onUpdated,
}) => {
  const { formatNumber, formatDate } = usePreferences();
  const [activeTab, setActiveTab] = useState<"transactions" | "lenders">("transactions");

  const [totalAmount, setTotalAmount] = useState(0);
  const [transactions, setTransactions] = useState<CompanyTransaction[]>([]);
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Funds Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [amount, setAmount] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [isCapitalInfusion, setIsCapitalInfusion] = useState(false);
  const [capitalType, setCapitalType] = useState<"own" | "lended">("own");
  const [selectedLenderId, setSelectedLenderId] = useState<string>("");
  const [isNewLender, setIsNewLender] = useState(false);
  const [newLenderName, setNewLenderName] = useState("");
  const [newLenderPhone, setNewLenderPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Settlement Modal state
  const [settlingLender, setSettlingLender] = useState<Lender | null>(null);
  const [settleAmount, setSettleAmount] = useState<number | "">("");
  const [settleNotes, setSettleNotes] = useState("");
  const [isSettling, setIsSettling] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryData, lendersData] = await Promise.all([
        getCompanySummary(),
        getLenders(),
      ]);
      setTotalAmount(summaryData.totalAmount);
      setTransactions(summaryData.transactions);
      setLenders(lendersData);
    } catch (err) {
      toast.error("Failed to load company transactions & lenders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setShowAddForm(false);
      resetAddForm();
      setSettlingLender(null);
    }
  }, [isOpen]);

  const resetAddForm = () => {
    setAmount("");
    setNotes("");
    setIsCapitalInfusion(false);
    setCapitalType("own");
    setSelectedLenderId("");
    setIsNewLender(false);
    setNewLenderName("");
    setNewLenderPhone("");
  };

  const handleAddFunds = async () => {
    if (isSubmitting) return;
    if (!amount || Number(amount) <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }

    if (isCapitalInfusion && capitalType === "lended") {
      if (isNewLender) {
        if (!newLenderName.trim()) {
          toast.error("Please enter the lender's name");
          return;
        }
      } else if (!selectedLenderId) {
        toast.error("Please select an existing lender or add a new person");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const result = await addCompanyFunds({
        amount: Number(amount),
        notes: notes.trim(),
        isCapitalInfusion,
        capitalType: isCapitalInfusion ? capitalType : undefined,
        lenderId: isCapitalInfusion && capitalType === "lended" && !isNewLender ? selectedLenderId : undefined,
        newLenderName: isCapitalInfusion && capitalType === "lended" && isNewLender ? newLenderName.trim() : undefined,
        lenderPhone: isCapitalInfusion && capitalType === "lended" && isNewLender ? newLenderPhone.trim() : undefined,
      });

      toast.success("Funds added successfully");
      onUpdated(result.totalAmount);
      setShowAddForm(false);
      resetAddForm();
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to add funds");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSettle = async () => {
    if (!settlingLender || isSettling) return;
    const num = Number(settleAmount);
    if (!settleAmount || num <= 0) {
      toast.error("Please enter a valid settlement amount");
      return;
    }
    if (num > settlingLender.outstandingBalance) {
      toast.error(
        `Settlement amount cannot exceed outstanding balance of ₹${formatNumber(settlingLender.outstandingBalance)}`
      );
      return;
    }
    if (num > totalAmount) {
      toast.error(
        `Insufficient company funds. Available: ₹${formatNumber(totalAmount)}`
      );
      return;
    }

    setIsSettling(true);
    try {
      const res = await settleLender(
        settlingLender._id,
        num,
        settleNotes.trim()
      );
      toast.success(res.message || "Settlement recorded successfully");
      onUpdated(res.totalAmount);
      setSettlingLender(null);
      setSettleAmount("");
      setSettleNotes("");
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to record settlement");
    } finally {
      setIsSettling(false);
    }
  };

  const totalOutstandingDebt = lenders.reduce(
    (sum, l) => sum + (l.outstandingBalance || 0),
    0
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
        title="Company Funds & Capital"
        description={`Available: ₹${formatNumber(totalAmount)} • Outstanding Debt: ₹${formatNumber(totalOutstandingDebt)}`}
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex rounded-lg border border-console-border bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("transactions")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all",
                activeTab === "transactions"
                  ? "bg-white text-console-text shadow-sm"
                  : "text-console-muted hover:text-console-text"
              )}
            >
              <DollarSign size={14} /> Transactions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("lenders")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all",
                activeTab === "lenders"
                  ? "bg-white text-console-text shadow-sm"
                  : "text-console-muted hover:text-console-text"
              )}
            >
              <HandCoins size={14} /> Lenders Ledger ({lenders.length})
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setShowAddForm((v) => !v);
              if (showAddForm) resetAddForm();
            }}
          >
            <Plus size={15} /> Add funds
          </Button>
        </div>

        {showAddForm && (
          <div className="mb-5 space-y-3.5 rounded-console border-2 border-brand-200 bg-brand-50/40 p-4 transition-all">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-700">
              Add Funds to Company
            </h4>

            <div>
              <label className="mb-1 block text-sm font-medium text-console-text">
                Amount (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-full rounded-lg border border-console-border bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </div>

            {/* Capital Infusion Checkbox */}
            <div className="rounded-lg border border-brand-200 bg-white p-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-console-text">
                <input
                  type="checkbox"
                  checked={isCapitalInfusion}
                  onChange={(e) => setIsCapitalInfusion(e.target.checked)}
                  className="h-4 w-4 rounded border-console-border text-brand-600 focus:ring-brand-500"
                />
                Mark as Owner Capital Infusion
              </label>

              {isCapitalInfusion && (
                <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
                  <div className="flex gap-4">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-console-text">
                      <input
                        type="radio"
                        name="capitalType"
                        value="own"
                        checked={capitalType === "own"}
                        onChange={() => setCapitalType("own")}
                        className="text-brand-600 focus:ring-brand-500"
                      />
                      <span>Own Capital (Self-funded)</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-console-text">
                      <input
                        type="radio"
                        name="capitalType"
                        value="lended"
                        checked={capitalType === "lended"}
                        onChange={() => setCapitalType("lended")}
                        className="text-brand-600 focus:ring-brand-500"
                      />
                      <span>Lended / Borrowed (Loan)</span>
                    </label>
                  </div>

                  {capitalType === "lended" && (
                    <div className="space-y-2.5 rounded-md bg-slate-50 p-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-console-text">
                          Lender Details *
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewLender((v) => !v);
                            setSelectedLenderId("");
                          }}
                          className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                        >
                          {isNewLender ? (
                            "Select Existing Lender"
                          ) : (
                            <>
                              <UserPlus size={13} /> + Add New Person
                            </>
                          )}
                        </button>
                      </div>

                      {isNewLender ? (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <input
                            type="text"
                            placeholder="Person / Lender Name *"
                            value={newLenderName}
                            onChange={(e) => setNewLenderName(e.target.value)}
                            className="w-full rounded-lg border border-console-border bg-white px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Phone Number (Optional)"
                            value={newLenderPhone}
                            onChange={(e) => setNewLenderPhone(e.target.value)}
                            className="w-full rounded-lg border border-console-border bg-white px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
                          />
                        </div>
                      ) : (
                        <select
                          value={selectedLenderId}
                          onChange={(e) => {
                            if (e.target.value === "new") {
                              setIsNewLender(true);
                              setSelectedLenderId("");
                            } else {
                              setSelectedLenderId(e.target.value);
                            }
                          }}
                          className="w-full rounded-lg border border-console-border bg-white px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
                        >
                          <option value="">Choose lender from list...</option>
                          {lenders.map((l) => (
                            <option key={l._id} value={l._id}>
                              {l.name} {l.phone ? `(${l.phone})` : ""} — Balance: ₹
                              {formatNumber(l.outstandingBalance)}
                            </option>
                          ))}
                          <option value="new">+ Type a new person...</option>
                        </select>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-console-text">
                Notes / Purpose{" "}
                <span className="text-xs text-console-muted">(Optional)</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-console-border bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                placeholder="e.g. For project working capital"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                disabled={isSubmitting}
                onClick={() => {
                  setShowAddForm(false);
                  resetAddForm();
                }}
              >
                Cancel
              </Button>
              <Button size="sm" loading={isSubmitting} onClick={handleAddFunds}>
                Confirm add
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <PageLoader label="Loading data" fullHeight={false} />
        ) : activeTab === "transactions" ? (
          transactions.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="No transactions yet"
              description="Fund additions, expenditures, and settlements will appear here."
            />
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const isIncoming = tx.amount >= 0;
                return (
                  <div
                    key={tx._id}
                    className="flex items-center justify-between rounded-console border border-console-border bg-white p-3.5 transition-shadow hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                          isIncoming
                            ? "bg-success-50 text-success-700"
                            : "bg-danger-50 text-danger-700"
                        )}
                      >
                        {isIncoming ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-sm font-medium text-console-text">
                            {tx.description || tx.type}
                          </p>
                          {tx.isCapitalInfusion && (
                            <Badge
                              variant={tx.capitalType === "lended" ? "warning" : "success"}
                              className="text-[10px]"
                            >
                              {tx.capitalType === "lended"
                                ? `Loan (${tx.lenderName || "Lender"})`
                                : "Own Capital"}
                            </Badge>
                          )}
                          {tx.settlementFor && (
                            <Badge variant="brand" className="text-[10px]">
                              Repayment to {tx.lenderName || "Lender"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-console-muted">
                          {formatDate(tx.date)}
                          {tx.site?.name ? ` • Site: ${tx.site.name}` : ""}
                        </p>
                      </div>
                    </div>
                    <p
                      className={cn(
                        "font-semibold whitespace-nowrap",
                        isIncoming ? "text-success-700" : "text-danger-700"
                      )}
                    >
                      {isIncoming ? "+" : ""}
                      {formatNumber(tx.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Lenders Ledger Tab */
          lenders.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No lenders recorded"
              description="When you add funds marked as Lended Capital, lenders will be tracked here for settlement."
            />
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-800">
                Lenders ledger tracks all borrowed amounts and allows recording partial or full loan repayments directly from company funds.
              </div>

              {lenders.map((lender) => (
                <div
                  key={lender._id}
                  className="flex flex-col justify-between gap-3 rounded-console border border-console-border bg-white p-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-console-text">
                        {lender.name}
                      </h4>
                      {lender.outstandingBalance === 0 ? (
                        <Badge variant="success" className="text-[10px]">
                          Fully Settled
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="text-[10px]">
                          Pending
                        </Badge>
                      )}
                    </div>
                    {lender.phone && (
                      <p className="text-xs text-console-muted">{lender.phone}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-console-muted">
                      <span>Total Lended: <strong className="text-console-text">₹{formatNumber(lender.totalLended)}</strong></span>
                      <span>Settled: <strong className="text-success-700">₹{formatNumber(lender.totalSettled)}</strong></span>
                      <span>Balance: <strong className={lender.outstandingBalance > 0 ? "text-danger-600" : "text-success-700"}>₹{formatNumber(lender.outstandingBalance)}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={lender.outstandingBalance > 0 ? "primary" : "secondary"}
                      disabled={lender.outstandingBalance <= 0}
                      onClick={() => {
                        setSettlingLender(lender);
                        setSettleAmount(lender.outstandingBalance);
                        setSettleNotes("");
                      }}
                    >
                      <HandCoins size={14} /> Settle / Repay
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </Modal>

      {/* Settle Loan Repayment Sub-Modal */}
      {settlingLender && (
        <Modal
          isOpen={true}
          onClose={() => !isSettling && setSettlingLender(null)}
          size="sm"
          title={`Settle Loan with ${settlingLender.name}`}
          description={`Outstanding balance: ₹${formatNumber(settlingLender.outstandingBalance)}`}
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-console-text">
                Settlement Amount (₹) *
              </label>
              <input
                type="number"
                min="1"
                max={settlingLender.outstandingBalance}
                step="0.01"
                value={settleAmount}
                onChange={(e) =>
                  setSettleAmount(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2",
                  settleAmount !== "" &&
                    (Number(settleAmount) > settlingLender.outstandingBalance ||
                      Number(settleAmount) > totalAmount)
                    ? "border-danger-500 focus:border-danger-500 focus:ring-danger-100"
                    : "border-console-border focus:border-brand-500 focus:ring-brand-100"
                )}
                placeholder="0.00"
                disabled={isSettling}
              />
              {settleAmount !== "" &&
                Number(settleAmount) > settlingLender.outstandingBalance && (
                  <p className="mt-1 text-xs text-danger-600">
                    Amount cannot exceed outstanding balance of ₹
                    {formatNumber(settlingLender.outstandingBalance)}.
                  </p>
                )}
              {settleAmount !== "" &&
                Number(settleAmount) <= settlingLender.outstandingBalance &&
                Number(settleAmount) > totalAmount && (
                  <p className="mt-1 text-xs text-danger-600">
                    Amount exceeds available company funds (₹
                    {formatNumber(totalAmount)}).
                  </p>
                )}
              <p className="mt-1 text-xs text-console-muted">
                Will be deducted from Company Funds (Available: ₹{formatNumber(totalAmount)}).
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-console-text">
                Settlement Notes / Reference
              </label>
              <input
                type="text"
                value={settleNotes}
                onChange={(e) => setSettleNotes(e.target.value)}
                className="w-full rounded-lg border border-console-border px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                placeholder="e.g. Bank transfer / Final settlement"
                disabled={isSettling}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={isSettling}
                onClick={() => setSettlingLender(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                loading={isSettling}
                disabled={
                  !settleAmount ||
                  Number(settleAmount) <= 0 ||
                  Number(settleAmount) > settlingLender.outstandingBalance ||
                  Number(settleAmount) > totalAmount
                }
                onClick={handleSettle}
              >
                Confirm Settlement
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default CompanyFundsModal;
