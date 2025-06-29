// SelectUserModal.tsx
import React, { useEffect, useState } from "react";
import { getUsersByRole, User } from "@/services/userService";

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
          (user) => !excludedIds.includes(user.id)
        );
        setUsers(availableUsers);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch users");
        setLoading(false);
      }
    };
    fetchUsers();
  }, [role, excludedIds]);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-xl font-bold mb-4">
          Select {role.charAt(0).toUpperCase() + role.slice(1)}
        </h2>
        <ul className="max-h-60 overflow-y-auto mb-4">
          {users.map((user) => (
            <li
              key={user.id}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => onSelect(user)}
            >
              {user.name} ({user.email})
            </li>
          ))}
        </ul>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default SelectUserModal;
