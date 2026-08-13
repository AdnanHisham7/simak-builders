import React, { useState } from "react";
import { User, Mail, UserPlus, AlertCircle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newClient: { name: string; email: string }) => Promise<void>;
}

const AddClientModal: React.FC<AddClientModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [inputError, setInputError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmitLocal = async () => {
    if (!name || !email) {
      setInputError(true);
      return;
    }
    setIsLoading(true);
    try {
      await onSubmit({ name, email });
      setName("");
      setEmail("");
      setInputError(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose();
    setName("");
    setEmail("");
    setInputError(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add client"
      description="Create a new client account"
      size="sm"
      disableClose={isLoading}
      closeOnOverlayClick={!isLoading}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmitLocal} loading={isLoading}>
            <UserPlus className="h-4 w-4" />
            Add client
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
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (inputError) setInputError(false);
            }}
            disabled={isLoading}
            placeholder="Enter full name"
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
              inputError && !name
                ? "border-danger-300 bg-danger-50 focus:border-danger-500 focus:ring-danger-100"
                : "border-console-border bg-white focus:border-brand-500 focus:ring-brand-100"
            }`}
          />
          {inputError && !name && (
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
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (inputError) setInputError(false);
            }}
            disabled={isLoading}
            placeholder="Enter email address"
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
              inputError && !email
                ? "border-danger-300 bg-danger-50 focus:border-danger-500 focus:ring-danger-100"
                : "border-console-border bg-white focus:border-brand-500 focus:ring-brand-100"
            }`}
          />
          {inputError && !email && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-danger-600">
              <AlertCircle className="h-3.5 w-3.5" />
              Email is required
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AddClientModal;
