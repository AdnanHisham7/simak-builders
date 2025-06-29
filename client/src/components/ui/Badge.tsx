interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "error" | "info" | "default";
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = "default",
}) => {
  const variantClasses = {
    default: "bg-yellow-50 text-yellow-700",
    success: "bg-green-50 text-green-700",
    error: "bg-red-50 text-red-700",
    info: "bg-blue-50 text-blue-700",
  };

  return (
    <span
      className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
