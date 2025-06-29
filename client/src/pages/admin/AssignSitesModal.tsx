import React, { useState, useEffect, useMemo } from "react";
import {
  X,
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
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animation control
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [isOpen]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Keyboard handling
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") handleClose();
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
      setSelectedSites([]);
      setSearchTerm("");
      setStatusFilter("all");
    }, 300);
  };

  const handleSiteChange = (siteId: string) => {
    setSelectedSites((prev) =>
      prev.includes(siteId)
        ? prev.filter((id) => id !== siteId)
        : [...prev, siteId]
    );
  };

  const handleSubmit = () => {
    onAssign(selectedSites);
    handleClose();
  };

  const handleSelectAll = () => {
    const availableSites = filteredSites.filter(
      (site) => !assignedSites.some((assigned) => assigned.id === site.id)
    );

    if (selectedSites.length === availableSites.length) {
      setSelectedSites([]);
    } else {
      setSelectedSites(availableSites.map((site) => site.id));
    }
  };

  // Filtered sites based on search and status
  const filteredSites = useMemo(() => {
    return allSites.filter((site) => {
      const matchesSearch =
        site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.state.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || site.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [allSites, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getBudgetUtilization = (budget: number, expenses: number) => {
    const percentage = (expenses / budget) * 100;
    return {
      percentage: Math.min(percentage, 100),
      color:
        percentage > 90
          ? "bg-red-500"
          : percentage > 70
          ? "bg-yellow-500"
          : "bg-green-500",
    };
  };

  const availableSitesCount = filteredSites.filter(
    (site) => !assignedSites.some((assigned) => assigned.id === site.id)
  ).length;

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isAnimating ? "bg-black/60 backdrop-blur-sm" : "bg-black/0"
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative overflow-hidden bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[90vh] flex flex-col transition-all duration-300 transform ${
          isAnimating
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient header */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full" />

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Assign Sites</h2>
              <p className="text-sm text-gray-500 mt-1">
                Select sites to assign • {availableSitesCount} available
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 pb-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search sites by name, city, or state..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Select All Button */}
            <button
              onClick={handleSelectAll}
              disabled={availableSitesCount === 0}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {selectedSites.length === availableSitesCount &&
              availableSitesCount > 0
                ? "Deselect All"
                : "Select All"}
            </button>
          </div>
        </div>

        {/* Sites List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {filteredSites.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No sites found</p>
                <p className="text-gray-400 text-sm">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              filteredSites.map((site) => {
                const isAssigned = assignedSites.some((s) => s.id === site.id);
                const isSelected = selectedSites.includes(site.id);
                const budgetUtil = getBudgetUtilization(
                  site.budget,
                  site.expenses
                );

                return (
                  <div
                    key={site.id}
                    className={`group relative p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                      isAssigned
                        ? "bg-green-50 border-green-200 cursor-not-allowed"
                        : isSelected
                        ? "bg-blue-50 border-blue-300 shadow-md"
                        : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    }`}
                    onClick={() => !isAssigned && handleSiteChange(site.id)}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Checkbox */}
                      <div className="flex-shrink-0 mt-1">
                        {isAssigned ? (
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        ) : isSelected ? (
                          <CheckCircle2 className="w-6 h-6 text-blue-600" />
                        ) : (
                          <Circle className="w-6 h-6 text-gray-400 group-hover:text-gray-600" />
                        )}
                      </div>

                      {/* Site Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {site.name}
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600 truncate">
                                {site.address}, {site.city}, {site.state}{" "}
                                {site.zip}
                              </span>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                              site.status
                            )}`}
                          >
                            {isAssigned && (
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                            )}
                            {isAssigned ? "Already Assigned" : site.status}
                          </span>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Budget */}
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <DollarSign className="w-4 h-4 text-green-600" />
                              <span className="text-xs font-medium text-gray-600">
                                Budget
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">
                              ${site.budget.toLocaleString()}
                            </p>
                          </div>

                          {/* Expenses */}
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <TrendingUp className="w-4 h-4 text-red-600" />
                              <span className="text-xs font-medium text-gray-600">
                                Expenses
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">
                              ${site.expenses.toLocaleString()}
                            </p>
                          </div>

                          {/* Budget Utilization */}
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <Activity className="w-4 h-4 text-blue-600" />
                              <span className="text-xs font-medium text-gray-600">
                                Utilization
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-500 ${budgetUtil.color}`}
                                  style={{ width: `${budgetUtil.percentage}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-gray-700">
                                {budgetUtil.percentage.toFixed(0)}%
                              </span>
                            </div>
                          </div>

                          {/* Created Date */}
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <Calendar className="w-4 h-4 text-purple-600" />
                              <span className="text-xs font-medium text-gray-600">
                                Created
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">
                              {new Date(site.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Selection Indicator */}
                    {isSelected && !isAssigned && (
                      <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-blue-500 rounded-tr-xl">
                        <CheckCircle2 className="absolute -top-4 -right-4 w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 pt-4 border-t border-gray-200 bg-gray-50/50">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{selectedSites.length}</span> sites
            selected
            {selectedSites.length > 0 && (
              <span className="ml-2 text-gray-500">• Ready to assign</span>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedSites.length === 0}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm"
            >
              Assign {selectedSites.length > 0 && `(${selectedSites.length})`}{" "}
              Sites
            </button>
          </div>
        </div>

        {/* Subtle glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur-sm -z-10" />
      </div>
    </div>
  );
};

export default AssignSitesModal;
