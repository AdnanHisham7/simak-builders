// File: src/components/ui/LeadCard.jsx
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

export default function LeadCard({ lead }:any) {
  return (
    <motion.div 
      className="pb-4 border-b border-gray-100 last:border-0"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
      whileHover={{ x: 2 }}
    >
      <div className="flex mb-1">
        <Calendar size={16} className="text-green-500 mr-2" />
        <h4 className="font-medium">{lead.title}</h4>
      </div>
      <p className="text-sm text-gray-500">Client: {lead.client}</p>
      <div className="flex justify-between mt-1">
        <p className="text-xs text-gray-400">{lead.time}</p>
        <p className="text-xs font-medium">{lead.budget}</p>
      </div>
    </motion.div>
  );
}