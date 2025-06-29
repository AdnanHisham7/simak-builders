// File: src/components/ui/ProjectCard.tsx
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

interface Project {
  title: string;
  status: 'In Progress' | 'pending' | 'completed';
  description: string;
  updated: string;
}

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const statusColors: Record<Project['status'], string> = {
    'In Progress': 'bg-blue-100 text-blue-700',
    pending: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
  };

  return (
    <motion.div
      className="pb-4 border-b border-gray-100 last:border-0"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
      whileHover={{ x: 2 }}
    >
      <div className="flex justify-between mb-1">
        <div className="flex items-center">
          <Calendar size={16} className="text-green-500 mr-2" />
          <h4 className="font-medium">{project.title}</h4>
        </div>
        <span className={`${statusColors[project.status]} text-xs px-2 py-1 rounded`}>
          {project.status}
        </span>
      </div>
      <p className="text-sm text-gray-500">{project.description}</p>
      <p className="text-xs text-gray-400 mt-1">{project.updated}</p>
    </motion.div>
  );
}
