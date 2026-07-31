import React from "react";
import ConfirmDialog, { ConfirmDialogVariant } from "@/components/ui/ConfirmDialog";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
  variant?: "default" | "danger" | "warning" | "success" | "info";
  confirmText?: string;
  cancelText?: string;
  size?: "sm" | "md" | "lg";
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isLoading,
  variant,
  confirmText,
  cancelText,
  size,
}) => (
  <ConfirmDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title={title}
    message={message}
    isLoading={isLoading}
    variant={variant as ConfirmDialogVariant}
    confirmText={confirmText}
    cancelText={cancelText}
    size={size}
  />
);

export default ConfirmModal;
