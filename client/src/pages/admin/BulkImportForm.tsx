import { useState, useCallback } from "react";
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
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";

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
  category: "machinery" | "rental" | "service" | "material";
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
  attendances: any[];
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
  employees?: any[];
  stocks?: any[];
  contractors?: any[];
}

const SectionCard: React.FC<{
  children: React.ReactNode;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
}> = ({ children, title, icon: Icon, count }) => (
  <div className="rounded-console border border-console-border bg-white">
    <div className="border-b border-console-border p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <Icon className="h-4 w-4" />
          </div>
          <h3 className="text-base font-semibold text-console-text">{title}</h3>
        </div>
        {count !== undefined && (
          <span className="rounded-full bg-console-bg px-3 py-1 text-xs font-medium text-console-muted">
            {count} items
          </span>
        )}
      </div>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const InputField: React.FC<{
  label: string;
  children: React.ReactNode;
  required?: boolean;
  error?: boolean;
}> = ({ label, children, required = false, error = false }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-console-text">
      {label}
      {required && <span className="ml-1 text-danger-600">*</span>}
    </label>
    {children}
    {error && <p className="mt-1 text-sm text-danger-600">This field is required</p>}
  </div>
);

const fieldClass = (hasError?: boolean) =>
  cn(
    "w-full rounded-lg border px-3.5 py-2.5 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100",
    hasError ? "border-danger-400" : "border-console-border",
  );

const BulkImportForm: React.FC<BulkImportFormProps> = ({ clients, vendors }) => {
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "site" | "phases" | "documents" | "purchases" | "miscellaneous"
  >("site");

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
      setActiveSection("site");
      return;
    }

    setIsSubmitting(true);
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
      setActiveSection("site");
    } catch (err) {
      toast.error("Bulk import failed");
    } finally {
      setIsSubmitting(false);
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
    <div className="space-y-6">
      <div className="flex flex-wrap gap-1 rounded-console border border-console-border bg-console-bg p-1">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                activeSection === section.id
                  ? "bg-brand-700 text-white"
                  : "text-console-muted hover:bg-white",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{section.label}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-6">
        {activeSection === "site" && (
          <SectionCard title="Site Details" icon={Building}>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              <InputField label="Site Name" required error={errors.name}>
                <input
                  type="text"
                  value={formData.site.name}
                  onChange={(e) => updateSiteField("name", e.target.value)}
                  onBlur={(e) => handleBlur("name", e.target.value)}
                  className={fieldClass(errors.name)}
                  placeholder="Enter site name"
                />
              </InputField>

              <InputField label="Address" required error={errors.address}>
                <input
                  type="text"
                  value={formData.site.address}
                  onChange={(e) => updateSiteField("address", e.target.value)}
                  onBlur={(e) => handleBlur("address", e.target.value)}
                  className={fieldClass(errors.address)}
                  placeholder="Enter address"
                />
              </InputField>

              <InputField label="City" required error={errors.city}>
                <input
                  type="text"
                  value={formData.site.city}
                  onChange={(e) => updateSiteField("city", e.target.value)}
                  onBlur={(e) => handleBlur("city", e.target.value)}
                  className={fieldClass(errors.city)}
                  placeholder="Enter city"
                />
              </InputField>

              <InputField label="State" required error={errors.state}>
                <input
                  type="text"
                  value={formData.site.state}
                  onChange={(e) => updateSiteField("state", e.target.value)}
                  onBlur={(e) => handleBlur("state", e.target.value)}
                  className={fieldClass(errors.state)}
                  placeholder="Enter state"
                />
              </InputField>

              <InputField label="ZIP Code" required error={errors.zip}>
                <input
                  type="text"
                  value={formData.site.zip}
                  onChange={(e) => updateSiteField("zip", e.target.value)}
                  onBlur={(e) => handleBlur("zip", e.target.value)}
                  className={fieldClass(errors.zip)}
                  placeholder="Enter ZIP code"
                />
              </InputField>

              <InputField label="Client" required error={errors.client}>
                <select
                  value={formData.site.client}
                  onChange={(e) => updateSiteField("client", e.target.value)}
                  onBlur={(e) => handleBlur("client", e.target.value)}
                  className={fieldClass(errors.client)}
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
                  className={fieldClass(errors.budget)}
                  placeholder="Enter budget amount"
                />
              </InputField>

              <InputField label="Status" required error={errors.status}>
                <select
                  value={formData.site.status}
                  onChange={(e) => updateSiteField("status", e.target.value)}
                  onBlur={(e) => handleBlur("status", e.target.value)}
                  className={fieldClass(errors.status)}
                >
                  <option value="">Select status</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </InputField>
            </div>
          </SectionCard>
        )}

        {activeSection === "phases" && (
          <SectionCard title="Project Phases" icon={CheckCircle} count={formData.phases.length}>
            <div className="space-y-3">
              {formData.phases.map((phase, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-console border border-console-border p-4 transition-colors hover:bg-console-bg"
                >
                  <div className="flex items-center gap-4">
                    <div className="shrink-0">
                      {phase.status === "completed" ? (
                        <CheckCircle className="h-5 w-5 text-success-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-300" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-console-text">{phase.name}</h4>
                      <p className="text-xs capitalize text-console-muted">{phase.status}</p>
                    </div>
                  </div>
                  <label className="flex cursor-pointer select-none items-center gap-2">
                    <input
                      type="checkbox"
                      checked={phase.status === "completed"}
                      onChange={(e) => updatePhaseStatus(index, e.target.checked)}
                      className="h-4 w-4 rounded border-console-border text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm font-medium text-console-text">Mark as completed</span>
                  </label>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {activeSection === "documents" && (
          <SectionCard title="Documents" icon={FileText} count={documentFiles.length}>
            <div className="space-y-4">
              <div className="rounded-console border-2 border-dashed border-console-border p-8 text-center transition-colors hover:border-brand-300">
                <Upload className="mx-auto mb-3 h-10 w-10 text-console-muted" />
                <p className="text-sm font-medium text-console-text">Upload documents</p>
                <p className="mt-0.5 text-sm text-console-muted">
                  Drag and drop files here, or click to select
                </p>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setDocumentFiles(Array.from(e.target.files || []))}
                  className="mx-auto mt-4 block w-full max-w-sm text-sm text-console-muted file:mr-4 file:rounded-full file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
                />
              </div>

              {documentFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-console-text">Selected files:</h4>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {documentFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2.5 rounded-lg bg-brand-50 p-3"
                      >
                        <FileText className="h-4 w-4 shrink-0 text-brand-700" />
                        <span className="truncate text-sm text-console-text">{file.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {activeSection === "purchases" && (
          <SectionCard title="Purchases" icon={Package} count={formData.purchases.length}>
            <div className="space-y-5">
              <button
                type="button"
                onClick={() => addArrayItem("purchases")}
                className="flex w-full items-center justify-center gap-2 rounded-console border-2 border-dashed border-console-border py-3 text-sm font-medium text-console-muted transition-colors hover:border-brand-300 hover:text-brand-700"
              >
                <Plus className="h-4 w-4" />
                <span>Add new purchase</span>
              </button>

              {formData.purchases.map((purchase, index) => (
                <div key={index} className="space-y-5 rounded-console border border-console-border bg-console-bg p-5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-console-text">Purchase #{index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeArrayItem("purchases", index)}
                      aria-label="Remove purchase"
                      className="rounded-lg p-2 text-danger-600 transition-colors hover:bg-danger-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InputField label="Vendor" required>
                      <select
                        value={purchase.vendor}
                        onChange={(e) => updateArrayItem("purchases", index, "vendor", e.target.value)}
                        className={fieldClass()}
                      >
                        <option value="">Select a vendor</option>
                        {vendors.map((vendor) => (
                          <option key={vendor._id} value={vendor._id}>
                            {vendor.name}
                          </option>
                        ))}
                      </select>
                    </InputField>

                    <InputField label="Total Amount (₹)">
                      <input
                        type="number"
                        value={purchase.totalAmount}
                        onChange={(e) =>
                          updateArrayItem("purchases", index, "totalAmount", Number(e.target.value))
                        }
                        className={fieldClass()}
                        placeholder="Enter total amount"
                      />
                    </InputField>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-medium text-console-text">Items</h5>
                      <button
                        type="button"
                        onClick={() => addPurchaseItem(index)}
                        className="flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add item</span>
                      </button>
                    </div>

                    {purchase.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="rounded-lg border border-console-border bg-white p-4">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
                          <InputField label="Name">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updatePurchaseItem(index, itemIndex, "name", e.target.value)}
                              className={fieldClass()}
                              placeholder="Item name"
                            />
                          </InputField>
                          <InputField label="Unit">
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) => updatePurchaseItem(index, itemIndex, "unit", e.target.value)}
                              className={fieldClass()}
                              placeholder="Unit"
                            />
                          </InputField>
                          <InputField label="Category">
                            <input
                              type="text"
                              value={item.category}
                              onChange={(e) => updatePurchaseItem(index, itemIndex, "category", e.target.value)}
                              className={fieldClass()}
                              placeholder="Category"
                            />
                          </InputField>
                          <InputField label="Quantity">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updatePurchaseItem(index, itemIndex, "quantity", Number(e.target.value))
                              }
                              className={fieldClass()}
                              placeholder="Qty"
                            />
                          </InputField>
                          <InputField label="Price (₹)">
                            <input
                              type="number"
                              value={item.price}
                              onChange={(e) =>
                                updatePurchaseItem(index, itemIndex, "price", Number(e.target.value))
                              }
                              className={fieldClass()}
                              placeholder="Price"
                            />
                          </InputField>
                        </div>
                        <button
                          type="button"
                          onClick={() => removePurchaseItem(index, itemIndex)}
                          className="mt-3 flex items-center gap-1.5 text-sm text-danger-600 hover:text-danger-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remove item</span>
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-console-text">Bill upload</label>
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) updateArrayItem("purchases", index, "billFile", file);
                      }}
                      className="block w-full text-sm text-console-muted file:mr-4 file:rounded-full file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
                    />
                    {purchase.billFile && (
                      <p className="flex items-center gap-1.5 text-sm text-success-700">
                        <FileText className="h-3.5 w-3.5" />
                        <span>{purchase.billFile.name}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {activeSection === "miscellaneous" && (
          <SectionCard
            title="Miscellaneous Expenses"
            icon={Wrench}
            count={formData.miscellaneousExpenses.length}
          >
            <div className="space-y-5">
              <button
                type="button"
                onClick={() => addArrayItem("miscellaneousExpenses")}
                className="flex w-full items-center justify-center gap-2 rounded-console border-2 border-dashed border-console-border py-3 text-sm font-medium text-console-muted transition-colors hover:border-brand-300 hover:text-brand-700"
              >
                <Plus className="h-4 w-4" />
                <span>Add miscellaneous expense</span>
              </button>

              {formData.miscellaneousExpenses.map((exp, index) => (
                <div key={index} className="space-y-4 rounded-console border border-console-border bg-console-bg p-5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-console-text">Expense #{index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeArrayItem("miscellaneousExpenses", index)}
                      aria-label="Remove expense"
                      className="rounded-lg p-2 text-danger-600 transition-colors hover:bg-danger-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InputField label="Category" required>
                      <select
                        value={exp.category}
                        onChange={(e) =>
                          updateArrayItem("miscellaneousExpenses", index, "category", e.target.value)
                        }
                        className={fieldClass()}
                      >
                        <option value="machinery">Machinery</option>
                        <option value="rental">Rental</option>
                        <option value="material">Material</option>
                        <option value="service">Service</option>
                      </select>
                    </InputField>

                    <InputField label="Name / Description" required>
                      <input
                        type="text"
                        value={exp.name}
                        onChange={(e) =>
                          updateArrayItem("miscellaneousExpenses", index, "name", e.target.value)
                        }
                        className={fieldClass()}
                        placeholder="e.g. JCB Hire, Generator Service"
                      />
                    </InputField>

                    <InputField label="Amount (₹)" required>
                      <input
                        type="number"
                        value={exp.amount}
                        onChange={(e) =>
                          updateArrayItem("miscellaneousExpenses", index, "amount", Number(e.target.value))
                        }
                        className={fieldClass()}
                      />
                    </InputField>

                    <InputField label="Tip (₹) — Optional">
                      <input
                        type="number"
                        value={exp.tip}
                        onChange={(e) =>
                          updateArrayItem("miscellaneousExpenses", index, "tip", Number(e.target.value))
                        }
                        className={fieldClass()}
                        placeholder="0"
                      />
                    </InputField>

                    <InputField label="Notes">
                      <textarea
                        value={exp.notes}
                        onChange={(e) =>
                          updateArrayItem("miscellaneousExpenses", index, "notes", e.target.value)
                        }
                        className={cn(fieldClass(), "h-20 resize-none")}
                        placeholder="Additional notes..."
                      />
                    </InputField>

                    <InputField label="Date" required>
                      <input
                        type="date"
                        value={exp.date}
                        onChange={(e) =>
                          updateArrayItem("miscellaneousExpenses", index, "date", e.target.value)
                        }
                        className={fieldClass()}
                      />
                    </InputField>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>

      <div className="flex justify-center pt-2">
        <Button size="lg" onClick={handleBulkImport} loading={isSubmitting}>
          {isSubmitting ? "Importing..." : "Import all data"}
        </Button>
      </div>
    </div>
  );
};

export default BulkImportForm;
