import React, { useState, useCallback } from "react";
import { toast } from "sonner";
import { privateClient } from "@/api";
import {
  Plus,
  Trash2,
  Upload,
  FileText,
  Building,
  CheckCircle,
  Circle,
  Package,
  Wrench,
} from "lucide-react";

const defaultPhases = [
  "Site Visit",
  "Prepare Plan and elevating detailed drawings",
  "Permit",
  "Settout Foundation Basement Belt Masonry, concrete work",
  "Wiring & plumbing",
  "Plastering, waterproofing",
  "White washing",
  "Floor work",
  "Interior work",
  "Paint work",
] as const;

// ==================== TYPES ====================
interface SiteData {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  client: string;
  budget: number;
  status: string;
}

interface Phase {
  name: string;
  status: "not started" | "completed";
}

interface PurchaseItem {
  name: string;
  unit: string;
  category: string;
  quantity: number;
  price: number;
}

interface Purchase {
  vendor: string;
  items: PurchaseItem[];
  totalAmount: number;
  billFile: File | null;
}

interface MiscellaneousExpense {
  category: "machinery" | "rental" | "service";
  name: string;
  amount: number;
  tip: number;
  notes: string;
  date: string;
}

interface FormDataState {
  site: SiteData;
  phases: Phase[];
  purchases: Purchase[];
  miscellaneousExpenses: MiscellaneousExpense[];
  attendances: any[]; // extend when you add UI
  stockUsages: any[];
  contractorTransactions: any[];
}

interface Errors {
  name: boolean;
  address: boolean;
  city: boolean;
  state: boolean;
  zip: boolean;
  client: boolean;
  budget: boolean;
  status: boolean;
}

interface Client {
  id: string;
  name: string;
}

interface Vendor {
  _id: string;
  name: string;
}

interface BulkImportFormProps {
  clients: Client[];
  vendors: Vendor[];
  // employees, stocks, contractors are passed from AdminDashboard but not used yet
  employees?: any[];
  stocks?: any[];
  contractors?: any[];
}

// ==================== STABLE SUB-COMPONENTS (moved outside) ====================
const SectionCard: React.FC<{
  children: React.ReactNode;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
}> = ({ children, title, icon: Icon, count }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
    <div className="p-6 border-b border-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        {count !== undefined && (
          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
            {count} items
          </span>
        )}
      </div>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const InputField: React.FC<{
  label: string;
  children: React.ReactNode;
  required?: boolean;
  error?: boolean;
}> = ({ label, children, required = false, error = false }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
    {error && (
      <p className="text-red-500 text-sm mt-1">This field is required</p>
    )}
  </div>
);

