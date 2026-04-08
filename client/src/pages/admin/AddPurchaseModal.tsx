import React, { useState, useEffect } from "react";
import {
  X,
  Upload,
  Plus,
  Trash2,
  ShoppingCart,
  User,
  Receipt,
  AlertCircle,
  Check,
  Building2,
  DollarSign,
  Calendar,
} from "lucide-react";
import { addPurchase } from "@/services/purchaseService";
import { getVendors, createVendor, Vendor } from "@/services/vendorService";
import { privateClient } from "@/api";
import { getSiteDetails } from "@/services/siteService";

interface AddPurchaseModalProps {
  siteId: string | null; // null for company-level purchases
  onClose: () => void;
  isAdmin?: boolean;
}

interface PurchaseItem {
  name: string;
  unit: string;
  category: string;
  quantity: string | number;
  price: string | number; // unit price
  totalAmount: string | number; // NEW: per-item total amount
}

const AddPurchaseModal: React.FC<AddPurchaseModalProps> = ({
  siteId,
  isAdmin = false,
  onClose,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<string>("");
  const [showNewVendorForm, setShowNewVendorForm] = useState(false);
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorEmail, setNewVendorEmail] = useState("");
  const [newVendorPhone, setNewVendorPhone] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([
    {
      name: "",
      unit: "",
      category: "",
      quantity: "",
      price: "",
      totalAmount: "",
    },
  ]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [transportationFee, setTransportationFee] = useState<string>(""); // NEW: optional transportation fee
  const [billFile, setBillFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [purchaseDate, setPurchaseDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [sourceOfFunds, setSourceOfFunds] = useState<"company" | "siteManager">(
    "company",
  );
  const [selectedSiteManagerId, setSelectedSiteManagerId] = useState("");
  const [siteManagers, setSiteManagers] = useState<any[]>([]);

  const categories = [
    "Earth Work",
    "Rubble work",
    "Laterite Work",
    "Concrete Work",
    "Wood Work",
    "Waterproofing & Pest control",
    "Plastering Wiring Plumbing",
    "Floor Work",
    "Interior work",
    "Paint Work",
    "Masonry Work",
    "Other",
  ];

  const units = [
    "kg",
    "Ft",
    "Nos",
    "Load",
    "bag",
    "sheet",
    "hour",
    "day",
    "bundle",
    "kintel",
    "ton",
    "length",
    "N/A",
    "Other",
  ];

  useEffect(() => {
    setIsAnimating(true);
  }, []);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const vendorList = await getVendors();
        setVendors(vendorList);
      } catch (error) {
        console.error("Error fetching vendors:", error);
      }
    };
    fetchVendors();
  }, []);

  useEffect(() => {
    const fetchSiteManagers = async () => {
      if (!isAdmin || !siteId) return;
      try {
        const response = await privateClient.get("/users", {
          params: { role: "siteManager", siteId },
        });
        const site = await getSiteDetails(siteId!)
        setSiteManagers(site.siteManagers || []);
        console.log(site.siteManagers, "site managers");
      } catch (error) {
        console.error("Error fetching site managers:", error);
      }
    };
    fetchSiteManagers();
  }, [isAdmin, siteId]);

  useEffect(() => {
    calculateTotal();
  }, [items]);

  const getSizeStyles = () => "w-full max-w-4xl max-h-[90vh]";

  const addItem = () => {
    setItems([
      ...items,
      {
        name: "",
        unit: "",
        category: "",
        quantity: "",
        price: "",
        totalAmount: "",
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  const handleItemChange = (
    index: number,
    field: keyof PurchaseItem,
    value: string,
  ) => {
    const newItems = [...items];
    const item = newItems[index];
    newItems[index][field] = value;

    const qty = parseFloat(item.quantity as string) || 0;
    const price = parseFloat(item.price as string) || 0;
    const total = parseFloat(item.totalAmount as string) || 0;

    if (field === "totalAmount") {
      // User manually entered total amount → auto-calculate unit price (if qty > 0)
      if (qty > 0) {
        newItems[index].price = (total / qty).toFixed(2);
      }
    } else if (field === "quantity" || field === "price") {
      // User changed qty or unit price → auto-calculate total amount
      newItems[index].totalAmount = (qty * price).toFixed(2);
    }

    setItems(newItems);
    setErrors((prev) => ({
      ...prev,
      [`item_${index}_quantity`]: "",
      [`item_${index}_price`]: "",
      [`item_${index}_totalAmount`]: "",
    }));
  };

  const calculateTotal = () => {
    const total = items.reduce((sum, item) => {
      const itemTotal = parseFloat(item.totalAmount as string) || 0;
      return sum + itemTotal;
    }, 0);
    setTotalAmount(total);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedVendor) {
      newErrors.vendor = "Please select a vendor";
    }

    if (selectedVendor === "new") {
      if (!newVendorName) newErrors.vendorName = "Vendor name is required";
      if (!newVendorEmail) newErrors.vendorEmail = "Vendor email is required";
      if (!newVendorPhone) newErrors.vendorPhone = "Vendor phone is required";
    }

    if (!paymentMethod) {
      newErrors.paymentMethod = "Please select a payment method";
    }

    items.forEach((item, index) => {
      if (!item.name) newErrors[`item_${index}_name`] = "Item name is required";

      if (!item.unit) {
        newErrors[`item_${index}_unit`] = "Unit is required";
      } else if (item.unit === "Other") {
        newErrors[`item_${index}_unit`] = "Custom unit is required";
      }

      if (!item.category) {
        newErrors[`item_${index}_category`] = "Category is required";
      } else if (item.category === "Other") {
        newErrors[`item_${index}_category`] = "Custom category is required";
      }

      if (!item.quantity || parseFloat(item.quantity as string) <= 0) {
        newErrors[`item_${index}_quantity`] = "Valid quantity is required";
      }
      if (!item.price || parseFloat(item.price as string) <= 0) {
        newErrors[`item_${index}_price`] = "Valid unit price is required";
      }
      if (!item.totalAmount || parseFloat(item.totalAmount as string) <= 0) {
        newErrors[`item_${index}_totalAmount`] =
          "Valid total amount is required";
      }
    });

    if (!billFile) {
      newErrors.billFile = "Please upload a bill";
    }

    if (isAdmin && paymentMethod === "cash") {
      if (!sourceOfFunds)
        newErrors.sourceOfFunds = "Source of funds is required";
      if (sourceOfFunds === "siteManager" && !selectedSiteManagerId) {
        newErrors.selectedSiteManager = "Please select a site manager";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (
      file &&
      (file.type.startsWith("image/") || file.type === "application/pdf")
    ) {
      setBillFile(file);
      setErrors((prev) => ({ ...prev, billFile: "" }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      let vendorId: string;

      if (selectedVendor === "new") {
        const newVendor = await createVendor({
          name: newVendorName,
          email: newVendorEmail,
          phone: newVendorPhone,
        });
        vendorId = newVendor.id;
        setVendors([...vendors, newVendor]);
      } else {
        vendorId = selectedVendor;
      }

      const formData = new FormData();
      formData.append("vendorId", vendorId);
      formData.append("items", JSON.stringify(items));
      formData.append("totalAmount", totalAmount.toString());
      formData.append("transportationFee", transportationFee || "0"); // NEW
      formData.append("billUpload", billFile!);
      formData.append("paymentMethod", paymentMethod);
      formData.append("date", purchaseDate);
      if (siteId) formData.append("siteId", siteId);

      const finalSource = isAdmin ? sourceOfFunds : "siteManager";
      formData.append("sourceOfFunds", finalSource);
      if (finalSource === "siteManager") {
        if (selectedSiteManagerId) {
          formData.append("deductFromUserId", selectedSiteManagerId);
        } else if (!isAdmin) {
          // site manager using their own account – backend will use req.user
        }
      }

      await addPurchase(formData);

      setCurrentStep(3);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error adding purchase:", error);
      setErrors({ submit: "Failed to add purchase. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 200);
  };

  if (currentStep === 3) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 w-96 text-center transform scale-100 opacity-100 transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-t-2xl" />
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Purchase Added Successfully!
          </h3>
          <p className="text-gray-600">
            Your purchase has been recorded and saved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div
        className={`relative bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-200 transform overflow-hidden ${
          isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
        } ${getSizeStyles()}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl" />
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <ShoppingCart size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Add New Purchase
                </h2>
                <p className="text-sm text-gray-500 flex items-center">
                  {siteId ? (
                    <>
                      <Building2 size={14} className="mr-1" />
                      Site: {siteId}
                    </>
                  ) : (
                    <>
                      <Building2 size={14} className="mr-1" />
                      Company Level
                    </>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)] px-6 py-4">
          <div className="space-y-6 mb-10">
            {/* Vendor Information */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center mb-3">
                <User size={18} className="text-blue-600 mr-2" />
                <h3 className="font-semibold text-gray-900">
                  Vendor Information
                </h3>
              </div>
              <div className="space-y-3">
                <div>
                  <select
                    value={selectedVendor}
                    onChange={(e) => {
                      setSelectedVendor(e.target.value);
                      setShowNewVendorForm(e.target.value === "new");
                      setErrors((prev) => ({ ...prev, vendor: "" }));
                    }}
                    className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.vendor
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <option value="">Select a vendor</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </option>
                    ))}
                    <option value="new">➕ Add New Vendor</option>
                  </select>
                  {errors.vendor && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.vendor}
                    </p>
                  )}
                </div>
                {showNewVendorForm && (
                  <div className="space-y-3 p-4 bg-white rounded-lg border border-blue-200 animate-in slide-in-from-top-2 duration-300">
                    <h4 className="font-medium text-gray-800 mb-2">
                      New Vendor Details
                    </h4>
                    <input
                      type="text"
                      placeholder="Vendor Name *"
                      value={newVendorName}
                      onChange={(e) => {
                        setNewVendorName(e.target.value);
                        setErrors((prev) => ({ ...prev, vendorName: "" }));
                      }}
                      className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.vendorName
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200"
                      }`}
                    />
                    {errors.vendorName && (
                      <p className="text-red-500 text-sm">
                        {errors.vendorName}
                      </p>
                    )}
                    <input
                      type="email"
                      placeholder="Vendor Email *"
                      value={newVendorEmail}
                      onChange={(e) => {
                        setNewVendorEmail(e.target.value);
                        setErrors((prev) => ({ ...prev, vendorEmail: "" }));
                      }}
                      className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.vendorEmail
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200"
                      }`}
                    />
                    {errors.vendorEmail && (
                      <p className="text-red-500 text-sm">
                        {errors.vendorEmail}
                      </p>
                    )}
                    <input
                      type="tel"
                      placeholder="Vendor Phone *"
                      value={newVendorPhone}
                      onChange={(e) => {
                        setNewVendorPhone(e.target.value);
                        setErrors((prev) => ({ ...prev, vendorPhone: "" }));
                      }}
                      className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.vendorPhone
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200"
                      }`}
                    />
                    {errors.vendorPhone && (
                      <p className="text-red-500 text-sm">
                        {errors.vendorPhone}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-100">
              <div className="flex items-center mb-3">
                <DollarSign size={18} className="text-yellow-600 mr-2" />
                <h3 className="font-semibold text-gray-900">Payment Method</h3>
              </div>
              <select
                value={paymentMethod}
                onChange={(e) => {
                  setPaymentMethod(e.target.value);
                  setErrors((prev) => ({ ...prev, paymentMethod: "" }));
                }}
                className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${
                  errors.paymentMethod
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200"
                }`}
              >
                <option value="">Select Payment Method</option>
                <option value="cash">Cash</option>
                <option value="credit">Credit</option>
              </select>
              {errors.paymentMethod && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.paymentMethod}
                </p>
              )}
            </div>

            {isAdmin && paymentMethod === "cash" && (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                <div className="flex items-center mb-3">
                  <DollarSign size={18} className="text-emerald-600 mr-2" />
                  <h3 className="font-semibold text-gray-900">
                    Source of Funds *
                  </h3>
                </div>
                <select
                  value={sourceOfFunds}
                  onChange={(e) => {
                    const val = e.target.value as "company" | "siteManager";
                    setSourceOfFunds(val);
                    setSelectedSiteManagerId("");
                    setErrors((prev) => ({
                      ...prev,
                      sourceOfFunds: "",
                      selectedSiteManager: "",
                    }));
                  }}
                  className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    errors.sourceOfFunds
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200"
                  }`}
                >
                  <option value="company">Company Funds</option>
                  <option value="siteManager">Site Manager Funds</option>
                </select>
                {errors.sourceOfFunds && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.sourceOfFunds}
                  </p>
                )}

                {sourceOfFunds === "siteManager" && (
                  <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
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
                      className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                        errors.selectedSiteManager
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200"
                      }`}
                    >
                      <option value="">Select Site Manager</option>
                      {siteManagers.map((mgr: any) => (
                        <option key={mgr.id} value={mgr.id}>
                          {mgr.name}
                        </option>
                      ))}
                    </select>
                    {errors.selectedSiteManager && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle size={14} className="mr-1" />
                        {errors.selectedSiteManager}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Purchase Date (Admin only) */}
            {isAdmin && (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                <div className="flex items-center mb-3">
                  <Calendar size={18} className="text-indigo-600 mr-2" />
                  <h3 className="font-semibold text-gray-900">Purchase Date</h3>
                </div>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can set past or future dates
                </p>
              </div>
            )}

            {/* Purchase Items - Updated with per-item Total Amount */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Receipt size={18} className="text-green-600 mr-2" />
                  <h3 className="font-semibold text-gray-900">
                    Purchase Items
                  </h3>
                </div>
                <button
                  onClick={addItem}
                  className="flex items-center px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 text-sm"
                >
                  <Plus size={16} className="mr-1" />
                  Add Item
                </button>
              </div>
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-4 border border-green-200 relative"
                  >
                    {items.length > 1 && (
                      <button
                        onClick={() => removeItem(index)}
                        className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-50 rounded transition-colors duration-200"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                      {/* Item Name */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Item Name *
                        </label>
                        <input
                          type="text"
                          placeholder="(e.g: Cement)"
                          value={item.name}
                          onChange={(e) => {
                            handleItemChange(index, "name", e.target.value);
                            setErrors((prev) => ({
                              ...prev,
                              [`item_${index}_name`]: "",
                            }));
                          }}
                          className={`w-full px-3 py-2 border rounded-lg text-sm transition-all duration-200 focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
                            errors[`item_${index}_name`]
                              ? "border-red-300 bg-red-50"
                              : "border-gray-200"
                          }`}
                        />
                        {errors[`item_${index}_name`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`item_${index}_name`]}
                          </p>
                        )}
                      </div>

                      {/* Unit with "Other" support */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Unit *
                        </label>
                        <select
                          value={
                            units.includes(item.unit)
                              ? item.unit
                              : item.unit
                                ? "Other"
                                : ""
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            handleItemChange(
                              index,
                              "unit",
                              value === "Other" ? "Other" : value,
                            );
                            setErrors((prev) => ({
                              ...prev,
                              [`item_${index}_unit`]: "",
                            }));
                          }}
                          className={`w-full px-3 py-2 border rounded-lg text-sm transition-all duration-200 focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
                            errors[`item_${index}_unit`]
                              ? "border-red-300 bg-red-50"
                              : "border-gray-200"
                          }`}
                        >
                          <option value="">Select Unit</option>
                          {units
                            .filter((unit) => unit !== "Other")
                            .map((unit) => (
                              <option key={unit} value={unit}>
                                {unit}
                              </option>
                            ))}
                          <option value="Other">Other</option>
                        </select>

                        {/* Custom unit input */}
                        {(item.unit === "Other" ||
                          (item.unit && !units.includes(item.unit))) && (
                          <input
                            type="text"
                            placeholder="Enter custom unit..."
                            value={item.unit === "Other" ? "" : item.unit}
                            onChange={(e) => {
                              handleItemChange(index, "unit", e.target.value);
                              setErrors((prev) => ({
                                ...prev,
                                [`item_${index}_unit`]: "",
                              }));
                            }}
                            className={`mt-2 w-full px-3 py-2 border rounded-lg text-sm transition-all duration-200 focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
                              errors[`item_${index}_unit`]
                                ? "border-red-300 bg-red-50"
                                : "border-gray-200"
                            }`}
                          />
                        )}

                        {errors[`item_${index}_unit`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`item_${index}_unit`]}
                          </p>
                        )}
                      </div>

                      {/* Category with "Other" support */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Category *
                        </label>
                        <select
                          value={
                            categories.includes(item.category)
                              ? item.category
                              : item.category
                                ? "Other"
                                : ""
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            handleItemChange(
                              index,
                              "category",
                              value === "Other" ? "Other" : value,
                            );
                            setErrors((prev) => ({
                              ...prev,
                              [`item_${index}_category`]: "",
                            }));
                          }}
                          className={`w-full px-3 py-2 border rounded-lg text-sm transition-all duration-200 focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
                            errors[`item_${index}_category`]
                              ? "border-red-300 bg-red-50"
                              : "border-gray-200"
                          }`}
                        >
                          <option value="">Select Category</option>
                          {categories
                            .filter((cat) => cat !== "Other")
                            .map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          <option value="Other">Other</option>
                        </select>

                        {/* Custom category input */}
                        {(item.category === "Other" ||
                          (item.category &&
                            !categories.includes(item.category))) && (
                          <input
                            type="text"
                            placeholder="Enter custom category..."
                            value={
                              item.category === "Other" ? "" : item.category
                            }
                            onChange={(e) => {
                              handleItemChange(
                                index,
                                "category",
                                e.target.value,
                              );
                              setErrors((prev) => ({
                                ...prev,
                                [`item_${index}_category`]: "",
                              }));
                            }}
                            className={`mt-2 w-full px-3 py-2 border rounded-lg text-sm transition-all duration-200 focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
                              errors[`item_${index}_category`]
                                ? "border-red-300 bg-red-50"
                                : "border-gray-200"
                            }`}
                          />
                        )}

                        {errors[`item_${index}_category`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`item_${index}_category`]}
                          </p>
                        )}
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, "quantity", e.target.value)
                          }
                          className={`w-full px-3 py-2 border rounded-lg text-sm transition-all duration-200 focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
                            errors[`item_${index}_quantity`]
                              ? "border-red-300 bg-red-50"
                              : "border-gray-200"
                          }`}
                        />
                        {errors[`item_${index}_quantity`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`item_${index}_quantity`]}
                          </p>
                        )}
                      </div>

                      {/* Unit Price */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Unit Price *
                        </label>
                        <input
                          type="number"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) =>
                            handleItemChange(index, "price", e.target.value)
                          }
                          className={`w-full px-3 py-2 border rounded-lg text-sm transition-all duration-200 focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
                            errors[`item_${index}_price`]
                              ? "border-red-300 bg-red-50"
                              : "border-gray-200"
                          }`}
                        />
                        {errors[`item_${index}_price`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`item_${index}_price`]}
                          </p>
                        )}
                      </div>

                      {/* Total Amount (NEW) */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Total Amount *
                        </label>
                        <input
                          type="number"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          value={item.totalAmount}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "totalAmount",
                              e.target.value,
                            )
                          }
                          className={`w-full px-3 py-2 border rounded-lg text-sm transition-all duration-200 focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
                            errors[`item_${index}_totalAmount`]
                              ? "border-red-300 bg-red-50"
                              : "border-gray-200"
                          }`}
                        />
                        {errors[`item_${index}_totalAmount`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`item_${index}_totalAmount`]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-white rounded-lg border-2 border-green-300">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-700">
                    Total Purchase Amount:
                  </span>
                  <span className="text-2xl font-bold text-green-600">
                    ₹
                    {totalAmount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Transportation Fee (NEW) */}
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-100">
              <div className="flex items-center mb-3">
                <DollarSign size={18} className="text-amber-600 mr-2" />
                <h3 className="font-semibold text-gray-900">
                  Transportation Fee{" "}
                  <span className="text-amber-500 text-sm font-normal">
                    (Optional)
                  </span>
                </h3>
              </div>
              <input
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={transportationFee}
                onChange={(e) => setTransportationFee(e.target.value)}
                className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-sm"
              />
              <p className="text-xs text-amber-600 mt-2">
                This will NOT affect the purchase total. It will be
                automatically recorded as a separate
                <span className="font-medium"> "service" </span> miscellaneous
                expense (Transportation service).
              </p>
            </div>

            {/* Upload Bill */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
              <div className="flex items-center mb-3">
                <Upload size={18} className="text-purple-600 mr-2" />
                <h3 className="font-semibold text-gray-900">Upload Bill</h3>
              </div>
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
                  dragActive
                    ? "border-purple-400 bg-purple-100"
                    : errors.billFile
                      ? "border-red-300 bg-red-50"
                      : "border-purple-200 hover:border-purple-300"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleFileDrop}
              >
                {billFile ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                      <Check size={24} className="text-white" />
                    </div>
                    <p className="text-green-600 font-medium">
                      {billFile.name}
                    </p>
                    <button
                      onClick={() => {
                        setBillFile(null);
                        setErrors((prev) => ({ ...prev, billFile: "" }));
                      }}
                      className="text-red-500 hover:text-red-700 text-sm underline"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload size={32} className="text-purple-400 mx-auto" />
                    <p className="text-gray-600">
                      Drag and drop your bill here, or{" "}
                      <label className="text-purple-600 hover:text-purple-700 cursor-pointer underline">
                        browse files
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setBillFile(file);
                              setErrors((prev) => ({ ...prev, billFile: "" }));
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </p>
                    <p className="text-sm text-gray-400">
                      Supports: Images, PDF (Max: 10MB)
                    </p>
                  </div>
                )}
              </div>
              {errors.billFile && (
                <p className="text-red-500 text-sm mt-2 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.billFile}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4">
          {errors.submit && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm flex items-center">
                <AlertCircle size={16} className="mr-2" />
                {errors.submit}
              </p>
            </div>
          )}
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-3 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <ShoppingCart size={18} className="mr-2" />
                  Submit Purchase
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPurchaseModal;
