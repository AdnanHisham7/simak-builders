import React, { useState, useEffect } from "react";
import { X, Plus, AlertCircle, DollarSign } from "lucide-react";
import { addMiscellaneousExpense } from "@/services/miscellaneousExpenseService";
import { privateClient } from "@/api";
import { getSiteDetails } from "@/services/siteService";

interface Props {
  siteId: string;
  isAdmin?: boolean;
  onClose: () => void;
}

const AddMiscellaneousExpenseModal: React.FC<Props> = ({
  siteId,
  isAdmin = false,
  onClose,
}) => {
  const [category, setCategory] = useState<"machinery" | "rental" | "service">(
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
    // Fetch site managers if admin
    if (isAdmin && siteId) {
      const fetchManagers = async () => {
        const site = await getSiteDetails(siteId);
        setSiteManagers(site.siteManagers || []);
      };
      fetchManagers();
    }
    // Fetch vendors list
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <Plus className="w-6 h-6 text-blue-600" />
            <span>Add Miscellaneous Expense</span>
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="machinery">Machinery</option>
              <option value="rental">Rental</option>
              <option value="service">Service</option>
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name / Description *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg ${errors.name ? "border-red-300" : "border-gray-200"}`}
              placeholder="e.g., JCB Hire, Generator Service"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value as "cash" | "credit");
                setSelectedVendorId("");
                setErrors((prev) => ({ ...prev, vendor: "" }));
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="cash">Cash</option>
              <option value="credit">Credit</option>
            </select>
          </div>

          {/* Vendor Selection (if credit) */}
          {paymentMethod === "credit" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Vendor *
              </label>
              <select
                value={selectedVendorId}
                onChange={(e) => {
                  setSelectedVendorId(e.target.value);
                  setErrors((prev) => ({ ...prev, vendor: "" }));
                }}
                className={`w-full px-3 py-2 border rounded-lg ${errors.vendor ? "border-red-300" : "border-gray-200"}`}
              >
                <option value="">Select a vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor._id} value={vendor._id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
              {errors.vendor && (
                <p className="text-red-500 text-sm mt-1">{errors.vendor}</p>
              )}
            </div>
          )}

          {/* Source of Funds (admin only) */}
          {isAdmin && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center mb-3">
                <DollarSign className="w-5 h-5 text-emerald-600 mr-2" />
                <h3 className="font-semibold text-gray-900">
                  Source of Funds *
                </h3>
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
              >
                <option value="company">Company Funds</option>
                <option value="siteManager">Site Manager Funds</option>
              </select>
              {errors.sourceOfFunds && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.sourceOfFunds}
                </p>
              )}
              {sourceOfFunds === "siteManager" && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Site Manager *
                  </label>
                  <select
                    value={selectedSiteManagerId}
                    onChange={(e) => {
                      setSelectedSiteManagerId(e.target.value);
                      setErrors((prev) => ({
                        ...prev,
                        selectedSiteManager: "",
                      }));
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Select Site Manager</option>
                    {siteManagers.map((mgr: any) => (
                      <option key={mgr.id} value={mgr.id}>
                        {mgr.name}
                      </option>
                    ))}
                  </select>
                  {errors.selectedSiteManager && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.selectedSiteManager}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Amount & Tip */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₹) *
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg ${errors.amount ? "border-red-300" : "border-gray-200"}`}
                placeholder="0.00"
                step="0.01"
              />
              {errors.amount && (
                <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tip (₹) Optional
              </label>
              <input
                type="number"
                value={tip}
                onChange={(e) => setTip(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                placeholder="0.00"
                step="0.01"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg h-20"
              placeholder="Any additional details..."
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            />
          </div>
        </div>

        {errors.submit && (
          <p className="text-red-500 text-sm mt-4 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.submit}
          </p>
        )}

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-5 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-70"
          >
            {loading ? "Adding..." : "Add Expense"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMiscellaneousExpenseModal;
