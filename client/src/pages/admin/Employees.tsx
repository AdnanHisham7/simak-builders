import React, { useEffect, useState, useMemo } from "react";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getAttendanceByEmployee,
  calculateSalary,
  markAttendancesPaid,
  Employee,
} from "@/services/employeeService";

interface EmployeeFormData {
  name: string;
  email: string;
  phone: string;
  position: string;
  dailyWage: number;
}

interface Attendance {
  id: string;
  site: { id: string; name: string };
  date: string;
  status: number;
  dailyWage: number;
  isPaid: boolean;
  markedBy: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: "",
    email: "",
    phone: "",
    position: "",
    dailyWage: 0,
  });

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [positionFilter, setPositionFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<"name" | "email" | "position">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [isAttendanceModalOpen, setIsAttendanceModalOpen] =
    useState<boolean>(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null
  );
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<
    string | null
  >(null);
  const [attendanceData, setAttendanceData] = useState<Attendance[] | null>(
    null
  );
  const [attendanceLoading, setAttendanceLoading] = useState<boolean>(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [totalSalary, setTotalSalary] = useState<number | null>(null);
  const [attendanceIds, setAttendanceIds] = useState<string[]>([]);
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "unpaid">(
    "all"
  );
  const [searchTermAttendance, setSearchTermAttendance] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (isAttendanceModalOpen && selectedEmployeeId) {
      fetchAttendance(selectedEmployeeId);
    }
  }, [isAttendanceModalOpen, selectedEmployeeId]);

  useEffect(() => {
    if (isModalOpen || isAttendanceModalOpen) {
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
    }
  }, [isModalOpen, isAttendanceModalOpen]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await getEmployees();
      setEmployees(data);
    } catch (err) {
      setError("Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async (employeeId: string) => {
    setAttendanceLoading(true);
    setAttendanceError(null);
    try {
      const data = await getAttendanceByEmployee(employeeId);
      setAttendanceData(data);
    } catch (err) {
      setAttendanceError("Failed to fetch attendance data");
    } finally {
      setAttendanceLoading(false);
    }
  };

  const uniquePositions = useMemo(() => {
    return Array.from(new Set(employees.map((emp) => emp.position))).sort();
  }, [employees]);

  const filteredAndSortedEmployees = useMemo(() => {
    let filtered = employees.filter((employee) => {
      const matchesSearch =
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.phone.includes(searchTerm);
      const matchesPosition =
        !positionFilter || employee.position === positionFilter;
      return matchesSearch && matchesPosition;
    });

    filtered.sort((a, b) => {
      const aValue = a[sortBy].toLowerCase();
      const bValue = b[sortBy].toLowerCase();
      return sortOrder === "asc"
        ? aValue < bValue
          ? -1
          : 1
        : aValue > bValue
        ? -1
        : 1;
    });

    return filtered;
  }, [employees, searchTerm, positionFilter, sortBy, sortOrder]);

  const openCreateModal = () => {
    setIsEditMode(false);
    setFormData({ name: "", email: "", phone: "", position: "", dailyWage: 0 });
    setIsModalOpen(true);
  };

  const openEditModal = (employee: Employee) => {
    setIsEditMode(true);
    setCurrentEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      position: employee.position,
      dailyWage: employee.dailyWage,
    });
    setIsModalOpen(true);
  };

  const openAttendanceModal = (employee: Employee) => {
    setSelectedEmployeeId(employee.id);
    setSelectedEmployeeName(employee.name);
    setIsAttendanceModalOpen(true);
    setTotalSalary(null);
    setAttendanceIds([]);
  };

  const closeModal = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsModalOpen(false);
      setCurrentEmployee(null);
    }, 200);
  };

  const closeAttendanceModal = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsAttendanceModalOpen(false);
      setSelectedEmployeeId(null);
      setSelectedEmployeeName(null);
      setAttendanceData(null);
      setAttendanceError(null);
      setTotalSalary(null);
      setAttendanceIds([]);
      setEndDate("");
      setStartDate("");
      setPaymentFilter("all");
      setSearchTermAttendance("");
    }, 200);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "dailyWage" ? Number(value) : value,
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditMode && currentEmployee) {
        await updateEmployee(currentEmployee.id, formData);
      } else {
        await createEmployee(formData);
      }
      closeModal();
      fetchEmployees();
    } catch (err) {
      setError("Operation failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        await deleteEmployee(id);
        fetchEmployees();
      } catch (err) {
        setError("Failed to delete employee");
      }
    }
  };

  const handleCalculateSalary = async () => {
    if (!startDate || !endDate || !selectedEmployeeId) return;
    try {
      const { totalSalary, attendanceIds } = await calculateSalary(
        selectedEmployeeId,
        startDate,
        endDate
      );
      setTotalSalary(totalSalary);
      setAttendanceIds(attendanceIds);
    } catch (err) {
      setAttendanceError("Failed to calculate salary");
    }
  };

  const handleConfirmPayment = async () => {
    if (!attendanceIds.length) return;
    try {
      await markAttendancesPaid(attendanceIds);
      setTotalSalary(null);
      setAttendanceIds([]);
      fetchAttendance(selectedEmployeeId!);
    } catch (err) {
      setAttendanceError("Failed to mark attendances as paid");
    }
  };

  const handleSort = (field: "name" | "email" | "position") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: "name" | "email" | "position") => {
    if (sortBy !== field) return "↕️";
    return sortOrder === "asc" ? "↑" : "↓";
  };

  const getStatusBadge = (status: number) => {
    const percentage = (status * 100).toFixed(0);
    const color =
      status === 1
        ? "bg-green-100 text-green-800 border-green-200"
        : status === 0
        ? "bg-red-100 text-red-800 border-red-200"
        : "bg-blue-100 text-blue-800 border-blue-200";
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full border ${color}`}
      >
        {percentage}%
      </span>
    );
  };

  const filteredAttendanceData = useMemo(() => {
    if (!attendanceData) return [];
    let filtered = attendanceData;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filtered = filtered.filter((record) => {
        const recordDate = new Date(record.date);
        return recordDate >= start && recordDate <= end;
      });
    }

    if (paymentFilter === "paid") {
      filtered = filtered.filter((record) => record.isPaid);
    } else if (paymentFilter === "unpaid") {
      filtered = filtered.filter((record) => !record.isPaid);
    }

    if (searchTermAttendance) {
      const lowerSearch = searchTermAttendance.toLowerCase();
      filtered = filtered.filter(
        (record) =>
          record.site.name.toLowerCase().includes(lowerSearch) ||
          new Date(record.date)
            .toLocaleDateString()
            .toLowerCase()
            .includes(lowerSearch) ||
          record.markedBy.name.toLowerCase().includes(lowerSearch)
      );
    }

    return filtered;
  }, [attendanceData, startDate, endDate, paymentFilter, searchTermAttendance]);

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl" />
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-6">
        {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Employee Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your team members and track their attendance
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-medium flex items-center space-x-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span>Add Employee</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-8">
          {/* <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl" /> */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Employees
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Position
              </label>
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">All Positions</option>
                {uniquePositions.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setPositionFilter("");
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredAndSortedEmployees.length} of {employees.length}{" "}
              employees
            </span>
            <span>Total Positions: {uniquePositions.length}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {filteredAndSortedEmployees.length === 0 ? (
            <div className="p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No employees found
              </h3>
              <p className="mt-2 text-gray-500">
                {searchTerm || positionFilter
                  ? "Try adjusting your search criteria or filters."
                  : "Get started by adding your first employee."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Name</span>
                        <span className="text-gray-400">
                          {getSortIcon("name")}
                        </span>
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                      onClick={() => handleSort("email")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Email</span>
                        <span className="text-gray-400">
                          {getSortIcon("email")}
                        </span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                      onClick={() => handleSort("position")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Position</span>
                        <span className="text-gray-400">
                          {getSortIcon("position")}
                        </span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedEmployees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div
                              className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium text-sm"
                              title={`Total Paid Salary: $${(
                                employee.totalPaidSalary || 0
                              ).toFixed(2)}`}
                            >
                              {employee.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {employee.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {employee.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {employee.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                          {employee.position}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => openAttendanceModal(employee)}
                            className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-xs font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                          >
                            📊 Attendance
                          </button>
                          <button
                            onClick={() => openEditModal(employee)}
                            className="px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-lg text-xs font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(employee.id)}
                            className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg text-xs font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            <div
              className={`relative bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-200 transform overflow-hidden w-full max-w-md ${
                isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl" />
              <div className="p-6 mt-2">
                <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {isEditMode ? "✏️ Edit Employee" : "➕ Add Employee"}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Position
                    </label>
                    <input
                      type="text"
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter job position"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Daily Wage
                    </label>
                    <input
                      type="number"
                      name="dailyWage"
                      value={formData.dailyWage}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter daily wage"
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleFormSubmit}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105 font-medium"
                    >
                      {isEditMode ? "Update Employee" : "Create Employee"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {isAttendanceModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            <div
              className={`relative bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-200 transform overflow-hidden w-full max-w-6xl max-h-[90vh] ${
                isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl" />
              <div className="p-6 mt-2 overflow-y-auto max-h-[calc(90vh-2rem)]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    📊 Attendance Records for {selectedEmployeeName}
                  </h2>
                  <button
                    onClick={closeAttendanceModal}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={handleCalculateSalary}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium"
                      >
                        Calculate Salary
                      </button>
                    </div>
                  </div>
                  {totalSalary !== null && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                      <p className="text-green-800">
                        Total Salary: ${totalSalary.toFixed(2)}
                      </p>
                      <button
                        onClick={handleConfirmPayment}
                        className="mt-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 font-medium"
                      >
                        Confirm Payment
                      </button>
                    </div>
                  )}
                </div>

                <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by Payment Status
                    </label>
                    <select
                      value={paymentFilter}
                      onChange={(e) =>
                        setPaymentFilter(
                          e.target.value as "all" | "paid" | "unpaid"
                        )
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="all">All</option>
                      <option value="paid">Paid</option>
                      <option value="unpaid">Unpaid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Attendance
                    </label>
                    <input
                      type="text"
                      value={searchTermAttendance}
                      onChange={(e) => setSearchTermAttendance(e.target.value)}
                      placeholder="Search by site, date, or marked by"
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Showing {filteredAttendanceData.length} records
                </p>

                {attendanceLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">
                      Loading attendance data...
                    </span>
                  </div>
                ) : attendanceError ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-red-800">{attendanceError}</p>
                  </div>
                ) : filteredAttendanceData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Site
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Daily Wage
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Paid
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Paid At
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Marked By
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredAttendanceData.map((record) => (
                          <tr key={record.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {record.site.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {new Date(record.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(record.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              ${record.dailyWage}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {record.isPaid ? "Yes" : "No"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {record.isPaid
                                ? new Date(record.updatedAt).toLocaleString()
                                : "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {record.markedBy.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {new Date(record.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-gray-500">
                      No attendance records found.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Employees;
