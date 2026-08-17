import { useEffect, useState } from "react";
import { DollarSign, Send, Building } from "lucide-react";
import { toast } from "sonner";
import { getSites, Site } from "@/services/siteService";
import {
  submitExpenseRequest,
  getMyExpenseRequests,
  ExpenseRequest,
  ExpenseRequestCategory,
} from "@/services/expenseRequestService";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import PageLoader from "@/components/ui/PageLoader";
import { usePreferences } from "@/hooks/usePreferences";
import { useHighlightFromQuery } from "@/hooks/useHighlightFromQuery";

const CATEGORY_OPTIONS: { value: ExpenseRequestCategory; label: string }[] = [
  { value: "machinery", label: "Machinery" },
  { value: "rental", label: "Rental" },
  { value: "service", label: "Service" },
  { value: "material", label: "Material" },
];

const statusBadge: Record<
  ExpenseRequest["status"],
  { variant: "warning" | "success" | "error"; label: string }
> = {
  pending: { variant: "warning", label: "Pending review" },
  approved: { variant: "success", label: "Approved" },
  rejected: { variant: "error", label: "Rejected" },
};

const ArchitectExpenseRequests: React.FC = () => {
  const { formatDate, formatNumber } = usePreferences();
  const [sites, setSites] = useState<Site[]>([]);
  const [siteId, setSiteId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExpenseRequestCategory>("material");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<ExpenseRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    try {
      const response = await getMyExpenseRequests({ limit: 20 });
      setRequests(response.data);
    } catch (error) {
      toast.error("Failed to load your expense requests");
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const sitesData = await getSites();
        setSites(sitesData);
        if (sitesData.length > 0) {
          setSiteId(sitesData[0].id);
        }
        await loadRequests();
      } catch (error) {
        toast.error("Failed to load expense request data");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const highlightedId = useHighlightFromQuery(!loading && requests.length > 0);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setAmount("");
    setCategory("material");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!siteId) {
      toast.error("Please select a site");
      return;
    }
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setSubmitting(true);
    try {
      await submitExpenseRequest({
        siteId,
        title: title.trim(),
        description: description.trim(),
        category,
        amount: amountNum,
      });
      toast.success("Expense request submitted for approval");
      resetForm();
      await loadRequests();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to submit expense request",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PageLoader label="Loading expense requests" />;
  }

  if (sites.length === 0) {
    return (
      <EmptyState
        icon={Building}
        title="No sites assigned yet"
        description="Once you're assigned to a site, you'll be able to raise expense requests for it."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <Card
          title="Raise an expense request"
          description="Requests are reviewed by the admin before funds are released"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="expense-site"
                className="mb-1 block text-xs font-medium text-console-muted"
              >
                Site
              </label>
              <select
                id="expense-site"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="expense-title"
                className="mb-1 block text-xs font-medium text-console-muted"
              >
                Title
              </label>
              <input
                id="expense-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={150}
                placeholder="e.g. Concrete mixer rental"
                className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="expense-category"
                  className="mb-1 block text-xs font-medium text-console-muted"
                >
                  Category
                </label>
                <select
                  id="expense-category"
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as ExpenseRequestCategory)
                  }
                  className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="expense-amount"
                  className="mb-1 block text-xs font-medium text-console-muted"
                >
                  Amount (₹)
                </label>
                <input
                  id="expense-amount"
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="expense-description"
                className="mb-1 block text-xs font-medium text-console-muted"
              >
                Description (optional)
              </label>
              <textarea
                id="expense-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="Add any context the admin should know before approving"
                className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <Button type="submit" loading={submitting} className="w-full">
              <Send size={15} />
              Submit Request
            </Button>
          </form>
        </Card>
      </div>

      <div className="lg:col-span-3">
        <Card title="Your requests" description="Track the status of every request you've raised">
          {requests.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="No expense requests yet"
              description="Requests you submit will show up here with their review status."
            />
          ) : (
            <div className="space-y-4">
              {requests.map((request) => {
                const site =
                  typeof request.site === "object"
                    ? request.site.name
                    : "Site";
                const status = statusBadge[request.status];
                return (
                  <div
                    key={request._id}
                    id={`highlight-${request._id}`}
                    className={`rounded-lg border border-console-border bg-console-bg p-4 transition-colors duration-700 ${
                      highlightedId === request._id
                        ? "border-brand-300 bg-brand-50 ring-2 ring-brand-400"
                        : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-console-text">
                          {request.title}
                        </p>
                        <p className="text-xs text-console-muted">
                          {site} • {formatDate(request.createdAt)}
                        </p>
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    {request.description && (
                      <p className="mt-2 text-sm text-console-text">
                        {request.description}
                      </p>
                    )}
                    <p className="mt-2 text-sm font-semibold text-brand-700">
                      ₹{formatNumber(request.amount)}
                    </p>
                    {request.status === "rejected" && request.reviewNotes && (
                      <div className="mt-3 rounded-lg border border-danger-100 bg-danger-50 p-3">
                        <p className="text-xs font-semibold text-danger-700">
                          Reason for rejection
                        </p>
                        <p className="mt-1 text-sm text-danger-700">
                          {request.reviewNotes}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ArchitectExpenseRequests;