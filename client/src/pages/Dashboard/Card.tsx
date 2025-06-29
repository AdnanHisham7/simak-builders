// File: src/components/ui/Card.jsx
import { motion } from 'framer-motion';

export default function Card({ children, className }:any) {
  return (
    <motion.div 
      className={`bg-white rounded-lg border border-gray-200 p-4 sm:p-6 ${className}`}
      whileHover={{ y: -2, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100 }}
    >
      {children}
    </motion.div>
  );
}