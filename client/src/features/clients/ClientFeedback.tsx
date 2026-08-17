import { useEffect, useState } from "react";
import { Star, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { getClientSites } from "@/services/clientService";
import {
  submitFeedback,
  getMyFeedback,
  Feedback,
  FeedbackCategory,
} from "@/services/feedbackService";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import PageLoader from "@/components/ui/PageLoader";
import { usePreferences } from "@/hooks/usePreferences";
import { useHighlightFromQuery } from "@/hooks/useHighlightFromQuery";

interface ClientSiteOption {
  _id: string;
  name: string;
}

const CATEGORY_OPTIONS: { value: FeedbackCategory; label: string }[] = [
  { value: "quality", label: "Construction Quality" },
  { value: "timeline", label: "Timeline & Delays" },
  { value: "communication", label: "Communication" },
  { value: "budget", label: "Budget & Billing" },
  { value: "safety", label: "Site Safety" },
  { value: "other", label: "Other" },
];

const statusBadge: Record<
  Feedback["status"],
  { variant: "warning" | "info" | "success"; label: string }
> = {
  open: { variant: "warning", label: "Awaiting response" },
  in_review: { variant: "info", label: "Under review" },
  resolved: { variant: "success", label: "Resolved" },
};

const ClientFeedback: React.FC = () => {
  const { formatDate } = usePreferences();
  const [sites, setSites] = useState<ClientSiteOption[]>([]);
  const [siteId, setSiteId] = useState("");
  const [category, setCategory] = useState<FeedbackCategory>("quality");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    try {
      const response = await getMyFeedback({ limit: 20 });
      setHistory(response.data);
    } catch (error) {
      toast.error("Failed to load your feedback history");
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const sitesData = await getClientSites();
        setSites(sitesData);
        if (sitesData.length > 0) {
          setSiteId(sitesData[0]._id);
        }
        await loadHistory();
      } catch (error) {
        toast.error("Failed to load feedback data");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const highlightedId = useHighlightFromQuery(!loading && history.length > 0);

  const resetForm = () => {
    setRating(0);
    setMessage("");
    setCategory("quality");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!siteId) {
      toast.error("Please select a site");
      return;
    }
    if (rating < 1) {
      toast.error("Please select a rating");
      return;
    }
    if (!message.trim()) {
      toast.error("Please describe your feedback");
      return;
    }

    setSubmitting(true);
    try {
      await submitFeedback({ siteId, rating, message: message.trim(), category });
      toast.success("Feedback submitted successfully");
      resetForm();
      await loadHistory();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to submit feedback",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PageLoader label="Loading feedback" />;
  }

  if (sites.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No sites assigned yet"
        description="Once a site is assigned to your account, you'll be able to submit feedback for it."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <Card title="Share your feedback" description="Tell us how your project is going">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="feedback-site"
                className="mb-1 block text-xs font-medium text-console-muted"
              >
                Site
              </label>
              <select
                id="feedback-site"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              >
                {sites.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="feedback-category"
                className="mb-1 block text-xs font-medium text-console-muted"
              >
                Category
              </label>
              <select
                id="feedback-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
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
              <span className="mb-1 block text-xs font-medium text-console-muted">
                Rating
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    onMouseEnter={() => setHoverRating(value)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`Rate ${value} out of 5`}
                    className="p-0.5"
                  >
                    <Star
                      size={24}
                      className={
                        value <= (hoverRating || rating)
                          ? "fill-brand-500 text-brand-500"
                          : "text-console-border"
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="feedback-message"
                className="mb-1 block text-xs font-medium text-console-muted"
              >
                Message
              </label>
              <textarea
                id="feedback-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                maxLength={2000}
                placeholder="Tell us what's working well or what needs attention..."
                className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
              <p className="mt-1 text-right text-xs text-console-muted">
                {message.length}/2000
              </p>
            </div>

            <Button
              type="submit"
              loading={submitting}
              className="w-full"
            >
              <Send size={15} />
              Submit Feedback
            </Button>
          </form>
        </Card>
      </div>

      <div className="lg:col-span-3">
        <Card title="Your feedback history" description="Track responses from our team">
          {history.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No feedback submitted yet"
              description="Your submitted feedback and our responses will appear here."
            />
          ) : (
            <div className="space-y-4">
              {history.map((item) => {
                const site =
                  typeof item.site === "object" ? item.site.name : "Site";
                const status = statusBadge[item.status];
                return (
                  <div
                    key={item._id}
                    id={`highlight-${item._id}`}
                    className={`rounded-lg border border-console-border bg-console-bg p-4 transition-colors duration-700 ${
                      highlightedId === item._id
                        ? "border-brand-300 bg-brand-50 ring-2 ring-brand-400"
                        : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((value) => (
                            <Star
                              key={value}
                              size={14}
                              className={
                                value <= item.rating
                                  ? "fill-brand-500 text-brand-500"
                                  : "text-console-border"
                              }
                            />
                          ))}
                        </div>
                        <span className="text-xs font-medium text-console-muted">
                          {site}
                        </span>
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-console-text">
                      {item.message}
                    </p>
                    <p className="mt-1 text-xs text-console-muted">
                      Submitted {formatDate(item.createdAt)}
                    </p>
                    {item.adminResponse && (
                      <div className="mt-3 rounded-lg border border-brand-100 bg-brand-50 p-3">
                        <p className="text-xs font-semibold text-brand-800">
                          Response from our team
                        </p>
                        <p className="mt-1 text-sm text-brand-900">
                          {item.adminResponse}
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

export default ClientFeedback;