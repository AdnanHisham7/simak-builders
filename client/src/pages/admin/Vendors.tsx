import React, { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Package,
  Phone,
  Mail,
  User,
  Calendar,
  DollarSign,
  Filter,
  Grid,
  List,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  getVendors,
  createVendor,
  updateVendor,
  deleteVendor,
  getPurchasesByVendor,
  settleVendorPayments,
} from "@/services/vendorService";

interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  totalPurchases: number;
  totalAmount: number;
  outstandingAmount: number;
  status: "active" | "inactive";
}

interface Purchase {
  _id: string;
  site: { name: string } | null;
  createdAt: string;
  totalAmount: number;
  status: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    price: number;
    category: string;
  }>;
  billUpload: {
    name: string;
    url: string;
    uploadDate: string;
  };
  payment: {
    method: "cash" | "credit";
    isPaid: boolean;
  };
}

interface VendorFormData {
  name: string;
  email: string;
  phone: string;
}

const Vendors: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [currentVendor, setCurrentVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState<VendorFormData>({
    name: "",
    email: "",
    phone: "",
  });
  const [selectedVendorPurchases, setSelectedVendorPurchases] = useState<
    Purchase[]
  >([]);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] =
    useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [expandedStats, setExpandedStats] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getVendors();
        setVendors(data);
      } catch (err) {
        setError("Failed to fetch vendors");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    setIsAnimating(true);
  }, []);

  const getSizeStyles = () => {
    return "w-full max-w-7xl mx-auto";
  };

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || vendor.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: vendors.length,
    active: vendors.filter((v) => v.status === "active").length,
    inactive: vendors.filter((v) => v.status === "inactive").length,
    totalAmount: vendors.reduce((sum, v) => sum + v.totalAmount, 0),
    totalPurchases: vendors.reduce((sum, v) => sum + v.totalPurchases, 0),
    totalOutstanding: vendors.reduce(
      (sum, v) => sum + (v.outstandingAmount || 0),
      0
    ),
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setFormData({ name: "", email: "", phone: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (vendor: Vendor) => {
    setIsEditMode(true);
    setCurrentVendor(vendor);
    setFormData({
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentVendor(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditMode && currentVendor) {
        await updateVendor(currentVendor.id, formData);
      } else {
        await createVendor(formData);
      }
      closeModal();
      const data = await getVendors();
      setVendors(data);
    } catch (err) {
      setError("Operation failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this vendor?")) {
      try {
        await deleteVendor(id);
        const data = await getVendors();
        setVendors(data);
      } catch (err) {
        setError("Failed to delete vendor");
      }
    }
  };

  const openPurchaseModal = async (vendorId: string) => {
    try {
      const purchases = await getPurchasesByVendor(vendorId);
      setSelectedVendorPurchases(purchases);
      setIsPurchaseModalOpen(true);
    } catch (err) {
      setError("Failed to fetch purchases");
    }
  };

  const closePurchaseModal = () => {
    setIsPurchaseModalOpen(false);
    setSelectedVendorPurchases([]);
  };

  const handleSettle = async (vendorId: string) => {
    if (
      window.confirm(
        "Are you sure you want to settle the outstanding amount for this vendor?"
      )
    ) {
      try {
        await settleVendorPayments(vendorId);
        const data = await getVendors();
        setVendors(data);
      } catch (err) {
        setError("Failed to settle payment");
      }
    }
  };

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-6">
      <div className={`max-w-7xl mx-auto`}>
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Vendor Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your vendors, track purchases, and monitor relationships
              </p>
            </div>
            <button
              onClick={openCreateModal}
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
              <span>Add Vendor</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Overview Statistics
            </h2>
            <button
              onClick={() => setExpandedStats(!expandedStats)}
              className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
            >
              {expandedStats ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>
          <div
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 transition-all duration-300 ${
              expandedStats ? "opacity-100 max-h-96" : "opacity-100 max-h-32"
            }`}
          >
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">
                    Total Vendors
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {stats.total}
                  </p>
                </div>
                <User className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">
                    Active Vendors
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {stats.active}
                  </p>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-medium">
                    Inactive Vendors
                  </p>
                  <p className="text-2xl font-bold text-red-900">
                    {stats.inactive}
                  </p>
                </div>
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">
                    Total Purchases
                  </p>
                  <p className="text-2xl font-bold text-purple-900">
                    {stats.totalPurchases}
                  </p>
                </div>
                <Package className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">
                    Total Value
                  </p>
                  <p className="text-2xl font-bold text-orange-900">
                    ${stats.totalAmount.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-orange-500" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-pink-100 p-6 rounded-xl border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-medium">
                    Total Outstanding
                  </p>
                  <p className="text-2xl font-bold text-red-900">
                    ${stats.totalOutstanding?.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-red-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Vendors
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex items-end space-x-2">
              <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${
                    viewMode === "grid"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${
                    viewMode === "list"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="pb-8">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVendors.map((vendor) => (
                <div
                  key={vendor.id}
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                        {vendor.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {vendor.name}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            vendor.status === "active"
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : "bg-red-100 text-red-800 border border-red-200"
                          }`}
                        >
                          {vendor.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 mr-2" />
                      <span>{vendor.email}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      <span>{vendor.phone}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>
                        Since {new Date(vendor.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {vendor.totalPurchases}
                      </p>
                      <p className="text-xs text-gray-500">Purchases</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        ${vendor.totalAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">Total Value</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">
                        ${vendor.outstandingAmount?.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">Outstanding</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openPurchaseModal(vendor.id)}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-200 flex items-center justify-center"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Purchases
                    </button>
                    <button
                      onClick={() => openEditModal(vendor)}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 flex items-center justify-center"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(vendor.id)}
                      className="px-3 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {vendor.outstandingAmount > 0 && (
                      <button
                        onClick={() => handleSettle(vendor.id)}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-200"
                      >
                        Settle ${vendor.outstandingAmount.toFixed(2)}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statistics
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVendors.map((vendor) => (
                    <tr
                      key={vendor.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
                              {vendor.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {vendor.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Since{" "}
                              {new Date(vendor.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {vendor.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {vendor.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            vendor.status === "active"
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : "bg-red-100 text-red-800 border border-red-200"
                          }`}
                        >
                          {vendor.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {vendor.totalPurchases} purchases
                        </div>
                        <div className="text-sm text-gray-500">
                          ${vendor.totalAmount.toLocaleString()} total
                        </div>
                        <div className="text-sm text-red-500">
                          ${vendor.outstandingAmount?.toLocaleString()}{" "}
                          outstanding
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openPurchaseModal(vendor.id)}
                            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(vendor)}
                            className="text-yellow-600 hover:text-yellow-900 p-1 rounded hover:bg-yellow-50"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(vendor.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {vendor.outstandingAmount > 0 && (
                            <button
                              onClick={() => handleSettle(vendor.id)}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                            >
                              Settle
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-200 scale-100">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl" />
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">
                  {isEditMode ? "Edit Vendor" : "Add New Vendor"}
                </h2>
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vendor Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="Enter vendor name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all font-medium"
                    >
                      {isEditMode ? "Update Vendor" : "Create Vendor"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {isPurchaseModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-t-2xl" />
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">
                  Purchase History
                </h2>
                <div className="max-h-96 overflow-y-auto">
                  {selectedVendorPurchases.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">
                        No purchases found for this vendor.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedVendorPurchases.map((purchase) => (
                        <div
                          key={purchase._id}
                          className="bg-gray-50 rounded-xl p-6 border border-gray-200"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                Site
                              </p>
                              <p className="text-gray-900">
                                {purchase.site ? purchase.site.name : "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                Date
                              </p>
                              <p className="text-gray-900">
                                {new Date(
                                  purchase.createdAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                Total Amount
                              </p>
                              <p className="text-2xl font-bold text-green-600">
                                ${purchase.totalAmount.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                Status
                              </p>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {purchase.status}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                Payment Method
                              </p>
                              <p className="text-gray-900">
                                {purchase.payment.method}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                Payment Status
                              </p>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  purchase.payment.isPaid
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {purchase.payment.isPaid ? "Paid" : "Unpaid"}
                              </span>
                            </div>
                          </div>
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Items ({purchase.items.length})
                            </p>
                            <div className="space-y-2">
                              {purchase.items.map((item, index) => (
                                <div
                                  key={index}
                                  className="bg-white p-3 rounded-lg border border-gray-200"
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-medium text-gray-900">
                                        {item.name}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        Category: {item.category}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-medium text-gray-900">
                                        {item.quantity} {item.unit}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        ${item.price} each
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              Bill Upload
                            </p>
                            <a
                              href={`${import.meta.env.VITE_API_URL}${
                                purchase.billUpload?.url
                              }`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              {purchase.billUpload?.name}
                            </a>
                            <p className="text-sm text-gray-500">
                              Uploaded:{" "}
                              {new Date(
                                purchase.billUpload?.uploadDate
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={closePurchaseModal}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Vendors;
