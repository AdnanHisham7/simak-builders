// MarkAttendanceModal.tsx
import React, { useState, useEffect } from "react";
import { getEmployees } from "@/services/employeeService";
import {
  markAttendance,
  getEmployeesWithAttendance,
} from "@/services/attendanceService";
import { Calendar, Clipboard, Search, User, Users } from "lucide-react";

interface MarkAttendanceModalProps {
  siteId: string;
  onClose: () => void;
  onAttendanceMarked: () => void;
}

const MarkAttendanceModal: React.FC<MarkAttendanceModalProps> = ({
  siteId,
  onClose,
  onAttendanceMarked,
}) => {
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>(
    []
  );
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState<number>(1); // Default to FullDay (100%)
  const [error, setError] = useState<string | null>(null);
  const [employeesWithAttendance, setEmployeesWithAttendance] = useState<
    string[]
  >([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Define status options with labels and corresponding values
  const statusOptions = [
    { label: "FullDay (100%)", value: 1 },
    { label: "90%", value: 0.9 },
    { label: "80%", value: 0.8 },
    { label: "70%", value: 0.7 },
    { label: "60%", value: 0.6 },
    { label: "50%", value: 0.5 },
    { label: "40%", value: 0.4 },
    { label: "30%", value: 0.3 },
    { label: "20%", value: 0.2 },
    { label: "10%", value: 0.1 },
    { label: "0% (Absent)", value: 0 },
  ];

  // Animation effect on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Fetch all employees when the modal mounts
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await getEmployees();
        setEmployees(data);
      } catch (err) {
        setError("Failed to fetch employees");
      }
    };
    fetchEmployees();
  }, [siteId]);

  // Fetch employees with attendance whenever siteId or date changes
  useEffect(() => {
    const fetchEmployeesWithAttendance = async () => {
      try {
        const data = await getEmployeesWithAttendance(siteId, date);
        setEmployeesWithAttendance(data);
      } catch (err) {
        console.error("Failed to fetch employees with attendance:", err);
        setError("Failed to fetch attendance data");
      }
    };
    fetchEmployeesWithAttendance();
  }, [siteId, date]);

  // Filter employees to exclude those with attendance records and apply search
  const filteredEmployees = employees
    .filter((emp) => !employeesWithAttendance.includes(emp.id))
    .filter((emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 200);
  };

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (selectedEmployees.length === 0) {
      setError("Please select at least one employee");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await Promise.all(
        selectedEmployees.map((employeeId) =>
          markAttendance(employeeId, siteId, date, status)
        )
      );
      onAttendanceMarked();
      handleClose();
    } catch (err) {
      setError(
        "Failed to mark attendance for some employees. Some may already have attendance marked for this date."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: number) => {
    if (status === 1) return "from-green-500 to-emerald-600";
    if (status === 0) return "from-red-500 to-rose-600";
    return "from-blue-500 to-indigo-600";
  };

  const getStatusIcon = (status: number) => {
    if (status === 1) return "✓";
    if (status === 0) return "✗";
    return "⧗";
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className={`relative bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300 transform overflow-hidden w-full max-w-2xl max-h-[90vh] ${
          isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient header background */}
        <div
          className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${getStatusColor(
            status
          )} rounded-t-2xl transition-all duration-300`}
        />

        {/* Header */}
        <div className="relative px-8 pt-8 pb-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getStatusColor(
                  status
                )} flex items-center justify-center text-white text-xl font-bold shadow-lg`}
              >
                {getStatusIcon(status)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Mark Attendance
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Select employees and mark their attendance status
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200 group"
            >
              <span className="text-gray-500 group-hover:text-gray-700 text-xl">
                ×
              </span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
              <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">!</span>
              </div>
              <div>
                <h4 className="text-red-800 font-medium">Error</h4>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Date and Status Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <Calendar className="w-4 h-4" /> Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50 focus:bg-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <Clipboard className="w-4 h-4" /> Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50 focus:bg-white"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Employee Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <Users className="w-4 h-4" /> Select Employees
              </label>
              <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {selectedEmployees.length} of {filteredEmployees.length}{" "}
                selected
              </span>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50 focus:bg-white"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Search className="w-4 h-4" />
              </div>
            </div>

            {/* Select All Checkbox */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={
                    selectedEmployees.length === filteredEmployees.length &&
                    filteredEmployees.length > 0
                  }
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSelectedEmployees(
                      checked ? filteredEmployees.map((emp) => emp.id) : []
                    );
                  }}
                  className="w-5 h-5 rounded-lg border-2 border-blue-300 text-blue-600 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
                <span className="ml-3 text-sm font-medium text-blue-800 group-hover:text-blue-900 transition-colors duration-200">
                  Select All Available Employees
                </span>
              </label>
            </div>

            {/* Employee List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {filteredEmployees.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2 flex justify-center">
                    <User className="w-10 h-10" />
                  </div>
                  <p>No employees available for attendance</p>
                  <p className="text-sm mt-1">
                    All employees may already have attendance marked for this
                    date
                  </p>
                </div>
              ) : (
                filteredEmployees.map((emp) => (
                  <label
                    key={emp.id}
                    className="flex items-center p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-all duration-200 border border-transparent hover:border-gray-200 group"
                  >
                    <input
                      type="checkbox"
                      value={emp.id}
                      checked={selectedEmployees.includes(emp.id)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSelectedEmployees((prev) =>
                          checked
                            ? [...prev, emp.id]
                            : prev.filter((id) => id !== emp.id)
                        );
                      }}
                      className="w-5 h-5 rounded-lg border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    />
                    <div className="ml-3 flex items-center space-x-3 flex-1">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                        {emp.name}
                      </span>
                    </div>
                    {selectedEmployees.includes(emp.id) && (
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{selectedEmployees.length}</span>{" "}
              employees selected
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading || selectedEmployees.length === 0}
                className={`px-8 py-3 bg-gradient-to-r ${getStatusColor(
                  status
                )} text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Marking...</span>
                  </>
                ) : (
                  <>
                    <span>{getStatusIcon(status)}</span>
                    <span>Mark Attendance</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkAttendanceModal;
