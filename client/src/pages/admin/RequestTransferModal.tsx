import React, { useState, useEffect } from "react";

interface RequestTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transferData: any) => Promise<void>;
  sites: any;
  stocks: any;
  allowedToSites: any;
}

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
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [currentStep, setCurrentStep] = useState(1);
console.log("Allowed TO SITES", allowedToSites)
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      // Reset form when modal opens
      setFromSite("");
      setToSite("");
      setStock(null);
      setQuantity(0);
      setErrors({});
      setCurrentStep(1);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredStocks =
    fromSite === "company"
      ? stocks.filter((s) => !s.site)
      : fromSite
      ? stocks.filter((s) => s.site?._id === fromSite)
      : [];

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
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

  const getSizeStyles = () => {
    return "w-full max-w-2xl mx-4";
  };

  const getStepColor = (step: number) => {
    if (step < currentStep) return "bg-green-500 text-white";
    if (step === currentStep) return "bg-blue-500 text-white";
    return "bg-gray-200 text-gray-500";
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1: return fromSite && stock;
      case 2: return quantity > 0;
      case 3: return toSite;
      default: return false;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
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

        {/* Header */}
        <div className="relative px-8 py-6 border-b border-gray-100">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Request Stock Transfer</h2>
              <p className="text-gray-500 text-sm">Transfer inventory between sites</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mt-6 space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-200 ${getStepColor(step)}`}>
                  {step < currentStep ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    step
                  )}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-0.5 mx-2 transition-colors duration-200 ${
                    step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Select Source and Item</h3>
                <p className="text-gray-500 text-sm">Choose where to transfer from and what to transfer</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">From Site</label>
                  <div className="relative">
                    <select
                      value={fromSite}
                      onChange={(e) => {
                        setFromSite(e.target.value);
                        setStock(null);
                        setErrors({...errors, fromSite: ""});
                      }}
                      className={`w-full p-3 border-2 rounded-xl bg-white transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
                        errors.fromSite ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <option value="">Select source site</option>
                      <option value="company">🏢 Company Warehouse</option>
                      {sites.map((site) => (
                        <option key={site.id} value={site.id}>
                          📍 {site.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {errors.fromSite && <p className="text-sm text-red-500">{errors.fromSite}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Stock Item</label>
                  <div className="relative">
                    <select
                      onChange={(e) => {
                        setStock(filteredStocks.find((s) => s._id === e.target.value));
                        setErrors({...errors, stock: ""});
                      }}
                      disabled={!fromSite}
                      className={`w-full p-3 border-2 rounded-xl bg-white transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-500 ${
                        errors.stock ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <option value="">Select stock item</option>
                      {filteredStocks.map((s) => (
                        <option key={s._id} value={s._id}>
                          📦 {s.name} (Available: {s.quantity || 0})
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {errors.stock && <p className="text-sm text-red-500">{errors.stock}</p>}
                </div>
              </div>

              {stock && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-900">Selected Item: {stock.name}</h4>
                      <p className="text-sm text-blue-700">Available quantity: {stock.quantity || 0} units</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Specify Quantity</h3>
                <p className="text-gray-500 text-sm">How many units would you like to transfer?</p>
              </div>

              <div className="max-w-md mx-auto space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Transfer Quantity</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        setQuantity(Number(e.target.value));
                        setErrors({...errors, quantity: ""});
                      }}
                      min="1"
                      max={stock?.quantity || 999}
                      className={`w-full p-4 border-2 rounded-xl text-center text-2xl font-bold transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
                        errors.quantity ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="0"
                    />
                  </div>
                  {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
                </div>

                {stock && (
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Available:</span>
                      <span className="font-semibold">{stock.quantity || 0} units</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-2">
                      <span className="text-gray-600">Transferring:</span>
                      <span className="font-semibold text-blue-600">{quantity} units</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-2 pt-2 border-t">
                      <span className="text-gray-600">Remaining:</span>
                      <span className="font-semibold">{(stock.quantity || 0) - quantity} units</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Select Destination</h3>
                <p className="text-gray-500 text-sm">Choose where to transfer the items</p>
              </div>

              <div className="max-w-md mx-auto space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">To Site</label>
                  <div className="relative">
                    <select
                      value={toSite}
                      onChange={(e) => {
                        setToSite(e.target.value);
                        setErrors({...errors, toSite: ""});
                      }}
                      className={`w-full p-3 border-2 rounded-xl bg-white transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
                        errors.toSite ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <option value="">Select destination site</option>
                      {allowedToSites?.map((siteId) => {
                        const site = sites.find((s) => s.id === siteId);
                        return site ? (
                          <option key={site.id} value={site.id}>
                            🎯 {site.name}
                          </option>
                        ) : null;
                      })}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {errors.toSite && <p className="text-sm text-red-500">{errors.toSite}</p>}
                </div>

                {/* Transfer Summary */}
                {fromSite && stock && quantity > 0 && toSite && (
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200 mt-6">
                    <h4 className="font-semibold text-green-900 mb-3">Transfer Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-green-700">From:</span>
                        <span className="font-medium">{fromSite === "company" ? "Company Warehouse" : sites.find(s => s.id === fromSite)?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">To:</span>
                        <span className="font-medium">{sites.find(s => s.id === toSite)?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Item:</span>
                        <span className="font-medium">{stock.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Quantity:</span>
                        <span className="font-medium">{quantity} units</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Step {currentStep} of 3</span>
          </div>
          
          <div className="flex space-x-3">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-medium"
              >
                Previous
              </button>
            )}
            
            {currentStep < 3 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceedToNext()}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !canProceedToNext()}
                className="px-8 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span>Submit Request</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestTransferModal;