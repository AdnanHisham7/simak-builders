import React, { useEffect, useState } from "react";
import {
  X,
  User,
  Mail,
  UserPlus,
  Edit3,
  Check,
  AlertCircle,
  Sparkles,
} from "lucide-react";


interface SiteManager {
  id: string;
  name: string;
  email: string;
}

interface EditSiteManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  manager: SiteManager;
  onSubmit: (updatedManager: { id: string; name: string; email: string }) => void;
}

const EditSiteManagerModal: React.FC<EditSiteManagerModalProps> = ({
  isOpen,
  onClose,
  manager,
  onSubmit,
}) => {
  const [updatedManager, setUpdatedManager] = useState({ ...manager });
  const [inputErrors, setInputErrors] = useState({ name: false, email: false });
  const [isAnimating, setIsAnimating] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setUpdatedManager({ ...manager });
    } else {
      setIsAnimating(false);
    }
  }, [isOpen, manager]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUpdatedManager((prev) => ({ ...prev, [name]: value }));
    if (inputErrors[name as keyof typeof inputErrors]) {
      setInputErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmitLocal = async () => {
    const errors = {
      name: !updatedManager.name.trim(),
      email: !updatedManager.email.trim() || !isValidEmail(updatedManager.email),
    };
    setInputErrors(errors);

    if (!Object.values(errors).some(Boolean)) {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
        onSubmit(updatedManager);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
      setInputErrors({ name: false, email: false });
    }, 150);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`relative bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300 transform overflow-hidden ${
          isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-8'
        } w-full max-w-md`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient header background */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 rounded-t-2xl" />
        
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-emerald-400/10 to-blue-400/10 rounded-full blur-xl animate-pulse" />
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-tr from-purple-400/10 to-emerald-400/10 rounded-full blur-xl animate-pulse delay-1000" />
        </div>

        {/* Header */}
        <div className="relative p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Edit3 className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 rounded-full flex items-center justify-center">
                  <Sparkles className="w-2 h-2 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Edit Site Manager
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">Update manager information</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="group relative w-8 h-8 rounded-lg bg-gray-100 hover:bg-red-50 transition-all duration-200 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-gray-500 group-hover:text-red-500 transition-colors duration-200" />
              <div className="absolute inset-0 rounded-lg bg-red-500/0 group-hover:bg-red-500/10 transition-all duration-200" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="relative px-6 pb-6">
          <div className="space-y-5">
            {/* Name Field */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <User className="w-4 h-4 mr-2 text-gray-400" />
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={updatedManager.name}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  disabled={isLoading}
                  placeholder="Enter full name"
                  className={`w-full px-4 py-3 pl-11 border-2 rounded-xl transition-all duration-200 ${
                    inputErrors.name 
                      ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-100" 
                      : "border-gray-200 bg-gray-50 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 focus:bg-white"
                  } ${isLoading ? "opacity-60 cursor-not-allowed" : ""} ${
                    focusedField === 'name' ? 'shadow-lg transform scale-[1.02]' : 'hover:shadow-md'
                  }`}
                />
                <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${
                  focusedField === 'name' ? 'text-emerald-500' : 'text-gray-400'
                }`} />
                {inputErrors.name && (
                  <div className="flex items-center mt-2 animate-fade-in">
                    <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
                    <p className="text-red-500 text-sm">Name is required</p>
                  </div>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={updatedManager.email}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  disabled={isLoading}
                  placeholder="Enter email address"
                  className={`w-full px-4 py-3 pl-11 border-2 rounded-xl transition-all duration-200 ${
                    inputErrors.email 
                      ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-100" 
                      : "border-gray-200 bg-gray-50 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 focus:bg-white"
                  } ${isLoading ? "opacity-60 cursor-not-allowed" : ""} ${
                    focusedField === 'email' ? 'shadow-lg transform scale-[1.02]' : 'hover:shadow-md'
                  }`}
                />
                <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${
                  focusedField === 'email' ? 'text-emerald-500' : 'text-gray-400'
                }`} />
                {inputErrors.email && (
                  <div className="flex items-center mt-2 animate-fade-in">
                    <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
                    <p className="text-red-500 text-sm">Valid email is required</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-6 py-3 text-gray-700 bg-white border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmitLocal}
              disabled={isLoading}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
                isLoading 
                  ? "bg-gradient-to-r from-emerald-400 to-blue-400 cursor-not-allowed" 
                  : "bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 hover:shadow-lg hover:shadow-emerald-500/25"
              } flex items-center justify-center space-x-2`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


export default EditSiteManagerModal;