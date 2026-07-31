import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { getUsersByRole, User } from "@/services/userService";
import Modal from "@/components/ui/Modal";
import PageLoader from "@/components/ui/PageLoader";
import EmptyState from "@/components/ui/EmptyState";

interface SelectUserModalProps {
  role: string;
  excludedIds: string[];
  onSelect: (user: User) => void;
  onClose: () => void;
}

const SelectUserModal: React.FC<SelectUserModalProps> = ({
  role,
  excludedIds,
  onSelect,
  onClose,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsersByRole(role);
        const availableUsers = data.filter(
          (user) => !excludedIds.includes(user.id),
        );
        setUsers(availableUsers);
      } catch (err) {
        setError("Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [role, excludedIds]);

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Select ${role.charAt(0).toUpperCase() + role.slice(1)}`}
      size="sm"
    >
      {loading ? (
        <PageLoader label="Loading users" fullHeight={false} />
      ) : error ? (
        <p className="text-sm text-danger-600">{error}</p>
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="No available users" description="Everyone with this role is already assigned." />
      ) : (
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {users.map((user) => (
            <button
              type="button"
              key={user.id}
              onClick={() => onSelect(user)}
              className="flex w-full flex-col items-start rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-brand-50"
            >
              <span className="text-sm font-medium text-console-text">{user.name}</span>
              <span className="text-xs text-console-muted">{user.email}</span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default SelectUserModal;
