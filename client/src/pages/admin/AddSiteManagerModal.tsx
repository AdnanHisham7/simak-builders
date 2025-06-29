import React, { useState, useEffect } from "react";
import { X, User, Mail, UserPlus, AlertCircle, Sparkles } from "lucide-react";

// AddSiteManagerModal Component
interface AddSiteManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newManager: { name: string; email: string }) => Promise<void>;
}

const AddSiteManagerModal: React.FC<AddSiteManagerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [inputError, setInputError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  const handleSubmitLocal = async () => {
    if (!name || !email) {
      setInputError(true);
      return;
    }
    setIsLoading(true);
    try {
      await onSubmit({ name, email });
      // Reset form on success
      setName("");
      setEmail("");
      setInputError(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
      setName("");
      setEmail("");
      setInputError(false);
    }, 150);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`relative bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300 transform overflow-hidden ${
          isAnimating
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-8"
        } w-full max-w-md`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient header background */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl" />

        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-xl animate-pulse" />
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-tr from-pink-400/10 to-blue-400/10 rounded-full blur-xl animate-pulse delay-1000" />
        </div>

        {/* Header */}
        <div className="relative p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                  <Sparkles className="w-2 h-2 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Add Site Manager
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Create a new site manager account
                </p>
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
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <User className="w-4 h-4 mr-2 text-gray-400" />
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (inputError) setInputError(false);
                  }}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                  disabled={isLoading}
                  placeholder="Enter full name"
                  className={`w-full px-4 py-3 pl-11 border-2 rounded-xl transition-all duration-200 ${
                    inputError && !name
                      ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                      : "border-gray-200 bg-gray-50 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:bg-white"
                  } ${isLoading ? "opacity-60 cursor-not-allowed" : ""} ${
                    focusedField === "name"
                      ? "shadow-lg transform scale-[1.02]"
                      : "hover:shadow-md"
                  }`}
                />
                <User
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${
                    focusedField === "name" ? "text-blue-500" : "text-gray-400"
                  }`}
                />
                {inputError && !name && (
                  <div className="flex items-center mt-2 animate-fade-in">
                    <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
                    <p className="text-red-500 text-sm">Name is required</p>
                  </div>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div className="group">
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (inputError) setInputError(false);
                  }}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  disabled={isLoading}
                  placeholder="Enter email address"
                  className={`w-full px-4 py-3 pl-11 border-2 rounded-xl transition-all duration-200 ${
                    inputError && !email
                      ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                      : "border-gray-200 bg-gray-50 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:bg-white"
                  } ${isLoading ? "opacity-60 cursor-not-allowed" : ""} ${
                    focusedField === "email"
                      ? "shadow-lg transform scale-[1.02]"
                      : "hover:shadow-md"
                  }`}
                />
                <Mail
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${
                    focusedField === "email" ? "text-blue-500" : "text-gray-400"
                  }`}
                />
                {inputError && !email && (
                  <div className="flex items-center mt-2 animate-fade-in">
                    <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
                    <p className="text-red-500 text-sm">Email is required</p>
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
                  ? "bg-gradient-to-r from-blue-400 to-purple-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-lg hover:shadow-blue-500/25"
              } flex items-center justify-center space-x-2`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Add Manager</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSiteManagerModal;
