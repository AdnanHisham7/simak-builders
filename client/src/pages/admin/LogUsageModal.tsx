import React, { useState, useEffect } from "react";

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
  sites,
  stocks,
}) => {
  const [stock, setStock] = useState<any>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ stock?: string; quantity?: string }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Animation control
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStock(null);
      setQuantity(0);
      setErrors({});
      setSearchTerm("");
      setIsDropdownOpen(false);
    }
  }, [isOpen]);

  // Filter stocks based on search
  const filteredStocks = stocks?.filter((s: any) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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
    setErrors(prev => ({ ...prev, stock: undefined }));
  };

  const getSizeStyles = () => {
    return "w-full max-w-lg mx-4";
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`relative bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300 transform overflow-hidden ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        } ${getSizeStyles()}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient header background */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl" />
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 z-10 group"
        >
          <svg className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="px-8 pt-8 pb-2">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Log Stock Usage</h2>
              <p className="text-sm text-gray-500">Record inventory usage for your site</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-8">
          <div className="space-y-6">
            {/* Stock Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Stock Item
              </label>
              <div className="relative">
                <div
                  className={`w-full p-4 border-2 rounded-xl transition-all duration-200 cursor-pointer bg-white hover:bg-gray-50 ${
                    errors.stock ? 'border-red-300' : isDropdownOpen ? 'border-blue-500 ring-4 ring-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {stock ? stock.name : "Choose a stock item"}
                        </div>
                        {stock && (
                          <div className="text-sm text-gray-500">
                            Available: {stock.quantity} units
                          </div>
                        )}
                      </div>
                    </div>
                    <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Dropdown */}
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-10 max-h-64 overflow-hidden">
                    {/* Search */}
                    <div className="p-3 border-b border-gray-100">
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          type="text"
                          placeholder="Search stocks..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    {/* Stock list */}
                    <div className="max-h-48 overflow-y-auto">
                      {filteredStocks.length > 0 ? (
                        filteredStocks.map((s: any) => (
                          <div
                            key={s._id}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors duration-150"
                            onClick={() => handleStockSelect(s)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                <div>
                                  <div className="font-medium text-gray-900">{s.name}</div>
                                  <div className="text-sm text-gray-500">
                                    {s.quantity} available
                                  </div>
                                </div>
                              </div>
                              {s.quantity <= 10 && (
                                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                  Low Stock
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          No stocks found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {errors.stock && (
                <p className="text-red-500 text-sm flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{errors.stock}</span>
                </p>
              )}
            </div>

            {/* Quantity Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quantity to Use
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={quantity || ''}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setQuantity(value);
                    setErrors(prev => ({ ...prev, quantity: undefined }));
                  }}
                  min="1"
                  max={stock?.quantity || undefined}
                  className={`w-full p-4 pl-12 border-2 rounded-xl transition-all duration-200 focus:outline-none ${
                    errors.quantity 
                      ? 'border-red-300 focus:ring-4 focus:ring-red-50 focus:border-red-500' 
                      : 'border-gray-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-500'
                  }`}
                  placeholder="Enter quantity"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                </div>
              </div>
              {stock && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Available: {stock.quantity} units</span>
                  {quantity > 0 && (
                    <span className="text-blue-600 font-medium">
                      Remaining: {stock.quantity - quantity} units
                    </span>
                  )}
                </div>
              )}
              {errors.quantity && (
                <p className="text-red-500 text-sm flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{errors.quantity}</span>
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 mt-8">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !stock || quantity <= 0}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Logging Usage...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Log Usage</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogUsageModal;