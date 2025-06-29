import React, { useEffect, useState } from "react";
import {
  getClientDashboard,
  getClientSites,
  sendMoneyToAdmin,
} from "@/services/clientService";
import {
  BarChart,
  ShoppingCart,
  Package as PackageIcon,
  Construction,
  DollarSign,
  Building,
  Wallet,
  User,
  TrendingUp,
  AlertTriangle,
  Send,
} from "lucide-react";
import SendMoneyCard from "./SendMoneyCard";
import ConfirmationModal from "./ConfirmationModal";
import { toast } from "sonner";

interface SectionState {
  data: any[];
  total: number;
  page: number;
  limit: number;
}

const ClientDashboard: React.FC = () => {
  const [site, setSite] = useState<any>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [purchases, setPurchases] = useState<SectionState>({
    data: [],
    total: 0,
    page: 1,
    limit: 10,
  });
  const [stocks, setStocks] = useState<SectionState>({
    data: [],
    total: 0,
    page: 1,
    limit: 10,
  });
  const [machineryRentals, setMachineryRentals] = useState<SectionState>({
    data: [],
    total: 0,
    page: 1,
    limit: 10,
  });
  const [transactions, setTransactions] = useState<SectionState>({
    data: [],
    total: 0,
    page: 1,
    limit: 10,
  });
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [amountStr, setAmountStr] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const fetchSites = async () => {
    try {
      const sitesData = await getClientSites();
      setSites(sitesData);
      if (sitesData.length > 0) {
        setSelectedSite(sitesData[0]);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch sites");
    }
  };

  const fetchData = async (params: any) => {
    try {
      const data = await getClientDashboard(params);
      setSite(data.site);
      setPurchases({
        data: data.purchases.data,
        total: data.purchases.total,
        page: Number(params.purchasesPage),
        limit: Number(params.purchasesLimit),
      });
      setStocks({
        data: data.stocks.data,
        total: data.stocks.total,
        page: Number(params.stocksPage),
        limit: Number(params.stocksLimit),
      });
      setMachineryRentals({
        data: data.machineryRentals.data,
        total: data.machineryRentals.total,
        page: Number(params.rentalsPage),
        limit: Number(params.rentalsLimit),
      });
      setTransactions({
        data: data.transactions.data,
        total: data.transactions.total,
        page: Number(params.transactionsPage),
        limit: Number(params.transactionsLimit),
      });
      setAttendances(data.attendances);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setTimeout(() => setIsAnimating(true), 100);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  useEffect(() => {
    if (selectedSite) {
      const initialParams = {
        siteId: selectedSite._id,
        purchasesPage: 1,
        purchasesLimit: 10,
        stocksPage: 1,
        stocksLimit: 10,
        rentalsPage: 1,
        rentalsLimit: 10,
        transactionsPage: 1,
        transactionsLimit: 10,
      };
      fetchData(initialParams);
    }
  }, [selectedSite]);

  const refreshDashboard = async () => {
    const params = getCurrentParams();
    await fetchData(params);
  };

  const getCurrentParams = () => ({
    siteId: selectedSite?._id,
    purchasesPage: purchases.page,
    purchasesLimit: purchases.limit,
    stocksPage: stocks.page,
    stocksLimit: stocks.limit,
    rentalsPage: machineryRentals.page,
    rentalsLimit: machineryRentals.limit,
    transactionsPage: transactions.page,
    transactionsLimit: transactions.limit,
  });

  const handlePageChange = (section: string, newPage: number) => {
    const currentParams = getCurrentParams();
    const totalPages = Math.ceil(
      section === "purchases"
        ? purchases.total
        : section === "stocks"
        ? stocks.total
        : section === "rentals"
        ? machineryRentals.total
        : transactions.total / 10
    );
    if (newPage < 1 || newPage > totalPages) return;

    const newParams = {
      ...currentParams,
      [`${section}Page`]: newPage,
    };
    fetchData(newParams);
  };

  const handleSendMoneyRequest = () => {
    const num = parseFloat(amountStr);
    if (isNaN(num) || num <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setIsModalOpen(true);
  };

  const handleConfirmSendMoney = async () => {
    setIsSending(true);
    try {
      const amountNum = parseFloat(amountStr);
      await sendMoneyToAdmin(amountNum, selectedSite._id);
      toast.success("Money sent successfully, pending admin verification.");
      setAmountStr("");
      refreshDashboard();
    } catch (err) {
      toast.error("Failed to send money.");
    } finally {
      setIsSending(false);
      setIsModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h- bg-gradient-to-br from-yellow-50 via-white to-yellow-100 flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
          <div
            className="absolute inset-0 w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"
            style={{ animationDelay: "0.15s", animationDuration: "1.2s" }}
          ></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl border border-red-200 p-8 max-w-md w-full text-center transform scale-100 opacity-100 transition-all duration-200">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-pink-500 to-orange-500 rounded-t-2xl" />
          <AlertTriangle size={60} className="text-red-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: <BarChart size={20} /> },
    { id: "purchases", label: "Purchases", icon: <ShoppingCart size={20} /> },
    { id: "stocks", label: "Inventory", icon: <PackageIcon size={20} /> },
    { id: "rentals", label: "Rentals", icon: <Construction size={20} /> },
    {
      id: "transactions",
      label: "Transactions",
      icon: <DollarSign size={20} />,
    },
  ];

  const StatCard = ({
    title,
    value,
    icon,
    color,
  }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
  }) => (
    <div
      className={`relative bg-white rounded-2xl shadow-lg border border-gray-200 p-6 transition-all duration-300 hover:shadow-xl hover:scale-105 group cursor-pointer overflow-hidden`}
    >
      <div
        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color} rounded-t-2xl`}
      />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="opacity-70 group-hover:scale-110 transition-transform duration-200">
          {icon}
        </div>
      </div>
    </div>
  );

  const TableCard = ({
    title,
    children,
    icon,
    section,
  }: {
    title: string;
    children: React.ReactNode;
    icon: React.ReactNode;
    section: string;
  }) => {
    const sectionData =
      section === "purchases"
        ? purchases
        : section === "stocks"
        ? stocks
        : section === "rentals"
        ? machineryRentals
        : transactions;
    const totalPages = Math.ceil(sectionData.total / sectionData.limit);

    return (
      <div
        className={`relative bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-200 transform overflow-hidden ${
          isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-800 to-amber-900 rounded-t-2xl" />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            {icon}
            <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          </div>
          {children}
          {section !== "overview" && (
            <div className="flex justify-between items-center mt-4 px-6 pb-4">
              <button
                onClick={() => handlePageChange(section, sectionData.page - 1)}
                disabled={sectionData.page <= 1}
                className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span>
                Page {sectionData.page} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(section, sectionData.page + 1)}
                disabled={sectionData.page >= totalPages}
                className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-xl bg-gradient-to-br from-yellow-50 via-white to-yellow-50">
      <div
        className={`border-b border-gray-200 transition-all duration-200 transform ${
          isAnimating ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Client Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome back! Here's your project overview.
              </p>
            </div>
            <User size={60} />
          </div>
          <div className="mt-4">
            <label htmlFor="site-select" className="text-gray-700 font-medium">
              Select Site:
            </label>
            <select
              id="site-select"
              value={selectedSite?._id || ""}
              onChange={(e) => {
                const site = sites.find((s) => s._id === e.target.value);
                setSelectedSite(site);
              }}
              className="ml-2 p-2 border border-gray-300 rounded-lg"
            >
              {sites.map((site) => (
                <option key={site._id} value={site._id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div
          className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 transition-all duration-300 delay-100 transform ${
            isAnimating
              ? "translate-y-0 opacity-100"
              : "translate-y-4 opacity-0"
          }`}
        >
          <StatCard
            title="Site Name"
            value={site?.name || "N/A"}
            icon={<Building size={30} />}
            color="from-amber-800 to-amber-900"
          />
          <StatCard
            title="Budget"
            value={`₹${site?.budget?.toLocaleString() || 0}`}
            icon={<Wallet size={30} />}
            color="from-amber-800 to-amber-900"
          />
          <StatCard
            title="Expenses"
            value={`₹${site?.expenses?.toLocaleString() || 0}`}
            icon={<BarChart size={30} />}
            color="from-amber-800 to-amber-900"
          />
        </div>

        <div
          className={`mb-8 transition-all duration-300 delay-200 transform ${
            isAnimating
              ? "translate-y-0 opacity-100"
              : "translate-y-4 opacity-0"
          }`}
        >
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-2">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-amber-800 to-amber-900 text-white shadow-lg transform scale-105"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          className={`transition-all duration-300 delay-300 transform ${
            isAnimating
              ? "translate-y-0 opacity-100"
              : "translate-y-4 opacity-0"
          }`}
        >
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <SendMoneyCard
                amountStr={amountStr}
                setAmountStr={setAmountStr}
                onSendMoneyRequest={handleSendMoneyRequest}
              />
              <TableCard
                title="Quick Statistics"
                icon={<TrendingUp size={24} />}
                section="overview"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl">
                    <div className="text-2xl font-bold text-amber-600">
                      {purchases.total || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Purchases</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl">
                    <div className="text-2xl font-bold text-amber-600">
                      {stocks.total || 0}
                    </div>
                    <div className="text-sm text-gray-600">Stock Items</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl">
                    <div className="text-2xl font-bold text-amber-600">
                      {machineryRentals.total || 0}
                    </div>
                    <div className="text-sm text-gray-600">Rentals</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl">
                    <div className="text-2xl font-bold text-amber-600">
                      {transactions.total || 0}
                    </div>
                    <div className="text-sm text-gray-600">Transactions</div>
                  </div>
                </div>
              </TableCard>
            </div>
          )}

          {activeTab === "purchases" && (
            <TableCard
              title="Purchase Orders"
              icon={<ShoppingCart size={24} />}
              section="purchases"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-amber-100 to-amber-200">
                      <th className="text-left py-4 px-6 font-semibold text-gray-700 rounded-l-xl">
                        Vendor
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">
                        Total Amount
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700 rounded-r-xl">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.data?.map((pur: any, index: number) => (
                      <tr
                        key={pur._id}
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                        }`}
                      >
                        <td className="py-4 px-6 font-medium text-gray-900">
                          {pur.vendor?.name || "N/A"}
                        </td>
                        <td className="py-4 px-6 text-green-600 font-semibold">
                          ₹{pur.totalAmount?.toLocaleString() || 0}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              pur.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : pur.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {pur.status || "Unknown"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TableCard>
          )}

          {activeTab === "stocks" && (
            <TableCard
              title="Inventory Management"
              icon={<PackageIcon size={24} />}
              section="stocks"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-amber-100 to-amber-200">
                      <th className="text-left py-4 px-6 font-semibold text-gray-700 rounded-l-xl">
                        Item Name
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">
                        Quantity
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700 rounded-r-xl">
                        Unit
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stocks.data?.map((stock: any, index: number) => (
                      <tr
                        key={stock._id}
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                        }`}
                      >
                        <td className="py-4 px-6 font-medium text-gray-900">
                          {stock.name || "N/A"}
                        </td>
                        <td className="py-4 px-6 text-blue-600 font-semibold">
                          {stock.quantity || 0}
                        </td>
                        <td className="py-4 px-6 text-gray-600">
                          {stock.unit || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TableCard>
          )}

          {activeTab === "rentals" && (
            <TableCard
              title="Machinery Rentals"
              icon={<Construction size={24} />}
              section="rentals"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-amber-100 to-amber-200">
                      <th className="text-left py-4 px-6 font-semibold text-gray-700 rounded-l-xl">
                        Description
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">
                        Amount
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700 rounded-r-xl">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {machineryRentals.data?.map(
                      (rental: any, index: number) => (
                        <tr
                          key={rental._id}
                          className={`border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                          }`}
                        >
                          <td className="py-4 px-6 font-medium text-gray-900">
                            {rental.description || "N/A"}
                          </td>
                          <td className="py-4 px-6 text-green-600 font-semibold">
                            ₹{rental.amount?.toLocaleString() || 0}
                          </td>
                          <td className="py-4 px-6 text-gray-600">
                            {rental.date
                              ? new Date(rental.date).toLocaleDateString()
                              : "N/A"}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </TableCard>
          )}

          {activeTab === "transactions" && (
            <TableCard
              title="Transaction History"
              icon={<DollarSign size={24} />}
              section="transactions"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-amber-100 to-amber-200">
                      <th className="text-left py-4 px-6 font-semibold text-gray-700 rounded-l-xl">
                        Amount
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700 rounded-r-xl">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.data?.map((trans: any, index: number) => (
                      <tr
                        key={trans._id}
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                        }`}
                      >
                        <td className="py-4 px-6 text-green-600 font-semibold">
                          ₹{trans.amount?.toLocaleString() || 0}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              trans.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : trans.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : trans.status === "failed"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {trans.status || "Unknown"}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-gray-600">
                          {trans.createdAt
                            ? new Date(trans.createdAt).toLocaleDateString()
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TableCard>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmSendMoney}
        title="Confirm Send Money"
        description={`Are you sure you want to send ₹${parseFloat(
          amountStr
        ).toLocaleString()} to the admin for ${selectedSite?.name}?`}
        confirmText="Send"
        cancelText="Cancel"
        isLoading={isSending}
        icon={<Send className="w-6 h-6 text-green-600" />}
        theme="success"
      />
    </div>
  );
};

export default ClientDashboard;
