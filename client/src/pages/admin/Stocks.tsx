import React, { useEffect, useState } from "react";
import {
  getStocks,
  getStockTransfers,
  approveStockTransfer,
  rejectStockTransfer,
  requestStockTransfer,
  logStockUsage,
  addStock,
} from "@/services/stockService";
import { getSites } from "@/services/siteService";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import RequestTransferModal from "./RequestTransferModal";
import AddStockModal from "./AddStockModal";
import LogUsageModal from "./LogUsageModal";

interface Stock {
  _id: string;
  name: string;
  quantity: number;
  unit: string;
  site?: { _id: string; name: string };
}

interface StockTransfer {
  _id: string;
  stock: { _id: string; name: string };
  quantity: number;
  fromSite?: { _id: string; name: string };
  toSite: { _id: string; name: string };
  status: "Requested" | "Approved" | "Rejected";
  approvedBy?: { _id: string; username: string };
  rejectedBy?: { _id: string; username: string };
}

const Stocks: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [sites, setSites] = useState<{ _id: string; name: string }[]>([]);
  const [filterSite, setFilterSite] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRequestTransferOpen, setIsRequestTransferOpen] = useState(false);
  const [isLogUsageOpen, setIsLogUsageOpen] = useState(false);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [selectedStock, setSelectedStock] = useState<string | null>(null);

  const { userType, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    setIsAnimating(true);
    const fetchData = async () => {
      try {
        const [stocksData, sitesData, transfersData] = await Promise.all([
          getStocks(),
          getSites(),
          getStockTransfers(),
        ]);
        setStocks(stocksData);
        setSites(sitesData);
        setTransfers(transfersData);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch data");
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleApproveTransfer = async (transferId: string) => {
    try {
      await approveStockTransfer(transferId);
      setTransfers(
        transfers.map((t) =>
          t._id === transferId ? { ...t, status: "Approved" } : t
        )
      );
    } catch (err) {
      setError("Failed to approve transfer");
    }
  };

  const handleRejectTransfer = async (transferId: string) => {
    try {
      await rejectStockTransfer(transferId);
      setTransfers(
        transfers.map((t) =>
          t._id === transferId ? { ...t, status: "Rejected" } : t
        )
      );
    } catch (err) {
      setError("Failed to reject transfer");
    }
  };

  const handleRequestTransfer = async (transferData: any) => {
    try {
      await requestStockTransfer(transferData);
      const updatedTransfers = await getStockTransfers();
      setTransfers(updatedTransfers);
      setIsRequestTransferOpen(false);
    } catch (err) {
      setError("Failed to request transfer");
    }
  };

  const handleLogUsage = async (usageData: any) => {
    try {
      await logStockUsage(usageData);
      const updatedStocks = await getStocks();
      setStocks(updatedStocks);
      setIsLogUsageOpen(false);
    } catch (err) {
      setError("Failed to log usage");
    }
  };

  const handleAddStock = async (stockData: any) => {
    try {
      await addStock(stockData);
      const updatedStocks = await getStocks();
      setStocks(updatedStocks);
      setIsAddStockOpen(false);
    } catch (err) {
      setError("Failed to add stock");
    }
  };

  const filteredStocks = stocks.filter((stock) => {
    const matchesSearch = stock.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesSite = filterSite
      ? stock.site?._id === filterSite ||
        (filterSite === "company" && !stock.site)
      : true;
    return matchesSearch && matchesSite;
  });

  const canManageStocks = userType === "siteManager" || userType === "admin";

  const getStockStatusColor = (quantity: number) => {
    if (quantity <= 10) return "from-red-500 to-red-600";
    if (quantity <= 50) return "from-yellow-500 to-orange-500";
    return "from-green-500 to-green-600";
  };

  const getStockStatusText = (quantity: number) => {
    if (quantity <= 10) return "Low Stock";
    if (quantity <= 50) return "Medium Stock";
    return "In Stock";
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
            Loading Stocks...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div
            className={`relative bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-500 transform overflow-hidden ${
              isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
          >
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-pink-500 to-red-600 rounded-t-2xl" />
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Error Loading Data
              </h3>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8 pb-10">
        <div
          className={`relative bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-500 transform overflow-hidden ${
            isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
        >
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl" />

          <div className="p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Stock Management
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Manage your inventory across all sites
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {canManageStocks && (
                  <>
                    <button
                      onClick={() => setIsRequestTransferOpen(true)}
                      className="group relative px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 hover:from-blue-600 hover:to-blue-700"
                    >
                      <span className="flex items-center space-x-2">
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
                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                          />
                        </svg>
                        <span>Request Transfer</span>
                      </span>
                    </button>
                    <button
                      onClick={() => setIsLogUsageOpen(true)}
                      className="group relative px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 hover:from-green-600 hover:to-green-700"
                    >
                      <span className="flex items-center space-x-2">
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
                            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                        <span>Log Usage</span>
                      </span>
                    </button>
                  </>
                )}
                {userType === "admin" && (
                  <button
                    onClick={() => setIsAddStockOpen(true)}
                    className="group relative px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 hover:from-purple-600 hover:to-purple-700"
                  >
                    <span className="flex items-center space-x-2">
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
                      <span>Add Stock</span>
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div
          className={`relative bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-500 transform overflow-hidden ${
            isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
          style={{ animationDelay: "0.1s" }}
        >
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="relative flex-1 max-w-md">
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
                  placeholder="Search stocks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div className="flex items-center space-x-4">
                <div className="relative">
                  <select
                    value={filterSite || ""}
                    onChange={(e) => setFilterSite(e.target.value || null)}
                    className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">All Sites</option>
                    <option value="company">Company Stocks</option>
                    {sites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
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

                <div className="flex bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                      viewMode === "grid"
                        ? "bg-white shadow-md text-blue-600"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
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
                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                      viewMode === "table"
                        ? "bg-white shadow-md text-blue-600"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
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
                        d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`relative bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-500 transform overflow-hidden ${
            isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
          style={{ animationDelay: "0.2s" }}
        >
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-t-2xl overflow-hidden" />

          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Current Inventory
              </h2>
              <div className="text-sm text-gray-500">
                {filteredStocks.length} item
                {filteredStocks.length !== 1 ? "s" : ""} found
              </div>
            </div>

            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredStocks.map((stock, index) => (
                  <div
                    key={stock._id}
                    className={`group relative bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer overflow-hidden ${
                      selectedStock === stock._id
                        ? "ring-2 ring-blue-500 shadow-xl"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedStock(
                        selectedStock === stock._id ? null : stock._id
                      )
                    }
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div
                      className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getStockStatusColor(
                        stock.quantity
                      )} rounded-t-xl`}
                    />

                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3
                          className="font-semibold text-gray-900 text-lg truncate"
                          title={stock.name}
                        >
                          {stock.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {stock.site ? stock.site.name : "Company"}
                        </p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getStockStatusColor(
                          stock.quantity
                        )} text-white`}
                      >
                        {getStockStatusText(stock.quantity)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          {stock.quantity}
                        </div>
                        <div className="text-sm text-gray-500 uppercase tracking-wider">
                          {stock.unit}
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                      </div>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 rounded-xl transition-all duration-300" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Site
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStocks.map((stock, index) => (
                      <tr
                        key={stock._id}
                        className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 cursor-pointer"
                        onClick={() =>
                          setSelectedStock(
                            selectedStock === stock._id ? null : stock._id
                          )
                        }
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mr-3">
                              <svg
                                className="w-5 h-5 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                />
                              </svg>
                            </div>
                            <div className="font-medium text-gray-900">
                              {stock.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-lg font-semibold text-gray-900">
                            {stock.quantity}{" "}
                            <span className="text-sm text-gray-500">
                              {stock.unit}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {stock.site ? stock.site.name : "Company"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getStockStatusColor(
                              stock.quantity
                            )} text-white`}
                          >
                            {getStockStatusText(stock.quantity)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {filteredStocks.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No stocks found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </div>
        </div>

        {userType === "admin" && (
          <div
            className={`relative bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-500 transform overflow-hidden ${
              isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
            style={{ animationDelay: "0.3s" }}
          >
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-t-2xl" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Stock Transfers
                  </h2>
                </div>
                <div className="text-sm text-gray-500">
                  {transfers.length} transfer{transfers.length !== 1 ? "s" : ""}
                </div>
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        From
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        To
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Decided By
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transfers.map((transfer) => (
                      <tr key={transfer._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {transfer?.stock?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {transfer.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {transfer.fromSite
                            ? transfer.fromSite.name
                            : "Company"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {transfer?.toSite?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {transfer.status === "Approved" && (
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-md">
                              Approved
                            </span>
                          )}
                          {transfer.status === "Rejected" && (
                            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-md">
                              Rejected
                            </span>
                          )}
                          {transfer.status === "Requested" && (
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md">
                              Requested
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {transfer.approvedBy
                            ? transfer.approvedBy.username
                            : transfer.rejectedBy
                            ? transfer.rejectedBy.username
                            : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {transfer.status === "Requested" && (
                            <>
                              <button
                                onClick={() =>
                                  handleApproveTransfer(transfer._id)
                                }
                                className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 mr-2"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  handleRejectTransfer(transfer._id)
                                }
                                className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {isRequestTransferOpen && (
          <RequestTransferModal
            isOpen={isRequestTransferOpen}
            onClose={() => setIsRequestTransferOpen(false)}
            onSubmit={handleRequestTransfer}
            sites={sites}
            stocks={stocks}
            allowedToSites={sites.map((s) => s.id)}
          />
        )}
        {isLogUsageOpen && (
          <LogUsageModal
            isOpen={isLogUsageOpen}
            onClose={() => setIsLogUsageOpen(false)}
            onSubmit={handleLogUsage}
            sites={sites}
            stocks={stocks}
          />
        )}
        {isAddStockOpen && (
          <AddStockModal
            isOpen={isAddStockOpen}
            onClose={() => setIsAddStockOpen(false)}
            onSubmit={handleAddStock}
            sites={sites}
          />
        )}
      </div>
    </div>
  );
};

export default Stocks;
