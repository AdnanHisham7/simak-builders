import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface DeleteContractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  contractorName: string;
}

const DeleteContractorModal: React.FC<DeleteContractorModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  contractorName,
}) => (
  <ConfirmDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title="Delete Contractor"
    message={
      <>
        Are you sure you want to delete <span className="font-semibold text-console-text">{contractorName}</span>?
        This action cannot be undone.
      </>
    }
    variant="danger"
    confirmText="Yes, delete"
  />
);

export default DeleteContractorModal;
