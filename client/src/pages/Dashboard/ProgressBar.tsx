// File: src/components/ui/ProgressBar.jsx
import { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";

export default function ProgressBar({
  percentage,
  height = 2,
  className,
}: any) {
  const controls = useAnimation();
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (isInView) {
      controls.start({
        width: `${percentage}%`,
        transition: { duration: 0.8, ease: "easeOut" },
      });
    }
  }, [controls, isInView, percentage]);

  return (
    <div
      className={`h-${height} bg-gray-200 rounded-full overflow-hidden ${className}`}
    >
      <motion.div
        className="h-full bg-green-500"
        initial={{ width: 0 }}
        animate={controls}
        onViewportEnter={() => setIsInView(true)}
      />
    </div>
  );
}
