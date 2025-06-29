import React, { useEffect, useState } from "react";
import {
  createArchitect,
  getUsersByRole,
  regeneratePassword,
  toggleUserStatus,
  updateArchitect,
  assignSitesToArchitect,
} from "@/services/userService";
import { getSites } from "@/services/siteService";
import { Site } from "@/services/siteService";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  Edit,
  RefreshCw,
  Users,
  Building2,
  Mail,
  ShieldCheck,
  ShieldX,
  Copy,
  Settings,
  Trash2,
  UserPlus,
  Activity,
} from "lucide-react";
import AddArchitectModal from "./AddArchitectModal";
import EditArchitectModal from "./EditArchitectModal";
import AssignSitesModal from "./AssignSitesModal";
import ConfirmModal from "./ConfirmModal";
import { toast } from "sonner";

interface Architect {
  id: string;
  name: string;
  sites: Site[];
  email: string;
  password: string;
  isBlocked: boolean;
}

const Architects: React.FC = () => {
  const [architects, setArchitects] = useState<Architect[]>([]);
  const [allSites, setAllSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedArchitect, setSelectedArchitect] = useState<Architect | null>(
    null
  );
  const [isToggling, setIsToggling] = useState<{ [key: string]: boolean }>({});
  const [isRegenerating, setIsRegenerating] = useState<{
    [key: string]: boolean;
  }>({});
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isAnimating, setIsAnimating] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isLoading: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    isLoading: false,
  });

  const itemsPerPage = 8;

  useEffect(() => {
    setIsAnimating(true);
    const fetchData = async () => {
      setLoading(true);
      try {
        const [architectsData, sitesData] = await Promise.all([
          getUsersByRole("architect"),
          getSites(),
        ]);
        const mappedArchitects = architectsData.map((user) => ({
          id: user.id,
          name: user.name,
          sites: user.assignedSites || [],
          email: user.email,
          password: user.password || "********",
          isBlocked: user.isBlocked,
        }));
        setArchitects(mappedArchitects);
        setAllSites(sitesData);
      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error("Failed to fetch data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredArchitects = architects.filter((architect) => {
    const matchesSearch =
      architect.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      architect.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSite =
      !selectedSiteId ||
      architect.sites.some((site) => site.id === selectedSiteId);
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "active" && !architect.isBlocked) ||
      (selectedStatus === "blocked" && architect.isBlocked);
    return matchesSearch && matchesSite && matchesStatus;
  });

  const totalPages = Math.ceil(filteredArchitects.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentArchitects = filteredArchitects.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const activeArchitects = architects.filter((a) => !a.isBlocked).length;
  const blockedArchitects = architects.filter((a) => a.isBlocked).length;

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success(`${label} copied to clipboard!`);
      })
      .catch(() => {
        toast.error(`Failed to copy ${label}`);
      });
  };

  const handleToggleStatus = (architect: Architect) => {
    const action = architect.isBlocked ? "unblock" : "block";
    setConfirmModal({
      isLoading: false,
      isOpen: true,
      title: `Confirm ${action}`,
      message: `Are you sure you want to ${action} ${architect.name}?`,
      onConfirm: async () => {
        setConfirmModal((prev) => ({
          ...prev,
          isOpen: false,
          isLoading: true,
        }));
        setIsToggling((prev) => ({ ...prev, [architect.id]: true }));
        try {
          const newIsBlocked = !architect.isBlocked;
          await toggleUserStatus(architect.id, newIsBlocked);
          setArchitects((prev) =>
            prev.map((a) =>
              a.id === architect.id ? { ...a, isBlocked: newIsBlocked } : a
            )
          );
          toast.success(
            `Architect ${newIsBlocked ? "blocked" : "unblocked"} successfully!`
          );
        } catch (err) {
          console.error("Error toggling status:", err);
          toast.error("Failed to update status");
        } finally {
          setIsToggling((prev) => ({ ...prev, [architect.id]: false }));
          setConfirmModal((prev) => ({
            ...prev,
            isOpen: false,
            isLoading: false,
          }));
        }
      },
    });
  };

  const handleRegeneratePassword = (architect: Architect) => {
    setConfirmModal({
      isOpen: true,
      title: "Confirm Password Regeneration",
      message: `Are you sure you want to regenerate the password for ${architect.name}?`,
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        setIsRegenerating((prev) => ({ ...prev, [architect.id]: true }));
        try {
          const newPassword = await regeneratePassword(architect.id);
          navigator.clipboard
            .writeText(newPassword)
            .then(() => {
              toast.success("Password copied to clipboard!");
            })
            .catch((err) => {
              console.error("Failed to copy password:", err);
              toast.error("Failed to copy password.");
            });
          setArchitects((prev) =>
            prev.map((a) =>
              a.id === architect.id ? { ...a, password: newPassword } : a
            )
          );
          toast.success("Password regenerated successfully!");
        } catch (err) {
          console.error("Error regenerating password:", err);
          toast.error("Failed to regenerate password.");
        } finally {
          setIsRegenerating((prev) => ({ ...prev, [architect.id]: false }));
          setConfirmModal((prev) => ({
            ...prev,
            isLoading: false,
            isOpen: false,
          }));
        }
      },
    });
  };

  const handleRemoveSite = (architectId: string, siteId: string) => {
    const architect = architects.find((a) => a.id === architectId);
    const site = allSites.find((s) => s.id === siteId);
    if (!architect || !site) return;

    setConfirmModal({
      isLoading: false,
      isOpen: true,
      title: "Confirm Site Removal",
      message: `Are you sure you want to remove ${site.name} from ${architect.name}?`,
      onConfirm: async () => {
        try {
          const updatedSites = architect.sites.filter((s) => s.id !== siteId);
          await assignSitesToArchitect(
            architectId,
            updatedSites.map((s) => s.id)
          );
          setArchitects((prev) =>
            prev.map((a) =>
              a.id === architectId ? { ...a, sites: updatedSites } : a
            )
          );
          toast.success("Site removed successfully!");
        } catch (err) {
          console.error("Error removing site:", err);
          toast.error("Failed to remove site.");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleAssignSites = async (selectedSiteIds: string[]) => {
    if (!selectedArchitect) return;
    try {
      const currentSiteIds = selectedArchitect.sites.map((site) => site.id);
      const newSiteIds = [...new Set([...currentSiteIds, ...selectedSiteIds])];
      await assignSitesToArchitect(selectedArchitect.id, newSiteIds);
      const updatedSites = allSites.filter((site) =>
        newSiteIds.includes(site.id)
      );
      setArchitects((prev) =>
        prev.map((a) =>
          a.id === selectedArchitect.id ? { ...a, sites: updatedSites } : a
        )
      );
      toast.success("Sites assigned successfully!");
    } catch (err) {
      console.error("Error assigning sites:", err);
      toast.error("Failed to assign sites.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-purple-600 rounded-full animate-spin animation-delay-150 mx-auto"></div>
          </div>
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl" />
          <p className="mt-4 text-lg font-medium text-gray-600">
            Loading architects...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`transition-all duration-500 ${
        isAnimating ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="container mx-auto px-2 py-3">
        {/* Header Section */}
        <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-200 transform overflow-hidden mb-8">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl" />
          <div className="p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {activeArchitects}
                    </span>
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Architects
                  </h1>
                  <p className="text-gray-500 mt-1">
                    Manage and oversee architects across your organization
                  </p>
                </div>
              </div>
              <button
                className="group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
                onClick={() => setIsAddModalOpen(true)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                <UserPlus size={18} className="relative z-10" />
                <span className="relative z-10">Add Architect</span>
              </button>
            </div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">
                      Total Architects
                    </p>
                    <p className="text-2xl font-bold text-blue-800">
                      {architects.length}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">Active</p>
                    <p className="text-2xl font-bold text-green-800">
                      {activeArchitects}
                    </p>
                  </div>
                  <ShieldCheck className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-600 text-sm font-medium">Blocked</p>
                    <p className="text-2xl font-bold text-red-800">
                      {blockedArchitects}
                    </p>
                  </div>
                  <ShieldX className="w-8 h-8 text-red-500" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm font-medium">
                      Total Sites
                    </p>
                    <p className="text-2xl font-bold text-purple-800">
                      {allSites.length}
                    </p>
                  </div>
                  <Building2 className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-8">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar - Takes remaining space */}
              <div className="relative flex-grow min-w-0">
                <Search
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search by name or email..."
                  className="pl-12 pr-4 py-3 w-full border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-gray-50 focus:bg-white"
                />
              </div>

              {/* Filters - Fixed width */}
              <div className="flex gap-4 shrink-0">
                <div className="relative w-[200px]">
                  <Filter
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <select
                    value={selectedSiteId || "All Sites"}
                    onChange={(e) => {
                      setSelectedSiteId(
                        e.target.value === "All Sites" ? null : e.target.value
                      );
                      setCurrentPage(1);
                    }}
                    className="pl-12 pr-10 py-3 w-full border-2 border-gray-200 rounded-xl appearance-none focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-gray-50 focus:bg-white"
                  >
                    <option value="All Sites">All Sites</option>
                    {allSites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative w-[180px]">
                  <Filter
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <select
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-12 pr-10 py-3 w-full border-2 border-gray-200 rounded-xl appearance-none focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-gray-50 focus:bg-white"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Table */}
        <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <Users size={16} />
                      <span>Architect</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <Building2 size={16} />
                      <span>Assigned Sites</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <Mail size={16} />
                      <span>Contact</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <Activity size={16} />
                      <span>Status</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <Settings size={16} />
                      <span>Actions</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {currentArchitects.map((architect, index) => (
                  <tr
                    key={architect.id}
                    className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                            {architect.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </div>
                          <div
                            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                              architect.isBlocked ? "bg-red-500" : "bg-green-500"
                            }`}
                          />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {architect.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {architect.id.slice(-8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 items-center max-w-xs">
                        {architect.sites.slice(0, 2).map((site) => (
                          <span
                            key={site.id}
                            className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200"
                          >
                            {site.name}
                            <button
                              onClick={() =>
                                handleRemoveSite(architect.id, site.id)
                              }
                              className="ml-2 text-blue-600 hover:text-red-600 transition-colors duration-200"
                            >
                              <Trash2 size={12} />
                            </button>
                          </span>
                        ))}
                        {architect.sites.length > 2 && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            +{architect.sites.length - 2} more
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setSelectedArchitect(architect);
                            setIsAssignModalOpen(true);
                          }}
                          className="ml-2 w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-200"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Mail size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {architect.email}
                          </span>
                          <button
                            onClick={() =>
                              copyToClipboard(architect.email, "Email")
                            }
                            className="text-blue-500 hover:text-blue-700 transition-colors duration-200"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border-2 ${
                          architect.isBlocked
                            ? "bg-gradient-to-r from-red-50 to-red-100 text-red-800 border-red-200"
                            : "bg-gradient-to-r from-green-50 to-green-100 text-green-800 border-green-200"
                        }`}
                      >
                        {architect.isBlocked ? (
                          <>
                            <ShieldX size={12} className="mr-1" /> Blocked
                          </>
                        ) : (
                          <>
                            <ShieldCheck size={12} className="mr-1" /> Active
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleStatus(architect)}
                          disabled={isToggling[architect.id]}
                          className={`group relative px-3 py-2 text-xs rounded-lg font-medium transition-all duration-200 ${
                            architect.isBlocked
                              ? "bg-gradient-to-r from-green-100 to-green-200 text-green-700 hover:from-green-200 hover:to-green-300 border border-green-300"
                              : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 border border-gray-300"
                          } ${
                            isToggling[architect.id]
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:scale-105"
                          }`}
                        >
                          {isToggling[architect.id] ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : architect.isBlocked ? (
                            "Unblock"
                          ) : (
                            "Block"
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedArchitect(architect);
                            setIsEditModalOpen(true);
                          }}
                          className="group relative px-3 py-2 text-xs rounded-lg font-medium bg-gradient-to-r from-yellow-100 to-amber-200 text-yellow-700 hover:from-yellow-200 hover:to-amber-300 border border-yellow-300 hover:scale-105 transition-all duration-200"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleRegeneratePassword(architect)}
                          disabled={isRegenerating[architect.id]}
                          className={`group relative px-3 py-2 text-xs rounded-lg font-medium bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 hover:from-purple-200 hover:to-purple-300 border border-purple-300 transition-all duration-200 ${
                            isRegenerating[architect.id]
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:scale-105"
                          }`}
                        >
                          {isRegenerating[architect.id] ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <RefreshCw size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {currentArchitects.length === 0 && (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No architects found</p>
              <p className="text-gray-400 text-sm">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8 bg-white rounded-2xl shadow-lg border border-gray-200 px-6 py-4">
            <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
              Showing {indexOfFirstItem + 1} to{" "}
              {Math.min(indexOfLastItem, filteredArchitects.length)} of{" "}
              {filteredArchitects.length} architects
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-md ${
                  currentPage === 1
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex space-x-1">
                {[...Array(totalPages)].map((_, index) => {
                  const pageNum = index + 1;
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => paginate(pageNum)}
                        className={`w-8 h-8 flex items-center justify-center rounded-md ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  if (
                    pageNum === currentPage - 2 ||
                    pageNum === currentPage + 2
                  ) {
                    return (
                      <span
                        key={pageNum}
                        className="w-8 h-8 flex items-center justify-center text-gray-600"
                      >
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-md ${
                  currentPage === totalPages
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
        {/* Modals */}
        <AddArchitectModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={async (newArchitect) => {
            try {
              await createArchitect({
                name: newArchitect.name,
                email: newArchitect.email,
              });
              const updatedArchitects = await getUsersByRole("architect");
              setArchitects(
                updatedArchitects.map((user) => ({
                  id: user.id,
                  name: user.name,
                  sites: user.assignedSites || [],
                  email: user.email,
                  password: user.password || "********",
                  isBlocked: user.isBlocked,
                }))
              );
              setIsAddModalOpen(false);
              toast.success("Architect added successfully!");
            } catch (err) {
              console.error("Error adding architect:", err);
              toast.error("Failed to add architect.");
            }
          }}
        />
        {selectedArchitect && (
          <>
            <EditArchitectModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              architect={selectedArchitect}
              onSubmit={async (updatedArchitect) => {
                try {
                  await updateArchitect(selectedArchitect.id, {
                    name: updatedArchitect.name,
                    email: updatedArchitect.email,
                  });
                  setArchitects((prev) =>
                    prev.map((a) =>
                      a.id === selectedArchitect.id
                        ? { ...a, ...updatedArchitect }
                        : a
                    )
                  );
                  setIsEditModalOpen(false);
                  toast.success("Architect updated successfully!");
                } catch (err) {
                  console.error("Error updating architect:", err);
                  toast.error("Failed to update architect.");
                }
              }}
            />
            <AssignSitesModal
              isOpen={isAssignModalOpen}
              onClose={() => setIsAssignModalOpen(false)}
              allSites={allSites}
              assignedSites={selectedArchitect.sites}
              onAssign={handleAssignSites}
            />
          </>
        )}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() =>
            setConfirmModal((prev) => ({ ...prev, isOpen: false }))
          }
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          isLoading={confirmModal.isLoading}
        />
      </div>
    </div>
  );
};

export default Architects;