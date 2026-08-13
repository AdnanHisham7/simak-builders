import React, { useState, useEffect } from "react";
import { AlertCircle, DollarSign, ReceiptText } from "lucide-react";
import { addMiscellaneousExpense } from "@/services/miscellaneousExpenseService";
import { privateClient } from "@/api";
import { getSiteDetails } from "@/services/siteService";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface Props {
  isOpen: boolean;
  siteId: string;
  isAdmin?: boolean;
  onClose: () => void;
}

const fieldClass =
  "w-full rounded-lg border border-console-border bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";
const labelClass = "mb-1.5 block text-sm font-medium text-console-text";

const AddMiscellaneousExpenseModal: React.FC<Props> = ({
  isOpen,
  siteId,
  isAdmin = false,
  onClose,
}) => {
  const [category, setCategory] = useState<"machinery" | "rental" | "service" | "material">(
    "machinery",
  );
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [tip, setTip] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [sourceOfFunds, setSourceOfFunds] = useState<"company" | "siteManager">(
    "company",
  );
  const [selectedSiteManagerId, setSelectedSiteManagerId] = useState("");
  const [siteManagers, setSiteManagers] = useState<any[]>([]);

  const [paymentMethod, setPaymentMethod] = useState<"cash" | "credit">("cash");
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState("");

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCategory("machinery");
    setName("");
    setAmount("");
    setTip("");
    setNotes("");
    setDate(new Date().toISOString().split("T")[0]);
    setSourceOfFunds("company");
    setSelectedSiteManagerId("");
    setPaymentMethod("cash");
    setSelectedVendorId("");
    setErrors({});
  }, [isOpen]);

  useEffect(() => {
    if (isAdmin && siteId) {
      const fetchManagers = async () => {
        const site = await getSiteDetails(siteId);
        setSiteManagers(site.siteManagers || []);
      };
      fetchManagers();
    }
    const fetchVendors = async () => {
      try {
        const { data } = await privateClient.get("/vendors");
        setVendors(data);
      } catch (error) {
        console.error("Failed to fetch vendors", error);
      }
    };
    fetchVendors();
  }, [isAdmin, siteId]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = "Name is required";
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0)
      newErrors.amount = "Valid amount is required";
    if (!date) newErrors.date = "Date is required";
    if (isAdmin) {
      if (!sourceOfFunds)
        newErrors.sourceOfFunds = "Source of funds is required";
      if (sourceOfFunds === "siteManager" && !selectedSiteManagerId) {
        newErrors.selectedSiteManager = "Please select a site manager";
      }
    }
    if (paymentMethod === "credit" && !selectedVendorId) {
      newErrors.vendor = "Please select a vendor for credit payment";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      await addMiscellaneousExpense({
        siteId,
        category,
        name: name.trim(),
        amount: parseFloat(amount),
        tip: tip ? parseFloat(tip) : 0,
        notes: notes.trim(),
        date,
        sourceOfFunds: isAdmin ? sourceOfFunds : "siteManager",
        deductFromUserId:
          isAdmin && sourceOfFunds === "siteManager"
            ? selectedSiteManagerId
            : undefined,
        paymentMethod,
        vendorId: paymentMethod === "credit" ? selectedVendorId : undefined,
      });
      onClose();
    } catch (error: any) {
      setErrors({
        submit: error.response?.data?.message || "Failed to add expense",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add miscellaneous expense"
      size="md"
      disableClose={loading}
      closeOnOverlayClick={!loading}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {!loading && <ReceiptText className="h-4 w-4" />}
            Add expense
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Category *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className={fieldClass}
          >
            <option value="machinery">Machinery</option>
            <option value="rental">Rental</option>
            <option value="material">Material</option>
            <option value="service">Service</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Name / Description *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`${fieldClass} ${errors.name ? "border-danger-300" : ""}`}
            placeholder="e.g., JCB Hire, Generator Service"
          />
          {errors.name && (
            <p className="mt-1.5 text-sm text-danger-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label className={labelClass}>Payment method *</label>
          <select
            value={paymentMethod}
            onChange={(e) => {
              setPaymentMethod(e.target.value as "cash" | "credit");
              setSelectedVendorId("");
              setErrors((prev) => ({ ...prev, vendor: "" }));
            }}
            className={fieldClass}
          >
            <option value="cash">Cash</option>
            <option value="credit">Credit</option>
          </select>
        </div>

        {paymentMethod === "credit" && (
          <div>
            <label className={labelClass}>Select vendor *</label>
            <select
              value={selectedVendorId}
              onChange={(e) => {
                setSelectedVendorId(e.target.value);
                setErrors((prev) => ({ ...prev, vendor: "" }));
              }}
              className={`${fieldClass} ${errors.vendor ? "border-danger-300" : ""}`}
            >
              <option value="">Select a vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor._id} value={vendor._id}>
                  {vendor.name}
                </option>
              ))}
            </select>
            {errors.vendor && (
              <p className="mt-1.5 text-sm text-danger-600">{errors.vendor}</p>
            )}
          </div>
        )}

        {isAdmin && (
          <div className="rounded-console border border-success-100 bg-success-50/60 p-4">
            <div className="mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-success-700" />
              <h3 className="text-sm font-semibold text-console-text">Source of funds *</h3>
            </div>
            <select
              value={sourceOfFunds}
              onChange={(e) => {
                setSourceOfFunds(e.target.value as "company" | "siteManager");
                setSelectedSiteManagerId("");
                setErrors((prev) => ({
                  ...prev,
                  sourceOfFunds: "",
                  selectedSiteManager: "",
                }));
              }}
              className={fieldClass}
            >
              <option value="company">Company funds</option>
              <option value="siteManager">Site manager funds</option>
            </select>
            {errors.sourceOfFunds && (
              <p className="mt-1.5 text-sm text-danger-600">{errors.sourceOfFunds}</p>
            )}
            {sourceOfFunds === "siteManager" && (
              <div className="mt-4">
                <label className={labelClass}>Select site manager *</label>
                <select
                  value={selectedSiteManagerId}
                  onChange={(e) => {
                    setSelectedSiteManagerId(e.target.value);
                    setErrors((prev) => ({ ...prev, selectedSiteManager: "" }));
                  }}
                  className={fieldClass}
                >
                  <option value="">Select site manager</option>
                  {siteManagers.map((mgr: any) => (
                    <option key={mgr.id} value={mgr.id}>
                      {mgr.name}
                    </option>
                  ))}
                </select>
                {errors.selectedSiteManager && (
                  <p className="mt-1.5 text-sm text-danger-600">{errors.selectedSiteManager}</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Amount (₹) *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`${fieldClass} ${errors.amount ? "border-danger-300" : ""}`}
              placeholder="0.00"
              step="0.01"
            />
            {errors.amount && (
              <p className="mt-1.5 text-sm text-danger-600">{errors.amount}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Tip (₹) optional</label>
            <input
              type="number"
              value={tip}
              onChange={(e) => setTip(e.target.value)}
              className={fieldClass}
              placeholder="0.00"
              step="0.01"
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={`${fieldClass} h-20`}
            placeholder="Any additional details..."
          />
        </div>

        <div>
          <label className={labelClass}>Date *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={fieldClass}
          />
        </div>

        {errors.submit && (
          <p className="flex items-center gap-1.5 text-sm text-danger-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {errors.submit}
          </p>
        )}
      </div>
    </Modal>
  );
};

export default AddMiscellaneousExpenseModal;
