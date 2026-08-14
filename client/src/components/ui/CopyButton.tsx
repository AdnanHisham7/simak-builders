import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import Tooltip from "@/components/ui/Tooltip";

interface CopyButtonProps {
  value: string;
  label?: string;
  size?: number;
  className?: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({
  value,
  label = "value",
  size = 12,
  className,
}) => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  return (
    <Tooltip label={copied ? "Copied!" : `Copy ${label.toLowerCase()}`}>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copy ${label.toLowerCase()}`}
        className={cn(
          "relative inline-flex h-4 w-4 items-center justify-center text-console-muted transition-colors hover:text-brand-700",
          className,
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.span
              key="check"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex items-center justify-center text-success-600"
            >
              <Check size={size} />
            </motion.span>
          ) : (
            <motion.span
              key="copy"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Copy size={size} />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </Tooltip>
  );
};

export default CopyButton;
