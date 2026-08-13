import React, { useEffect, useState } from "react";
import { User, Mail, AlertCircle, Check } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface Client {
  id: string;
  name: string;
  email: string;
  isBlocked: boolean;
  assignedSites: { id: string; name: string }[];
}

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  onSubmit: (updatedClient: { name: string; email: string }) => void;
}

const EditClientModal: React.FC<EditClientModalProps> = ({
  isOpen,
  onClose,
  client,
  onSubmit,
}) => {
  const [updatedClient, setUpdatedClient] = useState({
    name: client.name,
    email: client.email,
  });
  const [inputErrors, setInputErrors] = useState({ name: false, email: false });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUpdatedClient({ name: client.name, email: client.email });
    }
  }, [isOpen, client]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUpdatedClient((prev) => ({ ...prev, [name]: value }));
    if (inputErrors[name as keyof typeof inputErrors]) {
      setInputErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmitLocal = async () => {
    const errors = {
      name: !updatedClient.name.trim(),
      email: !updatedClient.email.trim() || !isValidEmail(updatedClient.email),
    };
    setInputErrors(errors);

    if (!Object.values(errors).some(Boolean)) {
      setIsLoading(true);
      try {
        await onSubmit(updatedClient);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose();
    setInputErrors({ name: false, email: false });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit client"
      description={`Update details for ${client.name}`}
      size="sm"
      disableClose={isLoading}
      closeOnOverlayClick={!isLoading}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmitLocal} loading={isLoading}>
            <Check className="h-4 w-4" />
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <label className="mb-1.5 flex items-center text-sm font-medium text-console-text">
            <User className="mr-1.5 h-4 w-4 text-console-muted" />
            Full name
          </label>
          <input
            type="text"
            name="name"
            value={updatedClient.name}
            onChange={handleInputChange}
            disabled={isLoading}
            placeholder="Enter full name"
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
              inputErrors.name
                ? "border-danger-300 bg-danger-50 focus:border-danger-500 focus:ring-danger-100"
                : "border-console-border bg-white focus:border-brand-500 focus:ring-brand-100"
            }`}
          />
          {inputErrors.name && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-danger-600">
              <AlertCircle className="h-3.5 w-3.5" />
              Name is required
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 flex items-center text-sm font-medium text-console-text">
            <Mail className="mr-1.5 h-4 w-4 text-console-muted" />
            Email address
          </label>
          <input
            type="email"
            name="email"
            value={updatedClient.email}
            onChange={handleInputChange}
            disabled={isLoading}
            placeholder="Enter email address"
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
              inputErrors.email
                ? "border-danger-300 bg-danger-50 focus:border-danger-500 focus:ring-danger-100"
                : "border-console-border bg-white focus:border-brand-500 focus:ring-brand-100"
            }`}
          />
          {inputErrors.email && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-danger-600">
              <AlertCircle className="h-3.5 w-3.5" />
              Enter a valid email address
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default EditClientModal;
