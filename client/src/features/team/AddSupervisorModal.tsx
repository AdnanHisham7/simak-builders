import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface AddSupervisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; email: string }) => Promise<void>;
}

const AddSupervisorModal: React.FC<AddSupervisorModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({ name: "", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setName("");
      setEmail("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setName("");
    setEmail("");
    setErrors({ name: "", email: "" });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Supervisor" disableClose={isSubmitting}>
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
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Add supervisor
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddSupervisorModal;
