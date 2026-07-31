import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-6xl",
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: ModalSize;
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeOnOverlayClick?: boolean;
  disableClose?: boolean;
  className?: string;
}

let openModalCount = 0;

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  size = "md",
  children,
  footer,
  closeOnOverlayClick = true,
  disableClose = false,
  className,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    openModalCount += 1;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !disableClose) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      openModalCount = Math.max(0, openModalCount - 1);
      if (openModalCount === 0) {
        document.body.style.overflow = previousOverflow;
      }
    };
  }, [isOpen, onClose, disableClose]);

  if (!isOpen) return null;

  const handleOverlayMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!closeOnOverlayClick || disableClose) return;
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onMouseDown={handleOverlayMouseDown}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "console-modal-title" : undefined}
        className={cn(
          "w-full rounded-console bg-console-surface shadow-console-lg border border-console-border flex flex-col max-h-[90vh]",
          sizeClasses[size],
          className,
        )}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {(title || !disableClose) && (
          <div className="flex items-start justify-between gap-4 border-b border-console-border px-6 py-4 shrink-0">
            <div>
              {title && (
                <h2
                  id="console-modal-title"
                  className="text-base font-semibold text-console-text"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-console-muted">{description}</p>
              )}
            </div>
            {!disableClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="rounded-md p-1.5 text-console-muted hover:bg-console-bg hover:text-console-text transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        <div className="overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-console-border px-6 py-4 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
