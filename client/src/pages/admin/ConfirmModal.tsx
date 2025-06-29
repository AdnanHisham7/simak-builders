import React, { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Info, XCircle, Loader2 } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
  variant?: 'default' | 'danger' | 'warning' | 'success' | 'info';
  confirmText?: string;
  cancelText?: string;
  size?: 'sm' | 'md' | 'lg';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isLoading = false,
  variant = 'default',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  size = 'md'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      setTimeout(() => setIsVisible(false), 200);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (isLoading) return;
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleConfirm = () => {
    if (isLoading) return;
    onConfirm();
  };

  // Keyboard handling
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') handleClose();
      if (e.key === 'Enter' && !isLoading) handleConfirm();
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, isLoading]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-amber-500" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'info':
        return <Info className="w-6 h-6 text-blue-500" />;
      default:
        return <Info className="w-6 h-6 text-gray-500" />;
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          confirmButton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          iconBg: 'bg-red-100',
        };
      case 'warning':
        return {
          confirmButton: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
          iconBg: 'bg-amber-100',
        };
      case 'success':
        return {
          confirmButton: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
          iconBg: 'bg-green-100',
        };
      case 'info':
        return {
          confirmButton: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          iconBg: 'bg-blue-100',
        };
      default:
        return {
          confirmButton: 'bg-gray-800 hover:bg-gray-900 focus:ring-gray-500',
          iconBg: 'bg-gray-100',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'w-80 max-w-sm';
      case 'lg':
        return 'w-[32rem] max-w-2xl';
      default:
        return 'max-w-md';
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${
        isAnimating ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/0'
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-200 transform overflow-hidden ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        } ${getSizeStyles()}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient header background */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl" />
        
        <div className="p-6 pt-8">
          {/* Icon and Title */}
          <div className="flex items-center space-x-4 mb-6">
            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${variantStyles.iconBg}`}>
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold text-gray-900 leading-tight">
                {title}
              </h3>
            </div>
          </div>

          {/* Message */}
          <div className="mb-8">
            <p className="text-gray-600 leading-relaxed text-base">
              {message}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="inline-flex justify-center items-center px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className={`inline-flex justify-center items-center px-6 py-3 text-sm font-medium text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles.confirmButton}`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-4 flex items-center space-x-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Processing...</span>
            </div>
          </div>
        )}

        {/* Subtle animations */}
        <div className="absolute -top-1 -left-1 -right-1 -bottom-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-sm opacity-30 -z-10" />
      </div>
    </div>
  );
};

export default ConfirmModal;