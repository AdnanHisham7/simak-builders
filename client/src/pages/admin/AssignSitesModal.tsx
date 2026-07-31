import { useState, useMemo } from "react";
import {
  Search,
  MapPin,
  DollarSign,
  Calendar,
  Filter,
  CheckCircle2,
  Circle,
  Building2,
  TrendingUp,
  Activity,
} from "lucide-react";
import { Site } from "@/services/siteService";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";

interface AssignSitesModalProps {
  isOpen: boolean;
  onClose: () => void;
  allSites: Site[];
  assignedSites: Site[];
  onAssign: (selectedSiteIds: string[]) => void;
}

const AssignSitesModal: React.FC<AssignSitesModalProps> = ({
  isOpen,
  onClose,
  allSites,
  assignedSites,
  onAssign,
}) => {
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleClose = () => {
    onClose();
    setSelectedSites([]);
    setSearchTerm("");
    setStatusFilter("all");
  };

  const handleSiteChange = (siteId: string) => {
    setSelectedSites((prev) =>
      prev.includes(siteId) ? prev.filter((id) => id !== siteId) : [...prev, siteId],
    );
  };

  const handleSubmit = () => {
    onAssign(selectedSites);
    handleClose();
  };

  const filteredSites = useMemo(() => {
    return allSites.filter((site) => {
      const matchesSearch =
        site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.state.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || site.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [allSites, searchTerm, statusFilter]);

  const availableSitesCount = filteredSites.filter(
    (site) => !assignedSites.some((assigned) => assigned.id === site.id),
  ).length;

  const handleSelectAll = () => {
    const availableSites = filteredSites.filter(
      (site) => !assignedSites.some((assigned) => assigned.id === site.id),
    );
    if (selectedSites.length === availableSites.length) {
      setSelectedSites([]);
    } else {
      setSelectedSites(availableSites.map((site) => site.id));
    }
  };

  const getBudgetUtilization = (budget: number, expenses: number) => {
    const percentage = budget > 0 ? Math.min((expenses / budget) * 100, 100) : 0;
    return {
      percentage,
      color: percentage > 90 ? "bg-danger-500" : percentage > 70 ? "bg-warning-500" : "bg-success-500",
    };
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="xl"
      title="Assign Sites"
      description={`Select sites to assign · ${availableSitesCount} available`}
      footer={
        <div className="flex w-full items-center justify-between">
          <p className="text-sm text-console-muted">
            <span className="font-medium text-console-text">{selectedSites.length}</span> sites
            selected
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={selectedSites.length === 0}>
              Assign {selectedSites.length > 0 && `(${selectedSites.length})`} sites
            </Button>
          </div>
        </div>
      }
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-console-muted" size={16} />
          <input
            type="text"
            placeholder="Search sites by name, city, or state..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-console-border py-2.5 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-console-muted" size={15} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none rounded-lg border border-console-border bg-white py-2.5 pl-10 pr-8 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            <option value="all">All Status</option>
            <option value="InProgress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        <Button variant="secondary" onClick={handleSelectAll} disabled={availableSitesCount === 0}>
          {selectedSites.length === availableSitesCount && availableSitesCount > 0
            ? "Deselect all"
            : "Select all"}
        </Button>
      </div>

      {filteredSites.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No sites found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <div className="space-y-3">
          {filteredSites.map((site) => {
            const isAssigned = assignedSites.some((s) => s.id === site.id);
            const isSelected = selectedSites.includes(site.id);
            const budgetUtil = getBudgetUtilization(site.budget, site.expenses);

            return (
              <div
                key={site.id}
                onClick={() => !isAssigned && handleSiteChange(site.id)}
                className={cn(
                  "rounded-console border-2 p-5 transition-colors",
                  isAssigned
                    ? "cursor-not-allowed border-success-200 bg-success-50"
                    : isSelected
                      ? "cursor-pointer border-brand-300 bg-brand-50 shadow-console"
                      : "cursor-pointer border-console-border bg-white hover:border-slate-300 hover:shadow-console",
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1 shrink-0">
                    {isAssigned || isSelected ? (
                      <CheckCircle2
                        size={22}
                        className={isAssigned ? "text-success-600" : "text-brand-600"}
                      />
                    ) : (
                      <Circle size={22} className="text-slate-300" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-console-text">{site.name}</h3>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-console-muted">
                          <MapPin size={12} />
                          <span className="truncate">
                            {site.address}, {site.city}, {site.state} {site.zip}
                          </span>
                        </div>
                      </div>
                      <Badge variant={isAssigned ? "success" : site.status === "Completed" ? "info" : "warning"}>
                        {isAssigned ? "Already assigned" : site.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                      <div className="rounded-lg bg-console-bg p-3">
                        <div className="mb-1 flex items-center gap-1.5">
                          <DollarSign size={13} className="text-success-600" />
                          <span className="text-xs font-medium text-console-muted">Budget</span>
                        </div>
                        <p className="text-sm font-semibold text-console-text">
                          ₹{site.budget.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div className="rounded-lg bg-console-bg p-3">
                        <div className="mb-1 flex items-center gap-1.5">
                          <TrendingUp size={13} className="text-danger-600" />
                          <span className="text-xs font-medium text-console-muted">Expenses</span>
                        </div>
                        <p className="text-sm font-semibold text-console-text">
                          ₹{site.expenses.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div className="rounded-lg bg-console-bg p-3">
                        <div className="mb-1 flex items-center gap-1.5">
                          <Activity size={13} className="text-info-600" />
                          <span className="text-xs font-medium text-console-muted">Utilization</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-slate-200">
                            <div
                              className={cn("h-1.5 rounded-full transition-all", budgetUtil.color)}
                              style={{ width: `${budgetUtil.percentage}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-console-text">
                            {budgetUtil.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="rounded-lg bg-console-bg p-3">
                        <div className="mb-1 flex items-center gap-1.5">
                          <Calendar size={13} className="text-brand-600" />
                          <span className="text-xs font-medium text-console-muted">Created</span>
                        </div>
                        <p className="text-sm font-semibold text-console-text">
                          {new Date(site.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
};

export default AssignSitesModal;
