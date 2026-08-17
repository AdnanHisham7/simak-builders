import { useEffect, useState } from "react";
import { MessageSquare, Star, Send, Filter } from "lucide-react";
import { toast } from "sonner";
import {
  getAllFeedback,
  respondToFeedback,
  Feedback,
  FeedbackStatus,
} from "@/services/feedbackService";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonTable } from "@/components/ui/Skeleton";
import Modal from "@/components/ui/Modal";
import { usePreferences } from "@/hooks/usePreferences";
import { useDashboardContext } from "@/context/DashboardContext";
import { useHighlightFromQuery } from "@/hooks/useHighlightFromQuery";

type StatusFilter = "all" | FeedbackStatus;

const statusBadge: Record<
  Feedback["status"],
  { variant: "warning" | "info" | "success"; label: string }
> = {
  open: { variant: "warning", label: "Open" },
  in_review: { variant: "info", label: "Under review" },
  resolved: { variant: "success", label: "Resolved" },
};

const AdminFeedback: React.FC = () => {
  const { formatDate } = usePreferences();
  const { feedbackOpenCount, setFeedbackOpenCount } = useDashboardContext();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [openCount, setOpenCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<Feedback | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [responseStatus, setResponseStatus] = useState<
    "in_review" | "resolved"
  >("resolved");
  const [submitting, setSubmitting] = useState(false);

  const loadFeedback = async (status: StatusFilter) => {
    setLoading(true);
    try {
      const response = await getAllFeedback({
        status: status === "all" ? undefined : status,
        limit: 50,
      });
      setFeedback(response.data);
      setOpenCount(response.openCount ?? 0);
    } catch (error) {
      toast.error("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const highlightedId = useHighlightFromQuery(!loading && feedback.length > 0);

  const openModal = (item: Feedback) => {
    setSelected(item);
    setResponseText(item.adminResponse || "");
    setResponseStatus(item.status === "in_review" ? "in_review" : "resolved");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelected(null);
    setResponseText("");
  };

  const handleRespond = async () => {
    if (!selected) return;
    if (responseStatus === "resolved" && !responseText.trim()) {
      toast.error("Please add a response before resolving");
      return;
    }

    setSubmitting(true);
    try {
      const wasOpen = selected.status === "open";
      await respondToFeedback(selected._id, {
        response: responseText.trim(),
        status: responseStatus,
      });
      if (wasOpen) {
        setFeedbackOpenCount(Math.max(0, feedbackOpenCount - 1));
      }
      toast.success("Feedback updated");
      closeModal();
      await loadFeedback(statusFilter);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to update feedback",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-console-text">
            Client Feedback
          </h1>
          <p className="mt-0.5 text-sm text-console-muted">
            {openCount} open feedback item{openCount === 1 ? "" : "s"} awaiting a response
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-console-muted" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="in_review">Under review</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {loading ? (
        <SkeletonTable columns={4} />
      ) : feedback.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No feedback found"
          description="Client feedback will appear here as it's submitted."
        />
      ) : (
        <div className="space-y-3">
          {feedback.map((item) => {
            const client =
              typeof item.client === "object" ? item.client.name : "Client";
            const site =
              typeof item.site === "object" ? item.site.name : "Site";
            const status = statusBadge[item.status];
            return (
              <Card
                key={item._id}
                id={`highlight-${item._id}`}
                className={`p-0 transition-colors duration-700 ${
                  highlightedId === item._id
                    ? "bg-brand-50 ring-2 ring-brand-400"
                    : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => openModal(item)}
                  className="flex w-full flex-col gap-2 p-5 text-left transition-colors hover:bg-console-bg sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-console-text">
                        {client}
                      </span>
                      <span className="text-xs text-console-muted">
                        • {site}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <Star
                            key={value}
                            size={12}
                            className={
                              value <= item.rating
                                ? "fill-brand-500 text-brand-500"
                                : "text-console-border"
                            }
                          />
                        ))}
                      </div>
                    </div>
                    <p className="mt-1 line-clamp-1 text-sm text-console-muted">
                      {item.message}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-xs text-console-muted">
                      {formatDate(item.createdAt)}
                    </span>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </button>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isModalOpen && !!selected}
        onClose={closeModal}
        size="lg"
        title="Feedback details"
        description={
          selected && typeof selected.site === "object"
            ? selected.site.name
            : undefined
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="rounded-console bg-console-bg p-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Star
                      key={value}
                      size={14}
                      className={
                        value <= selected.rating
                          ? "fill-brand-500 text-brand-500"
                          : "text-console-border"
                      }
                    />
                  ))}
                </div>
                <Badge>{selected.category}</Badge>
              </div>
              <p className="mt-2 text-sm text-console-text">
                {selected.message}
              </p>
              <p className="mt-2 text-xs text-console-muted">
                Submitted {formatDate(selected.createdAt)}
              </p>
            </div>

            <div>
              <label
                htmlFor="admin-feedback-status"
                className="mb-1 block text-xs font-medium text-console-muted"
              >
                Update status
              </label>
              <select
                id="admin-feedback-status"
                value={responseStatus}
                onChange={(e) =>
                  setResponseStatus(e.target.value as "in_review" | "resolved")
                }
                className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              >
                <option value="in_review">Mark as under review</option>
                <option value="resolved">Mark as resolved</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="admin-feedback-response"
                className="mb-1 block text-xs font-medium text-console-muted"
              >
                Response {responseStatus === "resolved" ? "(required)" : "(optional)"}
              </label>
              <textarea
                id="admin-feedback-response"
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={5}
                maxLength={2000}
                placeholder="Let the client know how you're addressing their feedback..."
                className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                loading={submitting}
                onClick={handleRespond}
              >
                <Send size={15} />
                Send Update
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminFeedback;