import { useEffect, useState, useMemo } from "react";
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
import MarkEmployeeAttendanceModal from "./MarkEmployeeAttendanceModal";
import { toast } from "sonner";
import {
  Plus,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  BarChart3,
  CalendarCheck,
  Pencil,
  Trash2,
  Users,
  Inbox,
} from "lucide-react";
import { Card, StatCard } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import PageLoader from "@/components/ui/PageLoader";
import { SkeletonStatCards, SkeletonTable } from "@/components/ui/Skeleton";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Tooltip from "@/components/ui/Tooltip";
import CopyButton from "@/components/ui/CopyButton";
import GradientStatCard from "@/components/ui/GradientStatCard";

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

type SortField = "name" | "email" | "position";

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: "",
    email: "",
    phone: "",
    position: "",
    dailyWage: 0,
  });

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [positionFilter, setPositionFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortField>("name");
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
  const [markAttendanceTarget, setMarkAttendanceTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (isAttendanceModalOpen && selectedEmployeeId) {
      fetchAttendance(selectedEmployeeId);
    }
  }, [isAttendanceModalOpen, selectedEmployeeId]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await getEmployees();
      setEmployees(data);
      setPageError(null);
    } catch (err) {
      setPageError("Failed to fetch employees");
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

    filtered = [...filtered].sort((a, b) => {
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
    setIsModalOpen(false);
    setCurrentEmployee(null);
  };

  const closeAttendanceModal = () => {
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
    setIsSubmitting(true);
    try {
      if (isEditMode && currentEmployee) {
        await updateEmployee(currentEmployee.id, formData);
        toast.success("Employee updated");
      } else {
        await createEmployee(formData);
        toast.success("Employee created");
      }
      closeModal();
      fetchEmployees();
    } catch (err) {
      toast.error("Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteEmployee(deleteTarget.id);
      toast.success("Employee deleted");
      setDeleteTarget(null);
      fetchEmployees();
    } catch (err) {
      toast.error("Failed to delete employee");
    } finally {
      setIsDeleting(false);
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
      toast.error("Failed to calculate salary");
    }
  };

  const handleConfirmPayment = async () => {
    if (!attendanceIds.length) return;
    try {
      await markAttendancesPaid(attendanceIds);
      toast.success("Attendances marked as paid");
      setTotalSalary(null);
      setAttendanceIds([]);
      fetchAttendance(selectedEmployeeId!);
    } catch (err) {
      toast.error("Failed to mark attendances as paid");
    }
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return <ArrowUpDown size={13} className="text-console-muted" />;
    return sortOrder === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />;
  };

  const getStatusBadge = (status: number) => {
    const percentage = (status * 100).toFixed(0);
    const variant = status === 1 ? "success" : status === 0 ? "error" : "info";
    return <Badge variant={variant}>{percentage}%</Badge>;
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

  if (pageError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <h3 className="text-lg font-semibold text-console-text">Something went wrong</h3>
          <p className="mt-1 text-sm text-console-muted">{pageError}</p>
          <Button className="mt-5" onClick={fetchEmployees}>
            Try again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-console-text">Employee Management</h1>
          <p className="mt-0.5 text-sm text-console-muted">
            Manage your team members and track their attendance
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus size={16} /> Add employee
        </Button>
      </div>

      {loading ? (
        <div className="space-y-6">
          <SkeletonStatCards count={3} />
          <SkeletonTable />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Total Employees" value={employees.length} icon={Users} />
            <StatCard
              label="Total Daily Wage"
              value={`₹${employees.reduce((sum, e) => sum + (e.dailyWage || 0), 0).toLocaleString()}`}
              icon={BarChart3}
            />
            <GradientStatCard
              label="Total Paid Salary"
              value={employees.reduce((sum, e) => sum + (e.totalPaidSalary || 0), 0)}
              prefix="₹"
              tone="success"
              icon={CalendarCheck}
            />
          </div>

          <Card>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-console-text">
                  Search employees
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-console-muted" size={16} />
                  <input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-console-border py-2.5 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-console-text">
                  Filter by position
                </label>
                <select
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                  className="w-full rounded-lg border border-console-border px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
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
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    setSearchTerm("");
                    setPositionFilter("");
                  }}
                >
                  Clear filters
                </Button>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-console-muted">
              <span>
                Showing {filteredAndSortedEmployees.length} of {employees.length} employees
              </span>
              <span>Total positions: {uniquePositions.length}</span>
            </div>
          </Card>

          <Card>
            {filteredAndSortedEmployees.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No employees found"
                description={
                  searchTerm || positionFilter
                    ? "Try adjusting your search criteria or filters."
                    : "Get started by adding your first employee."
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-console-border">
                  <thead className="bg-console-bg">
                    <tr>
                      <th
                        className="cursor-pointer px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted"
                        onClick={() => handleSort("name")}
                      >
                        <span className="flex items-center gap-1.5">
                          Name <SortIcon field="name" />
                        </span>
                      </th>
                      <th
                        className="cursor-pointer px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted"
                        onClick={() => handleSort("email")}
                      >
                        <span className="flex items-center gap-1.5">
                          Email <SortIcon field="email" />
                        </span>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">
                        Phone
                      </th>
                      <th
                        className="cursor-pointer px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted"
                        onClick={() => handleSort("position")}
                      >
                        <span className="flex items-center gap-1.5">
                          Position <SortIcon field="position" />
                        </span>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-console-muted">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-console-border">
                    {filteredAndSortedEmployees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-console-bg">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800"
                              title={`Total paid salary: ₹${(employee.totalPaidSalary || 0).toLocaleString("en-IN")}`}
                            >
                              {employee.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-console-text">{employee.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-console-muted">
                          <div className="flex items-center gap-2">
                            <span>{employee.email}</span>
                            <CopyButton value={employee.email} label="Email" />
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-console-muted">
                          <div className="flex items-center gap-2">
                            <span>{employee.phone}</span>
                            <CopyButton value={employee.phone} label="Phone" />
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge variant="info">{employee.position}</Badge>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center gap-1">
                            <Tooltip label="View attendance">
                              <button
                                type="button"
                                onClick={() => openAttendanceModal(employee)}
                                aria-label="View attendance"
                                className="rounded-lg p-2 text-console-muted transition-colors hover:bg-success-50 hover:text-success-700"
                              >
                                <BarChart3 size={16} />
                              </button>
                            </Tooltip>
                            <Tooltip label="Mark attendance">
                              <button
                                type="button"
                                onClick={() =>
                                  setMarkAttendanceTarget({ id: employee.id, name: employee.name })
                                }
                                aria-label="Mark attendance"
                                className="rounded-lg p-2 text-console-muted transition-colors hover:bg-info-50 hover:text-info-700"
                              >
                                <CalendarCheck size={16} />
                              </button>
                            </Tooltip>
                            <Tooltip label="Edit employee">
                              <button
                                type="button"
                                onClick={() => openEditModal(employee)}
                                aria-label="Edit employee"
                                className="rounded-lg p-2 text-console-muted transition-colors hover:bg-warning-50 hover:text-warning-700"
                              >
                                <Pencil size={16} />
                              </button>
                            </Tooltip>
                            <Tooltip label="Delete employee">
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(employee)}
                                aria-label="Delete employee"
                                className="rounded-lg p-2 text-console-muted transition-colors hover:bg-danger-50 hover:text-danger-700"
                              >
                                <Trash2 size={16} />
                              </button>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={isEditMode ? "Edit Employee" : "Add Employee"}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-console-text">Full name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder="Enter full name"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-console-text">Email address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder="Enter email address"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-console-text">Phone number</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder="Enter phone number"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-console-text">Position</label>
            <input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleInputChange}
              required
              className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder="Enter job position"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-console-text">Daily wage (₹)</label>
            <input
              type="number"
              name="dailyWage"
              value={formData.dailyWage}
              onChange={handleInputChange}
              required
              min="0"
              className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder="Enter daily wage"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEditMode ? "Update employee" : "Create employee"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isAttendanceModalOpen}
        onClose={closeAttendanceModal}
        title={`Attendance records for ${selectedEmployeeName ?? ""}`}
        size="xl"
      >
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-console-text">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-console-text">End date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={handleCalculateSalary}>
              Calculate salary
            </Button>
          </div>
        </div>

        {totalSalary !== null && (
          <div className="mb-6 rounded-console border border-success-100 bg-success-50 p-4">
            <p className="text-sm font-semibold text-success-700">
              Total salary: ₹{totalSalary.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </p>
            <Button size="sm" variant="secondary" className="mt-3" onClick={handleConfirmPayment}>
              Confirm payment
            </Button>
          </div>
        )}

        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-console-text">
              Filter by payment status
            </label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as "all" | "paid" | "unpaid")}
              className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-console-text">Search attendance</label>
            <input
              type="text"
              value={searchTermAttendance}
              onChange={(e) => setSearchTermAttendance(e.target.value)}
              placeholder="Search by site, date, or marked by"
              className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>
        <p className="mb-4 text-sm text-console-muted">
          Showing {filteredAttendanceData.length} records
        </p>

        {attendanceLoading ? (
          <PageLoader label="Loading attendance data" fullHeight={false} />
        ) : attendanceError ? (
          <div className="rounded-console border border-danger-100 bg-danger-50 p-4 text-sm text-danger-700">
            {attendanceError}
          </div>
        ) : filteredAttendanceData.length > 0 ? (
          <div className="overflow-x-auto rounded-console border border-console-border">
            <table className="min-w-full divide-y divide-console-border">
              <thead className="bg-console-bg">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Site</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Daily Wage</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Paid</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Paid At</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Marked By</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-console-border bg-white">
                {filteredAttendanceData.map((record) => (
                  <tr key={record.id}>
                    <td className="px-4 py-3 text-sm text-console-text">{record.site.name}</td>
                    <td className="px-4 py-3 text-sm text-console-text">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(record.status)}</td>
                    <td className="px-4 py-3 text-sm text-console-text">
                      ₹{record.dailyWage.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-sm text-console-text">
                      {record.isPaid ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-3 text-sm text-console-muted">
                      {record.isPaid ? new Date(record.updatedAt).toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-console-text">{record.markedBy.name}</td>
                    <td className="px-4 py-3 text-sm text-console-muted">
                      {new Date(record.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={Inbox} title="No attendance records found" />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete employee"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`}
        variant="danger"
        confirmText="Delete"
        isLoading={isDeleting}
      />

      {markAttendanceTarget && (
        <MarkEmployeeAttendanceModal
          employeeId={markAttendanceTarget.id}
          employeeName={markAttendanceTarget.name}
          onClose={() => setMarkAttendanceTarget(null)}
          onMarked={() => {
            fetchEmployees();
          }}
        />
      )}
    </div>
  );
};

export default Employees;
