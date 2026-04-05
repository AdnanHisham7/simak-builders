import React from "react";
import { X, Trash2, AlertTriangle } from "lucide-react";

interface DeleteContractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  contractorName: string;
  isAnimating?: boolean;
}

const DeleteContractorModal: React.FC<DeleteContractorModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  contractorName,
  isAnimating = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full transition-all duration-200 ${
          isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-red-100 rounded-full">
              <AlertTriangle size={48} className="text-red-600" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Delete Contractor
          </h2>
          <p className="text-center text-gray-600 mb-8">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-gray-900">
              {contractorName}
            </span>
            ?
            <br />
            This action cannot be undone.
          </p>

          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-medium flex items-center gap-2"
            >
              <Trash2 size={18} />
              Yes, Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteContractorModal;
