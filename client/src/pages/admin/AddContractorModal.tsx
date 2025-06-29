import React from "react";
import { X, UserPlus, AlertCircle } from "lucide-react";

interface AddContractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (e: React.MouseEvent) => void;
  newContractor: {
    name: string;
    email: string;
    phone: string;
    company: string;
  };
  setNewContractor: React.Dispatch<
    React.SetStateAction<{
      name: string;
      email: string;
      phone: string;
      company: string;
    }>
  >;
  inputErrors: {
    name: boolean;
    email: boolean;
    phone: boolean;
    company: boolean;
  };
  setInputErrors: React.Dispatch<
    React.SetStateAction<{
      name: boolean;
      email: boolean;
      phone: boolean;
      company: boolean;
    }>
  >;
  isAnimating: boolean;
  sizeStyles: string;
}

const AddContractorModal: React.FC<AddContractorModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  newContractor,
  setNewContractor,
  inputErrors,
  isAnimating,
  sizeStyles,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`relative bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-200 transform overflow-hidden ${
          isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
        } ${sizeStyles}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl" />

        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <UserPlus size={20} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Add New Contractor
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={newContractor.name}
                onChange={(e) =>
                  setNewContractor({ ...newContractor, name: e.target.value })
                }
                className={`w-full px-4 py-3 border-2 ${
                  inputErrors.name
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200"
                } rounded-xl focus:outline-none focus:border-blue-500 focus:bg-blue-50 transition-all duration-200`}
                placeholder="Enter contractor's full name"
              />
              {inputErrors.name && (
                <p className="text-red-500 text-xs mt-2 flex items-center">
                  <AlertCircle size={12} className="mr-1" />
                  Name is required
                </p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={newContractor.email}
                onChange={(e) =>
                  setNewContractor({ ...newContractor, email: e.target.value })
                }
                className={`w-full px-4 py-3 border-2 ${
                  inputErrors.email
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200"
                } rounded-xl focus:outline-none focus:border-blue-500 focus:bg-blue-50 transition-all duration-200`}
                placeholder="contractor@example.com"
              />
              {inputErrors.email && (
                <p className="text-red-500 text-xs mt-2 flex items-center">
                  <AlertCircle size={12} className="mr-1" />
                  Valid email is required
                </p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Phone Number
              </label>
              <input
                type="text"
                name="phone"
                value={newContractor.phone}
                onChange={(e) =>
                  setNewContractor({ ...newContractor, phone: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-blue-50 transition-all duration-200"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Company
              </label>
              <input
                type="text"
                name="company"
                value={newContractor.company}
                onChange={(e) =>
                  setNewContractor({
                    ...newContractor,
                    company: e.target.value,
                  })
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-blue-50 transition-all duration-200"
                placeholder="Company name"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-700 border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onAdd}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
            >
              Add Contractor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddContractorModal;
