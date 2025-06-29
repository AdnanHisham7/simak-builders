import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const modalVariants = {
  hidden: { opacity: 0, y: -50 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 50 },
};

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  icon: React.ReactNode;
  theme?: 'danger' | 'success' | 'info';
  warningText?: string;
}

const themeClasses = {
  danger: {
    iconBg: 'bg-red-100',
    button: 'bg-red-600 hover:bg-red-700',
  },
  success: {
    iconBg: 'bg-green-100',
    button: 'bg-green-600 hover:bg-green-700',
  },
  info: {
    iconBg: 'bg-blue-100',
    button: 'bg-blue-600 hover:bg-blue-700',
  },
};

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  icon,
  theme = 'danger',
  warningText,
}) => {
  const selectedTheme = themeClasses[theme];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
          >
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 ${selectedTheme.iconBg} rounded-full flex items-center justify-center`}>
                  {icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                  {warningText && <p className="text-gray-600">{warningText}</p>}
                </div>
              </div>
              <p className="text-gray-700 mb-6">{description}</p>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-300"
                >
                  {cancelText}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`flex-1 px-4 py-2 ${selectedTheme.button} text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoading ? 'Processing...' : confirmText}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;