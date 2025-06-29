import { motion, useMotionValue, animate } from "framer-motion";
import { useEffect, useState } from "react";

export default function StatCard({ title, value, subtitle, icon: Icon }: any) {
  // Extract number and prefix (e.g. ₹)
  const match =
    typeof value === "string" ? value.match(/^([^0-9.-]*)([0-9,.-]+)/) : null;
  const prefix = match ? match[1] : "";
  const numericString = match ? match[2].replace(/,/g, "") : "";
  const numericValue = !isNaN(Number(numericString))
    ? Number(numericString)
    : null;
  const isNumber = numericValue !== null;

  const [displayValue, setDisplayValue] = useState(isNumber ? 0 : value);
  const motionValue = useMotionValue(0);

  useEffect(() => {
    if (isNumber) {
      const controls = animate(motionValue, numericValue!, {
        duration: 1.5,
        onUpdate(latest) {
          const formatted = new Intl.NumberFormat("en-IN").format(
            Math.floor(latest)
          );
          setDisplayValue(`${prefix}${formatted}`);
        },
      });

      return controls.stop;
    } else {
      setDisplayValue(value);
    }
  }, [value]);

  return (
    <motion.div
      className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col"
      whileHover={{
        y: -4,
        boxShadow:
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
    >
      <div className="flex justify-between items-center">
        <h3 className="font-medium">{title}</h3>
        {Icon && <Icon size={16} className="text-gray-400" />}
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <motion.div className="text-3xl font-bold">{displayValue}</motion.div>
        <div className="text-sm text-gray-500">{subtitle}</div>
      </div>
    </motion.div>
  );
}
