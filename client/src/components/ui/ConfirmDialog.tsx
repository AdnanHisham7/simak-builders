import { AlertTriangle, CheckCircle2, HelpCircle, Info, Loader2, XCircle } from "lucide-react";
import Modal from "./Modal";
import { cn } from "@/lib/cn";

export type ConfirmDialogVariant = "default" | "danger" | "warning" | "success" | "info";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  helperText?: string;
  isLoading?: boolean;
  variant?: ConfirmDialogVariant;
  confirmText?: string;
  cancelText?: string;
  size?: "sm" | "md" | "lg";
}

const variantConfig: Record<
  ConfirmDialogVariant,
  { icon: React.ReactNode; iconBg: string; iconColor: string; confirmButton: string }
> = {
  default: {
    icon: <HelpCircle className="h-5 w-5" />,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    confirmButton: "bg-slate-900 hover:bg-slate-800 focus-visible:ring-slate-500",
  },
  danger: {
    icon: <XCircle className="h-5 w-5" />,
    iconBg: "bg-danger-50",
    iconColor: "text-danger-600",
    confirmButton: "bg-danger-600 hover:bg-danger-700 focus-visible:ring-danger-500",
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5" />,
    iconBg: "bg-warning-50",
    iconColor: "text-warning-600",
    confirmButton: "bg-warning-600 hover:bg-warning-700 focus-visible:ring-warning-500",
  },
  success: {
    icon: <CheckCircle2 className="h-5 w-5" />,
    iconBg: "bg-success-50",
    iconColor: "text-success-600",
    confirmButton: "bg-success-600 hover:bg-success-700 focus-visible:ring-success-500",
  },
  info: {
    icon: <Info className="h-5 w-5" />,
    iconBg: "bg-info-50",
    iconColor: "text-info-600",
    confirmButton: "bg-info-600 hover:bg-info-700 focus-visible:ring-info-500",
  },
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  helperText,
  isLoading = false,
  variant = "default",
  confirmText = "Confirm",
  cancelText = "Cancel",
  size = "sm",
}) => {
  const config = variantConfig[variant];

  const handleConfirm = () => {
    if (isLoading) return;
    onConfirm();
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      disableClose={isLoading}
      closeOnOverlayClick={!isLoading}
      size={size}
      className="max-w-md"
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            config.iconBg,
            config.iconColor,
          )}
        >
          {config.icon}
        </div>
        <div className="flex-1 pt-0.5">
          <h3 className="text-base font-semibold text-console-text">{title}</h3>
          <div className="mt-1.5 text-sm text-console-muted leading-relaxed">{message}</div>
          {helperText && (
            <p className="mt-2 text-xs font-medium text-console-muted">{helperText}</p>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={handleClose}
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-lg border border-console-border bg-white px-4 py-2 text-sm font-medium text-console-text transition-colors hover:bg-console-bg disabled:cursor-not-allowed disabled:opacity-60"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isLoading}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-console transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
            config.confirmButton,
          )}
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? "Processing..." : confirmText}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
