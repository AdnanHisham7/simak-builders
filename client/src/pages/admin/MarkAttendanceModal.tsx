import { useState, useEffect } from "react";
import { getEmployees } from "@/services/employeeService";
import { markAttendance, getEmployeesWithAttendance } from "@/services/attendanceService";
import { Calendar, Clipboard, Search, User, Users, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";

interface MarkAttendanceModalProps {
  siteId: string;
  onClose: () => void;
  onAttendanceMarked: () => void;
}

const statusOptions = [
  { label: "Full day (100%)", value: 1 },
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

const getStatusIcon = (status: number) => {
  if (status === 1) return CheckCircle2;
  if (status === 0) return XCircle;
  return Clock;
};

const MarkAttendanceModal: React.FC<MarkAttendanceModalProps> = ({
  siteId,
  onClose,
  onAttendanceMarked,
}) => {
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [employeesWithAttendance, setEmployeesWithAttendance] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  useEffect(() => {
    const fetchEmployeesWithAttendance = async () => {
      try {
        const data = await getEmployeesWithAttendance(siteId, date);
        setEmployeesWithAttendance(data);
      } catch (err) {
        setError("Failed to fetch attendance data");
      }
    };
    fetchEmployeesWithAttendance();
  }, [siteId, date]);

  const filteredEmployees = employees
    .filter((emp) => !employeesWithAttendance.includes(emp.id))
    .filter((emp) => emp.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSubmit = async () => {
    if (selectedEmployees.length === 0) {
      setError("Please select at least one employee");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await Promise.all(
        selectedEmployees.map((employeeId) =>
          markAttendance(employeeId, siteId, date, status),
        ),
      );
      onAttendanceMarked();
      onClose();
    } catch (err) {
      setError(
        "Failed to mark attendance for some employees. Some may already have attendance marked for this date.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const StatusIcon = getStatusIcon(status);

  return (
    <Modal
      isOpen
      onClose={onClose}
      disableClose={isLoading}
      closeOnOverlayClick={!isLoading}
      size="lg"
      title="Mark Attendance"
      description="Select employees and mark their attendance status"
      footer={
        <div className="flex w-full items-center justify-between">
          <p className="text-sm text-console-muted">
            <span className="font-medium text-console-text">{selectedEmployees.length}</span>{" "}
            employees selected
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={isLoading}
              disabled={selectedEmployees.length === 0}
            >
              {!isLoading && <StatusIcon size={15} />}
              Mark attendance
            </Button>
          </div>
        </div>
      }
    >
      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-console border border-danger-100 bg-danger-50 p-4">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger-600" />
          <div>
            <h4 className="text-sm font-medium text-danger-800">Error</h4>
            <p className="mt-0.5 text-sm text-danger-600">{error}</p>
          </div>
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-console-text">
            <Calendar size={15} /> Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-console-text">
            <Clipboard size={15} /> Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(Number(e.target.value))}
            className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-sm font-medium text-console-text">
            <Users size={15} /> Select employees
          </label>
          <span className="rounded-full bg-console-bg px-3 py-1 text-xs text-console-muted">
            {selectedEmployees.length} of {filteredEmployees.length} selected
          </span>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-console-muted" size={15} />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-console-border py-2.5 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-console border border-info-100 bg-info-50 p-4">
          <input
            type="checkbox"
            checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
            onChange={(e) => {
              const checked = e.target.checked;
              setSelectedEmployees(checked ? filteredEmployees.map((emp) => emp.id) : []);
            }}
            className="h-4 w-4 rounded border-info-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm font-medium text-info-800">Select all available employees</span>
        </label>

        <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
          {filteredEmployees.length === 0 ? (
            <EmptyState
              icon={User}
              title="No employees available"
              description="All employees may already have attendance marked for this date."
            />
          ) : (
            filteredEmployees.map((emp) => (
              <label
                key={emp.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent p-3 transition-colors hover:border-console-border hover:bg-console-bg"
              >
                <input
                  type="checkbox"
                  checked={selectedEmployees.includes(emp.id)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSelectedEmployees((prev) =>
                      checked ? [...prev, emp.id] : prev.filter((id) => id !== emp.id),
                    );
                  }}
                  className="h-4 w-4 rounded border-console-border text-brand-600 focus:ring-brand-500"
                />
                <div className="flex flex-1 items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800">
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-console-text">{emp.name}</span>
                </div>
                {selectedEmployees.includes(emp.id) && (
                  <CheckCircle2 size={18} className="text-success-600" />
                )}
              </label>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};

export default MarkAttendanceModal;
