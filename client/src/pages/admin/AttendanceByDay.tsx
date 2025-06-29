import React, { useState, useEffect } from "react";

type AttendanceRecord = {
  employeeName: string;
  status: "Present" | "Absent" | string;
};

interface AttendanceByDayProps {
  selectedDate: string;
  selectedDayAttendance: AttendanceRecord[] | null;
  formatDate: (date: string) => string;
  onClose: () => void;
}

const AttendanceByDay: React.FC<AttendanceByDayProps> = ({
  selectedDate,
  selectedDayAttendance,
  formatDate,
  onClose,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "All" | "Present" | "HalfDay"
  >("All");

  useEffect(() => {
    if (selectedDate) {
      setIsAnimating(true);
    }
  }, [selectedDate]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  if (!selectedDate) return null;

  // Filter attendance records based on search and status filter
  const filteredAttendance =
    selectedDayAttendance?.filter((record) => {
      const matchesSearch = record.employeeName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === "All" || record.status === filterStatus;
      return matchesSearch && matchesStatus;
    }) || [];

  // Get attendance statistics
  const presentCount =
    selectedDayAttendance?.filter((r) => r.status === "Present").length || 0;
  const halfDayCount =
    selectedDayAttendance?.filter((r) => r.status === "HalfDay").length || 0;
  const totalCount = selectedDayAttendance?.length || 0;
  const attendanceRate =
    totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  const getStatusIcon = (status: string) => {
    if (status === "Present") {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4"
      onClick={handleClose}
    >
      <div
        className={`relative bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300 transform overflow-hidden w-full max-w-2xl max-h-[90vh] flex flex-col ${
          isAnimating
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient header background */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl" />

        {/* Header Section */}
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                Daily Attendance
              </h3>
              <p className="text-gray-600 flex items-center">
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {formatDate(selectedDate)}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 group"
            >
              <svg
                className="w-6 h-6 text-gray-400 group-hover:text-gray-600"
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
        </div>

        {/* Stats Cards */}
        {selectedDayAttendance && selectedDayAttendance.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {presentCount}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    Present
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {halfDayCount}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    Half Day
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {attendanceRate}%
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    Rate
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter Section */}
        {selectedDayAttendance && selectedDayAttendance.length > 0 && (
          <div className="px-6 py-4 border-b border-gray-200 space-y-3">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
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
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="flex space-x-2">
              {["All", "Present", "Absent"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status as any)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                    filterStatus === status
                      ? "bg-blue-100 text-blue-800 border border-blue-300"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto">
          {selectedDayAttendance === null ? (
            <div className="flex flex-col justify-center items-center py-12">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 absolute top-0 left-0"></div>
              </div>
              <p className="mt-4 text-gray-600 font-medium">
                Loading attendance data...
              </p>
              <p className="text-sm text-gray-400">
                Please wait while we fetch the records
              </p>
            </div>
          ) : filteredAttendance.length > 0 ? (
            <div className="p-6">
              <div className="space-y-3">
                {filteredAttendance.map((record, index) => (
                  <div
                    key={index}
                    className="group flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-gray-300 transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {record.employeeName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                          {record.employeeName}
                        </p>
                        <p className="text-sm text-gray-500">Employee</p>
                      </div>
                    </div>
                    <div
                      className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium shadow-sm ${
                        record.status === "Present"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {getStatusIcon(record.status)}
                      <span>{record.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : selectedDayAttendance.length === 0 ? (
            <div className="flex flex-col justify-center items-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
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
              </div>
              <p className="text-gray-600 font-medium">No attendance records</p>
              <p className="text-sm text-gray-400">
                No data available for this day
              </p>
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
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
              <p className="text-gray-600 font-medium">No results found</p>
              <p className="text-sm text-gray-400">
                Try adjusting your search or filter
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {filteredAttendance.length > 0 && (
              <>
                Showing {filteredAttendance.length} of{" "}
                {selectedDayAttendance?.length || 0} records
              </>
            )}
          </div>
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceByDay;
