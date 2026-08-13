import React, { useState, useEffect } from "react";
import { AlertCircle, PackagePlus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transferData: any) => Promise<void>;
  sites: any;
}

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
];

const units = [
  "kg",
  "m²",
  "m³",
  "m",
  "bag",
  "sheet",
  "hour",
  "day",
  "bundle",
  "kintel",
  "ton",
  "length",
];

const fieldClass =
  "w-full rounded-lg border-2 bg-white px-3.5 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-brand-50 disabled:cursor-not-allowed disabled:opacity-60";
const labelClass = "mb-1.5 flex items-center gap-1 text-sm font-semibold text-console-text";

const AddStockModal: React.FC<AddStockModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  sites,
}) => {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [unitPrice, setUnitPrice] = useState<number | "">("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("");
  const [site, setSite] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setQuantity("");
      setUnitPrice("");
      setUnit("");
      setCategory("");
      setSite("");
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Name is required";
    if (!quantity || quantity <= 0) newErrors.quantity = "Valid quantity is required";
    if (!unit.trim()) newErrors.unit = "Unit is required";
    if (!category.trim()) newErrors.category = "Category is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const siteId = site === "company" ? null : site;
      const stockData = {
        name,
        quantity: Number(quantity),
        unit,
        category,
        siteId,
        price: unitPrice === "" ? undefined : Number(unitPrice),
      };
      await onSubmit(stockData);
      onClose();
    } catch (error) {
      console.error("Error adding stock:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add new stock"
      description="Create a new stock item for your inventory"
      size="md"
      disableClose={isSubmitting}
      closeOnOverlayClick={!isSubmitting}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isSubmitting}>
            {!isSubmitting && <PackagePlus className="h-4 w-4" />}
            Add stock
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <label className={labelClass}>
            Stock name <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`${fieldClass} ${
              errors.name ? "border-danger-300" : "border-console-border hover:border-slate-300"
            }`}
            placeholder="Enter stock item name..."
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-danger-600">
              <AlertCircle className="h-3.5 w-3.5" />
              {errors.name}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Quantity <span className="text-danger-500">*</span>
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
              min="1"
              className={`${fieldClass} ${
                errors.quantity ? "border-danger-300" : "border-console-border hover:border-slate-300"
              }`}
              placeholder="0"
              disabled={isSubmitting}
            />
            {errors.quantity && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-danger-600">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.quantity}
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>
              Unit <span className="text-danger-500">*</span>
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className={`${fieldClass} ${
                errors.unit ? "border-danger-300" : "border-console-border hover:border-slate-300"
              }`}
              disabled={isSubmitting}
            >
              <option value="">Select unit...</option>
              {units.map((unitOption) => (
                <option key={unitOption} value={unitOption}>
                  {unitOption}
                </option>
              ))}
            </select>
            {errors.unit && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-danger-600">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.unit}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className={labelClass}>
            Unit price <span className="text-xs font-normal text-console-muted">(Optional)</span>
          </label>
          <input
            type="number"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value === "" ? "" : Number(e.target.value))}
            min="0"
            step="0.01"
            className={`${fieldClass} border-console-border hover:border-slate-300`}
            placeholder="₹ per unit"
            disabled={isSubmitting}
          />
          <p className="mt-1.5 text-xs text-console-muted">
            Used to value future stock transfers of this item. Leave blank to keep the existing
            average price.
          </p>
        </div>

        <div>
          <label className={labelClass}>
            Category <span className="text-danger-500">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`${fieldClass} ${
              errors.category ? "border-danger-300" : "border-console-border hover:border-slate-300"
            }`}
            disabled={isSubmitting}
          >
            <option value="">Select category...</option>
            {categories.map((categoryOption) => (
              <option key={categoryOption} value={categoryOption}>
                {categoryOption}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-danger-600">
              <AlertCircle className="h-3.5 w-3.5" />
              {errors.category}
            </p>
          )}
        </div>

        <div>
          <label className={labelClass}>Site location</label>
          <select
            value={site}
            onChange={(e) => setSite(e.target.value)}
            className={`${fieldClass} border-console-border hover:border-slate-300`}
            disabled={isSubmitting}
          >
            <option value="">Select a site...</option>
            <option value="company">Company</option>
            {sites?.map((siteItem: any) => (
              <option key={siteItem.id} value={siteItem.id}>
                {siteItem.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Modal>
  );
};

export default AddStockModal;
