import { CheckBadgeIcon } from "@/assets/icons";

interface VerifiedBadgeProps {
  label: string;
  iconSize?: number;  // Optional to adjust icon size
  className?: string; // Optional to customize styles
}

const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ label, iconSize = 16, className = '' }) => (
  <span
    className={`flex items-center gap-1 text-sm text-blue-600 border border-blue-300 rounded-full px-2 py-0.5 ${className}`}
  >
    <CheckBadgeIcon className={`h-${iconSize} w-${iconSize}`} />
    <span>{label}</span>
  </span>
);

export default VerifiedBadge;
