import React, { useState, useEffect } from "react";
import {
  Upload,
  Plus,
  Trash2,
  ShoppingCart,
  User,
  Receipt,
  AlertCircle,
  Check,
  DollarSign,
  Calendar,
  FileText,
} from "lucide-react";
import { addPurchase } from "@/services/purchaseService";
import { getVendors, createVendor, Vendor } from "@/services/vendorService";
import { getSiteDetails } from "@/services/siteService";
import { searchItems, ItemSuggestion } from "@/services/itemService";
import { PURCHASE_CATEGORIES, PURCHASE_UNITS } from "@/constants/purchaseOptions";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Tooltip from "@/components/ui/Tooltip";
import { cn } from "@/lib/cn";

interface AddPurchaseModalProps {
  siteId: string | null;
  onClose: () => void;
  isAdmin?: boolean;
}

interface PurchaseItem {
  name: string;
  unit: string;
  category: string;
  quantity: string | number;
  price: string | number;
  totalAmount: string | number;
}

const sectionClass = "rounded-console border border-console-border bg-console-bg p-4";
const fieldClass = (hasError?: boolean) =>
  cn(
    "w-full rounded-lg border px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2",
    hasError
      ? "border-danger-400 bg-danger-50 focus:ring-danger-100"
      : "border-console-border bg-white focus:border-brand-500 focus:ring-brand-100",
  );

