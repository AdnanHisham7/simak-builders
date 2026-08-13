import React, { useEffect, useState } from "react";
import { AlertCircle, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface Contractor {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: "active" | "blocked";
  siteAssignments: { site: { id: string; name: string }; totalAmount: number }[];
}

interface AddContractorTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractor: Contractor;
  onAddTransaction: (data: any) => Promise<any>;
  defaultSiteId?: string;
}

const fieldClass =
  "w-full rounded-lg border border-console-border bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";
const labelClass = "mb-1.5 block text-sm font-medium text-console-text";

const AddContractorTransactionModal: React.FC<
  AddContractorTransactionModalProps
> = ({ isOpen, onClose, contractor, onAddTransaction, defaultSiteId }) => {
  const [transaction, setTransaction] = useState({
    siteId: "",
    type: "",
    amount: 0,
    description: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  const predefinedCategories = [
    "electrical work",
    "plumbing",
    "Waterproofing",
    "landscaping",
    "concrete",
    "industrial work",
    "roofing work",
    "painting work",
    "plastering work",
  ];

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "other") {
      setShowCustomCategory(true);
      setCategory("");
    } else {
      setShowCustomCategory(false);
      setCategory(value);
      setCustomCategory("");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    if (name === "amount" && value !== "" && Number(value) < 0) {
      return;
    }
    setTransaction((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (defaultSiteId)
      setTransaction((prev) => ({ ...prev, siteId: defaultSiteId }));
  }, [defaultSiteId]);

  const handleAdd = async () => {
    if (isSubmitting) return;
    if (!transaction.siteId || !transaction.type || !transaction.amount) {
      setError("Please fill all required fields: site, type, and amount.");
      return;
    }
    if (Number(transaction.amount) <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }
    setIsSubmitting(true);
    try {
      const data = {
        contractorId: contractor.id,
        siteId: transaction.siteId,
        type: transaction.type as "advance" | "expense" | "additional_payment",
        amount: Number(transaction.amount),
        description: transaction.description,
        category: showCustomCategory ? customCategory : category,
      };
      await onAddTransaction(data);
      setTransaction({ siteId: "", type: "", amount: 0, description: "" });
      setError(null);
      onClose();
      toast.success("Transaction added successfully");
    } catch (err) {
      setError("Failed to add transaction. Ensure the site exists.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const assignedSites = contractor.siteAssignments.map(
    (assignment) => assignment.site,
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Add transaction for ${contractor.name}`}
      size="md"
      disableClose={isSubmitting}
      closeOnOverlayClick={!isSubmitting}
      footer={
        assignedSites.length > 0 ? (
          <Button onClick={handleAdd} loading={isSubmitting}>
            <ReceiptText className="h-4 w-4" />
            Add transaction
          </Button>
        ) : undefined
      }
    >
      {assignedSites.length === 0 ? (
        <p className="text-sm text-danger-600">No sites assigned to this contractor.</p>
      ) : (
        <div className="space-y-4">
          {!defaultSiteId ? (
            <div>
              <label className={labelClass}>Site *</label>
              <select
                name="siteId"
                value={transaction.siteId}
                onChange={handleChange}
                className={fieldClass}
              >
                <option value="">Select a site</option>
                {assignedSites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className={labelClass}>Site</label>
              <input
                type="text"
                value={assignedSites.find((s) => s.id === defaultSiteId)?.name || ""}
                disabled
                className="w-full rounded-lg border border-console-border bg-console-bg px-3.5 py-2.5 text-sm text-console-muted"
              />
            </div>
          )}

          <div>
            <label className={labelClass}>Type *</label>
            <select
              name="type"
              value={transaction.type}
              onChange={handleChange}
              className={fieldClass}
            >
              <option value="">Select type</option>
              <option value="advance">Advance</option>
              <option value="expense">Expense</option>
              <option value="additional_payment">Additional payment</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Amount *</label>
            <input
              type="number"
              name="amount"
              value={transaction.amount || ""}
              onChange={handleChange}
              min="0"
              step="0.01"
              className={fieldClass}
              placeholder="Enter amount"
            />
          </div>

          <div>
            <label className={labelClass}>Category type *</label>
            <select
              value={showCustomCategory ? "other" : category}
              onChange={handleCategoryChange}
              className={fieldClass}
            >
              <option value="">Select category</option>
              {predefinedCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="other">Other (specify)</option>
            </select>
            {showCustomCategory && (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Enter custom category"
                className={`${fieldClass} mt-2`}
                required
              />
            )}
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <input
              type="text"
              name="description"
              value={transaction.description}
              onChange={handleChange}
              className={fieldClass}
              placeholder="Transaction description"
            />
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-sm text-danger-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
};

export default AddContractorTransactionModal;
