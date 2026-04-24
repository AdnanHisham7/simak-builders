import React, { useEffect, useState, useMemo } from "react";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlignJustify,
  Users,
  Eye,
  MapPin,
  Grid,
  Activity,
  AlertCircle,
  Mail,
  Phone,
  ArrowLeft,
  DollarSign,
} from "lucide-react";
import {
  getAllContractors,
  createContractor,
  assignSiteToContractor,
  getContractorTransactions,
  addTransaction,
  updateContractor,
  deleteContractor,
} from "@/services/contractorService";
import { getSites } from "@/services/siteService";
import AddContractorModal from "./AddContractorModal";
import ContractorAssignSiteModal from "./ContractorAssignSiteModal";
import AddTransactionModal from "./AddContractorTransactionModal";
import DeleteContractorModal from "./DeleteContractorModal";

interface Contractor {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: "active" | "blocked";
  siteAssignments: { site: { id: string; name: string }; totalAmount: number }[];
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
  const [isAssignSiteModalOpen, setIsAssignSiteModalOpen] = useState(false);
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] =
    useState(false);

  const [selectedContractor, setSelectedContractor] =
    useState<Contractor | null>(null);
  const [selectedSiteIdForTx, setSelectedSiteIdForTx] = useState("");

  const [viewMode, setViewMode] = useState<
    "list" | "grid" | "details" | "transactions"
  >("list");

  const [selectedCompany, setSelectedCompany] = useState("All Companies");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [companies, setCompanies] = useState<string[]>(["All Companies"]);
  const [sites, setSites] = useState<Site[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [contractorToEdit, setContractorToEdit] = useState<Contractor | null>(
    null,
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [contractorToDelete, setContractorToDelete] =
    useState<Contractor | null>(null);

  const [newContractor, setNewContractor] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
  });
  const [inputErrors, setInputErrors] = useState({
    name: false,
    email: false,
    phone: false,
    company: false,
  });

  const [transactions, setTransactions] = useState<any[]>([]);
  const [newTransaction, setNewTransaction] = useState({
    siteId: "",
    type: "",
    amount: 0,
    description: "",
  });
  const [transactionError, setTransactionError] = useState<string | null>(null);

  const [sortBy, setSortBy] = useState<"name" | "company" | "email" | "status">(
    "name",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const itemsPerPage = 6;

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const contractorsData = await getAllContractors();
        const sitesData = await getSites();
        setContractors(contractorsData);
        setSites(sitesData);
        const uniqueCompanies = Array.from(
          new Set(contractorsData.map((c) => c.company).filter(Boolean)),
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
    filteredAndSortedContractors.length / itemsPerPage,
  );
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentContractors = filteredAndSortedContractors.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) setCurrentPage(pageNumber);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
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
      const createdContractor = await createContractor(newContractor);
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

  const openDetails = (contractor: Contractor) => {
    setSelectedContractor(contractor);
    setViewMode("details");
  };

  const openTransactions = async (contractor: Contractor, siteId: string) => {
    setSelectedContractor(contractor);
    setSelectedSiteIdForTx(siteId);
    try {
      const txs = await getContractorTransactions(contractor.id, siteId);
      setTransactions(txs);
      setViewMode("transactions");
    } catch (err) {
      setError("Failed to fetch transactions.");
    }
  };

  const handleAssignSite = async (siteId: string) => {
    if (!selectedContractor) return;
    try {
      await assignSiteToContractor(selectedContractor.id, siteId);
      const newAssignment = {
        site: {
          id: siteId,
          name: sites.find((s) => s.id === siteId)?.name || "",
        },
        balance: 0,
      };
      setSelectedContractor((prev) => ({
        ...prev!,
        siteAssignments: [...(prev?.siteAssignments || []), newAssignment],
      }));
      setIsAssignSiteModalOpen(false);
    } catch (err) {
      setError("Failed to assign site.");
    }
  };

  const handleAddTransaction = async (data: any) => {
    const response = await addTransaction(data);
    setContractors((prev) =>
      prev.map((c) =>
        c.id === response.updatedContractor.id ? response.updatedContractor : c,
      ),
    );
    if (
      selectedContractor &&
      selectedContractor.id === response.updatedContractor.id
    ) {
      setSelectedContractor(response.updatedContractor);
    }
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

  const openEditModal = (contractor: Contractor) => {
    setContractorToEdit(contractor);
    setNewContractor({
      name: contractor.name,
      email: contractor.email,
      phone: contractor.phone || "",
      company: contractor.company || "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateContractor = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!contractorToEdit) return;

    const errors = {
      name: !newContractor.name.trim(),
      email: !newContractor.email.trim() || !isValidEmail(newContractor.email),
      phone: false,
      company: false,
    };

    setInputErrors(errors);
    if (errors.name || errors.email) return;

    try {
      const updated = await updateContractor(contractorToEdit.id, {
        name: newContractor.name,
        email: newContractor.email,
        phone: newContractor.phone,
        company: newContractor.company,
      });

      // Update local state
      setContractors((prev) =>
        prev.map((c) =>
          c.id === contractorToEdit.id ? { ...c, ...updated } : c,
        ),
      );

      setIsEditModalOpen(false);
      setContractorToEdit(null);
      setNewContractor({ name: "", email: "", phone: "", company: "" });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update contractor.");
    }
  };

  const openDeleteModal = (contractor: Contractor) => {
    setContractorToDelete(contractor);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteContractor = async () => {
    if (!contractorToDelete) return;

    try {
      await deleteContractor(contractorToDelete.id);

      setContractors((prev) =>
        prev.filter((c) => c.id !== contractorToDelete.id),
      );

      setIsDeleteModalOpen(false);
      setContractorToDelete(null);

      // If currently viewing this contractor's details, go back
      if (selectedContractor?.id === contractorToDelete.id) {
        setViewMode("list");
        setSelectedContractor(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete contractor.");
    }
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

        <div className="flex gap-2">
          <button
            onClick={() => openEditModal(contractor)}
            className="px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all text-sm"
          >
            Edit
          </button>
          <button
            onClick={() => openDeleteModal(contractor)}
            className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all text-sm"
          >
            Delete
          </button>
          <button
            onClick={() => openDetails(contractor)}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2"
          >
            <Eye size={14} />
            <span>View</span>
          </button>
        </div>
      </div>
    </div>
  );

  // ======================= RENDER =======================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
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
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Contractor Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your contractors and their assignments
            </p>
          </div>
          {viewMode === "list" || viewMode === "grid" ? (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-medium flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Add Contractor</span>
            </button>
          ) : (
            <button
              onClick={() => setViewMode("list")}
              className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to List
            </button>
          )}
        </div>

        {/* Stats Cards - only show in list/grid view */}
        {(viewMode === "list" || viewMode === "grid") && (
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
        )}

        {/* ==================== DETAILS VIEW ==================== */}
        {viewMode === "details" && selectedContractor && (
          <div>
            <button
              onClick={() => setViewMode("list")}
              className="flex items-center text-blue-600 hover:text-blue-700 font-medium mb-6"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Contractors
            </button>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">
                      {selectedContractor.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">
                      {selectedContractor.name}
                    </h2>
                    <p className="text-lg text-gray-600">
                      {selectedContractor.company || "No Company"}
                    </p>
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                        selectedContractor.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {selectedContractor.status === "active"
                        ? "Active"
                        : "Blocked"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Contact Information */}
                <div className="lg:col-span-1">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Users size={20} className="mr-2 text-blue-600" />
                      Contact Information
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Mail size={16} className="text-gray-500" />
                        <span className="text-gray-700">
                          {selectedContractor.email}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone size={16} className="text-gray-500" />
                        <span className="text-gray-700">
                          {selectedContractor.phone || "Not provided"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <MapPin size={16} className="text-gray-500" />
                        <span className="text-gray-700">
                          {selectedContractor.company || "Not provided"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Site Assignments */}
                <div className="lg:col-span-2">
                  <div className="bg-white border-2 border-gray-100 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <MapPin size={20} className="mr-2 text-green-600" />
                        Site Assignments (
                        {selectedContractor.siteAssignments.length})
                      </h3>
                      <button
                        onClick={() => {
                          if (selectedContractor) {
                            setIsAssignSiteModalOpen(true);
                          }
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-200 flex items-center space-x-2"
                      >
                        <Plus size={16} />
                        <span>Assign Site</span>
                      </button>
                    </div>

                    {selectedContractor.siteAssignments.length > 0 ? (
                      <div className="space-y-4">
                        {selectedContractor.siteAssignments.map(
                          (assignment) => (
                            <div
                              key={assignment.site.id}
                              className="bg-gray-50 rounded-xl p-4 flex items-center justify-between"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                                  <MapPin size={18} className="text-white" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    {assignment.site.name}
                                  </h4>
                                  <p
                                    className={`text-sm font-medium ${assignment.totalAmount >= 0 ? "text-green-600" : "text-red-600"}`}
                                  >
                                    Total Amount: ₹
                                    {assignment.totalAmount?.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() =>
                                  openTransactions(
                                    selectedContractor,
                                    assignment.site.id,
                                  )
                                }
                                className="px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                              >
                                <Activity size={14} />
                                <span className="text-sm">Transactions</span>
                              </button>
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MapPin
                          size={48}
                          className="mx-auto text-gray-300 mb-4"
                        />
                        <p className="text-gray-500">No sites assigned yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={() => setIsAddTransactionModalOpen(true)}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-200 flex items-center space-x-2"
                >
                  <DollarSign size={16} />
                  <span>Add Transaction</span>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TRANSACTIONS VIEW ==================== */}
        {viewMode === "transactions" && selectedContractor && (
          <div>
            <button
              onClick={() => setViewMode("details")}
              className="flex items-center text-blue-600 hover:text-blue-700 font-medium mb-6"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Details
            </button>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-h-[80vh] flex flex-col">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center mb-6">
                <Activity size={24} className="mr-3 text-blue-600" />
                Transactions for {selectedContractor.name}
              </h2>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Select Site
                </label>
                <select
                  value={selectedSiteIdForTx}
                  onChange={async (e) => {
                    const siteId = e.target.value;
                    setSelectedSiteIdForTx(siteId);
                    if (siteId) {
                      try {
                        const txs = await getContractorTransactions(
                          selectedContractor.id,
                          siteId,
                        );
                        setTransactions(txs);
                      } catch (err) {
                        setError("Failed to fetch transactions.");
                      }
                    } else {
                      setTransactions([]);
                    }
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-blue-50 transition-all duration-200"
                >
                  <option value="">Select a site to view transactions</option>
                  {selectedContractor.siteAssignments.map((assignment) => (
                    <option key={assignment.site.id} value={assignment.site.id}>
                      {assignment.site.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSiteIdForTx && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Transactions for{" "}
                    {selectedContractor.siteAssignments.find(
                      (a) => a.site.id === selectedSiteIdForTx,
                    )?.site.name || "Unknown Site"}
                  </h3>

                  {transactions.length > 0 ? (
                    <div className="max-h-[400px] overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Description
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {transactions.map((tx) => (
                            <tr key={tx.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {tx.type}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                ₹{tx.amount.toFixed(2)}
                              </td>
                              <td className="px-6 py-4">
                                {tx.description || "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {new Date(tx.date).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      No transactions found for this site.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== LIST / GRID VIEW ==================== */}
        {(viewMode === "list" || viewMode === "grid") && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Contractors
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className={`p-2 rounded-xl ${viewMode === "list" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"}`}
                    >
                      <AlignJustify size={18} />
                    </button>
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-xl ${viewMode === "grid" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"}`}
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
            </div>

            {/* List or Grid */}
            {filteredAndSortedContractors.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  No contractors found
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  No contractors found
                </h3>
                <p className="mt-2 text-gray-500">
                  Try adjusting your search criteria or filters.
                </p>
              </div>
            ) : viewMode === "list" ? (
              // List View (Table) - same as old
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th
                          className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                          onClick={() => handleSort("name")}
                        >
                          Name {getSortIcon("name")}
                        </th>
                        <th
                          className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                          onClick={() => handleSort("company")}
                        >
                          Company {getSortIcon("company")}
                        </th>
                        <th
                          className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                          onClick={() => handleSort("email")}
                        >
                          Email {getSortIcon("email")}
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone
                        </th>
                        <th
                          className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                          onClick={() => handleSort("status")}
                        >
                          Status {getSortIcon("status")}
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
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
                                {contractor.name.charAt(0).toUpperCase()}
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {contractor.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {contractor.phone || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${contractor.status === "active" ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"}`}
                            >
                              {contractor.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openDetails(contractor)}
                                className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-xs font-medium hover:shadow-lg transition-all duration-200"
                              >
                                View
                              </button>

                              <button
                                onClick={() => openEditModal(contractor)}
                                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg text-xs font-medium hover:shadow-lg transition-all duration-200"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => openDeleteModal(contractor)}
                                className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg text-xs font-medium hover:shadow-lg transition-all duration-200"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              // Grid View
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentContractors.map((contractor) => (
                  <ContractorCard key={contractor.id} contractor={contractor} />
                ))}
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between mt-8">
              <div className="text-sm text-gray-500">
                Showing {indexOfFirstItem + 1} to{" "}
                {Math.min(indexOfLastItem, filteredAndSortedContractors.length)}{" "}
                of {filteredAndSortedContractors.length} contractors
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-md ${currentPage === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100"}`}
                >
                  <ChevronLeft size={18} />
                </button>
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
                        className={`w-8 h-8 flex items-center justify-center rounded-md ${currentPage === pageNum ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
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
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-md ${currentPage === totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100"}`}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* ======================= MODALS ======================= */}
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
          onSubmit={handleAddContractor}
          newContractor={newContractor}
          setNewContractor={setNewContractor}
          inputErrors={inputErrors}
          sizeStyles={getSizeStyles()}
        />

        {/* Edit Modal - Reuse the same component */}
        <AddContractorModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setContractorToEdit(null);
            setNewContractor({ name: "", email: "", phone: "", company: "" });
            setInputErrors({
              name: false,
              email: false,
              phone: false,
              company: false,
            });
          }}
          onSubmit={handleUpdateContractor}
          newContractor={newContractor}
          setNewContractor={setNewContractor}
          inputErrors={inputErrors}
          sizeStyles={getSizeStyles()}
          isEditMode={true} // Important!
        />

        <ContractorAssignSiteModal
          isOpen={isAssignSiteModalOpen && !!selectedContractor}
          onClose={() => setIsAssignSiteModalOpen(false)}
          contractor={selectedContractor}
          sites={sites}
          onAssign={handleAssignSite}
          setError={setError}
          sizeStyles={getSizeStyles()}
        />

        <AddTransactionModal
          isOpen={isAddTransactionModalOpen}
          onClose={() => setIsAddTransactionModalOpen(false)}
          contractor={selectedContractor}
          onAddTransaction={handleAddTransaction}
        />

        <DeleteContractorModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setContractorToDelete(null);
          }}
          onConfirm={handleDeleteContractor}
          contractorName={contractorToDelete?.name || ""}
        />
      </div>
    </div>
  );
};

export default Contractors;
