import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Boxes, ChevronDown, Layers, Search, TrendingDown } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface LogUsageModalProps {
  isOpen: boolean;
  sites: any;
  onClose: () => void;
  onSubmit: (transferData: any) => Promise<void>;
  stocks: any;
}

const LogUsageModal: React.FC<LogUsageModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  stocks,
}) => {
  const [stock, setStock] = useState<any>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ stock?: string; quantity?: string }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStock(null);
      setQuantity(0);
      setErrors({});
      setSearchTerm("");
      setIsDropdownOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredStocks =
    stocks?.filter((s: any) => s.name.toLowerCase().includes(searchTerm.toLowerCase())) || [];

  const validateForm = () => {
    const newErrors: { stock?: string; quantity?: string } = {};

    if (!stock) {
      newErrors.stock = "Please select a stock item";
    }

    if (quantity <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    }

    if (stock && quantity > stock.quantity) {
      newErrors.quantity = `Only ${stock.quantity} items available in stock`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const siteId = stock.site?._id || null;
      const usageData = { siteId, stockId: stock._id, quantity };
      await onSubmit(usageData);
      onClose();
    } catch (error) {
      console.error("Error logging usage:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStockSelect = (selectedStock: any) => {
    setStock(selectedStock);
    setSearchTerm(selectedStock.name);
    setIsDropdownOpen(false);
    setErrors((prev) => ({ ...prev, stock: undefined }));
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Log stock usage"
      description="Record inventory usage for your site"
      size="md"
      disableClose={isSubmitting}
      closeOnOverlayClick={!isSubmitting}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isSubmitting} disabled={!stock || quantity <= 0}>
            {!isSubmitting && <TrendingDown className="h-4 w-4" />}
            Log usage
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-console-text">
            Select stock item
          </label>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className={`flex w-full items-center justify-between rounded-lg border-2 bg-white p-3.5 text-left transition-all duration-200 hover:bg-console-bg ${
                errors.stock
                  ? "border-danger-300"
                  : isDropdownOpen
                  ? "border-brand-500 ring-4 ring-brand-50"
                  : "border-console-border hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-console-bg text-console-muted">
                  <Boxes className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-console-text">
                    {stock ? stock.name : "Choose a stock item"}
                  </div>
                  {stock && (
                    <div className="text-xs text-console-muted">Available: {stock.quantity} units</div>
                  )}
                </div>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-console-muted transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                  className="glass-panel absolute left-0 right-0 top-full z-10 mt-2 max-h-64 overflow-hidden rounded-glass-sm shadow-glass-lg"
                >
                  <div className="border-b border-white/60 p-3">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-console-muted" />
                      <input
                        type="text"
                        placeholder="Search stocks..."
                        className="w-full rounded-lg border border-console-border bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto">
                    {filteredStocks.length > 0 ? (
                      filteredStocks.map((s: any) => (
                        <button
                          type="button"
                          key={s._id}
                          className="flex w-full items-center justify-between border-b border-white/60 p-3 text-left transition-colors last:border-b-0 hover:bg-white/70"
                          onClick={() => handleStockSelect(s)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="h-2 w-2 rounded-full bg-success-500" />
                            <div>
                              <div className="text-sm font-medium text-console-text">{s.name}</div>
                              <div className="text-xs text-console-muted">{s.quantity} available</div>
                            </div>
                          </div>
                          {s.quantity <= 10 && (
                            <span className="rounded-full bg-warning-100 px-2 py-0.5 text-xs font-medium text-warning-800">
                              Low stock
                            </span>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="flex flex-col items-center gap-2 p-6 text-center text-sm text-console-muted">
                        <Layers className="h-5 w-5" />
                        No stocks found
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {errors.stock && (
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-danger-600">
              <AlertCircle className="h-4 w-4" />
              {errors.stock}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-console-text">Quantity to use</label>
          <input
            type="number"
            value={quantity || ""}
            onChange={(e) => {
              const value = Number(e.target.value);
              setQuantity(value);
              setErrors((prev) => ({ ...prev, quantity: undefined }));
            }}
            min="1"
            max={stock?.quantity || undefined}
            className={`w-full rounded-lg border-2 bg-white p-3.5 text-sm transition-all duration-200 focus:outline-none focus:ring-4 ${
              errors.quantity
                ? "border-danger-300 focus:border-danger-500 focus:ring-danger-50"
                : "border-console-border focus:border-brand-500 focus:ring-brand-50"
            }`}
            placeholder="Enter quantity"
          />
          {stock && (
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-console-muted">Available: {stock.quantity} units</span>
              {quantity > 0 && (
                <span className="font-medium text-brand-700">
                  Remaining: {stock.quantity - quantity} units
                </span>
              )}
            </div>
          )}
          {errors.quantity && (
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-danger-600">
              <AlertCircle className="h-4 w-4" />
              {errors.quantity}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default LogUsageModal;
