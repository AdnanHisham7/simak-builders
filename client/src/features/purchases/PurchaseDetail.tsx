import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ArrowLeft,
  ShoppingCart,
  Building2,
  User,
  Calendar,
  CreditCard,
  Truck,
  FileText,
  Download,
  CheckCircle2,
  Clock,
  ExternalLink,
  Receipt,
  Package,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { RootState } from "@/store/store";
import { getPurchaseById, verifyPurchase } from "@/services/purchaseService";
import { usePreferences } from "@/hooks/usePreferences";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import PageLoader from "@/components/ui/PageLoader";
import EmptyState from "@/components/ui/EmptyState";
import { toast } from "sonner";

export const PurchaseDetail: React.FC = () => {
  const { purchaseId } = useParams<{ purchaseId: string }>();
  const navigate = useNavigate();
  const { formatDate, formatNumber, formatDecimal } = usePreferences();
  const { userType } = useSelector((state: RootState) => state.auth);

  const [purchase, setPurchase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  const fetchPurchase = async () => {
    if (!purchaseId) return;
    try {
      setLoading(true);
      const data = await getPurchaseById(purchaseId);
      setPurchase(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load purchase details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchase();
  }, [purchaseId]);

  const handleVerify = async () => {
    if (!purchaseId) return;
    try {
      setVerifying(true);
      await verifyPurchase(purchaseId);
      toast.success("Purchase verified successfully");
      await fetchPurchase();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to verify purchase");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return <PageLoader fullHeight label="Loading purchase details..." />;
  }

  if (!purchase) {
    return (
      <div className="p-6">
        <EmptyState
          icon={AlertCircle}
          title="Purchase Not Found"
          description="The requested purchase record could not be found or may have been deleted."
          action={
            <Button variant="secondary" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} /> Go Back
            </Button>
          }
        />
      </div>
    );
  }

  const isVerified = purchase.status === "verified";
  const itemsSubtotal = (purchase.items || []).reduce(
    (sum: number, it: any) => sum + (Number(it.totalAmount) || 0),
    0
  );
  const siteUrl = purchase.site?._id
    ? `/${userType === "siteManager" ? "siteManager" : "admin"}/sites/${purchase.site._id}`
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
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-console-text sm:text-2xl">
                Purchase Order Details
              </h1>
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
              Record ID: <code className="font-mono">{purchase._id}</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {purchase.billUpload?.url && (
            <a
              href={purchase.billUpload.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-console-border bg-white px-3 py-1.5 text-xs font-medium text-console-text shadow-xs hover:bg-slate-50 transition-colors"
            >
              <Download size={14} /> Download Invoice / Bill
            </a>
          )}
          {!isVerified && userType === "admin" && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleVerify}
              loading={verifying}
              className="flex items-center gap-1.5"
            >
              <CheckCircle2 size={15} /> Verify Purchase
            </Button>
          )}
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-brand-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-console-muted">
              Total Amount
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Receipt size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-console-text">
            ₹{formatNumber(purchase.totalAmount || 0)}
          </p>
          <span className="mt-1 text-xs text-console-muted">
            Includes transportation fee
          </span>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-console-muted">
              Transportation
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <Truck size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-console-text">
            ₹{formatNumber(purchase.transportationFee || 0)}
          </p>
          <span className="mt-1 text-xs text-console-muted">
            Freight / delivery charge
          </span>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-console-muted">
              Payment Details
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
              <CreditCard size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-bold capitalize text-console-text">
              {purchase.payment?.method || "N/A"}
            </span>
            <Badge variant={purchase.payment?.isPaid ? "success" : "warning"}>
              {purchase.payment?.isPaid ? "Paid" : "Unpaid / Credit"}
            </Badge>
          </div>
          <span className="mt-1 text-xs text-console-muted">
            Paid amount: ₹{formatNumber(purchase.payment?.paidAmount || 0)}
          </span>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-console-muted">
              Source of Funds
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Wallet size={16} />
            </div>
          </div>
          <p className="mt-2 text-lg font-bold capitalize text-console-text">
            {purchase.sourceOfFunds === "siteManager"
              ? "Site Manager"
              : purchase.sourceOfFunds || "Company"}
          </p>
          <span className="mt-1 text-xs text-console-muted truncate">
            {purchase.deductFromUserId?.name
              ? `Debited: ${purchase.deductFromUserId.name}`
              : "Company account"}
          </span>
        </Card>
      </div>

      {/* Metadata Context Sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Site Details Card */}
        <Card title="Site Information" description="Construction site destination">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Building2 size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-console-text">
                  {purchase.site?.name || "Company Stock / General"}
                </p>
                {purchase.site?.code && (
                  <p className="text-xs text-console-muted">
                    Code: {purchase.site.code}
                  </p>
                )}
                {purchase.site?.address && (
                  <p className="text-xs text-slate-600 mt-1">
                    {purchase.site.address}
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

        {/* Vendor Information Card */}
        <Card title="Vendor Information" description="Supplier / merchant details">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <ShoppingCart size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-console-text">
                  {purchase.vendor?.name || "Unknown Vendor"}
                </p>
                {purchase.vendor?.companyName && (
                  <p className="text-xs text-console-muted">
                    {purchase.vendor.companyName}
                  </p>
                )}
                {purchase.vendor?.phone && (
                  <p className="text-xs text-slate-600 mt-1">
                    Phone: {purchase.vendor.phone}
                  </p>
                )}
                {purchase.vendor?.email && (
                  <p className="text-xs text-slate-600">
                    Email: {purchase.vendor.email}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Audit & Recording Card */}
        <Card title="Audit & Timestamp" description="Record entry origin">
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between border-b border-console-border pb-2">
              <span className="text-console-muted">Purchase Date:</span>
              <span className="font-medium text-console-text flex items-center gap-1">
                <Calendar size={13} />
                {formatDate(purchase.date || purchase.createdAt)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-console-border pb-2">
              <span className="text-console-muted">Recorded By:</span>
              <span className="font-medium text-console-text flex items-center gap-1">
                <User size={13} />
                {purchase.addedBy?.name || "System"} (
                <span className="uppercase">{purchase.addedBy?.role || "Staff"}</span>)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-console-muted">Created At:</span>
              <span className="font-mono text-slate-600">
                {new Date(purchase.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Itemized Breakdown Table */}
      <Card
        title="Purchased Items Breakdown"
        description="Detailed list of materials, quantities, units, and item pricing"
      >
        <div className="overflow-x-auto rounded-lg border border-console-border">
          <table className="min-w-full divide-y divide-console-border text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-console-muted">
              <tr>
                <th className="px-4 py-3 w-12 text-center">#</th>
                <th className="px-4 py-3">Item Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Quantity</th>
                <th className="px-4 py-3 text-right">Unit Price</th>
                <th className="px-4 py-3 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-console-border bg-white text-console-text">
              {(purchase.items || []).map((item: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/75 transition-colors">
                  <td className="px-4 py-3 text-center text-console-muted font-medium">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3 font-semibold text-console-text flex items-center gap-2">
                    <Package size={14} className="text-brand-600" />
                    {item.name}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 capitalize">
                      {item.category || "General"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatDecimal(item.quantity)} {item.unit || "units"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">
                    ₹{formatDecimal(item.price)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-console-text">
                    ₹{formatDecimal(item.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-console-border bg-slate-50 font-semibold text-xs text-console-text">
              <tr>
                <td colSpan={5} className="px-4 py-2.5 text-right text-console-muted">
                  Items Subtotal:
                </td>
                <td className="px-4 py-2.5 text-right font-bold">
                  ₹{formatDecimal(itemsSubtotal)}
                </td>
              </tr>
              {purchase.transportationFee > 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-right text-console-muted">
                    Transportation Fee:
                  </td>
                  <td className="px-4 py-2 text-right font-bold text-blue-700">
                    + ₹{formatDecimal(purchase.transportationFee)}
                  </td>
                </tr>
              )}
              <tr className="border-t border-console-border bg-slate-100/80 text-sm font-bold">
                <td colSpan={5} className="px-4 py-3 text-right text-console-text">
                  Grand Total:
                </td>
                <td className="px-4 py-3 text-right text-brand-700">
                  ₹{formatDecimal(purchase.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Notes / Remarks & Attached Bill Preview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {purchase.notes && (
          <Card title="Purchase Notes & Remarks" description="Internal team comments">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3.5 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
              {purchase.notes}
            </div>
          </Card>
        )}

        {purchase.billUpload?.url && (
          <Card
            title="Attached Invoice / Bill"
            description={purchase.billUpload.name || "Uploaded bill receipt"}
            action={
              <a
                href={purchase.billUpload.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                Open in new tab <ExternalLink size={12} />
              </a>
            }
          >
            <div className="flex items-center gap-3 rounded-lg border border-console-border p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <FileText size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-console-text truncate">
                  {purchase.billUpload.name || "Bill Document"}
                </p>
                <p className="text-[11px] text-console-muted">
                  {purchase.billUpload.size
                    ? `${(purchase.billUpload.size / 1024).toFixed(1)} KB`
                    : "Document attachment"}
                </p>
              </div>
              <a
                href={purchase.billUpload.url}
                download
                className="rounded-lg border border-console-border bg-white p-2 text-console-muted hover:text-brand-700 transition-colors"
                title="Download Bill"
              >
                <Download size={16} />
              </a>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PurchaseDetail;
