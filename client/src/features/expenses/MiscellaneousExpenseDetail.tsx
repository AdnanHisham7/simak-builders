import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ArrowLeft,
  Wrench,
  Building2,
  User,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  ExternalLink,
  Receipt,
  Wallet,
  AlertCircle,
  Tag,
  Coins,
  Store,
  FileText,
  Truck,
} from "lucide-react";
import { RootState } from "@/store/store";
import {
  getMiscellaneousExpenseById,
  verifyMiscellaneousExpense,
} from "@/services/miscellaneousExpenseService";
import { usePreferences } from "@/hooks/usePreferences";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import PageLoader from "@/components/ui/PageLoader";
import EmptyState from "@/components/ui/EmptyState";
import { toast } from "sonner";

const CATEGORY_COLORS: Record<string, string> = {
  machinery: "bg-amber-500/10 text-amber-700 border-amber-300",
  rental: "bg-purple-500/10 text-purple-700 border-purple-300",
  service: "bg-blue-500/10 text-blue-700 border-blue-300",
  material: "bg-emerald-500/10 text-emerald-700 border-emerald-300",
};

export const MiscellaneousExpenseDetail: React.FC = () => {
  const { expenseId } = useParams<{ expenseId: string }>();
  const navigate = useNavigate();
  const { formatDate, formatNumber } = usePreferences();
  const { userType } = useSelector((state: RootState) => state.auth);

  const [expense, setExpense] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  const fetchExpense = async () => {
    if (!expenseId) return;
    try {
      setLoading(true);
      const data = await getMiscellaneousExpenseById(expenseId);
      setExpense(data);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to load expense details"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpense();
  }, [expenseId]);

  const handleVerify = async () => {
    if (!expenseId) return;
    try {
      setVerifying(true);
      await verifyMiscellaneousExpense(expenseId);
      toast.success("Miscellaneous expense verified successfully");
      await fetchExpense();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to verify expense"
      );
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return <PageLoader fullHeight label="Loading expense details..." />;
  }

  if (!expense) {
    return (
      <div className="p-6">
        <EmptyState
          icon={AlertCircle}
          title="Expense Not Found"
          description="The requested miscellaneous expense record could not be found or may have been deleted."
          action={
            <Button variant="secondary" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} /> Go Back
            </Button>
          }
        />
      </div>
    );
  }

  const isVerified = expense.status === "verified";
  const totalExpenseCost = (Number(expense.amount) || 0) + (Number(expense.tip) || 0);
  const siteUrl = expense.site?._id
    ? `/${userType === "siteManager" ? "siteManager" : "admin"}/sites/${expense.site._id}`
    : null;
  const relatedPurchaseUrl = expense.purchaseId?._id || expense.purchaseId
    ? `/${userType === "siteManager" ? "siteManager" : "admin"}/purchases/${
        typeof expense.purchaseId === "object" ? expense.purchaseId._id : expense.purchaseId
      }`
    : null;

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Top Header Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 shadow-xs"
          >
            <ArrowLeft size={16} /> Back
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-console-text">
                Miscellaneous Expense Details
              </h1>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${
                  CATEGORY_COLORS[expense.category] || "bg-slate-100 text-slate-700"
                }`}
              >
                {expense.category}
              </span>
              <Badge variant={isVerified ? "success" : "warning"}>
                {isVerified ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={12} /> Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> Pending Verification
                  </span>
                )}
              </Badge>
            </div>
            <p className="text-xs text-console-muted mt-0.5">
              Record ID: <code className="font-mono">{expense._id}</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isVerified && userType === "admin" && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleVerify}
              loading={verifying}
              className="flex items-center gap-1.5"
            >
              <CheckCircle2 size={15} /> Verify Expense
            </Button>
          )}
        </div>
      </div>

      {/* Linked Purchase Order Banner */}
      {expense.purchaseId && (
        <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/90 via-sky-50/50 to-slate-50 p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                <Truck size={20} />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Linked to Purchase Order #
                    {typeof expense.purchaseId === "object"
                      ? expense.purchaseId._id?.slice(-8)
                      : String(expense.purchaseId).slice(-8)}
                  </h3>
                  <Badge variant="info">Transportation Service</Badge>
                  {typeof expense.purchaseId === "object" && expense.purchaseId.status && (
                    <Badge
                      variant={
                        expense.purchaseId.status === "verified" ? "success" : "warning"
                      }
                    >
                      Purchase:{" "}
                      {expense.purchaseId.status === "verified"
                        ? "Verified"
                        : "Pending Verification"}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                  This expense represents the delivery / freight charge recorded for a purchase
                  order.
                  {typeof expense.purchaseId === "object" && expense.purchaseId.totalAmount !== undefined && (
                    <>
                      {" "}The vendor invoice is{" "}
                      <strong className="text-slate-800 font-semibold">
                        ₹{formatNumber(expense.purchaseId.totalAmount)}
                      </strong>
                      {expense.purchaseId.vendor?.name
                        ? ` from ${expense.purchaseId.vendor.name}`
                        : ""}
                      . It is tracked as an independent miscellaneous service expense to keep the
                      supplier material invoice separate from site logistics fees.
                    </>
                  )}
                </p>
              </div>
            </div>

            {relatedPurchaseUrl && (
              <div className="shrink-0 self-end md:self-center">
                <Link
                  to={relatedPurchaseUrl}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
                >
                  View Related Purchase <ExternalLink size={13} />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-brand-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-console-muted">
              Base Amount
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Receipt size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-console-text">
            ₹{formatNumber(expense.amount || 0)}
          </p>
          <span className="mt-1 text-xs text-console-muted">
            Direct operational expense
          </span>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-console-muted">
              Tip / Additional
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Coins size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-console-text">
            ₹{formatNumber(expense.tip || 0)}
          </p>
          <span className="mt-1 text-xs text-console-muted">
            Gratuity or extra incidental
          </span>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-console-muted">
              Total Cost
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Wallet size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            ₹{formatNumber(totalExpenseCost)}
          </p>
          <span className="mt-1 text-xs text-console-muted">
            Base amount + tip combined
          </span>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-console-muted">
              Payment & Source
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
              <CreditCard size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-bold capitalize text-console-text">
              {expense.paymentMethod || "Cash"}
            </span>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 capitalize">
              {expense.sourceOfFunds === "siteManager" ? "Site Manager" : "Company"}
            </span>
          </div>
          <span className="mt-1 text-xs text-console-muted truncate">
            {expense.deductFromUserId?.name
              ? `Debited: ${expense.deductFromUserId.name}`
              : "Company account"}
          </span>
        </Card>
      </div>

      {/* Primary Details Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Expense Core Info */}
        <Card title="Expense Description" description="Primary operational event">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <Wrench size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-console-text">
                  {expense.name}
                </p>
                <p className="text-xs text-console-muted capitalize mt-0.5">
                  Category: {expense.category}
                </p>
              </div>
            </div>

            {relatedPurchaseUrl && (
              <div className="mt-3 rounded-lg border border-blue-200/80 bg-blue-50/50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-blue-950 flex items-center gap-1.5">
                    <Truck size={14} className="text-blue-600" />
                    Linked Purchase Order
                  </p>
                  {typeof expense.purchaseId === "object" && expense.purchaseId.status && (
                    <Badge
                      variant={
                        expense.purchaseId.status === "verified" ? "success" : "warning"
                      }
                    >
                      {expense.purchaseId.status}
                    </Badge>
                  )}
                </div>
                {typeof expense.purchaseId === "object" && (
                  <div className="text-xs text-slate-600 space-y-1">
                    {expense.purchaseId.vendor?.name && (
                      <p>
                        <span className="text-slate-500">Vendor:</span>{" "}
                        <span className="font-medium text-slate-800">
                          {expense.purchaseId.vendor.name}
                        </span>
                      </p>
                    )}
                    <p>
                      <span className="text-slate-500">Materials Bill:</span>{" "}
                      <span className="font-semibold text-slate-800">
                        ₹{formatNumber(expense.purchaseId.totalAmount || 0)}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-500">Combined Landed Cost:</span>{" "}
                      <span className="font-semibold text-emerald-700">
                        ₹{formatNumber((expense.purchaseId.totalAmount || 0) + totalExpenseCost)}
                      </span>
                    </p>
                  </div>
                )}
                <Link
                  to={relatedPurchaseUrl}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 pt-1"
                >
                  View Full Purchase Order <ExternalLink size={12} />
                </Link>
              </div>
            )}
          </div>
        </Card>

        {/* Site Details Card */}
        <Card title="Site Information" description="Site where expense incurred">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Building2 size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-console-text">
                  {expense.site?.name || "General Site"}
                </p>
                {expense.site?.code && (
                  <p className="text-xs text-console-muted">
                    Code: {expense.site.code}
                  </p>
                )}
                {expense.site?.address && (
                  <p className="text-xs text-slate-600 mt-1">
                    {expense.site.address}
                  </p>
                )}
              </div>
            </div>

            {siteUrl && (
              <Link
                to={siteUrl}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                Go to Site Dashboard <ExternalLink size={12} />
              </Link>
            )}
          </div>
        </Card>

        {/* Vendor & Entry Audit */}
        <Card title="Vendor & Recording Audit" description="Origin & audit logging">
          <div className="space-y-2.5 text-xs">
            {expense.vendor && (
              <div className="flex items-center justify-between border-b border-console-border pb-2">
                <span className="text-console-muted">Vendor:</span>
                <span className="font-semibold text-console-text flex items-center gap-1">
                  <Store size={13} />
                  {expense.vendor?.name || "Associated Vendor"}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between border-b border-console-border pb-2">
              <span className="text-console-muted">Expense Date:</span>
              <span className="font-medium text-console-text flex items-center gap-1">
                <Calendar size={13} />
                {formatDate(expense.date || expense.createdAt)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-console-border pb-2">
              <span className="text-console-muted">Recorded By:</span>
              <span className="font-medium text-console-text flex items-center gap-1">
                <User size={13} />
                {expense.addedBy?.name || "System"} (
                <span className="uppercase">{expense.addedBy?.role || "Staff"}</span>)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-console-muted">Timestamp:</span>
              <span className="font-mono text-slate-600">
                {new Date(expense.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Notes / Remarks Card */}
      <Card
        title="Expense Notes & Details"
        description="Detailed description, purpose, and notes recorded for this expenditure"
      >
        {expense.notes ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-mono">
            {expense.notes}
          </div>
        ) : (
          <p className="text-xs text-console-muted italic">
            No additional notes provided for this miscellaneous expense.
          </p>
        )}
      </Card>
    </div>
  );
};

export default MiscellaneousExpenseDetail;
