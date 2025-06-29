import React, { useEffect, useState, useMemo } from "react";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlignJustify,
  Users,
  Eye,
  MapPin,
  Grid,
  Activity,
  AlertCircle,
  Mail,
  Phone,
} from "lucide-react";
import {
  getAllContractors,
  createContractor,
  assignSiteToContractor,
  getContractorTransactions,
  addTransaction,
} from "@/services/contractorService";
import { getSites } from "@/services/siteService";
import AddContractorModal from "./AddContractorModal";
import DetailsModal from "./ContractorDetailsModal";
import AssignSiteModal from "./ContractorAssignSiteModal";
import TransactionsModal from "./ContractorTransactionsModal";

interface Contractor {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: "active" | "blocked";
  siteAssignments: { site: { id: string; name: string }; balance: number }[];
}

interface Site {
  id: string;
  name: string;
}

const Contractors: React.FC = () => {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAssignSiteModalOpen, setIsAssignSiteModalOpen] = useState(false);
  const [isTransactionsModalOpen, setIsTransactionsModalOpen] = useState(false);
  const [selectedContractor, setSelectedContractor] =
    useState<Contractor | null>(null);
  const [selectedCompany, setSelectedCompany] = useState("All Companies");
  const [newContractor, setNewContractor] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
  });
  const [companies, setCompanies] = useState<string[]>(["All Companies"]);
  const [inputErrors, setInputErrors] = useState({
    name: false,
    email: false,
    phone: false,
    company: false,
  });
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [newTransaction, setNewTransaction] = useState({
    siteId: "",
    type: "",
    amount: 0,
    description: "",
  });
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [sortBy, setSortBy] = useState<"name" | "company" | "email" | "status">(
    "name"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const itemsPerPage = 6;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const contractorsData = await getAllContractors();
        const sitesData = await getSites();
        setContractors(contractorsData);
        setSites(sitesData);
        const uniqueCompanies = Array.from(
          new Set(contractorsData.map((c) => c.company).filter(Boolean))
        );
        setCompanies(["All Companies", ...uniqueCompanies]);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch data. Please try again later.");
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (
      isAddModalOpen ||
      isDetailsModalOpen ||
      isAssignSiteModalOpen ||
      isTransactionsModalOpen
    ) {
      setIsAnimating(true);
    }
  }, [
    isAddModalOpen,
    isDetailsModalOpen,
    isAssignSiteModalOpen,
    isTransactionsModalOpen,
  ]);

  const filteredAndSortedContractors = useMemo(() => {
    let filtered = contractors.filter((contractor) => {
      const matchesSearch =
        contractor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contractor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contractor.phone && contractor.phone.includes(searchTerm));
      const matchesCompany =
        selectedCompany === "All Companies" ||
        contractor.company === selectedCompany;
      const matchesStatus =
        statusFilter === "All Statuses" || contractor.status === statusFilter;
      return matchesSearch && matchesCompany && matchesStatus;
    });

    filtered.sort((a, b) => {
      const aValue = (a[sortBy] || "").toLowerCase();
      const bValue = (b[sortBy] || "").toLowerCase();
      return sortOrder === "asc"
        ? aValue < bValue
          ? -1
          : 1
        : aValue > bValue
        ? -1
        : 1;
    });

    return filtered;
  }, [
    contractors,
    searchTerm,
    selectedCompany,
    statusFilter,
    sortBy,
    sortOrder,
  ]);

  const totalPages = Math.ceil(
    filteredAndSortedContractors.length / itemsPerPage
  );
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentContractors = filteredAndSortedContractors.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) setCurrentPage(pageNumber);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewContractor((prev) => ({ ...prev, [name]: value }));
    if (inputErrors[name as keyof typeof inputErrors]) {
      setInputErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleAddContractor = async (e: React.MouseEvent) => {
    e.preventDefault();
    const errors = {
      name: !newContractor.name.trim(),
      email: !newContractor.email.trim() || !isValidEmail(newContractor.email),
      phone: false,
      company: false,
    };
    setInputErrors(errors);
    if (errors.name || errors.email) return;

    try {
      const createdContractor = await createContractor({
        name: newContractor.name,
        email: newContractor.email,
        phone: newContractor.phone,
        company: newContractor.company,
      });
      setContractors((prev) => [...prev, createdContractor]);
      if (newContractor.company && !companies.includes(newContractor.company)) {
        setCompanies((prev) => [...prev, newContractor.company]);
      }
      setNewContractor({ name: "", email: "", phone: "", company: "" });
      setIsAddModalOpen(false);
    } catch (err) {
      setError("Failed to add contractor.");
    }
  };

  const handleAssignSite = async (siteId: string) => {
    try {
      await assignSiteToContractor(selectedContractor!.id, siteId);
      const newAssignment = {
        site: {
          id: siteId,
          name: sites.find((s) => s.id === siteId)?.name || "",
        },
        balance: 0,
      };
      setSelectedContractor((prev) => ({
        ...prev!,
        siteAssignments: [...prev!.siteAssignments, newAssignment],
      }));
      setIsAssignSiteModalOpen(false);
    } catch (err) {
      setError("Failed to assign site.");
    }
  };

  const handleAddTransaction = async (data) => {
    const response = await addTransaction(data);
    setContractors((prev) =>
      prev.map((c) =>
        c.id === response.updatedContractor.id ? response.updatedContractor : c
      )
    );
    setSelectedContractor(response.updatedContractor);
    return response;
  };

  const handleSort = (field: "name" | "company" | "email" | "status") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: "name" | "company" | "email" | "status") => {
    if (sortBy !== field) return "↕️";
    return sortOrder === "asc" ? "↑" : "↓";
  };

  const getSizeStyles = () => "max-w-2xl w-full mx-4";

  const StatsCard = ({ icon: Icon, title, value, color }: any) => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-2xl ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  const ContractorCard = ({ contractor }: { contractor: Contractor }) => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {contractor.name.charAt(0)}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{contractor.name}</h3>
            <p className="text-sm text-gray-500">
              {contractor.company || "No Company"}
            </p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            contractor.status === "active"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {contractor.status === "active" ? "Active" : "Blocked"}
        </span>
      </div>
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Mail size={14} className="mr-2" />
          {contractor.email}
        </div>
        {contractor.phone && (
          <div className="flex items-center text-sm text-gray-600">
            <Phone size={14} className="mr-2" />
            {contractor.phone}
          </div>
        )}
        <div className="flex items-center text-sm text-gray-600">
          <MapPin size={14} className="mr-2" />
          {contractor.siteAssignments.length} sites assigned
        </div>
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="text-sm text-gray-600">
          Total Balance:{" "}
          <span className="font-semibold text-gray-900">
            $
            {contractor.siteAssignments
              .reduce((sum, assignment) => sum + assignment.balance, 0)
              .toFixed(2)}
          </span>
        </div>
        <button
          onClick={() => {
            setSelectedContractor(contractor);
            setIsDetailsModalOpen(true);
          }}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2"
        >
          <Eye size={14} />
          <span>View Details</span>
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl" />
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-6">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Contractor Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your contractors and their assignments
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-medium flex items-center space-x-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span>Add Contractor</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            icon={Users}
            title="Total Contractors"
            value={contractors.length}
            color="bg-gradient-to-br from-blue-500 to-purple-600"
          />
          <StatsCard
            icon={Activity}
            title="Active Contractors"
            value={contractors.filter((c) => c.status === "active").length}
            color="bg-gradient-to-br from-green-500 to-blue-500"
          />
          <StatsCard
            icon={AlertCircle}
            title="Blocked Contractors"
            value={contractors.filter((c) => c.status === "blocked").length}
            color="bg-gradient-to-br from-red-500 to-pink-600"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-8 relative">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Contractors
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
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
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Company
              </label>
              <select
                value={selectedCompany}
                onChange={(e) => {
                  setSelectedCompany(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                {companies.map((company) => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="All Statuses">All Statuses</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <div className="flex items-end space-x-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-xl ${
                    viewMode === "list"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <AlignJustify size={18} />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-xl ${
                    viewMode === "grid"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Grid size={18} />
                </button>
              </div>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCompany("All Companies");
                  setStatusFilter("All Statuses");
                  setCurrentPage(1);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {indexOfFirstItem + 1} to{" "}
              {Math.min(indexOfLastItem, filteredAndSortedContractors.length)}{" "}
              of {filteredAndSortedContractors.length} contractors
            </span>
            <span>Total Companies: {companies.length - 1}</span>
          </div>
        </div>

        {filteredAndSortedContractors.length === 0 ? (
          <div className="p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No contractors found
            </h3>
            <p className="mt-2 text-gray-500">
              {searchTerm ||
              selectedCompany !== "All Companies" ||
              statusFilter !== "All Statuses"
                ? "Try adjusting your search criteria or filters."
                : "Get started by adding your first contractor."}
            </p>
          </div>
        ) : viewMode === "list" ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden relative">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Name</span>
                        <span className="text-gray-400">
                          {getSortIcon("name")}
                        </span>
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                      onClick={() => handleSort("company")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Company</span>
                        <span className="text-gray-400">
                          {getSortIcon("company")}
                        </span>
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                      onClick={() => handleSort("email")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Email</span>
                        <span className="text-gray-400">
                          {getSortIcon("email")}
                        </span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                      onClick={() => handleSort("status")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Status</span>
                        <span className="text-gray-400">
                          {getSortIcon("status")}
                        </span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentContractors.map((contractor) => (
                    <tr
                      key={contractor.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
                              {contractor.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {contractor.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                          {contractor.company || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {contractor.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {contractor.phone || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                            contractor.status === "active"
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : "bg-red-100 text-red-800 border border-red-200"
                          }`}
                        >
                          {contractor.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => {
                            setSelectedContractor(contractor);
                            setIsDetailsModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-xs font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentContractors.map((contractor) => (
              <ContractorCard key={contractor.id} contractor={contractor} />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-500">
            Showing {indexOfFirstItem + 1} to{" "}
            {Math.min(indexOfLastItem, filteredAndSortedContractors.length)} of{" "}
            {filteredAndSortedContractors.length} contractors
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
                      className="w-8 h-8 flex items-center justify-center"
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

        <AddContractorModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setNewContractor({ name: "", email: "", phone: "", company: "" });
            setInputErrors({
              name: false,
              email: false,
              phone: false,
              company: false,
            });
          }}
          onAdd={handleAddContractor}
          newContractor={newContractor}
          setNewContractor={setNewContractor}
          inputErrors={inputErrors}
          setInputErrors={setInputErrors}
          isAnimating={isAnimating}
          sizeStyles={getSizeStyles()}
        />
        <DetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          selectedContractor={selectedContractor}
          sites={sites}
          setIsAssignSiteModalOpen={setIsAssignSiteModalOpen}
          setSelectedSiteId={setSelectedSiteId}
          setIsTransactionsModalOpen={setIsTransactionsModalOpen}
          setTransactions={setTransactions}
          setError={setError}
          isAnimating={isAnimating}
          handleAddTransaction={handleAddTransaction}
        />
        <AssignSiteModal
          isOpen={isAssignSiteModalOpen}
          onClose={() => setIsAssignSiteModalOpen(false)}
          contractor={selectedContractor}
          sites={sites}
          onAssign={handleAssignSite}
          setSelectedContractor={setSelectedContractor}
          setIsAssignSiteModalOpen={setIsAssignSiteModalOpen}
          setError={setError}
          isAnimating={isAnimating}
          sizeStyles={getSizeStyles()}
        />
        <TransactionsModal
          isOpen={isTransactionsModalOpen}
          onClose={() => {
            setIsTransactionsModalOpen(false);
            setSelectedSiteId("");
            setTransactions([]);
          }}
          contractor={selectedContractor}
          sites={sites}
          transactions={transactions}
          setTransactions={setTransactions}
          onAddTransaction={handleAddTransaction}
          selectedSiteId={selectedSiteId}
          setSelectedContractor={setSelectedContractor}
          setContractors={setContractors}
          newTransaction={newTransaction}
          setNewTransaction={setNewTransaction}
          setTransactionError={setTransactionError}
          isAnimating={isAnimating}
        />
      </div>
    </div>
  );
};

export default Contractors;
