import React, { useEffect, useState } from "react";
import {
  createSiteManager,
  getUsersByRole,
  regeneratePassword,
  toggleUserStatus,
  updateSiteManager,
  assignSitesToManager,
  assignSiteExpenses,
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
  // Shield,
  ShieldCheck,
  ShieldX,
  // Eye,
  // EyeOff,
  Copy,
  Settings,
  // MoreVertical,
  Trash2,
  UserPlus,
  Activity,
  DollarSign,
} from "lucide-react";
import AddSiteManagerModal from "./AddSiteManagerModal";
import EditSiteManagerModal from "./EditSiteManagerModal";
import AssignSitesModal from "./AssignSitesModal";
import ConfirmModal from "./ConfirmModal";
import { toast } from "sonner";
import AssignFundsModal from "./AssignFundsModal";
import { Link } from "react-router-dom";

interface SiteManager {
  id: string;
  name: string;
  sites: Site[];
  email: string;
  password: string;
  isBlocked: boolean;
  siteExpensesBalance: number;
}

const SiteManagers: React.FC = () => {
  const [siteManagers, setSiteManagers] = useState<SiteManager[]>([]);
  const [allSites, setAllSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAssignFundsModalOpen, setIsAssignFundsModalOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState<SiteManager | null>(
    null
  );
  const [isToggling, setIsToggling] = useState<{ [key: string]: boolean }>({});
  const [isRegenerating, setIsRegenerating] = useState<{
    [key: string]: boolean;
  }>({});
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  // const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
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
        const [siteManagersData, sitesData] = await Promise.all([
          getUsersByRole("siteManager"),
          getSites(),
        ]);
        const mappedSiteManagers = siteManagersData.map((user) => ({
          id: user.id,
          name: user.name,
          sites: user.assignedSites || [],
          email: user.email,
          password: user.password || "********",
          isBlocked: user.isBlocked,
          siteExpensesBalance: user.siteExpensesBalance,
        }));
        setSiteManagers(mappedSiteManagers);
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

  const filteredSiteManagers = siteManagers.filter((manager) => {
    const matchesSearch =
      manager.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manager.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSite =
      !selectedSiteId ||
      manager.sites.some((site) => site.id === selectedSiteId);
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "active" && !manager.isBlocked) ||
      (selectedStatus === "blocked" && manager.isBlocked);
    return matchesSearch && matchesSite && matchesStatus;
  });

  const totalPages = Math.ceil(filteredSiteManagers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSiteManagers = filteredSiteManagers.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const activeManagers = siteManagers.filter((m) => !m.isBlocked).length;
  const blockedManagers = siteManagers.filter((m) => m.isBlocked).length;

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // const togglePasswordVisibility = (managerId: string) => {
  //   setShowPasswords((prev) => ({
  //     ...prev,
  //     [managerId]: !prev[managerId],
  //   }));
  // };

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

  const handleToggleStatus = (manager: SiteManager) => {
    const action = manager.isBlocked ? "unblock" : "block";
    setConfirmModal({
      isLoading: false,
      isOpen: true,
      title: `Confirm ${action}`,
      message: `Are you sure you want to ${action} ${manager.name}?`,
      onConfirm: async () => {
        setConfirmModal((prev) => ({
          ...prev,
          isOpen: false,
          isLoading: true,
        }));
        setIsToggling((prev) => ({ ...prev, [manager.id]: true }));
        try {
          const newIsBlocked = !manager.isBlocked;
          await toggleUserStatus(manager.id, newIsBlocked);
          setSiteManagers((prev) =>
            prev.map((m) =>
              m.id === manager.id ? { ...m, isBlocked: newIsBlocked } : m
            )
          );
          toast.success(
            `Manager ${newIsBlocked ? "blocked" : "unblocked"} successfully!`
          );
        } catch (err) {
          console.error("Error toggling status:", err);
          toast.error("Failed to update status");
        } finally {
          setIsToggling((prev) => ({ ...prev, [manager.id]: false }));
          setConfirmModal((prev) => ({
            ...prev,
            isOpen: false,
            isLoading: false,
          }));
        }
      },
    });
  };

  const handleRegeneratePassword = (manager: SiteManager) => {
    setConfirmModal({
      isOpen: true,
      title: "Confirm Password Regeneration",
      message: `Are you sure you want to regenerate the password for ${manager.name}?`,
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        setIsRegenerating((prev) => ({ ...prev, [manager.id]: true }));
        try {
          const newPassword = await regeneratePassword(manager.id);
          navigator.clipboard
            .writeText(newPassword)
            .then(() => {
              toast.success("Password copied to clipboard!");
            })
            .catch((err) => {
              console.error("Failed to copy password:", err);
              toast.error("Failed to copy password.");
            });
          setSiteManagers((prev) =>
            prev.map((m) =>
              m.id === manager.id ? { ...m, password: newPassword } : m
            )
          );
          toast.success("Password regenerated successfully!");
        } catch (err) {
          console.error("Error regenerating password:", err);
          toast.error("Failed to regenerate password.");
        } finally {
          setIsRegenerating((prev) => ({ ...prev, [manager.id]: false }));
          setConfirmModal((prev) => ({
            ...prev,
            isLoading: false,
            isOpen: false,
          }));
        }
      },
    });
  };

  const handleRemoveSite = (managerId: string, siteId: string) => {
    const manager = siteManagers.find((m) => m.id === managerId);
    const site = allSites.find((s) => s.id === siteId);
    if (!manager || !site) return;

    setConfirmModal({
      isLoading: false,
      isOpen: true,
      title: "Confirm Site Removal",
      message: `Are you sure you want to remove ${site.name} from ${manager.name}?`,
      onConfirm: async () => {
        try {
          const updatedSites = manager.sites.filter((s) => s.id !== siteId);
          await assignSitesToManager(
            managerId,
            updatedSites.map((s) => s.id)
          );
          setSiteManagers((prev) =>
            prev.map((m) =>
              m.id === managerId ? { ...m, sites: updatedSites } : m
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
    if (!selectedManager) return;
    try {
      const currentSiteIds = selectedManager.sites.map((site) => site.id);
      const newSiteIds = [...new Set([...currentSiteIds, ...selectedSiteIds])];
      await assignSitesToManager(selectedManager.id, newSiteIds);
      const updatedSites = allSites.filter((site) =>
        newSiteIds.includes(site.id)
      );
      setSiteManagers((prev) =>
        prev.map((m) =>
          m.id === selectedManager.id ? { ...m, sites: updatedSites } : m
        )
      );
      toast.success("Sites assigned successfully!");
    } catch (err) {
      console.error("Error assigning sites:", err);
      toast.error("Failed to assign sites.");
    }
  };

  const handleAssignFunds = async (amount: number) => {
    if (!selectedManager) return;
    try {
      await assignSiteExpenses(selectedManager.id, amount);
      const updatedManagers = await getUsersByRole("siteManager");
      setSiteManagers(
        updatedManagers.map((user) => ({
          id: user.id,
          name: user.name,
          sites: user.assignedSites || [],
          email: user.email,
          password: user.password || "********",
          isBlocked: user.isBlocked,
          siteExpensesBalance: user.siteExpensesBalance,
        }))
      );
      setIsAssignFundsModalOpen(false);
      toast.success("Funds assigned successfully!");
    } catch (err) {
      console.error("Error assigning funds:", err);
      toast.error("Failed to assign funds.");
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
            Loading Site Managers...
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
                      {activeManagers}
                    </span>
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Site Managers
                  </h1>
                  <p className="text-gray-500 mt-1">
                    Manage and oversee site managers across your organization
                  </p>
                </div>
              </div>
              <button
                className="group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
                onClick={() => setIsAddModalOpen(true)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                <UserPlus size={18} className="relative z-10" />
                <span className="relative z-10">Add Site Manager</span>
              </button>
            </div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">
                      Total Managers
                    </p>
                    <p className="text-2xl font-bold text-blue-800">
                      {siteManagers.length}
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
                      {activeManagers}
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
                      {blockedManagers}
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
          {/* <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" /> */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <Users size={16} />
                      <span>Manager</span>
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
                {currentSiteManagers.map((manager, index) => (
                  <tr
                    key={manager.id}
                    className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Link 
                            to={`/admin/site-managers/${manager.id}/dashboard`}
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                              {manager.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </div>
                          </Link>
                          <div
                            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                              manager.isBlocked ? "bg-red-500" : "bg-green-500"
                            }`}
                          />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {manager.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {manager.id.slice(-8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 items-center max-w-xs">
                        {manager.sites.slice(0, 2).map((site) => (
                          <span
                            key={site.id}
                            className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200"
                          >
                            {site.name}
                            <button
                              onClick={() =>
                                handleRemoveSite(manager.id, site.id)
                              }
                              className="ml-2 text-blue-600 hover:text-red-600 transition-colors duration-200"
                            >
                              <Trash2 size={12} />
                            </button>
                          </span>
                        ))}
                        {manager.sites.length > 2 && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            +{manager.sites.length - 2} more
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setSelectedManager(manager);
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
                            {manager.email}
                          </span>
                          <button
                            onClick={() =>
                              copyToClipboard(manager.email, "Email")
                            }
                            className="text-blue-500 hover:text-blue-700 transition-colors duration-200"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                        {/* <div className="flex items-center space-x-2">
                          <Shield size={14} className="text-gray-400" />
                          <span className="text-xs text-gray-600 font-mono">
                            {showPasswords[manager.id] ? manager.password : "••••••••"}
                          </span>
                          <button
                            onClick={() => togglePasswordVisibility(manager.id)}
                            className="text-blue-500 hover:text-blue-700 transition-colors duration-200"
                          >
                            {showPasswords[manager.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                          </button>
                          {showPasswords[manager.id] && (
                            <button
                              onClick={() => copyToClipboard(manager.password, "Password")}
                              className="text-blue-500 hover:text-blue-700 transition-colors duration-200"
                            >
                              <Copy size={12} />
                            </button>
                          )}
                        </div> */}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border-2 ${
                          manager.isBlocked
                            ? "bg-gradient-to-r from-red-50 to-red-100 text-red-800 border-red-200"
                            : "bg-gradient-to-r from-green-50 to-green-100 text-green-800 border-green-200"
                        }`}
                      >
                        {manager.isBlocked ? (
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
                          onClick={() => handleToggleStatus(manager)}
                          disabled={isToggling[manager.id]}
                          className={`group relative px-3 py-2 text-xs rounded-lg font-medium transition-all duration-200 ${
                            manager.isBlocked
                              ? "bg-gradient-to-r from-green-100 to-green-200 text-green-700 hover:from-green-200 hover:to-green-300 border border-green-300"
                              : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 border border-gray-300"
                          } ${
                            isToggling[manager.id]
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:scale-105"
                          }`}
                        >
                          {isToggling[manager.id] ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : manager.isBlocked ? (
                            "Unblock"
                          ) : (
                            "Block"
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedManager(manager);
                            setIsEditModalOpen(true);
                          }}
                          className="group relative px-3 py-2 text-xs rounded-lg font-medium bg-gradient-to-r from-yellow-100 to-amber-200 text-yellow-700 hover:from-yellow-200 hover:to-amber-300 border border-yellow-300 hover:scale-105 transition-all duration-200"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleRegeneratePassword(manager)}
                          disabled={isRegenerating[manager.id]}
                          className={`group relative px-3 py-2 text-xs rounded-lg font-medium bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 hover:from-purple-200 hover:to-purple-300 border border-purple-300 transition-all duration-200 ${
                            isRegenerating[manager.id]
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:scale-105"
                          }`}
                        >
                          {isRegenerating[manager.id] ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <RefreshCw size={14} />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedManager(manager);
                            setIsAssignFundsModalOpen(true);
                          }}
                          className="group relative px-3 py-2 text-xs rounded-lg font-medium bg-gradient-to-r from-green-100 to-green-200 text-green-700 hover:from-green-200 hover:to-green-300 border border-green-300 hover:scale-105 transition-all duration-200"
                        >
                          Assign Funds
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {currentSiteManagers.length === 0 && (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No site managers found</p>
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
              {Math.min(indexOfLastItem, filteredSiteManagers.length)} of{" "}
              {filteredSiteManagers.length} site managers
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
        <AddSiteManagerModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={async (newManager) => {
            try {
              await createSiteManager({
                name: newManager.name,
                email: newManager.email,
                role: "siteManager",
              });
              const updatedManagers = await getUsersByRole("siteManager");
              setSiteManagers(
                updatedManagers.map((user) => ({
                  id: user.id,
                  name: user.name,
                  sites: user.assignedSites || [],
                  email: user.email,
                  password: user.password || "********",
                  isBlocked: user.isBlocked,
                  siteExpensesBalance: user.siteExpensesBalance,
                }))
              );
              setIsAddModalOpen(false);
              toast.success("Site manager added successfully!");
            } catch (err: unknown) {
              console.error("Error adding site manager:", err);
              toast.error("Failed to add site manager.");
            }
          }}
        />
        {selectedManager && (
          <>
            <EditSiteManagerModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              manager={selectedManager}
              onSubmit={async (updatedManager) => {
                try {
                  await updateSiteManager(selectedManager.id, {
                    name: updatedManager.name,
                    email: updatedManager.email,
                  });
                  setSiteManagers((prev) =>
                    prev.map((m) =>
                      m.id === selectedManager.id
                        ? { ...m, ...updatedManager }
                        : m
                    )
                  );
                  setIsEditModalOpen(false);
                  toast.success("Site manager updated successfully!");
                } catch (err) {
                  console.error("Error updating site manager:", err);
                  toast.error("Failed to update site manager.");
                }
              }}
            />
            <AssignSitesModal
              isOpen={isAssignModalOpen}
              onClose={() => setIsAssignModalOpen(false)}
              allSites={allSites}
              assignedSites={selectedManager.sites}
              onAssign={handleAssignSites}
            />
            <AssignFundsModal
              isOpen={isAssignFundsModalOpen}
              onClose={() => setIsAssignFundsModalOpen(false)}
              onSubmit={handleAssignFunds}
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

export default SiteManagers;