// ==================== MAIN COMPONENT ====================
const BulkImportForm: React.FC<BulkImportFormProps> = ({
  clients,
  vendors,
}) => {
  const [formData, setFormData] = useState<FormDataState>({
    site: {
      name: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      client: "",
      budget: 0,
      status: "InProgress",
    },
    phases: defaultPhases.map((name) => ({
      name,
      status: "not started" as const,
    })),
    purchases: [],
    miscellaneousExpenses: [],
    attendances: [],
    stockUsages: [],
    contractorTransactions: [],
  });

  const [errors, setErrors] = useState<Errors>({
    name: false,
    address: false,
    city: false,
    state: false,
    zip: false,
    client: false,
    budget: false,
    status: false,
  });

  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [activeSection, setActiveSection] = useState<
    "site" | "phases" | "documents" | "purchases" | "miscellaneous"
  >("site");

  // Memoized handlers (stable across re-renders)
  const updateSiteField = useCallback((field: keyof SiteData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      site: { ...prev.site, [field]: value },
    }));

    if (
      (typeof value === "string" && value.trim() !== "") ||
      (field === "budget" && value > 0) ||
      (field === "status" && value !== "")
    ) {
      setErrors((prev) => ({ ...prev, [field]: false }));
    }
  }, []);

  const handleBlur = useCallback((field: keyof Errors, value: any) => {
    if (field === "budget") {
      if (value === "" || Number(value) <= 0) {
        setErrors((prev) => ({ ...prev, [field]: true }));
      }
    } else if (typeof value === "string" && value.trim() === "") {
      setErrors((prev) => ({ ...prev, [field]: true }));
    }
  }, []);

  const handleBulkImport = async () => {
    const siteErrors: Errors = {
      name: formData.site.name.trim() === "",
      address: formData.site.address.trim() === "",
      city: formData.site.city.trim() === "",
      state: formData.site.state.trim() === "",
      zip: formData.site.zip.trim() === "",
      client: formData.site.client === "",
      budget: formData.site.budget <= 0,
      status: formData.site.status === "",
    };

    setErrors(siteErrors);

    if (Object.values(siteErrors).some((error) => error)) {
      toast.error("Please fill in all required fields in Site Details");
      return;
    }

    try {
      const formDataToSend = new FormData();
      const jsonData = { ...formData };
      jsonData.purchases = jsonData.purchases.map((p) => {
        const { billFile, ...rest } = p;
        return { ...rest, billFile: null };
      });

      formDataToSend.append("data", JSON.stringify(jsonData));

      documentFiles.forEach((file, index) => {
        formDataToSend.append(`documents[${index}]`, file);
      });

      formData.purchases.forEach((purchase, index) => {
        if (purchase.billFile) {
          formDataToSend.append(
            `purchases[${index}].billUpload`,
            purchase.billFile,
          );
        }
      });

      await privateClient.post("/company/bulk-import", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Bulk import successful");

      // Reset
      setFormData({
        site: {
          name: "",
          address: "",
          city: "",
          state: "",
          zip: "",
          client: "",
          budget: 0,
          status: "InProgress",
        },
        phases: defaultPhases.map((name) => ({
          name,
          status: "not started" as const,
        })),
        purchases: [],
        miscellaneousExpenses: [],
        attendances: [],
        stockUsages: [],
        contractorTransactions: [],
      });
      setDocumentFiles([]);
      setErrors({
        name: false,
        address: false,
        city: false,
        state: false,
        zip: false,
        client: false,
        budget: false,
        status: false,
      });
    } catch (err) {
      toast.error("Bulk import failed");
    }
  };

  const addArrayItem = useCallback(
    (key: "purchases" | "miscellaneousExpenses") => {
      setFormData((prev) => {
        if (key === "purchases") {
          return {
            ...prev,
            purchases: [
              ...prev.purchases,
              { vendor: "", items: [], totalAmount: 0, billFile: null },
            ],
          };
        }
        if (key === "miscellaneousExpenses") {
          setFormData((prev) => ({
            ...prev,
            miscellaneousExpenses: [
              ...prev.miscellaneousExpenses,
              {
                category: "machinery",
                name: "",
                amount: 0,
                tip: 0,
                notes: "",
                date: "",
              },
            ],
          }));
        }
        return prev;
      });
    },
    [],
  );

  const addPurchaseItem = useCallback((purchaseIndex: number) => {
    setFormData((prev) => {
      const newPurchases = [...prev.purchases];
      newPurchases[purchaseIndex].items.push({
        name: "",
        unit: "",
        category: "",
        quantity: 0,
        price: 0,
      });
      return { ...prev, purchases: newPurchases };
    });
  }, []);

  const removeArrayItem = useCallback(
    (
      key:
        | "phases"
        | "purchases"
        | "miscellaneousExpenses"
        | "attendances"
        | "stockUsages"
        | "contractorTransactions",
      index: number,
    ) => {
      setFormData((prev) => ({
        ...prev,
        [key]: prev[key].filter((_, i) => i !== index),
      }));
    },
    [],
  );

  const removePurchaseItem = useCallback(
    (purchaseIndex: number, itemIndex: number) => {
      setFormData((prev) => {
        const newPurchases = [...prev.purchases];
        newPurchases[purchaseIndex].items = newPurchases[
          purchaseIndex
        ].items.filter((_, i) => i !== itemIndex);
        return { ...prev, purchases: newPurchases };
      });
    },
    [],
  );

  const updateArrayItem = useCallback(
    (
      key: "purchases" | "miscellaneousExpenses",
      index: number,
      field: string,
      value: any,
    ) => {
      setFormData((prev) => {
        const newArray = [...prev[key]];
        newArray[index] = { ...newArray[index], [field]: value };
        return { ...prev, [key]: newArray };
      });
    },
    [],
  );

  const updatePurchaseItem = useCallback(
    (
      purchaseIndex: number,
      itemIndex: number,
      field: keyof PurchaseItem,
      value: any,
    ) => {
      setFormData((prev) => {
        const newPurchases = [...prev.purchases];
        newPurchases[purchaseIndex].items[itemIndex] = {
          ...newPurchases[purchaseIndex].items[itemIndex],
          [field]: value,
        };
        return { ...prev, purchases: newPurchases };
      });
    },
    [],
  );

  const updatePhaseStatus = useCallback(
    (index: number, isCompleted: boolean) => {
      setFormData((prev) => {
        const newPhases = [...prev.phases];
        newPhases[index].status = isCompleted ? "completed" : "not started";
        return { ...prev, phases: newPhases };
      });
    },
    [],
  );

  const sections = [
    { id: "site", label: "Site Details", icon: Building },
    { id: "phases", label: "Phases", icon: CheckCircle },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "purchases", label: "Purchases", icon: Package },
    { id: "miscellaneous", label: "Miscellaneous Expenses", icon: Wrench },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Import</h1>
          <p className="text-gray-600">
            Import site data, phases, purchases, and more in one go
          </p>
        </div>

        {/* Progress Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeSection === section.id
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{section.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-8">
          {/* Site Details */}
          {activeSection === "site" && (
            <SectionCard title="Site Details" icon={Building}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InputField label="Site Name" required error={errors.name}>
                  <input
                    type="text"
                    value={formData.site.name}
                    onChange={(e) => updateSiteField("name", e.target.value)}
                    onBlur={(e) => handleBlur("name", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.name ? "border-red-500" : "border-gray-200"
                    }`}
                    placeholder="Enter site name"
                  />
                </InputField>

                <InputField label="Address" required error={errors.address}>
                  <input
                    type="text"
                    value={formData.site.address}
                    onChange={(e) => updateSiteField("address", e.target.value)}
                    onBlur={(e) => handleBlur("address", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.address ? "border-red-500" : "border-gray-200"
                    }`}
                    placeholder="Enter address"
                  />
                </InputField>

                <InputField label="City" required error={errors.city}>
                  <input
                    type="text"
                    value={formData.site.city}
                    onChange={(e) => updateSiteField("city", e.target.value)}
                    onBlur={(e) => handleBlur("city", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.city ? "border-red-500" : "border-gray-200"
                    }`}
                    placeholder="Enter city"
                  />
                </InputField>

                <InputField label="State" required error={errors.state}>
                  <input
                    type="text"
                    value={formData.site.state}
                    onChange={(e) => updateSiteField("state", e.target.value)}
                    onBlur={(e) => handleBlur("state", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.state ? "border-red-500" : "border-gray-200"
                    }`}
                    placeholder="Enter state"
                  />
                </InputField>

                <InputField label="ZIP Code" required error={errors.zip}>
                  <input
                    type="text"
                    value={formData.site.zip}
                    onChange={(e) => updateSiteField("zip", e.target.value)}
                    onBlur={(e) => handleBlur("zip", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.zip ? "border-red-500" : "border-gray-200"
                    }`}
                    placeholder="Enter ZIP code"
                  />
                </InputField>

                <InputField label="Client" required error={errors.client}>
                  <select
                    value={formData.site.client}
                    onChange={(e) => updateSiteField("client", e.target.value)}
                    onBlur={(e) => handleBlur("client", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.client ? "border-red-500" : "border-gray-200"
                    }`}
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </InputField>

                <InputField label="Budget" required error={errors.budget}>
                  <input
                    type="number"
                    value={formData.site.budget}
                    onChange={(e) =>
                      updateSiteField(
                        "budget",
                        e.target.value === "" ? 0 : Number(e.target.value),
                      )
                    }
                    onBlur={(e) => handleBlur("budget", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.budget ? "border-red-500" : "border-gray-200"
                    }`}
                    placeholder="Enter budget amount"
                  />
                </InputField>

                <InputField label="Status" required error={errors.status}>
                  <select
                    value={formData.site.status}
                    onChange={(e) => updateSiteField("status", e.target.value)}
                    onBlur={(e) => handleBlur("status", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.status ? "border-red-500" : "border-gray-200"
                    }`}
                  >
                    <option value="">Select status</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </InputField>
              </div>
            </SectionCard>
          )}

          {/* Phases */}
          {activeSection === "phases" && (
            <SectionCard
              title="Project Phases"
              icon={CheckCircle}
              count={formData.phases.length}
            >
              <div className="space-y-4">
                {formData.phases.map((phase, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {phase.status === "completed" ? (
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        ) : (
                          <Circle className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {phase.name}
                        </h4>
                        <p className="text-sm text-gray-500 capitalize">
                          {phase.status}
                        </p>
                      </div>
                    </div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={phase.status === "completed"}
                        onChange={(e) =>
                          updatePhaseStatus(index, e.target.checked)
                        }
                        className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Mark as completed
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Documents */}
          {activeSection === "documents" && (
            <SectionCard
              title="Documents"
              icon={FileText}
              count={documentFiles.length}
            >
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-all duration-200">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-gray-700">
                      Upload Documents
                    </p>
                    <p className="text-gray-500">
                      Drag and drop files here, or click to select
                    </p>
                  </div>
                  <input
                    type="file"
                    multiple
                    onChange={(e) =>
                      setDocumentFiles(Array.from(e.target.files || []))
                    }
                    className="mt-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                {documentFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">
                      Selected Files:
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {documentFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg"
                        >
                          <FileText className="w-5 h-5 text-blue-600" />
                          <span className="text-sm text-gray-700 truncate">
                            {file.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* Purchases */}
          {activeSection === "purchases" && (
            <SectionCard
              title="Purchases"
              icon={Package}
              count={formData.purchases.length}
            >
              <div className="space-y-6">
                <button
                  type="button"
                  onClick={() => addArrayItem("purchases")}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-all duration-200"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add New Purchase</span>
                </button>

                {formData.purchases.map((purchase, index) => (
                  <div
                    key={index}
                    className="p-6 bg-gray-50 rounded-xl space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-gray-900">
                        Purchase #{index + 1}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeArrayItem("purchases", index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField label="Vendor" required>
                        <select
                          value={purchase.vendor}
                          onChange={(e) =>
                            updateArrayItem(
                              "purchases",
                              index,
                              "vendor",
                              e.target.value,
                            )
                          }
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="">Select a vendor</option>
                          {vendors.map((vendor) => (
                            <option key={vendor._id} value={vendor._id}>
                              {vendor.name}
                            </option>
                          ))}
                        </select>
                      </InputField>

                      <InputField label="Total Amount">
                        <input
                          type="number"
                          value={purchase.totalAmount}
                          onChange={(e) =>
                            updateArrayItem(
                              "purchases",
                              index,
                              "totalAmount",
                              Number(e.target.value),
                            )
                          }
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter total amount"
                        />
                      </InputField>
                    </div>

                    {/* Purchase Items */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-gray-900">Items</h5>
                        <button
                          type="button"
                          onClick={() => addPurchaseItem(index)}
                          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors duration-200"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Item</span>
                        </button>
                      </div>

                      {purchase.items.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className="p-4 bg-white rounded-lg border border-gray-200"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <InputField label="Name">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) =>
                                  updatePurchaseItem(
                                    index,
                                    itemIndex,
                                    "name",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Item name"
                              />
                            </InputField>
                            <InputField label="Unit">
                              <input
                                type="text"
                                value={item.unit}
                                onChange={(e) =>
                                  updatePurchaseItem(
                                    index,
                                    itemIndex,
                                    "unit",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Unit"
                              />
                            </InputField>
                            <InputField label="Category">
                              <input
                                type="text"
                                value={item.category}
                                onChange={(e) =>
                                  updatePurchaseItem(
                                    index,
                                    itemIndex,
                                    "category",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Category"
                              />
                            </InputField>
                            <InputField label="Quantity">
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                  updatePurchaseItem(
                                    index,
                                    itemIndex,
                                    "quantity",
                                    Number(e.target.value),
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Qty"
                              />
                            </InputField>
                            <InputField label="Price">
                              <input
                                type="number"
                                value={item.price}
                                onChange={(e) =>
                                  updatePurchaseItem(
                                    index,
                                    itemIndex,
                                    "price",
                                    Number(e.target.value),
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Price"
                              />
                            </InputField>
                          </div>
                          <button
                            type="button"
                            onClick={() => removePurchaseItem(index, itemIndex)}
                            className="mt-3 text-red-600 hover:text-red-700 text-sm flex items-center space-x-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Remove Item</span>
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Bill Upload */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Bill Upload
                      </label>
                      <input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file)
                            updateArrayItem(
                              "purchases",
                              index,
                              "billFile",
                              file,
                            );
                        }}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {purchase.billFile && (
                        <p className="text-sm text-green-600 flex items-center space-x-1">
                          <FileText className="w-4 h-4" />
                          <span>{purchase.billFile.name}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Miscellaneous Expenses */}
          {activeSection === "miscellaneous" && (
            <SectionCard
              title="Miscellaneous Expenses"
              icon={Wrench}
              count={formData.miscellaneousExpenses.length}
            >
              <div className="space-y-6">
                <button
                  type="button"
                  onClick={() => addArrayItem("miscellaneousExpenses")}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-400 hover:text-blue-600"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Miscellaneous Expense</span>
                </button>

                {formData.miscellaneousExpenses.map((exp, index) => (
                  <div
                    key={index}
                    className="p-6 bg-gray-50 rounded-xl space-y-4"
                  >
                    <div className="flex justify-between">
                      <h4 className="text-lg font-semibold">
                        Expense #{index + 1}
                      </h4>
                      <button
                        onClick={() =>
                          removeArrayItem("miscellaneousExpenses", index)
                        }
                        className="text-red-600"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField label="Category" required>
                        <select
                          value={exp.category}
                          onChange={(e) =>
                            updateArrayItem(
                              "miscellaneousExpenses",
                              index,
                              "category",
                              e.target.value,
                            )
                          }
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                        >
                          <option value="machinery">Machinery</option>
                          <option value="rental">Rental</option>
                          <option value="service">Service</option>
                        </select>
                      </InputField>

                      <InputField label="Name / Description" required>
                        <input
                          type="text"
                          value={exp.name}
                          onChange={(e) =>
                            updateArrayItem(
                              "miscellaneousExpenses",
                              index,
                              "name",
                              e.target.value,
                            )
                          }
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                          placeholder="e.g. JCB Hire, Generator Service"
                        />
                      </InputField>

                      <InputField label="Amount (₹)" required>
                        <input
                          type="number"
                          value={exp.amount}
                          onChange={(e) =>
                            updateArrayItem(
                              "miscellaneousExpenses",
                              index,
                              "amount",
                              Number(e.target.value),
                            )
                          }
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                        />
                      </InputField>

                      <InputField label="Tip (₹) Optional">
                        <input
                          type="number"
                          value={exp.tip}
                          onChange={(e) =>
                            updateArrayItem(
                              "miscellaneousExpenses",
                              index,
                              "tip",
                              Number(e.target.value),
                            )
                          }
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                          placeholder="0"
                        />
                      </InputField>

                      <InputField label="Notes">
                        <textarea
                          value={exp.notes}
                          onChange={(e) =>
                            updateArrayItem(
                              "miscellaneousExpenses",
                              index,
                              "notes",
                              e.target.value,
                            )
                          }
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl h-20"
                          placeholder="Additional notes..."
                        />
                      </InputField>

                      <InputField label="Date" required>
                        <input
                          type="date"
                          value={exp.date}
                          onChange={(e) =>
                            updateArrayItem(
                              "miscellaneousExpenses",
                              index,
                              "date",
                              e.target.value,
                            )
                          }
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                        />
                      </InputField>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        {/* Submit Button */}
        <div className="mt-12 flex justify-center">
          <button
            type="button"
            onClick={handleBulkImport}
            className="px-12 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-semibold text-lg hover:shadow-xl hover:scale-105 transform transition-all duration-300 focus:ring-4 focus:ring-blue-200"
          >
            Import All Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkImportForm;
