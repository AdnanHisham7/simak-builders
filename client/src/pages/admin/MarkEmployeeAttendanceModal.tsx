import React, { useState, useEffect } from "react";
import { X, Calendar, Clipboard, MapPin, Receipt } from "lucide-react";
import { toast } from "sonner";
import { getSites, getSiteDetails } from "@/services/siteService";
import { markAttendance } from "@/services/attendanceService";
import { addMiscellaneousExpense } from "@/services/miscellaneousExpenseService";

interface MarkEmployeeAttendanceModalProps {
  employeeId: string;
  employeeName: string;
  onClose: () => void;
  onMarked: () => void;
}

const MISC_CATEGORIES = ["machinery", "rental", "service", "material"];

const statusOptions = [
  { label: "FullDay (100%)", value: 1 },
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

const MarkEmployeeAttendanceModal: React.FC<
  MarkEmployeeAttendanceModalProps
> = ({ employeeId, employeeName, onClose, onMarked }) => {
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
  const [sourceOfFunds, setSourceOfFunds] = useState<"company" | "siteManager">(
    "company",
  );
  const [siteManagers, setSiteManagers] = useState<any[]>([]);
  const [selectedSiteManagerId, setSelectedSiteManagerId] = useState("");

  useEffect(() => {
    const fetchActiveSites = async () => {
      try {
        const allSites = await getSites();
        const activeSites = (allSites || []).filter(
          (s: any) => s.status === "InProgress",
        );
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
          deductFromUserId:
            sourceOfFunds === "siteManager"
              ? selectedSiteManagerId
              : undefined,
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
    <div
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-500 to-emerald-600" />

        <div className="relative px-8 pt-8 pb-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Mark Attendance
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                For{" "}
                <span className="font-semibold text-gray-800">
                  {employeeName}
                </span>
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
              <MapPin className="w-4 h-4" /> Site *
            </label>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-gray-50 focus:bg-white"
            >
              <option value="">Select an active site</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
            {sites.length === 0 && (
              <p className="text-xs text-gray-500">
                No active (in-progress) sites found.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <Calendar className="w-4 h-4" /> Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-gray-50 focus:bg-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <Clipboard className="w-4 h-4" /> Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-gray-50 focus:bg-white"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={addMiscExpense}
                onChange={(e) => setAddMiscExpense(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <Receipt className="w-4 h-4" /> Also add a miscellaneous
                expense for this site
              </span>
            </label>

            {addMiscExpense && (
              <div className="mt-4 space-y-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs text-amber-600">
                  This creates a pending miscellaneous expense for the
                  selected site, exactly like the Miscellaneous tab on the
                  site's detail page — an admin still needs to verify it
                  before it affects the site's expenses and the funding
                  source's balance.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={miscCategory}
                      onChange={(e) => setMiscCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {MISC_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={miscName}
                      onChange={(e) => setMiscName(e.target.value)}
                      placeholder="e.g. Crane rental"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={miscAmount}
                      onChange={(e) => setMiscAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Source of Funds
                    </label>
                    <select
                      value={sourceOfFunds}
                      onChange={(e) =>
                        setSourceOfFunds(
                          e.target.value as "company" | "siteManager",
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="company">Company</option>
                      <option value="siteManager">Site Manager</option>
                    </select>
                  </div>
                </div>

                {sourceOfFunds === "siteManager" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Site Manager *
                    </label>
                    <select
                      value={selectedSiteManagerId}
                      onChange={(e) =>
                        setSelectedSiteManagerId(e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a site manager</option>
                      {siteManagers.map((mgr: any) => (
                        <option key={mgr.id} value={mgr.id}>
                          {mgr.name}
                        </option>
                      ))}
                    </select>
                    {siteManagers.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        This site has no assigned site managers.
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <textarea
                    value={miscNotes}
                    onChange={(e) => setMiscNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-8 py-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedSiteId}
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : "Mark Attendance"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarkEmployeeAttendanceModal;