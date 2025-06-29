import { BellIcon } from "@heroicons/react/24/outline";

interface NotificationBellProps {
  count?: number;
  onClick?: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  count = 0,
  onClick,
}) => {
  return (
    <div className="relative cursor-pointer" onClick={onClick}>
      <BellIcon className="h-6 w-6 text-gray-600 hover:text-gray-800 transition-colors" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </div>
  );
};

export default NotificationBell;