const AddPurchaseModal: React.FC<AddPurchaseModalProps> = ({ siteId, isAdmin = false, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<string>("");
  const [showNewVendorForm, setShowNewVendorForm] = useState(false);
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorEmail, setNewVendorEmail] = useState("");
  const [newVendorPhone, setNewVendorPhone] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([
    { name: "", unit: "", category: "", quantity: "", price: "", totalAmount: "" },
  ]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [transportationFee, setTransportationFee] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [billFile, setBillFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [purchaseDate, setPurchaseDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [sourceOfFunds, setSourceOfFunds] = useState<"company" | "siteManager">("company");
  const [selectedSiteManagerId, setSelectedSiteManagerId] = useState("");
  const [siteManagers, setSiteManagers] = useState<any[]>([]);
  const [siteName, setSiteName] = useState<string | null>(null);
  const [itemSuggestions, setItemSuggestions] = useState<Record<number, ItemSuggestion[]>>({});
  const [openSuggestionIndex, setOpenSuggestionIndex] = useState<number | null>(null);
  const itemSearchTimers = React.useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const categories = PURCHASE_CATEGORIES;
  const units = PURCHASE_UNITS;

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
    if (!siteId) {
      setSiteName(null);
      return;
    }
    const fetchSite = async () => {
      try {
        const site = await getSiteDetails(siteId);
        setSiteName(site.name);
        if (isAdmin) {
          setSiteManagers(site.siteManagers || []);
        }
      } catch (error) {
        console.error("Error fetching site details:", error);
      }
    };
    fetchSite();
  }, [siteId, isAdmin]);

  useEffect(() => {
    calculateTotal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const addItem = () => {
    setItems([...items, { name: "", unit: "", category: "", quantity: "", price: "", totalAmount: "" }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof PurchaseItem, value: string) => {
    const newItems = [...items];
    const item = newItems[index];
    newItems[index][field] = value;

    const qty = parseFloat(item.quantity as string) || 0;
    const price = parseFloat(item.price as string) || 0;
    const total = parseFloat(item.totalAmount as string) || 0;

    if (field === "totalAmount") {
      if (qty > 0) {
        newItems[index].price = (total / qty).toFixed(2);
      }
    } else if (field === "quantity" || field === "price") {
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

  const handleItemNameSearch = (index: number, value: string) => {
    handleItemChange(index, "name", value);
    setOpenSuggestionIndex(index);

    if (itemSearchTimers.current[index]) {
      clearTimeout(itemSearchTimers.current[index]);
    }

    if (!value || value.trim().length < 2) {
      setItemSuggestions((prev) => ({ ...prev, [index]: [] }));
      return;
    }

    itemSearchTimers.current[index] = setTimeout(async () => {
      try {
        const results = await searchItems(value.trim());
        setItemSuggestions((prev) => ({ ...prev, [index]: results }));
      } catch (error) {
        console.error("Error fetching item suggestions:", error);
      }
    }, 300);
  };

  const selectItemSuggestion = (index: number, suggestion: ItemSuggestion) => {
    const newItems = [...items];
    newItems[index].name = suggestion.name;
    if (suggestion.category && !newItems[index].category) {
      newItems[index].category = suggestion.category;
    }
    if (suggestion.defaultUnit && !newItems[index].unit) {
      newItems[index].unit = suggestion.defaultUnit;
    }
    setItems(newItems);
    setErrors((prev) => ({
      ...prev,
      [`item_${index}_name`]: "",
      [`item_${index}_category`]: "",
      [`item_${index}_unit`]: "",
    }));
    setOpenSuggestionIndex(null);
    setItemSuggestions((prev) => ({ ...prev, [index]: [] }));
  };

  const calculateTotal = () => {
    const total = items.reduce((sum, item) => sum + (parseFloat(item.totalAmount as string) || 0), 0);
    setTotalAmount(total);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedVendor) newErrors.vendor = "Please select a vendor";

    if (selectedVendor === "new") {
      if (!newVendorName) newErrors.vendorName = "Vendor name is required";
      if (!newVendorEmail) newErrors.vendorEmail = "Vendor email is required";
      if (!newVendorPhone) newErrors.vendorPhone = "Vendor phone is required";
    }

    if (!paymentMethod) newErrors.paymentMethod = "Please select a payment method";

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
        newErrors[`item_${index}_totalAmount`] = "Valid total amount is required";
      }
    });

    if (!billFile) newErrors.billFile = "Please upload a bill";

    if (isAdmin && paymentMethod === "cash") {
      if (!sourceOfFunds) newErrors.sourceOfFunds = "Source of funds is required";
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
    if (file && (file.type.startsWith("image/") || file.type === "application/pdf")) {
      setBillFile(file);
      setErrors((prev) => ({ ...prev, billFile: "" }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
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
      formData.append("transportationFee", transportationFee || "0");
      formData.append("notes", notes || "");
      formData.append("billUpload", billFile!);
      formData.append("paymentMethod", paymentMethod);
      formData.append("date", purchaseDate);
      if (siteId) formData.append("siteId", siteId);

      const finalSource = isAdmin ? sourceOfFunds : "siteManager";
      formData.append("sourceOfFunds", finalSource);
      if (finalSource === "siteManager" && selectedSiteManagerId) {
        formData.append("deductFromUserId", selectedSiteManagerId);
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

  if (currentStep === 3) {
    return (
      <Modal isOpen onClose={onClose} size="sm" closeOnOverlayClick={false}>
        <div className="py-4 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-100 text-success-700">
            <Check size={28} />
          </div>
          <h3 className="mb-1.5 text-lg font-semibold text-console-text">Purchase added successfully!</h3>
          <p className="text-sm text-console-muted">Your purchase has been recorded and saved.</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      disableClose={loading}
      closeOnOverlayClick={!loading}
      size="xl"
      title="Add New Purchase"
      description={
        siteId ? `Site: ${siteName ?? "Loading..."}` : "Company level purchase"
      }
      footer={
        <>
          {errors.submit && (
            <p className="mr-auto flex items-center gap-1.5 text-sm text-danger-600">
              <AlertCircle size={14} /> {errors.submit}
            </p>
          )}
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            <ShoppingCart size={16} /> Submit purchase
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className={sectionClass}>
          <div className="mb-3 flex items-center gap-2">
            <User size={17} className="text-brand-600" />
            <h3 className="text-sm font-semibold text-console-text">Vendor information</h3>
          </div>
          <select
            value={selectedVendor}
            onChange={(e) => {
              setSelectedVendor(e.target.value);
              setShowNewVendorForm(e.target.value === "new");
              setErrors((prev) => ({ ...prev, vendor: "" }));
            }}
            className={fieldClass(!!errors.vendor)}
          >
            <option value="">Select a vendor</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
            <option value="new">Add new vendor</option>
          </select>
          {errors.vendor && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-danger-600">
              <AlertCircle size={12} /> {errors.vendor}
            </p>
          )}

          {showNewVendorForm && (
            <div className="mt-3 space-y-3 rounded-lg border border-console-border bg-white p-4">
              <h4 className="text-sm font-medium text-console-text">New vendor details</h4>
              <div>
                <input
                  type="text"
                  placeholder="Vendor name *"
                  value={newVendorName}
                  onChange={(e) => {
                    setNewVendorName(e.target.value);
                    setErrors((prev) => ({ ...prev, vendorName: "" }));
                  }}
                  className={fieldClass(!!errors.vendorName)}
                />
                {errors.vendorName && <p className="mt-1 text-xs text-danger-600">{errors.vendorName}</p>}
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Vendor email *"
                  value={newVendorEmail}
                  onChange={(e) => {
                    setNewVendorEmail(e.target.value);
                    setErrors((prev) => ({ ...prev, vendorEmail: "" }));
                  }}
                  className={fieldClass(!!errors.vendorEmail)}
                />
                {errors.vendorEmail && <p className="mt-1 text-xs text-danger-600">{errors.vendorEmail}</p>}
              </div>
              <div>
                <input
                  type="tel"
                  placeholder="Vendor phone *"
                  value={newVendorPhone}
                  onChange={(e) => {
                    setNewVendorPhone(e.target.value);
                    setErrors((prev) => ({ ...prev, vendorPhone: "" }));
                  }}
                  className={fieldClass(!!errors.vendorPhone)}
                />
                {errors.vendorPhone && <p className="mt-1 text-xs text-danger-600">{errors.vendorPhone}</p>}
              </div>
            </div>
          )}
        </div>

        <div className={sectionClass}>
          <div className="mb-3 flex items-center gap-2">
            <DollarSign size={17} className="text-warning-600" />
            <h3 className="text-sm font-semibold text-console-text">Payment method</h3>
          </div>
          <select
            value={paymentMethod}
            onChange={(e) => {
              setPaymentMethod(e.target.value);
              setErrors((prev) => ({ ...prev, paymentMethod: "" }));
            }}
            className={fieldClass(!!errors.paymentMethod)}
          >
            <option value="">Select payment method</option>
            <option value="cash">Cash</option>
            <option value="credit">Credit</option>
          </select>
          {errors.paymentMethod && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-danger-600">
              <AlertCircle size={12} /> {errors.paymentMethod}
            </p>
          )}
        </div>

        {isAdmin && paymentMethod === "cash" && (
          <div className={sectionClass}>
            <div className="mb-3 flex items-center gap-2">
              <DollarSign size={17} className="text-success-600" />
              <h3 className="text-sm font-semibold text-console-text">Source of funds *</h3>
            </div>
            <select
              value={sourceOfFunds}
              onChange={(e) => {
                const val = e.target.value as "company" | "siteManager";
                setSourceOfFunds(val);
                setSelectedSiteManagerId("");
                setErrors((prev) => ({ ...prev, sourceOfFunds: "", selectedSiteManager: "" }));
              }}
              className={fieldClass(!!errors.sourceOfFunds)}
            >
              <option value="company">Company funds</option>
              <option value="siteManager">Site manager funds</option>
            </select>
            {errors.sourceOfFunds && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-danger-600">
                <AlertCircle size={12} /> {errors.sourceOfFunds}
              </p>
            )}

            {sourceOfFunds === "siteManager" && (
              <div className="mt-4">
                <label className="mb-1 block text-xs font-medium text-console-text">Select site manager *</label>
                <select
                  value={selectedSiteManagerId}
                  onChange={(e) => {
                    setSelectedSiteManagerId(e.target.value);
                    setErrors((prev) => ({ ...prev, selectedSiteManager: "" }));
                  }}
                  className={fieldClass(!!errors.selectedSiteManager)}
                >
                  <option value="">Select site manager</option>
                  {siteManagers.map((mgr: any) => (
                    <option key={mgr.id} value={mgr.id}>
                      {mgr.name}
                    </option>
                  ))}
                </select>
                {errors.selectedSiteManager && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-danger-600">
                    <AlertCircle size={12} /> {errors.selectedSiteManager}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {isAdmin && (
          <div className={sectionClass}>
            <div className="mb-3 flex items-center gap-2">
              <Calendar size={17} className="text-brand-600" />
              <h3 className="text-sm font-semibold text-console-text">Purchase date</h3>
            </div>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className={fieldClass()}
            />
            <p className="mt-1.5 text-xs text-console-muted">You can set past or future dates</p>
          </div>
        )}

        <div className={sectionClass}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt size={17} className="text-success-600" />
              <h3 className="text-sm font-semibold text-console-text">Purchase items</h3>
            </div>
            <Button size="sm" variant="secondary" onClick={addItem}>
              <Plus size={14} /> Add item
            </Button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="relative rounded-lg border border-console-border bg-white p-4">
                {items.length > 1 && (
                  <Tooltip label="Remove item">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      aria-label="Remove item"
                      className="absolute right-2 top-2 rounded p-1 text-danger-600 transition-colors hover:bg-danger-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </Tooltip>
                )}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6">
                  <div className="relative">
                    <label className="mb-1 block text-xs font-medium text-console-text">Item name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Cement"
                      value={item.name}
                      autoComplete="off"
                      onChange={(e) => {
                        handleItemNameSearch(index, e.target.value);
                        setErrors((prev) => ({ ...prev, [`item_${index}_name`]: "" }));
                      }}
                      onFocus={() => setOpenSuggestionIndex(index)}
                      onBlur={() => setTimeout(() => setOpenSuggestionIndex(null), 150)}
                      className={cn(fieldClass(!!errors[`item_${index}_name`]), "text-sm")}
                    />
                    {openSuggestionIndex === index && (itemSuggestions[index]?.length ?? 0) > 0 && (
                      <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-console-border bg-white shadow-console-lg">
                        {itemSuggestions[index].map((suggestion) => (
                          <button
                            type="button"
                            key={suggestion._id}
                            onMouseDown={() => selectItemSuggestion(index, suggestion)}
                            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-brand-50"
                          >
                            <span className="text-console-text">{suggestion.name}</span>
                            {suggestion.category && (
                              <span className="text-xs text-console-muted">{suggestion.category}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    {errors[`item_${index}_name`] && (
                      <p className="mt-1 text-xs text-danger-600">{errors[`item_${index}_name`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-console-text">Unit *</label>
                    <select
                      value={units.includes(item.unit) ? item.unit : item.unit ? "Other" : ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        handleItemChange(index, "unit", value === "Other" ? "Other" : value);
                        setErrors((prev) => ({ ...prev, [`item_${index}_unit`]: "" }));
                      }}
                      className={cn(fieldClass(!!errors[`item_${index}_unit`]), "text-sm")}
                    >
                      <option value="">Select unit</option>
                      {units.filter((u) => u !== "Other").map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                    {(item.unit === "Other" || (item.unit && !units.includes(item.unit))) && (
                      <input
                        type="text"
                        placeholder="Enter custom unit..."
                        value={item.unit === "Other" ? "" : item.unit}
                        onChange={(e) => {
                          handleItemChange(index, "unit", e.target.value);
                          setErrors((prev) => ({ ...prev, [`item_${index}_unit`]: "" }));
                        }}
                        className={cn(fieldClass(!!errors[`item_${index}_unit`]), "mt-2 text-sm")}
                      />
                    )}
                    {errors[`item_${index}_unit`] && (
                      <p className="mt-1 text-xs text-danger-600">{errors[`item_${index}_unit`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-console-text">Category *</label>
                    <select
                      value={categories.includes(item.category) ? item.category : item.category ? "Other" : ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        handleItemChange(index, "category", value === "Other" ? "Other" : value);
                        setErrors((prev) => ({ ...prev, [`item_${index}_category`]: "" }));
                      }}
                      className={cn(fieldClass(!!errors[`item_${index}_category`]), "text-sm")}
                    >
                      <option value="">Select category</option>
                      {categories.filter((c) => c !== "Other").map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                    {(item.category === "Other" || (item.category && !categories.includes(item.category))) && (
                      <input
                        type="text"
                        placeholder="Enter custom category..."
                        value={item.category === "Other" ? "" : item.category}
                        onChange={(e) => {
                          handleItemChange(index, "category", e.target.value);
                          setErrors((prev) => ({ ...prev, [`item_${index}_category`]: "" }));
                        }}
                        className={cn(fieldClass(!!errors[`item_${index}_category`]), "mt-2 text-sm")}
                      />
                    )}
                    {errors[`item_${index}_category`] && (
                      <p className="mt-1 text-xs text-danger-600">{errors[`item_${index}_category`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-console-text">Quantity *</label>
                    <input
                      type="number"
                      placeholder="0"
                      min="0"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                      className={cn(fieldClass(!!errors[`item_${index}_quantity`]), "text-sm")}
                    />
                    {errors[`item_${index}_quantity`] && (
                      <p className="mt-1 text-xs text-danger-600">{errors[`item_${index}_quantity`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-console-text">Unit price *</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => handleItemChange(index, "price", e.target.value)}
                      className={cn(fieldClass(!!errors[`item_${index}_price`]), "text-sm")}
                    />
                    {errors[`item_${index}_price`] && (
                      <p className="mt-1 text-xs text-danger-600">{errors[`item_${index}_price`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-console-text">Total amount *</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      value={item.totalAmount}
                      onChange={(e) => handleItemChange(index, "totalAmount", e.target.value)}
                      className={cn(fieldClass(!!errors[`item_${index}_totalAmount`]), "text-sm")}
                    />
                    {errors[`item_${index}_totalAmount`] && (
                      <p className="mt-1 text-xs text-danger-600">{errors[`item_${index}_totalAmount`]}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border-2 border-success-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-console-text">Total purchase amount:</span>
              <span className="text-2xl font-bold text-success-700">
                ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        <div className={sectionClass}>
          <div className="mb-3 flex items-center gap-2">
            <DollarSign size={17} className="text-warning-600" />
            <h3 className="text-sm font-semibold text-console-text">
              Transportation fee <span className="font-normal text-console-muted">(Optional)</span>
            </h3>
          </div>
          <input
            type="number"
            placeholder="0.00"
            min="0"
            step="0.01"
            value={transportationFee}
            onChange={(e) => setTransportationFee(e.target.value)}
            className={fieldClass()}
          />
          <p className="mt-2 text-xs text-console-muted">
            This will not affect the purchase total. It will be automatically recorded as a
            separate "service" miscellaneous expense (Transportation service).
          </p>
        </div>

        <div className={sectionClass}>
          <div className="mb-3 flex items-center gap-2">
            <FileText size={17} className="text-console-muted" />
            <h3 className="text-sm font-semibold text-console-text">
              Notes <span className="font-normal text-console-muted">(Optional)</span>
            </h3>
          </div>
          <textarea
            placeholder="Any additional notes about this purchase..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className={cn(fieldClass(), "resize-none")}
          />
        </div>

        <div className={sectionClass}>
          <div className="mb-3 flex items-center gap-2">
            <Upload size={17} className="text-brand-600" />
            <h3 className="text-sm font-semibold text-console-text">Upload bill</h3>
          </div>
          <div
            className={cn(
              "rounded-console border-2 border-dashed p-6 text-center transition-colors",
              dragActive
                ? "border-brand-400 bg-brand-50"
                : errors.billFile
                  ? "border-danger-300 bg-danger-50"
                  : "border-console-border bg-white hover:border-slate-300",
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleFileDrop}
          >
            {billFile ? (
              <div className="space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-500">
                  <Check size={22} className="text-white" />
                </div>
                <p className="font-medium text-success-700">{billFile.name}</p>
                <button
                  type="button"
                  onClick={() => {
                    setBillFile(null);
                    setErrors((prev) => ({ ...prev, billFile: "" }));
                  }}
                  className="text-sm text-danger-600 underline hover:text-danger-700"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload size={30} className="mx-auto text-console-muted" />
                <p className="text-sm text-console-muted">
                  Drag and drop your bill here, or{" "}
                  <label className="cursor-pointer text-brand-700 underline hover:text-brand-800">
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
                <p className="text-xs text-console-muted">Supports: Images, PDF (Max: 10MB)</p>
              </div>
            )}
          </div>
          {errors.billFile && (
            <p className="mt-2 flex items-center gap-1 text-sm text-danger-600">
              <AlertCircle size={14} /> {errors.billFile}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AddPurchaseModal;
