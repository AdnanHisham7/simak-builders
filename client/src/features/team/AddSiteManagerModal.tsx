import { useState } from "react";
import { AlertCircle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    setName("");
    setEmail("");
    setInputError(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      disableClose={isLoading}
      closeOnOverlayClick={!isLoading}
      title="Add Site Manager"
      description="Create a new site manager account"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-console-text">Full name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (inputError) setInputError(false);
            }}
            disabled={isLoading}
            placeholder="Enter full name"
            className={cn(
              "w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60",
              inputError && !name
                ? "border-danger-400 focus:ring-danger-100"
                : "border-console-border focus:border-brand-500 focus:ring-brand-100",
            )}
          />
          {inputError && !name && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-danger-600">
              <AlertCircle size={12} /> Name is required
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-console-text">Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (inputError) setInputError(false);
            }}
            disabled={isLoading}
            placeholder="Enter email address"
            className={cn(
              "w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60",
              inputError && !email
                ? "border-danger-400 focus:ring-danger-100"
                : "border-console-border focus:border-brand-500 focus:ring-brand-100",
            )}
          />
          {inputError && !email && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-danger-600">
              <AlertCircle size={12} /> Email is required
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            Add manager
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddSiteManagerModal;
