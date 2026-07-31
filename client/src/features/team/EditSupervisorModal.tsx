import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ name, email });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Supervisor" disableClose={isSubmitting}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-console-text">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter supervisor name"
            className={cn(
              "w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2",
              errors.name
                ? "border-danger-400 focus:ring-danger-100"
                : "border-console-border focus:border-brand-500 focus:ring-brand-100",
            )}
          />
          {errors.name && <p className="mt-1 text-xs text-danger-600">{errors.name}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-console-text">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter supervisor email"
            className={cn(
              "w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2",
              errors.email
                ? "border-danger-400 focus:ring-danger-100"
                : "border-console-border focus:border-brand-500 focus:ring-brand-100",
            )}
          />
          {errors.email && <p className="mt-1 text-xs text-danger-600">{errors.email}</p>}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditSupervisorModal;
