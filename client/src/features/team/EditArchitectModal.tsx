import { useState, useEffect } from "react";
import { Architect } from "./Architects";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface EditArchitectModalProps {
  isOpen: boolean;
  onClose: () => void;
  architect: Architect;
  onSubmit: (updatedArchitect: { name: string; email: string }) => Promise<void>;
}

const EditArchitectModal: React.FC<EditArchitectModalProps> = ({
  isOpen,
  onClose,
  architect,
  onSubmit,
}) => {
  const [name, setName] = useState(architect.name);
  const [email, setEmail] = useState(architect.email);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setName(architect.name);
    setEmail(architect.email);
  }, [architect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({ name, email });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Architect" disableClose={isSubmitting}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-console-text">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-console-text">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
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

export default EditArchitectModal;
