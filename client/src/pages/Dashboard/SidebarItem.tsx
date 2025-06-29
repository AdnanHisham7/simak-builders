import { motion } from "framer-motion";
export default function SidebarItem({
  icon: Icon,
  name,
  active,
  collapsed,
  onClick,
  badge,
}: any) {
  return (
    <motion.div
      className={`
        relative flex items-center cursor-pointer
        ${collapsed ? "justify-center px-3" : "px-4"} 
        ${
          active
            ? "bg-green-50 text-green-700 font-medium"
            : "text-gray-700 hover:bg-gray-50 hover:text-green-600"
        }
        my-1 py-2 rounded-md mx-2 transition-all duration-200 ease-in-out
      `}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Icon size={16} className={collapsed ? "" : "mr-2"} />
      {!collapsed && (
        <div className="flex items-center ml-3 text-sm">
          <span>{name}</span>
          {badge && (
            <span className="ml-2 bg-red-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
      )}

      {/* Active indicator */}
      {active && (
        <motion.div
          className="absolute left-0 w-1 h-4/5 bg-green-600 rounded-l"
          layoutId="activeIndicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </motion.div>
  );
}
