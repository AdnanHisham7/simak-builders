import React, { useState, useEffect } from "react";

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

const AddStockModal: React.FC<AddStockModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  sites,
}) => {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("");
  const [site, setSite] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Animation effect
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName("");
      setQuantity("");
      setUnit("");
      setCategory("");
      setSite("");
      setErrors({});
      setFocusedField(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Name is required";
    if (!quantity || quantity <= 0)
      newErrors.quantity = "Valid quantity is required";
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
      };
      await onSubmit(stockData);
      onClose();
    } catch (error) {
      console.error("Error adding stock:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getSizeStyles = () => {
    return "w-full max-w-lg mx-4";
  };

  if (!isOpen) return null;

  const renderUnitField = () => (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
        <svg
          className="w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
        <span>Unit</span>
        <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          onFocus={() => setFocusedField("unit")}
          onBlur={() => setFocusedField(null)}
          className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:bg-white focus:shadow-lg appearance-none cursor-pointer ${
            errors.unit
              ? "border-red-300 focus:border-red-500"
              : focusedField === "unit"
              ? "border-purple-500 shadow-lg shadow-purple-100"
              : "border-gray-200 hover:border-gray-300"
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
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
        {focusedField === "unit" && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 pointer-events-none" />
        )}
      </div>
      {errors.unit && (
        <p className="text-xs text-red-500 flex items-center space-x-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{errors.unit}</span>
        </p>
      )}
    </div>
  );

  // Modified Category Field
  const renderCategoryField = () => (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
        <svg
          className="w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <span>Category</span>
        <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          onFocus={() => setFocusedField("category")}
          onBlur={() => setFocusedField(null)}
          className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:bg-white focus:shadow-lg appearance-none cursor-pointer ${
            errors.category
              ? "border-red-300 focus:border-red-500"
              : focusedField === "category"
              ? "border-purple-500 shadow-lg shadow-purple-100"
              : "border-gray-200 hover:border-gray-300"
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
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
        {focusedField === "category" && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 pointer-events-none" />
        )}
      </div>
      {errors.category && (
        <p className="text-sm text-red-500 flex items-center space-x-1 animate-pulse">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{errors.category}</span>
        </p>
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300"
      onClick={handleOverlayClick}
    >
      <div
        className={`relative bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-200 transform overflow-hidden ${
          isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
        } ${getSizeStyles()}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient header background */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl" />

        {/* Header */}
        <div className="relative px-8 pt-8 pb-6 border-b border-gray-100">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 group"
            disabled={isSubmitting}
          >
            <svg
              className="w-5 h-5 transform group-hover:rotate-90 transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Add New Stock
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Create a new stock item for your inventory
              </p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="px-8 py-6 max-h-96 overflow-y-auto custom-scrollbar">
          <div className="space-y-6">
            {/* Stock Name */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                <span>Stock Name</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:bg-white focus:shadow-lg ${
                    errors.name
                      ? "border-red-300 focus:border-red-500"
                      : focusedField === "name"
                      ? "border-purple-500 shadow-lg shadow-purple-100"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  placeholder="Enter stock item name..."
                  disabled={isSubmitting}
                />
                {focusedField === "name" && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 pointer-events-none" />
                )}
              </div>
              {errors.name && (
                <p className="text-sm text-red-500 flex items-center space-x-1 animate-pulse">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{errors.name}</span>
                </p>
              )}
            </div>

            {/* Quantity and Unit Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                    />
                  </svg>
                  <span>Quantity</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    onFocus={() => setFocusedField("quantity")}
                    onBlur={() => setFocusedField(null)}
                    min="1"
                    className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:bg-white focus:shadow-lg ${
                      errors.quantity
                        ? "border-red-300 focus:border-red-500"
                        : focusedField === "quantity"
                        ? "border-purple-500 shadow-lg shadow-purple-100"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    placeholder="0"
                    disabled={isSubmitting}
                  />
                  {focusedField === "quantity" && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 pointer-events-none" />
                  )}
                </div>
                {errors.quantity && (
                  <p className="text-xs text-red-500 flex items-center space-x-1">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{errors.quantity}</span>
                  </p>
                )}
              </div>

              {renderUnitField()}
            </div>

            {/* Category */}
            {renderCategoryField()}

            {/* Site Selection */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span>Site Location</span>
              </label>
              <div className="relative">
                <select
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  onFocus={() => setFocusedField("site")}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:bg-white focus:shadow-lg appearance-none cursor-pointer ${
                    focusedField === "site"
                      ? "border-purple-500 shadow-lg shadow-purple-100"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  disabled={isSubmitting}
                >
                  <option value="">Select a site...</option>
                  <option value="company">🏢 Company</option>
                  {sites?.map((siteItem: any) => (
                    <option key={siteItem.id} value={siteItem.id}>
                      🏗️ {siteItem.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                {focusedField === "site" && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 pointer-events-none" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
          <div className="flex items-center justify-end space-x-4">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 text-gray-600 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="relative px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span>Add Stock</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
    </div>
  );
};

export default AddStockModal;
