import { useState, useEffect } from "react";
import { Calendar, Clipboard, MapPin, Receipt } from "lucide-react";
import { toast } from "sonner";
import { getSites, getSiteDetails } from "@/services/siteService";
import { markAttendance } from "@/services/attendanceService";
import { addMiscellaneousExpense } from "@/services/miscellaneousExpenseService";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface MarkEmployeeAttendanceModalProps {
  employeeId: string;
  employeeName: string;
  onClose: () => void;
  onMarked: () => void;
}

const MISC_CATEGORIES = ["machinery", "rental", "service", "material"];

const statusOptions = [
  { label: "Full day (100%)", value: 1 },
  { label: "90%", value: 0.9 },
  { label: "80%", value: 0.8 },
  { label: "70%", value: 0.7 },
  { label: "60%", value: 0.6 },
  { label: "50%", value: 0.5 },
  { label: "40%", value: 0.4 },
  { label: "30%", value: 0.3 },
  { label: "20%", value: 0.2 },
  { label: "10%", value: 0.1 },
  { label: "0% (Absent)", value: 0 },
];

const MarkEmployeeAttendanceModal: React.FC<MarkEmployeeAttendanceModalProps> = ({
  employeeId,
  employeeName,
  onClose,
  onMarked,
}) => {
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [addMiscExpense, setAddMiscExpense] = useState(false);
  const [miscCategory, setMiscCategory] = useState("machinery");
  const [miscName, setMiscName] = useState("");
  const [miscAmount, setMiscAmount] = useState("");
  const [miscNotes, setMiscNotes] = useState("");
  const [sourceOfFunds, setSourceOfFunds] = useState<"company" | "siteManager">("company");
  const [siteManagers, setSiteManagers] = useState<any[]>([]);
  const [selectedSiteManagerId, setSelectedSiteManagerId] = useState("");

  useEffect(() => {
    const fetchActiveSites = async () => {
      try {
        const allSites = await getSites();
        const activeSites = (allSites || []).filter((s: any) => s.status === "InProgress");
        setSites(activeSites);
      } catch (err) {
        setError("Failed to fetch active sites");
      }
    };
    fetchActiveSites();
  }, []);

  useEffect(() => {
    setSiteManagers([]);
    setSelectedSiteManagerId("");
    if (!selectedSiteId || !addMiscExpense) return;
    const fetchManagers = async () => {
      try {
        const site = await getSiteDetails(selectedSiteId);
        setSiteManagers(site.siteManagers || []);
      } catch (err) {
        console.error("Failed to fetch site managers", err);
      }
    };
    fetchManagers();
  }, [selectedSiteId, addMiscExpense]);

  const resetMiscFields = () => {
    setMiscCategory("machinery");
    setMiscName("");
    setMiscAmount("");
    setMiscNotes("");
    setSourceOfFunds("company");
    setSelectedSiteManagerId("");
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setError(null);

    if (!selectedSiteId) {
      setError("Please select a site");
      return;
    }

    if (addMiscExpense) {
      if (!miscName.trim()) {
        setError("Miscellaneous expense name is required");
        return;
      }
      const parsedAmount = parseFloat(miscAmount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setError("Miscellaneous expense amount must be greater than zero");
        return;
      }
      if (sourceOfFunds === "siteManager" && !selectedSiteManagerId) {
        setError("Please select which site manager's balance to deduct from");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await markAttendance(employeeId, selectedSiteId, date, status);
    } catch (err: any) {
      setIsSubmitting(false);
      setError(
        err?.response?.data?.message ||
          "Failed to mark attendance. This employee may already have attendance marked for this date at this site.",
      );
      return;
    }

    if (addMiscExpense) {
      try {
        await addMiscellaneousExpense({
          siteId: selectedSiteId,
          name: miscName.trim(),
          category: miscCategory,
          tip: 0,
          notes: miscNotes.trim(),
          amount: parseFloat(miscAmount),
          sourceOfFunds,
          deductFromUserId: sourceOfFunds === "siteManager" ? selectedSiteManagerId : undefined,
          paymentMethod: "cash",
          vendorId: undefined,
          date,
        });
        toast.success(
          "Attendance marked and miscellaneous expense added (pending admin verification).",
        );
      } catch (err: any) {
        toast.error(
          `Attendance was marked, but the miscellaneous expense failed: ${
            err?.response?.data?.message || "Unknown error"
          }`,
        );
        setIsSubmitting(false);
        onMarked();
        onClose();
        return;
      }
    } else {
      toast.success("Attendance marked successfully.");
    }

    setIsSubmitting(false);
    resetMiscFields();
    onMarked();
    onClose();
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      disableClose={isSubmitting}
      closeOnOverlayClick={!isSubmitting}
      size="lg"
      title="Mark Attendance"
      description={`For ${employeeName}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isSubmitting} disabled={!selectedSiteId}>
            Mark attendance
          </Button>
        </>
      }
    >
      {error && (
        <div className="mb-5 rounded-console border border-danger-100 bg-danger-50 p-4">
          <p className="text-sm text-danger-600">{error}</p>
        </div>
      )}

      <div className="mb-4">
        <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-console-text">
          <MapPin size={15} /> Site *
        </label>
        <select
          value={selectedSiteId}
          onChange={(e) => setSelectedSiteId(e.target.value)}
          className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        >
          <option value="">Select an active site</option>
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>
        {sites.length === 0 && (
          <p className="mt-1.5 text-xs text-console-muted">No active (in-progress) sites found.</p>
        )}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-console-text">
            <Calendar size={15} /> Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-console-text">
            <Clipboard size={15} /> Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(Number(e.target.value))}
            className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border-t border-console-border pt-4">
        <label className="flex cursor-pointer select-none items-center gap-2">
          <input
            type="checkbox"
            checked={addMiscExpense}
            onChange={(e) => setAddMiscExpense(e.target.checked)}
            className="rounded border-console-border text-brand-600 focus:ring-brand-500"
          />
          <span className="flex items-center gap-1.5 text-sm font-medium text-console-text">
            <Receipt size={15} /> Also add a miscellaneous expense for this site
          </span>
        </label>

        {addMiscExpense && (
          <div className="mt-4 space-y-4 rounded-console border border-console-border bg-console-bg p-4">
            <p className="text-xs text-warning-700">
              This creates a pending miscellaneous expense for the selected site, exactly like
              the Miscellaneous tab on the site's detail page — an admin still needs to verify
              it before it affects the site's expenses and the funding source's balance.
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-console-text">Category</label>
                <select
                  value={miscCategory}
                  onChange={(e) => setMiscCategory(e.target.value)}
                  className="w-full rounded-lg border border-console-border bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  {MISC_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-console-text">Name *</label>
                <input
                  type="text"
                  value={miscName}
                  onChange={(e) => setMiscName(e.target.value)}
                  placeholder="e.g. Crane rental"
                  className="w-full rounded-lg border border-console-border bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-console-text">Amount *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={miscAmount}
                  onChange={(e) => setMiscAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-console-border bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-console-text">Source of funds</label>
                <select
                  value={sourceOfFunds}
                  onChange={(e) => setSourceOfFunds(e.target.value as "company" | "siteManager")}
                  className="w-full rounded-lg border border-console-border bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="company">Company</option>
                  <option value="siteManager">Site Manager</option>
                </select>
              </div>
            </div>

            {sourceOfFunds === "siteManager" && (
              <div>
                <label className="mb-1 block text-sm font-medium text-console-text">Site manager *</label>
                <select
                  value={selectedSiteManagerId}
                  onChange={(e) => setSelectedSiteManagerId(e.target.value)}
                  className="w-full rounded-lg border border-console-border bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">Select a site manager</option>
                  {siteManagers.map((mgr: any) => (
                    <option key={mgr.id} value={mgr.id}>
                      {mgr.name}
                    </option>
                  ))}
                </select>
                {siteManagers.length === 0 && (
                  <p className="mt-1 text-xs text-console-muted">
                    This site has no assigned site managers.
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-console-text">
                Notes <span className="text-xs text-console-muted">(Optional)</span>
              </label>
              <textarea
                value={miscNotes}
                onChange={(e) => setMiscNotes(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-lg border border-console-border bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="Any additional notes..."
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default MarkEmployeeAttendanceModal;
