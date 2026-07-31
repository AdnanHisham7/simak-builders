import { AlertCircle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface AddContractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.MouseEvent) => void;
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
  sizeStyles?: string;
  isEditMode?: boolean;
}

const AddContractorModal: React.FC<AddContractorModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  newContractor,
  setNewContractor,
  inputErrors,
  isEditMode = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "Edit Contractor" : "Add New Contractor"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>
            {isEditMode ? "Update contractor" : "Add contractor"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-console-text">Full name *</label>
          <input
            type="text"
            value={newContractor.name}
            onChange={(e) => setNewContractor({ ...newContractor, name: e.target.value })}
            className={cn(
              "w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2",
              inputErrors.name
                ? "border-danger-400 focus:ring-danger-100"
                : "border-console-border focus:border-brand-500 focus:ring-brand-100",
            )}
            placeholder="Enter contractor's full name"
          />
          {inputErrors.name && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-danger-600">
              <AlertCircle size={12} /> Name is required
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-console-text">Email address *</label>
          <input
            type="email"
            value={newContractor.email}
            onChange={(e) => setNewContractor({ ...newContractor, email: e.target.value })}
            className={cn(
              "w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2",
              inputErrors.email
                ? "border-danger-400 focus:ring-danger-100"
                : "border-console-border focus:border-brand-500 focus:ring-brand-100",
            )}
            placeholder="contractor@example.com"
          />
          {inputErrors.email && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-danger-600">
              <AlertCircle size={12} /> Valid email is required
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-console-text">Phone number</label>
          <input
            type="text"
            value={newContractor.phone}
            onChange={(e) => setNewContractor({ ...newContractor, phone: e.target.value })}
            className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            placeholder="+91 9876543210"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-console-text">Company</label>
          <input
            type="text"
            value={newContractor.company}
            onChange={(e) => setNewContractor({ ...newContractor, company: e.target.value })}
            className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            placeholder="Company name"
          />
        </div>
      </div>
    </Modal>
  );
};

export default AddContractorModal;
