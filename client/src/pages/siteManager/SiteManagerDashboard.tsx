import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCurrentUser, getUserById } from "@/services/userService"; // Ensure getUserById is imported
import {
  DollarSign,
  CreditCard,
  Building2,
  MapPin,
  ChevronRight,
  Check,
  Clock,
  ChevronLeft,
  X,
} from "lucide-react";

const SiteManagerDashboard: React.FC = () => {
  const { managerId } = useParams<{ managerId: string }>(); // Get managerId from URL
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeTable, setActiveTable] = useState<"salary" | "expense" | null>(
    null
  );
  const [salaryPage, setSalaryPage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        let data;
        if (managerId) {
          // Admin viewing a specific site manager's dashboard
          data = await getUserById(managerId);
        } else {
          // Site manager viewing their own dashboard
          data = await getCurrentUser();
          console.log(data)
        }
        setUserData(data);
        setLoading(false);
        setTimeout(() => setIsAnimating(true), 100);
      } catch (err: any) {
        setError(err.message || "Failed to fetch user data");
        setLoading(false);
      }
    };
    fetchUserData();
  }, [managerId]); // Add managerId as dependency

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div className="text-gray-600 font-medium">
              Loading dashboard...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-red-200">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-t-2xl" />
          <div className="text-red-600 font-medium mt-2">Error: {error}</div>
        </div>
      </div>
    );
  }

  const {
    totalSalary,
    salaryAssignments,
    siteExpensesBalance,
    siteExpensesTransactions,
    assignedSites,
    name, // Add name to display whose dashboard it is
  } = userData;

  const handleStatCardClick = (type: "salary" | "expense") => {
    if (activeTable === type) {
      setActiveTable(null);
    } else {
      setActiveTable(type);
      if (type === "salary") setSalaryPage(1);
      if (type === "expense") setExpensePage(1);
    }
  };

  const StatsCard = ({
    title,
    amount,
    icon: Icon,
    gradient,
    onClick,
    isActive = false,
  }: {
    title: string;
    amount: number;
    icon: React.ComponentType<any>;
    gradient: string;
    onClick: () => void;
    isActive?: boolean;
  }) => (
    <div
      className={`relative bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300 transform cursor-pointer hover:scale-105 hover:shadow-3xl ${
        isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
      } ${isActive ? "ring-2 ring-blue-500 ring-opacity-50" : ""}`}
      onClick={onClick}
    >
      <div
        className={`absolute top-0 left-0 right-0 h-2 ${gradient} rounded-t-2xl`}
      />
      <div className="p-8">
        <div className="flex items-center justify-between mb-4">
          <Icon className="w-8 h-8 text-gray-600" />
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100 px-3 py-1 rounded-full">
            Click to view details
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
        <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
          ₹{amount.toLocaleString()}
        </p>
      </div>
    </div>
  );

  const TransactionTable = ({
    title,
    transactions,
    type,
    currentPage,
    setCurrentPage,
  }: {
    title: string;
    transactions: any[];
    type: "salary" | "expense";
    currentPage: number;
    setCurrentPage: (page: number) => void;
  }) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedTransactions = transactions.slice(startIndex, endIndex);
    const totalPages = Math.ceil(transactions.length / itemsPerPage);

    return (
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden mb-8">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
              {title}
            </h2>
            <button
              onClick={() => setActiveTable(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  {type === "salary" ? (
                    <>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Given By
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Site
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Given By
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedTransactions.map(
                  (transaction: any, index: number) => (
                    <tr
                      key={index}
                      className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                        ₹{transaction.amount.toLocaleString()}
                      </td>
                      {type === "salary" ? (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {transaction.givenBy?.name || "auto"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${
                                transaction.isVerified
                                  ? "bg-green-100 text-green-800 border border-green-200"
                                  : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                              }`}
                            >
                              {transaction.isVerified ? (
                                <>
                                  <Check className="w-3 h-3 mr-1" /> Verified
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 mr-1" /> Pending
                                </>
                              )}
                            </span>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              {transaction.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 max-w-48 truncate">
                            {transaction.description || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {transaction.site?.name || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {transaction.givenBy?.name || "-"}
                          </td>
                        </>
                      )}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 px-6 py-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, transactions.length)} of{" "}
                {transactions.length} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>
                <div className="flex space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          page === currentPage
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Determine the base path for site detail links
  const siteBasePath = managerId ? "/admin/sites" : "/siteManager/sites";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div
          className={`mb-12 transition-all duration-500 ${
            isAnimating
              ? "translate-y-0 opacity-100"
              : "translate-y-4 opacity-0"
          }`}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-4">
            {managerId ? `${name}'s Dashboard` : "Dashboard"}
          </h1>
          <p className="text-gray-600 text-lg">
            {managerId
              ? `Viewing dashboard for ${name}.`
              : "Welcome back! Here's your account overview and site management hub."}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <StatsCard
            title="Total Salary Account"
            amount={totalSalary}
            icon={DollarSign}
            gradient="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"
            onClick={() => handleStatCardClick("salary")}
            isActive={activeTable === "salary"}
          />
          <StatsCard
            title="In-Site Expenses Balance"
            amount={siteExpensesBalance}
            icon={CreditCard}
            gradient="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
            onClick={() => handleStatCardClick("expense")}
            isActive={activeTable === "expense"}
          />
        </div>

        {/* Transaction Tables */}
        {activeTable === "salary" && (
          <div
            className={`transition-all duration-500 ${
              isAnimating
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
          >
            <TransactionTable
              title="Salary Transaction History"
              transactions={salaryAssignments}
              type="salary"
              currentPage={salaryPage}
              setCurrentPage={setSalaryPage}
            />
          </div>
        )}

        {activeTable === "expense" && (
          <div
            className={`transition-all duration-500 ${
              isAnimating
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
          >
            <TransactionTable
              title="Site Expenses Transaction History"
              transactions={siteExpensesTransactions}
              type="expense"
              currentPage={expensePage}
              setCurrentPage={setExpensePage}
            />
          </div>
        )}

        {/* Assigned Sites Section */}
        <div
          className={`transition-all duration-700 delay-300 ${
            isAnimating
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0"
          }`}
        >
          <div className="flex items-center mb-8">
            <Building2 className="w-8 h-8 text-gray-600 mr-4" />
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
              Assigned Sites
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {assignedSites.map((site: any, index: number) => (
              <div
                key={site._id}
                className={`relative bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300 transform hover:scale-105 hover:shadow-3xl ${
                  isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-t-2xl" />
                <div className="p-8">
                  <div className="flex items-start justify-between mb-4">
                    <Building2 className="w-8 h-8 text-gray-600" />
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100 px-3 py-1 rounded-full">
                      Active Site
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {site.name}
                  </h3>
                  <div className="flex items-start mb-6">
                    <MapPin className="w-4 h-4 text-gray-400 mr-2 mt-1 flex-shrink-0" />
                    <p className="text-gray-600 leading-relaxed">
                      {`${site.address}, ${site.city}, ${site.state} ${site.zip}`}
                    </p>
                  </div>
                  <Link
                    to={`${siteBasePath}/${site._id}`}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <span>View & Edit Details</span>
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteManagerDashboard;
