import React from "react";
import ConfirmDialog, { ConfirmDialogVariant } from "@/components/ui/ConfirmDialog";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  icon?: React.ReactNode;
  theme?: "danger" | "success" | "info";
  warningText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  isLoading,
  theme,
  warningText,
}) => (
  <ConfirmDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title={title}
    message={description}
    helperText={warningText}
    isLoading={isLoading}
    variant={(theme ?? "danger") as ConfirmDialogVariant}
    confirmText={confirmText}
    cancelText={cancelText}
  />
);

export default ConfirmationModal;
