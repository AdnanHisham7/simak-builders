import { cloneElement, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

type TooltipPlacement = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  label: string;
  children: React.ReactElement;
  placement?: TooltipPlacement;
  delay?: number;
  disabled?: boolean;
}

const OFFSET = 10;

const Tooltip: React.FC<TooltipProps> = ({
  label,
  children,
  placement = "top",
  delay = 250,
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const anchorRef = useRef<HTMLElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipId = useId();

  const computePosition = () => {
    const node = anchorRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();

    let top = 0;
    let left = 0;

    switch (placement) {
      case "bottom":
        top = rect.bottom + OFFSET;
        left = rect.left + rect.width / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2;
        left = rect.left - OFFSET;
        break;
      case "right":
        top = rect.top + rect.height / 2;
        left = rect.right + OFFSET;
        break;
      case "top":
      default:
        top = rect.top - OFFSET;
        left = rect.left + rect.width / 2;
        break;
    }

    setCoords({ top, left });
  };

  const show = () => {
    if (disabled || !label) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      computePosition();
      setIsVisible(true);
    }, delay);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const setRef = (node: HTMLElement | null) => {
    anchorRef.current = node;
  };

  const child = children as React.ReactElement<any>;

  const translateByPlacement: Record<TooltipPlacement, string> = {
    top: "translate(-50%, -100%)",
    bottom: "translate(-50%, 0)",
    left: "translate(-100%, -50%)",
    right: "translate(0, -50%)",
  };

  const initialOffset: Record<TooltipPlacement, { x: number; y: number }> = {
    top: { x: 0, y: 4 },
    bottom: { x: 0, y: -4 },
    left: { x: 4, y: 0 },
    right: { x: -4, y: 0 },
  };

  const existingRef = (child as any).ref;

  const clonedChild = cloneElement(child, {
    onMouseEnter: (e: React.MouseEvent) => {
      child.props.onMouseEnter?.(e);
      show();
    },
    onMouseLeave: (e: React.MouseEvent) => {
      child.props.onMouseLeave?.(e);
      hide();
    },
    onFocus: (e: React.FocusEvent) => {
      child.props.onFocus?.(e);
      show();
    },
    onBlur: (e: React.FocusEvent) => {
      child.props.onBlur?.(e);
      hide();
    },
    "aria-describedby": isVisible ? tooltipId : undefined,
    ref: (node: HTMLElement | null) => {
      setRef(node);
      if (typeof existingRef === "function") existingRef(node);
      else if (existingRef && typeof existingRef === "object") {
        (existingRef as React.MutableRefObject<HTMLElement | null>).current = node;
      }
    },
  } as any);

  return (
    <>
      {clonedChild}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isVisible && (
              <motion.span
                id={tooltipId}
                role="tooltip"
                initial={{ opacity: 0, x: initialOffset[placement].x, y: initialOffset[placement].y, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: "fixed",
                  top: coords.top,
                  left: coords.left,
                  transform: translateByPlacement[placement],
                  zIndex: 9999,
                }}
                className={cn(
                  "pointer-events-none whitespace-nowrap rounded-lg bg-slate-900/95 px-2.5 py-1.5 text-xs font-medium text-white shadow-glass-lg backdrop-blur",
                )}
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
};

export default Tooltip;
