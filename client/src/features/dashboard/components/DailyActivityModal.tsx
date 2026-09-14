import { useEffect, useMemo, useState } from "react";
import { format, isSameDay, subDays } from "date-fns";
import {
  Calendar as CalendarIcon,
  Download,
  Search,
  Filter,
  Users,
  Building,
  Package,
  DollarSign,
  ShoppingCart,
  Briefcase,
  Shield,
  Activity,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  LayoutList,
  Table as TableIcon,
  X,
  Wrench,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import Modal from "@/components/ui/Modal";
import Tooltip from "@/components/ui/Tooltip";
import EmptyState from "@/components/ui/EmptyState";
import {
  ActivityLogItem,
  getAllActivityLogs,
} from "@/services/dashboardService";
import { useCompanyProfile } from "@/hooks/useCompanyProfile";
import { exportDailyActivityPdf } from "./exportDailyActivityPdf";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

interface DailyActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date;
}

const RESOURCE_LABELS: Record<
  string,
  { label: string; icon: any; color: string }
> = {
  site: {
    label: "Sites",
    icon: Building,
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  stock: {
    label: "Stock & Inventory",
    icon: Package,
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  expenseRequest: {
    label: "Expense Requests",
    icon: DollarSign,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  miscellaneousExpense: {
    label: "Misc Expenses",
    icon: DollarSign,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  expense: {
    label: "Expenses",
    icon: DollarSign,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  purchase: {
    label: "Purchases",
    icon: ShoppingCart,
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
  contractor: {
    label: "Contractors",
    icon: Briefcase,
    color: "bg-orange-50 text-orange-700 border-orange-200",
  },
  employee: {
    label: "Employees",
    icon: Users,
    color: "bg-teal-50 text-teal-700 border-teal-200",
  },
  vendor: {
    label: "Vendors",
    icon: ShoppingCart,
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  company: {
    label: "Company Finance",
    icon: Building,
    color: "bg-brand-50 text-brand-700 border-brand-200",
  },
  auth: {
    label: "Security & Login",
    icon: Shield,
    color: "bg-slate-100 text-slate-700 border-slate-200",
  },
  user: {
    label: "User Accounts",
    icon: Users,
    color: "bg-sky-50 text-sky-700 border-sky-200",
  },
};

const ACTION_COLORS: Record<string, string> = {
  create: "bg-emerald-500/10 text-emerald-700 border-emerald-300",
  update: "bg-blue-500/10 text-blue-700 border-blue-300",
  delete: "bg-red-500/10 text-red-700 border-red-300",
  approve: "bg-purple-500/10 text-purple-700 border-purple-300",
  reject: "bg-rose-500/10 text-rose-700 border-rose-300",
  login: "bg-slate-500/10 text-slate-700 border-slate-300",
  logout: "bg-slate-500/10 text-slate-700 border-slate-300",
  attendance: "bg-teal-500/10 text-teal-700 border-teal-300",
};

export const DailyActivityModal = ({
  isOpen,
  onClose,
  initialDate,
}: DailyActivityModalProps) => {
  const navigate = useNavigate();
  const { userType } = useSelector((state: RootState) => state.auth);
  const basePath = userType === "siteManager" ? "siteManager" : "admin";
  const { profile } = useCompanyProfile();
  const [selectedDate, setSelectedDate] = useState<Date>(
    initialDate || new Date(),
  );
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResource, setSelectedResource] = useState<string>("all");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"timeline" | "table">("timeline");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Sync initialDate prop
  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate);
    }
  }, [initialDate]);

  // Fetch activities for selectedDate
  const fetchActivities = async (targetDate: Date) => {
    setLoading(true);
    try {
      // Create local start & end of day in ISO string to avoid timezone shifts
      const start = new Date(targetDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(targetDate);
      end.setHours(23, 59, 59, 999);

      const data = await getAllActivityLogs({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        limit: 1000,
      });

      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to load activity logs for this date");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchActivities(selectedDate);
    }
  }, [isOpen, selectedDate]);

  // Filtered logs based on search, resource, and action
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Resource filter
      if (selectedResource !== "all" && log.resource !== selectedResource) {
        return false;
      }
      // Action filter
      if (selectedAction !== "all" && log.action !== selectedAction) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const detailsMatch = log.details?.toLowerCase().includes(query);
        const userMatch = log.user?.name?.toLowerCase().includes(query);
        const resourceMatch = log.resource?.toLowerCase().includes(query);
        const actionMatch = log.action?.toLowerCase().includes(query);
        if (!detailsMatch && !userMatch && !resourceMatch && !actionMatch) {
          return false;
        }
      }
      return true;
    });
  }, [logs, selectedResource, selectedAction, searchQuery]);

  // Unique resources present in the fetched logs
  const availableResources = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((log) => {
      if (log.resource) set.add(log.resource);
    });
    return Array.from(set);
  }, [logs]);

  // Unique actions present in the fetched logs
  const availableActions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((log) => {
      if (log.action) set.add(log.action);
    });
    return Array.from(set);
  }, [logs]);

  // Unique users
  const uniqueUsersCount = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((log) => {
      if (log.user?.name) set.add(log.user.name);
    });
    return set.size;
  }, [logs]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach((log) => {
      const res = log.resource || "other";
      counts[res] = (counts[res] || 0) + 1;
    });
    return counts;
  }, [logs]);

  const handleExportPdf = () => {
    if (filteredLogs.length === 0) {
      toast.error("No activities to export for this date");
      return;
    }
    setIsExporting(true);
    try {
      exportDailyActivityPdf({
        activities: filteredLogs,
        selectedDate,
        companyProfile: profile,
        filterResource: selectedResource,
        filterAction: selectedAction,
        searchQuery,
      });
      toast.success("Activity audit report exported successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF report");
    } finally {
      setIsExporting(false);
    }
  };

  const isToday = isSameDay(selectedDate, new Date());
  const isYesterday = isSameDay(selectedDate, subDays(new Date(), 1));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Daily Activity & Operations Audit"
      description="Inspect all platform activities and operational changes performed on any selected date"
      size="full"
      className="max-h-[92vh]"
    >
      <div className="space-y-4">
        {/* Top Controls: Date selection & PDF Export */}
        <div className="flex flex-col gap-3 rounded-xl border border-console-border bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-console-muted">
              Select Date:
            </span>

            {/* Quick shortcuts */}
            <button
              type="button"
              onClick={() => setSelectedDate(new Date())}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                isToday
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-white text-console-text border border-console-border hover:bg-slate-100",
              )}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(subDays(new Date(), 1))}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                isYesterday
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-white text-console-text border border-console-border hover:bg-slate-100",
              )}
            >
              Yesterday
            </button>

            {/* Custom Date Picker */}
            <div className="relative flex items-center">
              <input
                type="date"
                value={format(selectedDate, "yyyy-MM-dd")}
                onChange={(e) => {
                  if (e.target.value) {
                    const [year, month, day] = e.target.value
                      .split("-")
                      .map(Number);
                    setSelectedDate(new Date(year, month - 1, day));
                  }
                }}
                className="rounded-lg border border-console-border bg-white px-3 py-1.5 text-xs font-medium text-console-text shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <button
              type="button"
              onClick={() => fetchActivities(selectedDate)}
              className="rounded-lg p-1.5 text-console-muted transition-colors hover:bg-white hover:text-console-text border border-transparent hover:border-console-border"
              title="Refresh"
            >
              <RefreshCw
                size={14}
                className={cn(loading && "animate-spin text-brand-600")}
              />
            </button>
          </div>

          {/* Right Action: Export as PDF */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExporting || logs.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={14} />
              {isExporting ? "Generating PDF..." : "Export as PDF"}
            </button>
          </div>
        </div>

        {/* Date Heading & Summary KPI Bar */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-console-border bg-white p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-console-muted">
                Audit Date
              </span>
              <CalendarIcon size={16} className="text-brand-600" />
            </div>
            <p className="mt-1 text-sm font-bold text-console-text">
              {format(selectedDate, "dd MMMM yyyy")}
            </p>
            <p className="text-[11px] text-console-muted">
              {format(selectedDate, "EEEE")}
            </p>
          </div>

          <div className="rounded-xl border border-console-border bg-white p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-console-muted">
                Total Activities
              </span>
              <Activity size={16} className="text-emerald-600" />
            </div>
            <p className="mt-1 text-xl font-bold text-console-text">
              {loading ? "..." : logs.length}
            </p>
            <p className="text-[11px] text-console-muted">
              {filteredLogs.length !== logs.length
                ? `${filteredLogs.length} matching filters`
                : "All operations on this date"}
            </p>
          </div>

          <div className="rounded-xl border border-console-border bg-white p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-console-muted">
                Active Members
              </span>
              <Users size={16} className="text-blue-600" />
            </div>
            <p className="mt-1 text-xl font-bold text-console-text">
              {loading ? "..." : uniqueUsersCount}
            </p>
            <p className="text-[11px] text-console-muted">
              Unique team actors
            </p>
          </div>

          <div className="rounded-xl border border-console-border bg-white p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-console-muted">
                Active Modules
              </span>
              <Building size={16} className="text-purple-600" />
            </div>
            <p className="mt-1 text-xl font-bold text-console-text">
              {loading ? "..." : availableResources.length}
            </p>
            <p className="text-[11px] text-console-muted">
              Distinct operation domains
            </p>
          </div>
        </div>

        {/* Quick Module Filter Badges */}
        {Object.keys(categoryCounts).length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-semibold text-console-muted">
              Categories:
            </span>
            <button
              type="button"
              onClick={() => setSelectedResource("all")}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-medium border transition-colors",
                selectedResource === "all"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-console-text border-console-border hover:bg-slate-100",
              )}
            >
              All ({logs.length})
            </button>
            {Object.entries(categoryCounts).map(([res, count]) => {
              const meta = RESOURCE_LABELS[res] || {
                label: res,
                color: "bg-slate-100 text-slate-700 border-slate-200",
              };
              const isSelected = selectedResource === res;
              return (
                <button
                  key={res}
                  type="button"
                  onClick={() => setSelectedResource(isSelected ? "all" : res)}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-medium border transition-colors",
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900"
                      : `${meta.color} hover:opacity-80`,
                  )}
                >
                  {meta.label} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Search, Filter Dropdowns, and View Mode Toggle */}
        <div className="flex flex-col gap-2 rounded-xl border border-console-border bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-console-muted"
            />
            <input
              type="text"
              placeholder="Search description, employee name, site, action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-console-border bg-console-bg/50 py-1.5 pl-9 pr-8 text-xs text-console-text placeholder-console-muted focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-console-muted hover:text-console-text"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Resource Category select */}
            <select
              value={selectedResource}
              onChange={(e) => setSelectedResource(e.target.value)}
              className="rounded-lg border border-console-border bg-white px-2.5 py-1.5 text-xs text-console-text focus:border-brand-500 focus:outline-none"
            >
              <option value="all">All Modules</option>
              {availableResources.map((res) => (
                <option key={res} value={res}>
                  {RESOURCE_LABELS[res]?.label || res}
                </option>
              ))}
            </select>

            {/* Action Type select */}
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="rounded-lg border border-console-border bg-white px-2.5 py-1.5 text-xs text-console-text focus:border-brand-500 focus:outline-none"
            >
              <option value="all">All Actions</option>
              {availableActions.map((act) => (
                <option key={act} value={act}>
                  {act.charAt(0).toUpperCase() + act.slice(1)}
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-console-border bg-slate-100 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("timeline")}
                className={cn(
                  "rounded-md p-1.5 text-xs transition-colors",
                  viewMode === "timeline"
                    ? "bg-white text-console-text shadow-sm"
                    : "text-console-muted hover:text-console-text",
                )}
                title="Timeline View"
              >
                <LayoutList size={14} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={cn(
                  "rounded-md p-1.5 text-xs transition-colors",
                  viewMode === "table"
                    ? "bg-white text-console-text shadow-sm"
                    : "text-console-muted hover:text-console-text",
                )}
                title="Table View"
              >
                <TableIcon size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area: Activities List or Empty State */}
        <div className="min-h-[260px] max-h-[50vh] overflow-y-auto pr-1 [scrollbar-width:thin]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-console-muted">
              <RefreshCw size={24} className="animate-spin text-brand-600 mb-2" />
              <p className="text-sm">Fetching activities for {format(selectedDate, "dd MMM yyyy")}...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-console-border py-12">
              <EmptyState
                icon={CalendarIcon}
                title={
                  logs.length === 0
                    ? `No activities on ${format(selectedDate, "dd MMMM yyyy")}`
                    : "No matching activities"
                }
                description={
                  logs.length === 0
                    ? "No operations or audit events were recorded on this date. You can select another date using the date picker above."
                    : "Try adjusting your search keywords or filter options."
                }
                action={
                  logs.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => setSelectedDate(new Date())}
                      className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-700"
                    >
                      Jump to Today
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedResource("all");
                        setSelectedAction("all");
                      }}
                      className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800"
                    >
                      Clear Filters
                    </button>
                  )
                }
              />
            </div>
          ) : viewMode === "timeline" ? (
            /* TIMELINE VIEW */
            <div className="relative space-y-3 pl-2">
              <div className="absolute bottom-3 left-6 top-3 w-0.5 bg-slate-200" />
              {filteredLogs.map((log) => {
                const resMeta = RESOURCE_LABELS[log.resource] || {
                  label: log.resource,
                  icon: Activity,
                  color: "bg-slate-100 text-slate-700 border-slate-200",
                };
                const IconComponent = resMeta.icon;
                const actionClass =
                  ACTION_COLORS[log.action] ||
                  "bg-slate-100 text-slate-700 border-slate-200";
                const isExpanded = expandedLogId === log._id;

                let timeFormatted = "-";
                try {
                  timeFormatted = format(new Date(log.timestamp), "hh:mm a");
                } catch {
                  timeFormatted = "-";
                }

                return (
                  <div
                    key={log._id}
                    className="relative flex items-start gap-3.5 rounded-xl border border-console-border bg-white p-3.5 shadow-sm transition-all hover:border-brand-200"
                  >
                    {/* Icon Badge */}
                    <div
                      className={cn(
                        "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                        resMeta.color,
                      )}
                    >
                      <IconComponent size={16} />
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-semibold text-console-text">
                            {log.user?.name || "System"}
                          </span>
                          {log.user?.role && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 uppercase">
                              {log.user.role}
                            </span>
                          )}
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                              actionClass,
                            )}
                          >
                            {log.action}
                          </span>
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                              resMeta.color,
                            )}
                          >
                            {resMeta.label}
                          </span>
                        </div>

                        {/* Timestamp */}
                        <span className="flex items-center gap-1 text-[11px] font-medium text-console-muted">
                          <Clock size={11} />
                          {timeFormatted}
                        </span>
                      </div>

                      {/* Main Detail Text */}
                      <p className="mt-1.5 text-xs text-slate-700 font-medium leading-relaxed">
                        {log.details ||
                          `${log.user?.name || "User"} performed ${log.action} on ${resMeta.label}`}
                      </p>

                      {/* Detail Page Link for Purchases and Misc Expenses */}
                      {(() => {
                        const isPurchase = log.resource === "purchase";
                        const isMisc =
                          log.resource === "miscellaneousExpense" ||
                          log.resource === "miscellaneous";
                        const detailUrl =
                          isPurchase && log.resourceId
                            ? `/${basePath}/purchases/${log.resourceId}`
                            : isMisc && log.resourceId
                            ? `/${basePath}/miscellaneous-expenses/${log.resourceId}`
                            : null;

                        if (!detailUrl) return null;

                        return (
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                navigate(detailUrl);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50/70 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100 hover:text-brand-900 transition-colors shadow-2xs"
                            >
                              {isPurchase ? (
                                <ShoppingCart size={13} />
                              ) : (
                                <Wrench size={13} />
                              )}
                              View detailed {isPurchase ? "purchase" : "expense"} record →
                            </button>
                          </div>
                        );
                      })()}

                      {/* Technical metadata toggle */}
                      {(log.ip || log.device || log.resourceId) && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedLogId(isExpanded ? null : log._id)
                            }
                            className="inline-flex items-center gap-1 text-[11px] text-console-muted hover:text-console-text"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp size={12} /> Hide technical audit
                              </>
                            ) : (
                              <>
                                <ChevronDown size={12} /> View technical audit
                              </>
                            )}
                          </button>

                          {isExpanded && (
                            <div className="mt-1.5 rounded-lg border border-slate-100 bg-slate-50 p-2 text-[11px] text-slate-600 space-y-1">
                              {log.resourceId && (
                                <p>
                                  <span className="font-semibold text-slate-700">
                                    Resource ID:
                                  </span>{" "}
                                  <code className="rounded bg-white px-1 border border-slate-200">
                                    {log.resourceId}
                                  </code>
                                </p>
                              )}
                              {log.ip && (
                                <p>
                                  <span className="font-semibold text-slate-700">
                                    IP Address:
                                  </span>{" "}
                                  {log.ip}
                                </p>
                              )}
                              {log.device && (
                                <p>
                                  <span className="font-semibold text-slate-700">
                                    Device/Browser:
                                  </span>{" "}
                                  {log.device}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="overflow-x-auto rounded-xl border border-console-border bg-white">
              <table className="w-full text-left text-xs text-console-text">
                <thead className="border-b border-console-border bg-slate-50/75 text-[11px] font-semibold text-console-muted uppercase">
                  <tr>
                    <th className="px-3 py-2.5 w-12 text-center">#</th>
                    <th className="px-3 py-2.5 w-24">Time</th>
                    <th className="px-3 py-2.5 w-40">Actor</th>
                    <th className="px-3 py-2.5 w-32">Module</th>
                    <th className="px-3 py-2.5 w-24">Action</th>
                    <th className="px-3 py-2.5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-console-border">
                  {filteredLogs.map((log, index) => {
                    let timeFormatted = "-";
                    try {
                      timeFormatted = format(new Date(log.timestamp), "hh:mm a");
                    } catch {
                      timeFormatted = "-";
                    }

                    const resMeta = RESOURCE_LABELS[log.resource] || {
                      label: log.resource,
                      color: "bg-slate-100 text-slate-700 border-slate-200",
                    };
                    const actionClass =
                      ACTION_COLORS[log.action] ||
                      "bg-slate-100 text-slate-700 border-slate-200";

                    return (
                      <tr
                        key={log._id}
                        className="transition-colors hover:bg-slate-50/70"
                      >
                        <td className="px-3 py-2.5 text-center text-console-muted">
                          {index + 1}
                        </td>
                        <td className="px-3 py-2.5 font-medium text-console-muted whitespace-nowrap">
                          {timeFormatted}
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="font-semibold text-console-text">
                            {log.user?.name || "System"}
                          </p>
                          {log.user?.role && (
                            <span className="text-[10px] text-console-muted uppercase">
                              {log.user.role}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={cn(
                              "inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium",
                              resMeta.color,
                            )}
                          >
                            {resMeta.label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={cn(
                              "inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                              actionClass,
                            )}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-700 leading-relaxed font-medium">
                          <div>{log.details || "-"}</div>
                          {(() => {
                            const isPurchase = log.resource === "purchase";
                            const isMisc =
                              log.resource === "miscellaneousExpense" ||
                              log.resource === "miscellaneous";
                            const detailUrl =
                              isPurchase && log.resourceId
                                ? `/${basePath}/purchases/${log.resourceId}`
                                : isMisc && log.resourceId
                                ? `/${basePath}/miscellaneous-expenses/${log.resourceId}`
                                : null;

                            if (!detailUrl) return null;

                            return (
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  navigate(detailUrl);
                                }}
                                className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-800"
                              >
                                {isPurchase ? (
                                  <ShoppingCart size={11} />
                                ) : (
                                  <Wrench size={11} />
                                )}
                                View {isPurchase ? "purchase" : "expense"} details →
                              </button>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default DailyActivityModal;
