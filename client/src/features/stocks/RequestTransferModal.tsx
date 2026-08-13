import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, PackageSearch, ArrowRightLeft } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface RequestTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transferData: any) => Promise<void>;
  sites: any[];
  stocks: any[];
  allowedToSites: any[];
}

const fieldClass =
  "w-full rounded-lg border-2 bg-white px-3.5 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-console-bg disabled:text-console-muted";
const labelClass = "mb-1.5 block text-sm font-semibold text-console-text";

const STEP_LABELS = ["Source & item", "Quantity", "Destination"];

const RequestTransferModal: React.FC<RequestTransferModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  sites,
  stocks,
  allowedToSites,
}) => {
  const [fromSite, setFromSite] = useState("");
  const [toSite, setToSite] = useState("");
  const [stock, setStock] = useState<any>(null);
  const [quantity, setQuantity] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setFromSite("");
      setToSite("");
      setStock(null);
      setQuantity(0);
      setErrors({});
      setCurrentStep(1);
    }
  }, [isOpen]);

  const filteredStocks =
    fromSite === "company"
      ? stocks.filter((s) => !s.site)
      : fromSite
      ? stocks.filter((s) => s.site?._id === fromSite)
      : [];

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!fromSite) newErrors.fromSite = "Please select a source site";
    if (!stock) newErrors.stock = "Please select a stock item";
    if (!quantity || quantity <= 0) newErrors.quantity = "Please enter a valid quantity";
    if (!toSite) newErrors.toSite = "Please select a destination site";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    const fromSiteId = fromSite === "company" ? null : fromSite;
    const transferData = {
      stockId: stock._id,
      quantity,
      fromSiteId,
      toSiteId: toSite,
    };

    try {
      await onSubmit(transferData);
      onClose();
    } catch (error) {
      console.error("Transfer request failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return fromSite && stock;
      case 2:
        return quantity > 0;
      case 3:
        return toSite;
      default:
        return false;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Request stock transfer"
      description="Transfer inventory between sites"
      size="lg"
      disableClose={isSubmitting}
      closeOnOverlayClick={!isSubmitting}
      footer={
        <div className="flex w-full items-center justify-between">
          <span className="text-sm text-console-muted">Step {currentStep} of 3</span>
          <div className="flex gap-3">
            {currentStep > 1 && (
              <Button variant="secondary" onClick={() => setCurrentStep((s) => s - 1)}>
                Previous
              </Button>
            )}
            {currentStep < 3 ? (
              <Button onClick={() => setCurrentStep((s) => s + 1)} disabled={!canProceedToNext()}>
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} loading={isSubmitting} disabled={!canProceedToNext()}>
                {!isSubmitting && <ArrowRightLeft className="h-4 w-4" />}
                Submit request
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="mb-6 flex items-center justify-center gap-2">
        {[1, 2, 3].map((step) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors duration-300 ${
                  step < currentStep
                    ? "bg-success-600 text-white"
                    : step === currentStep
                    ? "bg-brand-700 text-white"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {step < currentStep ? <Check className="h-4 w-4" /> : step}
              </div>
              <span
                className={`hidden text-xs font-medium sm:block ${
                  step <= currentStep ? "text-console-text" : "text-console-muted"
                }`}
              >
                {STEP_LABELS[step - 1]}
              </span>
            </div>
            {step < 3 && (
              <div
                className={`mb-5 h-0.5 w-10 transition-colors duration-300 sm:w-16 ${
                  step < currentStep ? "bg-success-600" : "bg-slate-200"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>From site</label>
                  <select
                    value={fromSite}
                    onChange={(e) => {
                      setFromSite(e.target.value);
                      setStock(null);
                      setErrors({ ...errors, fromSite: "" });
                    }}
                    className={`${fieldClass} ${
                      errors.fromSite ? "border-danger-300" : "border-console-border hover:border-slate-300"
                    }`}
                  >
                    <option value="">Select source site</option>
                    <option value="company">Company warehouse</option>
                    {sites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name}
                      </option>
                    ))}
                  </select>
                  {errors.fromSite && <p className="mt-1.5 text-sm text-danger-600">{errors.fromSite}</p>}
                </div>

                <div>
                  <label className={labelClass}>Stock item</label>
                  <select
                    value={stock?._id || ""}
                    onChange={(e) => {
                      setStock(filteredStocks.find((s) => s._id === e.target.value));
                      setErrors({ ...errors, stock: "" });
                    }}
                    disabled={!fromSite}
                    className={`${fieldClass} ${
                      errors.stock ? "border-danger-300" : "border-console-border hover:border-slate-300"
                    }`}
                  >
                    <option value="">Select stock item</option>
                    {filteredStocks.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} (Available: {s.quantity || 0}) • ₹{(s.averagePrice || 0).toFixed(2)}/{s.unit}
                      </option>
                    ))}
                  </select>
                  {errors.stock && <p className="mt-1.5 text-sm text-danger-600">{errors.stock}</p>}
                </div>
              </div>

              {stock && (
                <div className="flex items-start gap-3 rounded-console border border-brand-100 bg-brand-50/60 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                    <PackageSearch className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-console-text">Selected item: {stock.name}</h4>
                    <p className="text-sm text-console-muted">Available quantity: {stock.quantity || 0} units</p>
                    <p className="text-sm text-console-muted">
                      Unit price: ₹{(stock.averagePrice || 0).toFixed(2)} / {stock.unit}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="mx-auto max-w-md space-y-4">
              <div>
                <label className={labelClass}>Transfer quantity</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(Number(e.target.value));
                    setErrors({ ...errors, quantity: "" });
                  }}
                  min="1"
                  max={stock?.quantity || 999}
                  className={`${fieldClass} text-center text-2xl font-bold ${
                    errors.quantity ? "border-danger-300" : "border-console-border hover:border-slate-300"
                  }`}
                  placeholder="0"
                />
                {errors.quantity && <p className="mt-1.5 text-sm text-danger-600">{errors.quantity}</p>}
              </div>

              {stock && (
                <div className="space-y-2 rounded-console border border-console-border bg-console-bg p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-console-muted">Available:</span>
                    <span className="font-semibold text-console-text">{stock.quantity || 0} units</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-console-border pt-2">
                    <span className="text-console-muted">Transferring:</span>
                    <span className="font-semibold text-brand-700">{quantity} units</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-console-border pt-2">
                    <span className="text-console-muted">Remaining:</span>
                    <span className="font-semibold text-console-text">
                      {(stock.quantity || 0) - quantity} units
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-console-border pt-2">
                    <span className="text-console-muted">Estimated value:</span>
                    <span className="font-semibold text-success-700">
                      ₹{((stock.averagePrice || 0) * (quantity || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="mx-auto max-w-md space-y-4">
              <div>
                <label className={labelClass}>To site</label>
                <select
                  value={toSite}
                  onChange={(e) => {
                    setToSite(e.target.value);
                    setErrors({ ...errors, toSite: "" });
                  }}
                  className={`${fieldClass} ${
                    errors.toSite ? "border-danger-300" : "border-console-border hover:border-slate-300"
                  }`}
                >
                  <option value="">Select destination site</option>
                  {allowedToSites?.map((siteId) => {
                    const site = sites.find((s) => s.id === siteId);
                    return site ? (
                      <option key={site.id} value={site.id}>
                        {site.name}
                      </option>
                    ) : null;
                  })}
                </select>
                {errors.toSite && <p className="mt-1.5 text-sm text-danger-600">{errors.toSite}</p>}
              </div>

              {fromSite && stock && quantity > 0 && toSite && (
                <div className="rounded-console border border-success-100 bg-success-50/60 p-4">
                  <h4 className="mb-3 font-semibold text-success-800">Transfer summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-success-700">From:</span>
                      <span className="font-medium text-console-text">
                        {fromSite === "company" ? "Company warehouse" : sites.find((s) => s.id === fromSite)?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-success-700">To:</span>
                      <span className="font-medium text-console-text">
                        {sites.find((s) => s.id === toSite)?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-success-700">Item:</span>
                      <span className="font-medium text-console-text">{stock.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-success-700">Quantity:</span>
                      <span className="font-medium text-console-text">{quantity} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-success-700">Unit price:</span>
                      <span className="font-medium text-console-text">
                        ₹{(stock.averagePrice || 0).toFixed(2)} / {stock.unit}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-success-200 pt-2">
                      <span className="text-success-700">Estimated value:</span>
                      <span className="font-semibold text-success-800">
                        ₹{((stock.averagePrice || 0) * (quantity || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </Modal>
  );
};

export default RequestTransferModal;
