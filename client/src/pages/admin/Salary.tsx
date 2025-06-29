import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  listSalaries,
  verifySalaryAssignment,
  updateFixedSalary,
  updateSalaryAssignmentAmount,
  UserWithSalary,
} from "@/services/userService";

const Salary: React.FC = () => {
  const [users, setUsers] = useState<UserWithSalary[]>([]);
  const [fixedSalaries, setFixedSalaries] = useState<{ [key: string]: number }>(
    {}
  );
  const [editableAmounts, setEditableAmounts] = useState<{
    [key: string]: number;
  }>({});
  const [loadingStates, setLoadingStates] = useState<{
    [key: string]: boolean;
  }>({});
  const [expandedUsers, setExpandedUsers] = useState<{
    [key: string]: boolean;
  }>({});
  const userType = useSelector((state: RootState) => state.auth.userType);

  useEffect(() => {
    if (userType === "admin") {
      listSalaries().then((data) => setUsers(data));
    }
  }, [userType]);

  const calculateTotalToBePaid = (salaryAssignments: SalaryAssignment[]) => {
    return salaryAssignments
      .filter((sa) => !sa.isVerified)
      .reduce((sum, sa) => sum + sa.amount, 0);
  };

  const handleSaveFixedSalary = async (userId: string) => {
    const fixedSalary = fixedSalaries[userId];
    if (fixedSalary !== undefined) {
      setLoadingStates((prev) => ({ ...prev, [`fixed-${userId}`]: true }));
      try {
        await updateFixedSalary(userId, fixedSalary);
        const updatedUsers = await listSalaries();
        setUsers(updatedUsers);
        setFixedSalaries((prev) => ({ ...prev, [userId]: undefined }));
      } finally {
        setLoadingStates((prev) => ({ ...prev, [`fixed-${userId}`]: false }));
      }
    }
  };

  const handleSaveAmount = async (
    userId: string,
    assignmentId: string,
    amount: number
  ) => {
    setLoadingStates((prev) => ({ ...prev, [`save-${assignmentId}`]: true }));
    try {
      await updateSalaryAssignmentAmount(userId, assignmentId, amount);
      const updatedUsers = await listSalaries();
      setUsers(updatedUsers);
      setEditableAmounts((prev) => ({ ...prev, [assignmentId]: undefined }));
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        [`save-${assignmentId}`]: false,
      }));
    }
  };

  const handleVerifySalary = async (
    userId: string,
    assignmentId: string,
    originalAmount: number
  ) => {
    // Check for unsaved changes
    if (
      editableAmounts[assignmentId] !== undefined &&
      editableAmounts[assignmentId] !== originalAmount
    ) {
      alert("Please save the changes before verifying.");
      return;
    }

    setLoadingStates((prev) => ({ ...prev, [`verify-${assignmentId}`]: true }));
    try {
      await verifySalaryAssignment(userId, assignmentId);
      const updatedUsers = await listSalaries();
      setUsers(updatedUsers);
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        [`verify-${assignmentId}`]: false,
      }));
    }
  };

  const toggleUserExpansion = (userId: string) => {
    setExpandedUsers((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: "from-red-500 to-red-600",
      manager: "from-blue-500 to-blue-600",
      employee: "from-green-500 to-green-600",
      default: "from-gray-500 to-gray-600",
    };
    return colors[role.toLowerCase() as keyof typeof colors] || colors.default;
  };

  if (userType !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-t-2xl" />
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            Only administrators can manage salary information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 mb-8">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl" />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Salary Management
              </h1>
              <p className="text-gray-600">
                Manage employee compensation and verify salary assignments
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-xl font-semibold">
                {users.length} Employees
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {users.map((user, index) => (
            <div
              key={user._id}
              className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-500 transform hover:shadow-3xl hover:-translate-y-1"
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl" />
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">
                        {user.name}
                      </h2>
                      <p className="text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1 rounded-full text-white text-sm font-semibold bg-gradient-to-r ${getRoleColor(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                    <button
                      onClick={() => toggleUserExpansion(user._id)}
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                    >
                      <svg
                        className={`w-5 h-5 transition-transform duration-200 ${
                          expandedUsers[user._id] ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-2xl font-bold text-red-600">
                    To be paid:{" "}
                    {formatCurrency(
                      calculateTotalToBePaid(user.salaryAssignments)
                    )}
                  </p>
                  <p className="text-lg text-green-600">
                    Paid: {formatCurrency(user.totalSalary)}
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700">
                    Fixed Salary
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={
                        fixedSalaries[user._id] !== undefined
                          ? fixedSalaries[user._id]
                          : user.fixedSalary
                      }
                      onChange={(e) =>
                        setFixedSalaries((prev) => ({
                          ...prev,
                          [user._id]: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="block w-32 pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={() => handleSaveFixedSalary(user._id)}
                      disabled={loadingStates[`fixed-${user._id}`]}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                </div>

                <div
                  className={`transition-all duration-300 overflow-hidden ${
                    expandedUsers[user._id]
                      ? "max-h-[2000px] opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                      <svg
                        className="w-5 h-5 mr-2 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Salary History
                    </h3>
                    <div className="space-y-3">
                      {user.salaryAssignments.map((sa) => (
                        <div
                          key={sa._id}
                          className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-600">
                                    Date
                                  </p>
                                  <p className="text-gray-900">
                                    {new Date(sa.date).toLocaleDateString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-600">
                                    Amount
                                  </p>
                                  {sa.isVerified ? (
                                    <p className="text-gray-900 font-semibold">
                                      {formatCurrency(sa.amount)}
                                    </p>
                                  ) : (
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="number"
                                        value={
                                          editableAmounts[sa._id] !== undefined
                                            ? editableAmounts[sa._id]
                                            : sa.amount
                                        }
                                        onChange={(e) =>
                                          setEditableAmounts((prev) => ({
                                            ...prev,
                                            [sa._id]:
                                              parseFloat(e.target.value) || 0,
                                          }))
                                        }
                                        className="block w-32 pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      />
                                      <button
                                        onClick={() =>
                                          handleSaveAmount(
                                            user._id,
                                            sa._id,
                                            editableAmounts[sa._id] || sa.amount
                                          )
                                        }
                                        disabled={
                                          loadingStates[`save-${sa._id}`]
                                        }
                                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                                      >
                                        Save
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-600">
                                    Assigned By
                                  </p>
                                  <p className="text-gray-900">
                                    {sa.givenBy?.name || "auto"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-600">
                                    Status
                                  </p>
                                  <div className="flex items-center">
                                    {sa.isVerified ? (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <svg
                                          className="w-3 h-3 mr-1"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                        Verified
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        <svg
                                          className="w-3 h-3 mr-1"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                        Pending
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            {!sa.isVerified && (
                              <button
                                onClick={() =>
                                  handleVerifySalary(
                                    user._id,
                                    sa._id,
                                    sa.amount
                                  )
                                }
                                disabled={loadingStates[`verify-${sa._id}`]}
                                className="ml-4 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 flex items-center"
                              >
                                {loadingStates[`verify-${sa._id}`] ? (
                                  <svg
                                    className="animate-spin w-4 h-4 mr-2"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    />
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    className="w-4 h-4 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                )}
                                Verify
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No employees found
            </h3>
            <p className="text-gray-500">
              Employee data will appear here once available.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Salary;
