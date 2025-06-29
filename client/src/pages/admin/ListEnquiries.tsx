import React, { useEffect, useState } from "react";
import { getEnquiries, markEnquiryAsSeen } from "@/services/messageService";
import {
  Search,
  Mail,
  Calendar,
  Phone,
  MessageSquare,
  X,
  SortAsc,
  SortDesc,
  Eye,
} from "lucide-react";
import { useDashboardContext } from "../../context/DashboardContext";

// Define the Enquiry interface
interface Enquiry {
  _id: string;
  name: string;
  email: string;
  subject: string;
  phone: string;
  createdAt: string;
  message: string;
  status: string;
  isSeen: boolean;
}

const ListEnquiries = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isGridView, setIsGridView] = useState(false);
  const { setUnseenCount } = useDashboardContext();

  useEffect(() => {
    const fetchEnquiries = async () => {
      try {
        const data = await getEnquiries();
        setEnquiries(data);
        setLoading(false);
      } catch (err) {
        // setError("Failed to fetch enquiries");
        setLoading(false);
      }
    };
    fetchEnquiries();
  }, []);

  const openModal = (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry);
    setIsModalOpen(true);
    setTimeout(() => setIsAnimating(true), 50);
  };

  const closeModal = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setSelectedEnquiry(null);
      setIsModalOpen(false);
    }, 200);
  };

  const handleMarkAsSeen = async (id: string) => {
    try {
      const previousEnquiry = enquiries.find((enq) => enq._id === id);
      const updatedEnquiry = await markEnquiryAsSeen(id);
      setEnquiries(
        enquiries.map((enq) => (enq._id === id ? updatedEnquiry : enq))
      );
      setSelectedEnquiry(updatedEnquiry);
      if (previousEnquiry && !previousEnquiry.isSeen) {
        setUnseenCount((prev) => prev - 1);
      }
    } catch (error) {
      console.error("Failed to mark enquiry as seen", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "responded":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "in-progress":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredAndSortedEnquiries = enquiries
    .filter((enquiry) => {
      const matchesSearch =
        enquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enquiry.subject.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter =
        filterStatus === "all" || enquiry.status === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "date":
          aVal = new Date(a.createdAt);
          bVal = new Date(b.createdAt);
          break;
        default:
          aVal = a[sortBy];
          bVal = b[sortBy];
      }
      return sortOrder === "asc"
        ? aVal > bVal
          ? 1
          : -1
        : aVal < bVal
        ? 1
        : -1;
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl" />

          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded-lg w-48 mb-8"></div>
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex space-x-4">
                    <div className="h-4 bg-gray-300 rounded flex-1"></div>
                    <div className="h-4 bg-gray-300 rounded w-32"></div>
                    <div className="h-4 bg-gray-300 rounded w-24"></div>
                  </div>
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Oops! Something went wrong
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Enquiries Dashboard
          </h1>
          <p className="text-gray-600">
            Manage and track all customer inquiries
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search enquiries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="subject">Sort by Subject</option>
              </select>

              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200"
              >
                {sortOrder === "asc" ? (
                  <SortAsc className="w-5 h-5" />
                ) : (
                  <SortDesc className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedEnquiries.map((enquiry, index) => (
            <div
              key={enquiry._id}
              onClick={() => openModal(enquiry)}
              className="group bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {enquiry.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                        {enquiry.name}
                      </h3>
                      <p className="text-sm text-gray-500">{enquiry.email}</p>
                    </div>
                  </div>
                  {!enquiry.isSeen && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      New
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">Subject:</span>
                    <span className="truncate">{enquiry.subject}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-green-500" />
                    <span>{enquiry.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <span>
                      {new Date(enquiry.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mt-3">
                    {enquiry.message}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {new Date(enquiry.createdAt).toLocaleTimeString()}
                  </span>
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-normal border ${getStatusColor(
                      enquiry.status
                    )}`}
                  >
                    {enquiry.status}
                  </div>
                  <button className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium group-hover:translate-x-1 transition-all duration-200">
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredAndSortedEnquiries.length === 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No enquiries found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterStatus !== "all"
                ? "Try adjusting your search or filter criteria"
                : "No enquiries have been submitted yet"}
            </p>
            {(searchTerm || filterStatus !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterStatus("all");
                }}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {isModalOpen && selectedEnquiry && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            <div
              className={`relative bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-200 transform overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
                isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl" />
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 z-10"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>

              <div className="p-8 pt-12">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                    {selectedEnquiry.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">
                      {selectedEnquiry.name}
                    </h2>
                    <p className="text-gray-600">{selectedEnquiry.email}</p>
                  </div>
                  <div
                    className={`ml-auto px-3 py-1 rounded-full text-sm font-normal border ${getStatusColor(
                      selectedEnquiry.status
                    )}`}
                  >
                    {selectedEnquiry.status}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="w-5 h-5 text-blue-500" />
                        <span className="font-semibold text-gray-900">
                          Email
                        </span>
                      </div>
                      <p className="text-gray-700">{selectedEnquiry.email}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Phone className="w-5 h-5 text-green-500" />
                        <span className="font-semibold text-gray-900">
                          Phone
                        </span>
                      </div>
                      <p className="text-gray-700">{selectedEnquiry.phone}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-5 h-5 text-purple-500" />
                        <span className="font-semibold text-gray-900">
                          Subject
                        </span>
                      </div>
                      <p className="text-gray-700">{selectedEnquiry.subject}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-5 h-5 text-orange-500" />
                        <span className="font-semibold text-gray-900">
                          Date
                        </span>
                      </div>
                      <p className="text-gray-700">
                        {new Date(selectedEnquiry.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-500" />
                    Message
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {selectedEnquiry.message}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                  >
                    Close
                  </button>
                  {selectedEnquiry.isSeen ? (
                    <span className="flex-1 px-6 py-3 bg-gray-200 text-gray-600 rounded-xl text-center font-medium">
                      Seen
                    </span>
                  ) : (
                    <button
                      onClick={() => handleMarkAsSeen(selectedEnquiry._id)}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
                    >
                      Mark as Seen
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListEnquiries;
