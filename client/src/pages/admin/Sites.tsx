import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertCircle,
  AlignJustify,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  BarChart3,
  Eye,
  Edit,
  Archive,
  MapPin,
  Building2,
  Clock,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Upload,
  ShoppingCart,
} from "lucide-react";
import { createSite, getSites, Site } from "@/services/siteService";
import { getUsersByRole } from "@/services/userService";
import { UserRole } from "@/types/user";
import AddSiteModal from "./AddSiteModal";
import AddPurchaseModal from "./AddPurchaseModal";
import { useNavigate } from "react-router-dom";

interface User {
  id: string;
  name: string;
  role: string;
}

const getProjectStatuses = (sites: Site[]) => {
  const statuses = sites.map((site) => site.status);
  return ["All Statuses", ...Array.from(new Set(statuses))];
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case "in progress":
    case "active":
      return <Clock className="w-4 h-4 text-blue-500" />;
    case "pending":
      return <Circle className="w-4 h-4 text-yellow-500" />;
    case "on hold":
      return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    default:
      return <Circle className="w-4 h-4 text-gray-400" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-green-50 text-green-700 border-green-200";
    case "in progress":
    case "active":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "pending":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "on hold":
      return "bg-orange-50 text-orange-700 border-orange-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

const getActionsForRole = (role: UserType): string[] => {
  switch (role) {
    case "admin":
      return ["view", "addPurchase"];
    case "siteManager":
      return ["view", "addPurchase"];
    case "supervisor":
      return ["view", "addPurchase"];
    case "architect":
      return ["view", "uploadDocuments"];
    case "client":
      return ["view", "viewProgress"];
    default:
      return ["view"];
  }
};

const Sites: React.FC = () => {
  const { userType } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddPurchaseModalOpen, setIsAddPurchaseModalOpen] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedProjectStatus, setSelectedProjectStatus] =
    useState("All Statuses");
  const [clients, setClients] = useState<User[]>([]);
  const [siteManagers, setSiteManagers] = useState<User[]>([]);
  const [architects, setArchitects] = useState<User[]>([]);
  const [projectStatuses, setProjectStatuses] = useState<string[]>([
    "All Statuses",
  ]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [viewMode] = useState<"table" | "cards">("table");

  const itemsPerPage = 8;

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleViewSite = (siteId: string) => {
    if (userType === "admin") {
      navigate(`/admin/sites/${siteId}`); // Navigate to site detail page
    } else if (userType === "siteManager") {
      navigate(`/siteManager/sites/${siteId}`);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedSites, clientList, managerList, architectList] =
          await Promise.all([
            getSites(),
            getUsersByRole(UserRole.Client),
            getUsersByRole(UserRole.SiteManager),
            getUsersByRole(UserRole.Architect),
          ]);
        const mappedSites = fetchedSites.map((site) => ({
          id: site.id,
          name: site.name,
          location: `${site.address}, ${site.city}, ${site.state} ${site.zip}`
            .trim()
            .replace(/^,|,$/g, ""),
          status: site.status || "Unknown",
          clientName: site.client?.name || "Unknown",
          budget: site.budget,
          expenses: site.expenses,
          createdAt: new Date(site.createdAt).toLocaleDateString(),
          siteManagerCount: site.siteManagerCount,
          architectCount: site.architectCount,
          completedPhases: site.completedPhases,
          totalPhases: site.totalPhases,
        }));
        console.log("HAHAHAHA", fetchedSites);
        setSites(mappedSites);
        setProjectStatuses(getProjectStatuses(mappedSites));
        setClients(clientList);
        setSiteManagers(managerList);
        setArchitects(architectList);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch data. Please try again later.");
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredSites = sites.filter((site) => {
    const matchesSearch =
      site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      selectedProjectStatus === "All Statuses" ||
      site.status === selectedProjectStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredSites.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSites = filteredSites.slice(indexOfFirstItem, indexOfLastItem);

  const totalBudget = sites.reduce((sum, site) => sum + site.budget, 0);
  const totalExpenses = sites.reduce((sum, site) => sum + site.expenses, 0);
  const completedSites = sites.filter(
    (site) => site.status.toLowerCase() === "completed"
  ).length;
  const activeSites = sites.filter(
    (site) =>
      site.status.toLowerCase() === "active" ||
      site.status.toLowerCase() === "in progress"
  ).length;

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleModalSubmit = async (siteData: any) => {
    try {
      const createdSite = await createSite(siteData);
      const mappedSite = {
        id: createdSite.id,
        name: createdSite.name,
        location:
          `${createdSite.address}, ${createdSite.city}, ${createdSite.state} ${createdSite.zip}`
            .trim()
            .replace(/^,|,$/g, ""),
        status: createdSite.status || "Unknown",
        clientName: createdSite.client?.name || "Unknown",
        budget: createdSite.budget,
        expenses: createdSite.expenses,
        createdAt: new Date(createdSite.createdAt).toLocaleDateString(),
        siteManagerCount: createdSite.siteManagerCount || 0,
        architectCount: createdSite.architectCount || 0,
        completedPhases: createdSite.completedPhases || 0,
        totalPhases: createdSite.totalPhases || createdSite.phases.length,
      };
      setSites((prevSites) => [...prevSites, mappedSite]);
      if (!projectStatuses.includes(createdSite.status) && createdSite.status) {
        setProjectStatuses((prev) => [...prev, createdSite.status]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error creating site:", err);
    }
  };

  const handleEditSite = (siteId: string) => {
    console.log(`Open edit modal for site ${siteId}`);
  };

  const handleArchiveSite = (siteId: string) => {
    console.log(`Archive site ${siteId}`);
  };

  const handleManageAttendance = (siteId: string) => {
    console.log(`Open attendance modal for site ${siteId}`);
  };

  const handleAddPurchase = (siteId: string) => {
    setSelectedSiteId(siteId);
    setIsAddPurchaseModalOpen(true);
  };

  const handleUploadDocuments = (siteId: string) => {
    console.log(`Open upload documents modal for site ${siteId}`);
  };

  const handleViewProgress = (siteId: string) => {
    console.log(`Navigate to progress page for site ${siteId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-10 w-48 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6"
                >
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 bg-gray-300 rounded"></div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
              <div className="p-6">
                <div className="h-12 bg-gray-100 rounded mb-4"></div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-50 rounded mb-2"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 max-w-md w-full transform transition-all duration-200">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-t-2xl"></div>
          <div className="flex items-center mb-4">
            <AlertCircle className="text-red-500 Mr-3" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">
              Error Loading Sites
            </h3>
          </div>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 font-medium shadow-lg"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6 transition-all duration-700 ${
        isAnimating ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-2">
              Site Management
            </h1>
            <p className="text-gray-600 text-lg">
              Manage and monitor your construction sites
            </p>
          </div>
          {userType === "admin" && (
            <div className="flex gap-3">
              <button
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 flex items-center font-medium shadow-lg hover:shadow-xl"
                onClick={() => setIsModalOpen(true)}
              >
                <Plus size={20} className="mr-2" />
                <span>Add New Site</span>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 p-6 transform hover:scale-105 transition-all duration-200 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Sites</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {sites.length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 p-6 transform hover:scale-105 transition-all duration-200 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Active Sites
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {activeSites}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 p-6 transform hover:scale-105 transition-all duration-200 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Total Budget
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  ₹{(totalBudget / 1000000).toFixed(1)}M
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 p-6 transform hover:scale-105 transition-all duration-200 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-red-500"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Completed</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {completedSites}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        <div
          className={`relative bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-500 transform overflow-hidden ${
            isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
        >
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl" />
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="relative flex-grow">
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
                  placeholder="Search sites by name or location..."
                  className="pl-12 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                />
              </div>
              <div className="relative min-w-[200px]">
                <Filter
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <select
                  value={selectedProjectStatus}
                  onChange={(e) => {
                    setSelectedProjectStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-12 pr-10 py-3 w-full border border-gray-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white cursor-pointer"
                >
                  {projectStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {filteredSites.length === 0 ? (
              <div className="text-center py-16">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-gray-100 rounded-full">
                    <AlignJustify size={48} className="text-gray-400" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No sites found
                </h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  We couldn't find any sites matching your search criteria. Try
                  adjusting your filters or search terms.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedProjectStatus("All Statuses");
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transform hover:scale-105 transition-all duration-200 font-medium"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-hidden rounded-xl border border-gray-200 mb-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Site Details
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Status & Client
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Financial
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Team & Progress
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {currentSites.map((site, index) => {
                          const actions = getActionsForRole(userType);
                          return (
                            <tr
                              key={site.id}
                              className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 group"
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                    <Building2 className="h-6 w-6 text-white" />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                                      {site.name}
                                    </div>
                                    <div className="text-sm text-gray-500 flex items-center mt-1">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      {site.location}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="space-y-2">
                                  <div
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                      site.status
                                    )}`}
                                  >
                                    {getStatusIcon(site.status)}
                                    <span className="ml-1">{site.status}</span>
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {site.clientName}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="space-y-1">
                                  <div className="text-sm font-semibold text-gray-900">
                                    ₹{site.budget.toLocaleString()}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Spent: ₹{site.expenses.toLocaleString()}
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div
                                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1.5 rounded-full transition-all duration-300"
                                      style={{
                                        width: `${Math.min(
                                          (site.expenses / site.budget) * 100,
                                          100
                                        )}%`,
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                                    <div className="flex items-center">
                                      <Users className="h-4 w-4 mr-1" />
                                      {site.siteManagerCount +
                                        site.architectCount}
                                    </div>
                                    <div className="flex items-center">
                                      <Calendar className="h-4 w-4 mr-1" />
                                      {site.createdAt}
                                    </div>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="text-xs text-gray-500 mr-2">
                                      Progress:
                                    </span>
                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                      <div
                                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-300"
                                        style={{
                                          width: `${
                                            site.totalPhases > 0
                                              ? (site.completedPhases /
                                                  site.totalPhases) *
                                                100
                                              : 0
                                          }%`,
                                        }}
                                      ></div>
                                    </div>
                                    <span className="text-xs text-gray-600 ml-2">
                                      {site.completedPhases}/{site.totalPhases}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex space-x-2">
                                  {actions.includes("view") && (
                                    <button
                                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                      onClick={() => handleViewSite(site.id)}
                                    >
                                      <Eye size={16} />
                                    </button>
                                  )}
                                  {actions.includes("edit") && (
                                    <button
                                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                                      onClick={() => handleEditSite(site.id)}
                                    >
                                      <Edit size={16} />
                                    </button>
                                  )}
                                  {actions.includes("archive") && (
                                    <button
                                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                      onClick={() => handleArchiveSite(site.id)}
                                    >
                                      <Archive size={16} />
                                    </button>
                                  )}
                                  {actions.includes("manageAttendance") && (
                                    <button
                                      className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
                                      onClick={() =>
                                        handleManageAttendance(site.id)
                                      }
                                    >
                                      <Calendar size={16} />
                                    </button>
                                  )}
                                  {actions.includes("addPurchase") && (
                                    <button
                                      className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all duration-200"
                                      onClick={() => handleAddPurchase(site.id)}
                                    >
                                      <ShoppingCart size={16} />
                                    </button>
                                  )}
                                  {actions.includes("uploadDocuments") && (
                                    <button
                                      className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all duration-200"
                                      onClick={() =>
                                        handleUploadDocuments(site.id)
                                      }
                                    >
                                      <Upload size={16} />
                                    </button>
                                  )}
                                  {actions.includes("viewProgress") && (
                                    <button
                                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                                      onClick={() =>
                                        handleViewProgress(site.id)
                                      }
                                    >
                                      <TrendingUp size={16} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between bg-gray-50 px-6 py-4 rounded-xl">
                  <div className="text-sm text-gray-600 mb-4 sm:mb-0">
                    Showing{" "}
                    <span className="font-semibold text-gray-900">
                      {indexOfFirstItem + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold text-gray-900">
                      {Math.min(indexOfLastItem, filteredSites.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-gray-900">
                      {filteredSites.length}
                    </span>{" "}
                    sites
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        currentPage === 1
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-600 hover:bg-white hover:shadow-md hover:text-blue-600"
                      }`}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div className="flex space-x-1">
                      {[...Array(totalPages)].map((_, index) => {
                        const pageNum = index + 1;
                        if (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= currentPage - 1 &&
                            pageNum <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => paginate(pageNum)}
                              className={`w-10 h-10 flex items-center justify-center rounded-lg font-medium transition-all duration-200 ${
                                currentPage === pageNum
                                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                                  : "text-gray-600 hover:bg-white hover:shadow-md hover:text-blue-600"
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
                              className="w-10 h-10 flex items-center justify-center text-gray-400"
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
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        currentPage === totalPages
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-600 hover:bg-white hover:shadow-md hover:text-blue-600"
                      }`}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {isModalOpen && (
          <AddSiteModal
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleModalSubmit}
            clients={clients}
            siteManagers={siteManagers}
            architects={architects}
          />
        )}
        {isAddPurchaseModalOpen && (
          <AddPurchaseModal
            siteId={selectedSiteId!}
            onClose={() => setIsAddPurchaseModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Sites;
