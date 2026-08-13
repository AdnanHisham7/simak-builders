import { useEffect, useState } from "react";
import { getEnquiries, markEnquiryAsSeen } from "@/services/messageService";
import {
  Search,
  Mail,
  Calendar,
  Phone,
  MessageSquare,
  SortAsc,
  SortDesc,
  Eye,
  Inbox,
  AlertCircle,
} from "lucide-react";
import { useDashboardContext } from "../../context/DashboardContext";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonTable } from "@/components/ui/Skeleton";
import Modal from "@/components/ui/Modal";
import Tooltip from "@/components/ui/Tooltip";

interface Enquiry {
  _id: string;
  name: string;
  email: string;
  subject: string;
  phone: string;
  createdAt: string;
  message: string;
  isSeen: boolean;
}

type SeenFilter = "all" | "new" | "seen";

const ListEnquiries: React.FC = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name" | "subject">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterSeen, setFilterSeen] = useState<SeenFilter>("all");
  const { unseenCount, setUnseenCount } = useDashboardContext();

  useEffect(() => {
    const fetchEnquiries = async () => {
      try {
        const data = await getEnquiries();
        setEnquiries(data as unknown as Enquiry[]);
      } catch (err) {
        setError("Failed to fetch enquiries");
      } finally {
        setLoading(false);
      }
    };
    fetchEnquiries();
  }, []);

  const openModal = (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEnquiry(null);
  };

  const handleMarkAsSeen = async (id: string) => {
    try {
      const previousEnquiry = enquiries.find((enq) => enq._id === id);
      const updatedEnquiry = await markEnquiryAsSeen(id);
      setEnquiries((prev) =>
        prev.map((enq) => (enq._id === id ? (updatedEnquiry as unknown as Enquiry) : enq)),
      );
      setSelectedEnquiry(updatedEnquiry as unknown as Enquiry);
      if (previousEnquiry && !previousEnquiry.isSeen) {
        setUnseenCount(unseenCount - 1);
      }
    } catch (error) {
      console.error("Failed to mark enquiry as seen", error);
    }
  };

  const filteredAndSortedEnquiries = enquiries
    .filter((enquiry) => {
      const matchesSearch =
        enquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enquiry.subject.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter =
        filterSeen === "all" ||
        (filterSeen === "new" && !enquiry.isSeen) ||
        (filterSeen === "seen" && enquiry.isSeen);
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let aVal: string | number, bVal: string | number;
      if (sortBy === "date") {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      } else {
        aVal = a[sortBy].toLowerCase();
        bVal = b[sortBy].toLowerCase();
      }
      return sortOrder === "asc" ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
    });

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-50 text-danger-600">
            <AlertCircle size={22} />
          </div>
          <h2 className="text-lg font-semibold text-console-text">Something went wrong</h2>
          <p className="mt-1 text-sm text-console-muted">{error}</p>
          <Button className="mt-5" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-console-text">Enquiries</h1>
        <p className="mt-0.5 text-sm text-console-muted">Manage and track all customer inquiries</p>
      </div>

      {loading ? (
        <SkeletonTable />
      ) : (
        <>
          <Card>
            <div className="flex flex-col items-center gap-4 lg:flex-row">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-console-muted" size={16} />
                <input
                  type="text"
                  placeholder="Search enquiries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-console-border py-2.5 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={filterSeen}
                  onChange={(e) => setFilterSeen(e.target.value as SeenFilter)}
                  className="rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  <option value="all">All Enquiries</option>
                  <option value="new">New</option>
                  <option value="seen">Seen</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "date" | "name" | "subject")}
                  className="rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  <option value="date">Sort by Date</option>
                  <option value="name">Sort by Name</option>
                  <option value="subject">Sort by Subject</option>
                </select>
                <Tooltip label={sortOrder === "asc" ? "Sort descending" : "Sort ascending"}>
                  <button
                    type="button"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    aria-label="Toggle sort order"
                    className="rounded-lg border border-console-border p-2.5 text-console-muted transition-colors hover:bg-console-bg"
                  >
                    {sortOrder === "asc" ? <SortAsc size={17} /> : <SortDesc size={17} />}
                  </button>
                </Tooltip>
              </div>
            </div>
          </Card>

          {filteredAndSortedEnquiries.length === 0 ? (
            <Card>
              <EmptyState
                icon={Inbox}
                title="No enquiries found"
                description={
                  searchTerm || filterSeen !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "No enquiries have been submitted yet."
                }
                action={
                  (searchTerm || filterSeen !== "all") && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setSearchTerm("");
                        setFilterSeen("all");
                      }}
                    >
                      Clear filters
                    </Button>
                  )
                }
              />
            </Card>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredAndSortedEnquiries.map((enquiry) => (
                <button
                  type="button"
                  key={enquiry._id}
                  onClick={() => openModal(enquiry)}
                  className="relative rounded-console border border-console-border bg-white p-5 text-left transition-shadow hover:shadow-console-lg"
                >
                  {!enquiry.isSeen && (
                    <span className="absolute right-4 top-4">
                      <Badge variant="error">New</Badge>
                    </span>
                  )}
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-base font-semibold text-brand-800">
                      {enquiry.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-console-text">{enquiry.name}</h3>
                      <p className="truncate text-xs text-console-muted">{enquiry.email}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-console-muted">
                      <MessageSquare size={14} className="shrink-0 text-brand-500" />
                      <span className="truncate">{enquiry.subject}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-console-muted">
                      <Phone size={14} className="shrink-0 text-success-500" />
                      {enquiry.phone}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-console-muted">
                      <Calendar size={14} className="shrink-0 text-brand-400" />
                      {new Date(enquiry.createdAt).toLocaleDateString()}
                    </div>
                    <p className="line-clamp-2 pt-1 text-sm text-console-muted">{enquiry.message}</p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-console-border pt-4">
                    <span className="text-xs text-console-muted">
                      {new Date(enquiry.createdAt).toLocaleTimeString()}
                    </span>
                    <span className="flex items-center gap-1 text-sm font-medium text-brand-700">
                      <Eye size={14} /> View details
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={isModalOpen && !!selectedEnquiry}
        onClose={closeModal}
        size="lg"
        title={selectedEnquiry?.name}
        description={selectedEnquiry?.email}
      >
        {selectedEnquiry && (
          <>
            <div className="mb-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-console bg-console-bg p-4">
                <div className="mb-1.5 flex items-center gap-2 text-console-muted">
                  <Mail size={15} />
                  <span className="text-sm font-medium text-console-text">Email</span>
                </div>
                <p className="text-sm text-console-muted">{selectedEnquiry.email}</p>
              </div>
              <div className="rounded-console bg-console-bg p-4">
                <div className="mb-1.5 flex items-center gap-2 text-console-muted">
                  <Phone size={15} />
                  <span className="text-sm font-medium text-console-text">Phone</span>
                </div>
                <p className="text-sm text-console-muted">{selectedEnquiry.phone}</p>
              </div>
              <div className="rounded-console bg-console-bg p-4">
                <div className="mb-1.5 flex items-center gap-2 text-console-muted">
                  <MessageSquare size={15} />
                  <span className="text-sm font-medium text-console-text">Subject</span>
                </div>
                <p className="text-sm text-console-muted">{selectedEnquiry.subject}</p>
              </div>
              <div className="rounded-console bg-console-bg p-4">
                <div className="mb-1.5 flex items-center gap-2 text-console-muted">
                  <Calendar size={15} />
                  <span className="text-sm font-medium text-console-text">Date</span>
                </div>
                <p className="text-sm text-console-muted">
                  {new Date(selectedEnquiry.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mb-6 rounded-console border border-brand-100 bg-brand-50 p-5">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-console-text">
                <MessageSquare size={15} className="text-brand-600" /> Message
              </h3>
              <p className="text-sm leading-relaxed text-console-muted">{selectedEnquiry.message}</p>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={closeModal}>
                Close
              </Button>
              {selectedEnquiry.isSeen ? (
                <span className="flex flex-1 items-center justify-center rounded-lg bg-console-bg text-sm font-medium text-console-muted">
                  Seen
                </span>
              ) : (
                <Button className="flex-1" onClick={() => handleMarkAsSeen(selectedEnquiry._id)}>
                  Mark as seen
                </Button>
              )}
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default ListEnquiries;
