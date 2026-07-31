import { useState } from "react";
import { Search, Calendar, CheckCircle2, XCircle, MinusCircle, Users } from "lucide-react";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import PageLoader from "@/components/ui/PageLoader";
import Badge from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

type AttendanceRecord = {
  employeeName: string;
  status: number;
};

interface AttendanceByDayProps {
  selectedDate: string;
  selectedDayAttendance: AttendanceRecord[] | null;
  formatDate: (date: string) => string;
  onClose: () => void;
}

type StatusFilter = "All" | "Present" | "Partial" | "Absent";

const matchesStatusFilter = (status: number, filter: StatusFilter) => {
  if (filter === "All") return true;
  if (filter === "Present") return status === 1;
  if (filter === "Absent") return status === 0;
  return status > 0 && status < 1;
};

const AttendanceByDay: React.FC<AttendanceByDayProps> = ({
  selectedDate,
  selectedDayAttendance,
  formatDate,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("All");

  if (!selectedDate) return null;

  const filteredAttendance =
    selectedDayAttendance?.filter((record) => {
      const matchesSearch = record.employeeName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesSearch && matchesStatusFilter(record.status, filterStatus);
    }) || [];

  const presentCount = selectedDayAttendance?.filter((r) => r.status === 1).length || 0;
  const partialCount =
    selectedDayAttendance?.filter((r) => r.status > 0 && r.status < 1).length || 0;
  const absentCount = selectedDayAttendance?.filter((r) => r.status === 0).length || 0;
  const totalCount = selectedDayAttendance?.length || 0;
  const attendanceRate =
    totalCount > 0
      ? Math.round(
          (selectedDayAttendance!.reduce((sum, r) => sum + r.status, 0) / totalCount) * 100,
        )
      : 0;

  const statusMeta = (status: number) => {
    if (status === 1) return { label: "100%", variant: "success" as const, icon: CheckCircle2 };
    if (status === 0) return { label: "Absent", variant: "error" as const, icon: XCircle };
    return { label: `${Math.round(status * 100)}%`, variant: "warning" as const, icon: MinusCircle };
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Daily Attendance"
      description={formatDate(selectedDate)}
      size="md"
    >
      {selectedDayAttendance === null ? (
        <PageLoader label="Loading attendance data" fullHeight={false} />
      ) : selectedDayAttendance.length === 0 ? (
        <EmptyState icon={Calendar} title="No attendance records" description="No data available for this day." />
      ) : (
        <>
          <div className="mb-5 grid grid-cols-4 gap-3">
            <div className="rounded-console border border-console-border bg-console-bg p-3 text-center">
              <div className="text-xl font-semibold text-success-700">{presentCount}</div>
              <div className="text-xs uppercase tracking-wide text-console-muted">Present</div>
            </div>
            <div className="rounded-console border border-console-border bg-console-bg p-3 text-center">
              <div className="text-xl font-semibold text-warning-600">{partialCount}</div>
              <div className="text-xs uppercase tracking-wide text-console-muted">Partial</div>
            </div>
            <div className="rounded-console border border-console-border bg-console-bg p-3 text-center">
              <div className="text-xl font-semibold text-danger-600">{absentCount}</div>
              <div className="text-xs uppercase tracking-wide text-console-muted">Absent</div>
            </div>
            <div className="rounded-console border border-console-border bg-console-bg p-3 text-center">
              <div className="text-xl font-semibold text-brand-700">{attendanceRate}%</div>
              <div className="text-xs uppercase tracking-wide text-console-muted">Rate</div>
            </div>
          </div>

          <div className="mb-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-console-muted" size={15} />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-console-border py-2.5 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div className="flex gap-2">
              {(["All", "Present", "Partial", "Absent"] as StatusFilter[]).map((status) => (
                <button
                  type="button"
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                    filterStatus === status
                      ? "bg-brand-50 text-brand-700 ring-1 ring-brand-200"
                      : "bg-console-bg text-console-muted hover:bg-slate-200",
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {filteredAttendance.length > 0 ? (
            <div className="max-h-80 space-y-2.5 overflow-y-auto">
              {filteredAttendance.map((record, index) => {
                const meta = statusMeta(record.status);
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-console border border-console-border p-3.5 transition-colors hover:bg-console-bg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800">
                        {record.employeeName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-console-text">{record.employeeName}</p>
                        <p className="text-xs text-console-muted">Employee</p>
                      </div>
                    </div>
                    <Badge variant={meta.variant}>
                      <meta.icon size={12} />
                      {meta.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={Users} title="No results found" description="Try adjusting your search or filter." />
          )}

          {filteredAttendance.length > 0 && (
            <p className="mt-4 text-sm text-console-muted">
              Showing {filteredAttendance.length} of {selectedDayAttendance.length} records
            </p>
          )}
        </>
      )}
    </Modal>
  );
};

export default AttendanceByDay;
