import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface SiteManager {
  id: string;
  name: string;
  email: string;
}

interface EditSiteManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  manager: SiteManager;
  onSubmit: (updatedManager: { id: string; name: string; email: string }) => Promise<void>;
}

const EditSiteManagerModal: React.FC<EditSiteManagerModalProps> = ({
  isOpen,
  onClose,
  manager,
  onSubmit,
}) => {
  const [updatedManager, setUpdatedManager] = useState({ ...manager });
  const [inputErrors, setInputErrors] = useState({ name: false, email: false });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUpdatedManager({ ...manager });
      setInputErrors({ name: false, email: false });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = {
      name: !updatedManager.name.trim(),
      email: !updatedManager.email.trim() || !isValidEmail(updatedManager.email),
    };
    setInputErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    setIsLoading(true);
    try {
      await onSubmit(updatedManager);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setInputErrors({ name: false, email: false });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      disableClose={isLoading}
      closeOnOverlayClick={!isLoading}
      title="Edit Site Manager"
      description="Update manager information"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-console-text">Full name</label>
          <input
            type="text"
            name="name"
            value={updatedManager.name}
            onChange={handleInputChange}
            disabled={isLoading}
            placeholder="Enter full name"
            className={cn(
              "w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60",
              inputErrors.name
                ? "border-danger-400 focus:ring-danger-100"
                : "border-console-border focus:border-brand-500 focus:ring-brand-100",
            )}
          />
          {inputErrors.name && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-danger-600">
              <AlertCircle size={12} /> Name is required
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-console-text">Email address</label>
          <input
            type="email"
            name="email"
            value={updatedManager.email}
            onChange={handleInputChange}
            disabled={isLoading}
            placeholder="Enter email address"
            className={cn(
              "w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60",
              inputErrors.email
                ? "border-danger-400 focus:ring-danger-100"
                : "border-console-border focus:border-brand-500 focus:ring-brand-100",
            )}
          />
          {inputErrors.email && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-danger-600">
              <AlertCircle size={12} /> Valid email is required
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditSiteManagerModal;
