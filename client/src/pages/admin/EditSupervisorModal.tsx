import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface Supervisor {
  id: string;
  name: string;
  email: string;
}

interface EditSupervisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  supervisor: Supervisor;
  onSubmit: (data: { name: string; email: string }) => Promise<void>;
}

const EditSupervisorModal: React.FC<EditSupervisorModalProps> = ({
  isOpen,
  onClose,
  supervisor,
  onSubmit,
}) => {
  const [name, setName] = useState(supervisor.name);
  const [email, setEmail] = useState(supervisor.email);
  const [errors, setErrors] = useState({ name: "", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setName(supervisor.name);
    setEmail(supervisor.email);
    setErrors({ name: "", email: "" });
  }, [supervisor]);

  const validateForm = () => {
    let isValid = true;
    const newErrors = { name: "", email: "" };

    if (!name.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    }
    if (!email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ name, email });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Edit Supervisor</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <X size={24} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-2 border-2 ${
                errors.name ? "border-red-500" : "border-gray-200"
              } rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200`}
              placeholder="Enter supervisor name"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-2 border-2 ${
                errors.email ? "border-red-500" : "border-gray-200"
              } rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200`}
              placeholder="Enter supervisor email"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2" />
            ) : null}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditSupervisorModal;