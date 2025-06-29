import React, { useState, useEffect } from "react";
import {
  Download,
  Filter,
  List,
  BarChart3,
  FileText,
  Users,
  Package,
  TrendingUp,
  Calendar,
  Search,
  RefreshCw,
  Settings,
  Eye,
  FileDown,
} from "lucide-react";
import { privateClient } from "@/api";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import headerImg from "@/assets/header.png";
import footerImg from "@/assets/footer.png";
import templateImage from "@/assets/template.png";
import "@/assets/Roboto-Regular";

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState("stockTransactions");
  const [sites, setSites] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    privateClient
      .get("/sites")
      .then((res) => setSites(res.data))
      .catch((err) => console.error("Error fetching sites:", err));
  }, []);

  const reportTypes = [
    {
      id: "stockTransactions",
      title: "Stock Transactions",
      description: "Track all stock movements and transactions",
      icon: BarChart3,
      color: "from-blue-500 to-indigo-600",
    },
    {
      id: "stockInventory",
      title: "Stock Inventory",
      description: "Current stock levels and inventory status",
      icon: Package,
      color: "from-green-500 to-emerald-600",
    },
    {
      id: "vendors",
      title: "Vendors Report",
      description: "Vendor performance and purchase history",
      icon: Users,
      color: "from-purple-500 to-violet-600",
    },
    {
      id: "clients",
      title: "Clients Report",
      description: "Comprehensive client analytics and insights",
      icon: FileText,
      color: "from-pink-500 to-rose-600",
    },
  ];

  const selectedReportData = reportTypes.find((r) => r.id === selectedReport);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-6">
      <div
        className={`max-w-7xl mx-auto transition-all duration-500 transform ${
          isAnimating ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        {/* Header Section */}
        <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 mb-8 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl" />

          <div className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Reports Dashboard
                  </h1>
                  <p className="text-gray-500 mt-1">
                    Generate comprehensive business reports and analytics
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 group">
                  <Settings className="w-5 h-5 text-gray-600 group-hover:rotate-90 transition-transform duration-300" />
                </button>
                <button className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Report Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {reportTypes.map((report, index) => {
            const Icon = report.icon;
            const isSelected = selectedReport === report.id;

            return (
              <div
                key={report.id}
                className={`relative cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                  isAnimating
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
                onClick={() => setSelectedReport(report.id)}
              >
                <div
                  className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 overflow-hidden ${
                    isSelected
                      ? "border-blue-500 shadow-2xl ring-4 ring-blue-100"
                      : "border-gray-200 hover:border-gray-300 hover:shadow-xl"
                  }`}
                >
                  {isSelected && (
                    <div
                      className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${report.color}`}
                    />
                  )}

                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r ${report.color} shadow-lg`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      {isSelected && (
                        <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse" />
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {report.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {report.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Report Content */}
        <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          <div
            className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${
              selectedReportData?.color || "from-blue-500 to-indigo-600"
            }`}
          />

          <div className="p-8">
            <div className="flex items-center mb-6">
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-r ${selectedReportData?.color} flex items-center justify-center mr-4`}
              >
                {selectedReportData && (
                  <selectedReportData.icon className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedReportData?.title}
                </h2>
                <p className="text-gray-500">
                  {selectedReportData?.description}
                </p>
              </div>
            </div>

            {selectedReport === "stockTransactions" && (
              <StockTransactionsReport sites={sites} />
            )}
            {selectedReport === "stockInventory" && (
              <StockInventoryReport sites={sites} />
            )}
            {selectedReport === "vendors" && <VendorsReport sites={sites} />}
            {selectedReport === "clients" && <ClientsReportDetailed />}
          </div>
        </div>
      </div>
    </div>
  );
};

const StockTransactionsReport = ({ sites }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [filters, setFilters] = useState({
    siteId: "",
    startDate: "",
    endDate: "",
    type: "",
  });

  useEffect(() => {
    setIsAnimating(true);
  }, []);

  const loadImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL("image/png");
        resolve(dataURL);
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const exportToPDF = async () => {
    try {
      const templateDataURL = await loadImage(templateImage); // Path to your full-page template image
      const doc = new jsPDF();

      // Add template image to the first page
      doc.addImage(
        templateDataURL,
        "PNG",
        0,
        0,
        doc.internal.pageSize.width,
        doc.internal.pageSize.height
      );

      // Override addPage to add template image for new pages
      const originalAddPage = doc.addPage;
      doc.addPage = function () {
        const page = originalAddPage.apply(this, arguments);
        doc.addImage(
          templateDataURL,
          "PNG",
          0,
          0,
          doc.internal.pageSize.width,
          doc.internal.pageSize.height
        );
        return page;
      };

      // Set initial yOffset for content (after assumed header area)
      let yOffset = 50;

      // Add title
      doc.setFontSize(18);
      doc.text("Stock Transactions Report", 14, yOffset);
      yOffset += 10;

      // Add generation date and metadata
      doc.setFontSize(10);
      doc.text(
        `Generated on: ${new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`,
        14,
        yOffset
      );
      yOffset += 5;

      doc.text(`Total Records: ${data.length}`, 14, yOffset);
      yOffset += 5;

      const selectedSite = sites.find((s) => s._id === filters.siteId);
      if (selectedSite) {
        doc.text(`Site: ${selectedSite.name}`, 14, yOffset);
        yOffset += 5;
      }

      if (filters.startDate && filters.endDate) {
        doc.text(
          `Period: ${filters.startDate} to ${filters.endDate}`,
          14,
          yOffset
        );
        yOffset += 5;
      }

      // Add line separator after all metadata
      doc.setLineWidth(0.1);
      doc.line(14, yOffset, 196, yOffset);
      yOffset += 10;

      // Define table options with adjusted margins and green header
      const tableOptions = {
        startY: yOffset,
        margin: { top: 40, bottom: 35, left: 14, right: 14 },
        styles: { font: "Roboto-Regular", fontSize: 10, cellPadding: 2 },
        headStyles: { fillColor: [160, 61, 5], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 30 },
          2: { cellWidth: 30 },
          3: { cellWidth: 20, halign: "center" },
          4: { cellWidth: 20, halign: "center" },
          5: { cellWidth: 30 },
          6: { cellWidth: 30 },
        },
      };

      doc.setFont("Roboto-Regular");

      // Add stock transactions table
      autoTable(doc, {
        head: [
          [
            "Date",
            "Type",
            "Description",
            "Qty",
            "Amount (INR)",
            "Vendor",
            "Added By",
          ],
        ],
        body: data.map((item) => [
          new Date(item.date || item.createdAt).toLocaleDateString("en-IN"),
          item.type.charAt(0).toUpperCase() +
            item.type.slice(1).toLowerCase() || "-",
          (
            item.description ||
            item.items?.map((i) => i.name).join(", ") ||
            "-"
          ).substring(0, 50) + (item.description?.length > 50 ? "..." : ""),
          item.items?.reduce((sum, i) => sum + i.quantity, 0) || "-",
          `₹${(item.amount || item.totalAmount || 0).toLocaleString("en-IN")}`,
          item.vendor?.name || "-",
          item.addedBy?.name || "-",
        ]),
        ...tableOptions,
        styles: { font: "Roboto-Regular", fontSize: 10, cellPadding: 2 },
      });

      // Add total amount
      if (data.length > 0) {
        const totalAmount = data.reduce(
          (sum, item) => sum + (item.amount || item.totalAmount || 0),
          0
        );
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(
          `Total Amount: ₹${totalAmount.toLocaleString("en-IN")}`,
          14,
          finalY
        );
      }

      // Save the document
      doc.save(
        `stock-transactions-report-${
          new Date().toISOString().split("T")[0]
        }.pdf`
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const fetchData = async () => {
    if (!filters.siteId) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await privateClient.get("/reports/stock-transactions", {
        params: filters,
      });
      setData(res.data);
    } catch (err) {
      console.error("Error fetching stock transactions:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  return (
    <div
      className={`transition-all duration-500 ${
        isAnimating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-100">
        <div className="flex items-center mb-4">
          <Filter className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="font-semibold text-gray-800">Report Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <select
              className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none"
              value={filters.siteId}
              onChange={(e) =>
                setFilters({ ...filters, siteId: e.target.value })
              }
            >
              <option value="">Select Site</option>
              {sites.map((site) => (
                <option key={site._id} value={site._id}>
                  {site.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              className="w-full pl-10 pr-3 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={filters.startDate}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value })
              }
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              className="w-full pl-10 pr-3 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={filters.endDate}
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value })
              }
            />
          </div>
          <select
            className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="">All Types</option>
            <option value="purchase">Purchase</option>
            <option value="rental">Rental</option>
          </select>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportToPDF}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            disabled={loading || data.length === 0}
          >
            <FileDown className="w-4 h-4 mr-2" /> Export PDF
          </button>

          <button
            onClick={fetchData}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />{" "}
            Refresh
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {!filters.siteId ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Select a Site
            </h3>
            <p className="text-gray-500">
              Please select a site from the filters above to view the stock
              transactions report.
            </p>
          </div>
        ) : loading ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Loading Report
            </h3>
            <p className="text-gray-500">Fetching stock transaction data...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              No Data Found
            </h3>
            <p className="text-gray-500">
              No stock transactions found for the selected filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Added By
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.date || item.createdAt).toLocaleDateString(
                        "en-IN"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          item.type === "purchase"
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {item.description ||
                        item.items?.map((i) => i.name).join(", ") ||
                        "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {item.items?.reduce((sum, i) => sum + i.quantity, 0) ||
                        "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      ₹
                      {(item.amount || item.totalAmount || 0).toLocaleString(
                        "en-IN"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.vendor?.name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.addedBy?.name || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const StockInventoryReport = ({ sites }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [filters, setFilters] = useState({
    siteId: "",
    category: "",
    minQuantity: "",
  });

  useEffect(() => {
    setIsAnimating(true);
    fetchData();
  }, [filters]);

  const loadImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL("image/png");
        resolve(dataURL);
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const exportToPDF = async () => {
    try {
      const templateDataURL = await loadImage(templateImage); // Assuming templateImage is defined
      const doc = new jsPDF();

      // Add template image to the first page
      doc.addImage(
        templateDataURL,
        "PNG",
        0,
        0,
        doc.internal.pageSize.width,
        doc.internal.pageSize.height
      );

      // Override addPage to add template image for new pages
      const originalAddPage = doc.addPage;
      doc.addPage = function () {
        const page = originalAddPage.apply(this, arguments);
        doc.addImage(
          templateDataURL,
          "PNG",
          0,
          0,
          doc.internal.pageSize.width,
          doc.internal.pageSize.height
        );
        return page;
      };

      // Set initial yOffset for content (after header area)
      let yOffset = 50;

      // Add title
      doc.setFontSize(18);
      const selectedSite = sites.find((s) => s._id === filters.siteId);
      const title = filters.siteId
        ? `Stock Inventory Report for ${selectedSite.name}`
        : "Stock Inventory Report for All Sites";
      doc.text(title, 14, yOffset);
      yOffset += 10;

      // Add generation date
      doc.setFontSize(10);
      doc.text(
        `Generated on: ${new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`,
        14,
        yOffset
      );
      yOffset += 10;

      // Add line separator
      doc.setLineWidth(0.1);
      doc.line(14, yOffset, 196, yOffset);
      yOffset += 10;

      // Define table options with adjusted margins
      const tableOptions = {
        startY: yOffset,
        margin: { top: 40, bottom: 35, left: 14, right: 14 },
        styles: { fontSize: 10, cellPadding: 2 },
        headStyles: { fillColor: [160, 61, 5], textColor: 255 }, // Green instead of violet
        alternateRowStyles: { fillColor: [248, 250, 252] },
      };

      doc.setFont("Roboto-Regular"); // Use the embedded font

      // Add stock table
      autoTable(doc, {
        head: [["Name", "Category", "Unit", "Quantity", "Site"]],
        body: data.map((stock) => [
          stock.name,
          stock.category,
          stock.unit,
          stock.quantity,
          stock.site?.name || "Company",
        ]),
        ...tableOptions,
        styles: { font: "Roboto-Regular", fontSize: 10, cellPadding: 2 },
      });

      // Add summary section if data exists
      if (data.length > 0) {
        const totalQuantity = data.reduce(
          (sum, stock) => sum + stock.quantity,
          0
        );
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.text(`Total Items: ${data.length}`, 14, finalY);
        doc.text(`Total Quantity: ${totalQuantity}`, 14, finalY + 10);
      }

      // Save the document
      const filename = filters.siteId
        ? `stock-inventory-${selectedSite.name}-${
            new Date().toISOString().split("T")[0]
          }.pdf`
        : `stock-inventory-all-sites-${
            new Date().toISOString().split("T")[0]
          }.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await privateClient.get("/reports/stock-inventory", {
        params: filters,
      });
      setData(res.data);
    } catch (err) {
      console.error("Error fetching stock inventory:", err);
    }
    setLoading(false);
  };

  return (
    <div
      className={`transition-all duration-500 ${
        isAnimating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-6 border border-green-100">
        <div className="flex items-center mb-4">
          <Filter className="w-5 h-5 text-green-600 mr-2" />
          <h3 className="font-semibold text-gray-800">Report Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <select
            className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
            value={filters.siteId}
            onChange={(e) => setFilters({ ...filters, siteId: e.target.value })}
          >
            <option value="">All Sites</option>
            {sites.map((site) => (
              <option key={site._id} value={site._id}>
                {site.name}
              </option>
            ))}
          </select>
          
          <input
            type="number"
            placeholder="Min Quantity"
            className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
            value={filters.minQuantity}
            onChange={(e) =>
              setFilters({ ...filters, minQuantity: e.target.value })
            }
          />
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportToPDF}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            disabled={loading || data.length === 0}
          >
            <FileDown className="w-4 h-4 mr-2" /> Export PDF
          </button>

          <button
            onClick={fetchData}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />{" "}
            Refresh
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-8 h-8 text-green-500 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Loading Report
            </h3>
            <p className="text-gray-500">Fetching stock inventory data...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              No Data Found
            </h3>
            <p className="text-gray-500">
              No stock inventory found for the selected filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Site
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.map((stock) => (
                  <tr
                    key={stock._id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stock.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stock.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stock.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {stock.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stock.site?.name || "Company"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const VendorsReport = ({ sites }) => {
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const fetchVendors = async () => {
      try {
        const res = await privateClient.get("/vendors");
        setVendors(res.data);
      } catch (err) {
        console.error("Error fetching vendors:", err);
      }
    };
    fetchVendors();
  }, []);

  const fetchPurchases = async () => {
    if (!selectedVendor) {
      setPurchases([]);
      return;
    }
    setLoading(true);
    try {
      const res = await privateClient.get("/reports/vendor-purchases", {
        params: { vendorId: selectedVendor },
      });
      setPurchases(res.data);
    } catch (err) {
      console.error("Error fetching vendor purchases:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPurchases();
  }, [selectedVendor]);

  const loadImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL("image/png");
        resolve(dataURL);
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const exportToPDF = async () => {
    try {
      const templateDataURL = await loadImage(templateImage); // Path to your template image
      const doc = new jsPDF();

      // Add template image to the first page
      doc.addImage(
        templateDataURL,
        "PNG",
        0,
        0,
        doc.internal.pageSize.width,
        doc.internal.pageSize.height
      );

      // Override addPage to add template image for new pages
      const originalAddPage = doc.addPage;
      doc.addPage = function () {
        const page = originalAddPage.apply(this, arguments);
        doc.addImage(
          templateDataURL,
          "PNG",
          0,
          0,
          doc.internal.pageSize.width,
          doc.internal.pageSize.height
        );
        return page;
      };

      // Set initial yOffset for content (after header area)
      let yOffset = 50;

      // Add title
      doc.setFontSize(18);
      doc.text("Vendor Purchases Report", 14, yOffset);
      yOffset += 10;

      // Add generation date and vendor info
      doc.setFontSize(10);
      doc.text(
        `Generated on: ${new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`,
        14,
        yOffset
      );
      yOffset += 5;
      const selectedVendorData = vendors.find((v) => v._id === selectedVendor);
      if (selectedVendorData) {
        doc.text(`Vendor: ${selectedVendorData.name}`, 14, yOffset);
        yOffset += 5;
      }
      yOffset += 5;

      // Add line separator
      doc.setLineWidth(0.1);
      doc.line(14, yOffset, 196, yOffset);
      yOffset += 10;

      // Define table options with adjusted margins
      const tableOptions = {
        startY: yOffset,
        margin: { top: 40, bottom: 35, left: 14, right: 14 },
        styles: { fontSize: 10, cellPadding: 2 },
        headStyles: { fillColor: [160, 61, 5], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      };

      doc.setFont("Roboto-Regular"); // Use the embedded font
      // Add purchases table
      autoTable(doc, {
        head: [["Date", "Items", "Total Amount (INR)", "Added By"]],
        body: purchases.map((purchase) => [
          new Date(purchase.createdAt).toLocaleDateString("en-IN"),
          purchase.items.map((item) => item.name).join(", "),
          `₹${purchase.totalAmount.toLocaleString("en-IN")}`,
          purchase.addedBy.name,
        ]),
        ...tableOptions,
        styles: { font: "Roboto-Regular", fontSize: 10, cellPadding: 2 },
      });

      // Add total amount
      if (purchases.length > 0) {
        const totalAmount = purchases.reduce(
          (sum, purchase) => sum + purchase.totalAmount,
          0
        );
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.text(
          `Total Amount: ₹${totalAmount.toLocaleString("en-IN")}`,
          14,
          finalY
        );
      }

      // Save the document
      doc.save(
        `vendor-${selectedVendorData.name}-purchases-${
          new Date().toISOString().split("T")[0]
        }.pdf`
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  return (
    <div
      className={`transition-all duration-500 ${
        isAnimating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-6 mb-6 border border-purple-100">
        <div className="flex items-center mb-4">
          <Filter className="w-5 h-5 text-purple-600 mr-2" />
          <h3 className="font-semibold text-gray-800">Select Vendor</h3>
        </div>
        <select
          className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
          value={selectedVendor}
          onChange={(e) => setSelectedVendor(e.target.value)}
        >
          <option value="">Select Vendor</option>
          {vendors.map((vendor) => (
            <option key={vendor._id} value={vendor._id}>
              {vendor.name}
            </option>
          ))}
        </select>
        {selectedVendor && (
          <div className="flex items-center space-x-3 mt-4">
            <button
              onClick={exportToPDF}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={loading || purchases.length === 0}
            >
              <FileDown className="w-4 h-4 mr-2" /> Export PDF
            </button>
            <button
              onClick={fetchPurchases}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />{" "}
              Refresh
            </button>
          </div>
        )}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {!selectedVendor ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Select a Vendor
            </h3>
            <p className="text-gray-500">
              Please select a vendor to view their purchase history.
            </p>
          </div>
        ) : loading ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Loading Purchases
            </h3>
            <p className="text-gray-500">
              Fetching purchase data for the selected vendor...
            </p>
          </div>
        ) : purchases.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              No Purchases Found
            </h3>
            <p className="text-gray-500">No purchases found for this vendor.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Added By
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {purchases.map((purchase) => (
                  <tr
                    key={purchase._id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(purchase.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {purchase.items.map((item) => item.name).join(", ")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      ₹{purchase.totalAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {purchase.addedBy.name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const ClientsReportDetailed = () => {
  const [data, setData] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    clientId: "",
    minAmount: "",
    search: "",
    startDate: "",
    endDate: "",
  });
  const [selectedSections, setSelectedSections] = useState([]);
  const [siteData, setSiteData] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [stockTransfers, setStockTransfers] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [paymentTransactions, setPaymentTransactions] = useState([]);

  useEffect(() => {
    setIsAnimating(true);
    const fetchClients = async () => {
      try {
        const res = await privateClient.get("/users", {
          params: { role: "client" },
        });
        setClients(res.data);
      } catch (err) {
        console.error("Error fetching clients:", err);
      }
    };
    fetchClients();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await privateClient.get("/reports/clients", {
        params: filters,
      });
      setData(res.data);

      if (filters.clientId) {
        const siteRes = await privateClient.get(
          `/sites/client/${filters.clientId}`
        );
        const site = Array.isArray(siteRes.data)
          ? siteRes.data[0]
          : siteRes.data;
        setSiteData(site);

        if (site && site._id) {
          const attendanceRes = await privateClient.get(
            `/attendance/site/${site._id}`,
            {
              params: {
                startDate: filters.startDate,
                endDate: filters.endDate,
              },
            }
          );
          setAttendances(attendanceRes.data);

          const purchaseRes = await privateClient.get(
            `/purchases/site/${site._id}`,
            { params: filters }
          );
          setPurchases(purchaseRes.data);

          const stockTransferRes = await privateClient.get(
            `/stocks/transfers?siteId=${site._id}`
          );
          setStockTransfers(stockTransferRes.data);

          const stocksRes = await privateClient.get(
            `/stocks?siteId=${site._id}`
          );
          setStocks(stocksRes.data);

          const paymentTransactionsRes = await privateClient.get(
            `/client/transactions/${filters.clientId}`
          );
          setPaymentTransactions(paymentTransactionsRes.data);
        } else {
          setSiteData(null);
          setAttendances([]);
          setPurchases([]);
          setStockTransfers([]);
          setStocks([]);
          setPaymentTransactions([]);
        }
      } else {
        setSiteData(null);
        setAttendances([]);
        setPurchases([]);
        setStockTransfers([]);
        setStocks([]);
        setPaymentTransactions([]);
      }
    } catch (err) {
      console.error("Error fetching clients report:", err);
    }
    setLoading(false);
  };

  const handleGenerateReport = () => {
    fetchData();
  };

  const handleSectionChange = (e) => {
    const { value, checked } = e.target;
    setSelectedSections((prev) =>
      checked ? [...prev, value] : prev.filter((s) => s !== value)
    );
  };

  const loadImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL("image/png");
        resolve(dataURL);
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const exportToPDF = async () => {
    try {
      // Load the template.png image that combines header and footer
      const templateDataURL = await loadImage(templateImage);

      // Create a new jsPDF document
      const doc = new jsPDF();

      // Add the background image to the first page
      doc.addImage(
        templateDataURL,
        "PNG",
        0,
        0,
        doc.internal.pageSize.width,
        doc.internal.pageSize.height
      );

      // Override the addPage method to add the background to every new page
      const originalAddPage = doc.addPage;
      doc.addPage = function () {
        const page = originalAddPage.apply(this, arguments);
        doc.addImage(
          templateDataURL,
          "PNG",
          0,
          0,
          doc.internal.pageSize.width,
          doc.internal.pageSize.height
        );
        return page;
      };

      // Set initial y-offset for content (adjust if template header height differs)
      let yOffset = 50;

      // Define table options without the footer in didDrawPage
      const tableOptions = {
        margin: { top: 40, bottom: 40, left: 14, right: 14 }, // Adjust margins if needed
        styles: { fontSize: 10, cellPadding: 2 },
        headStyles: { fillColor: [160, 61, 5], textColor: 255 },
        alternateRowStyles: { fillColor: [240, 248, 255] },
      };

      // Add report title
      doc.setFontSize(18);
      doc.text(
        filters.clientId ? "Client Detailed Report" : "All Clients Report",
        14,
        yOffset
      );
      yOffset += 10;

      // Add generation date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, yOffset);
      yOffset += 10;

      // Draw a line
      doc.setLineWidth(0.1);
      doc.line(14, yOffset, 196, yOffset);
      yOffset += 10;

      // Case 1: All clients report
      if (!filters.clientId) {
        autoTable(doc, {
          startY: yOffset,
          head: [
            [
              "Client Name",
              "Site Name",
              "Site Address",
              "Site Status",
              "Budget",
              "Expenses",
              "Total Transactions",
              "Total Amount Sent",
            ],
          ],
          body: data.map((client) => [
            client.name,
            client.site?.name || "-",
            client.site?.address || "-",
            client.site?.status || "-",
            client.site?.budget || 0,
            client.site?.expenses || 0,
            client.totalTransactions,
            client.totalAmount,
          ]),
          ...tableOptions,
        });
      }
      // Case 2: Client-specific report
      else {
        const client = data[0];

        if (client) {
          doc.setFontSize(14);
          doc.text("Client Details", 14, yOffset);
          yOffset += 10;
          doc.setFontSize(10);
          doc.text(`Name: ${client.name}`, 14, yOffset);
          yOffset += 5;
          doc.text(`Email: ${client.email}`, 14, yOffset);
          yOffset += 5;
          doc.text(`Status: ${client.status || "-"}`, 14, yOffset);
          yOffset += 10;
        }

        if (selectedSections.includes("siteDetails") && siteData) {
          doc.setFontSize(14);
          doc.text("Site Details", 14, yOffset);
          yOffset += 10;
          doc.setFontSize(10);
          doc.text(`Name: ${siteData.name}`, 14, yOffset);
          yOffset += 5;
          doc.text(`Address: ${siteData.address}`, 14, yOffset);
          yOffset += 5;
          doc.text(`City: ${siteData.city}`, 14, yOffset);
          yOffset += 5;
          doc.text(`State: ${siteData.state}`, 14, yOffset);
          yOffset += 5;
          doc.text(`Zip: ${siteData.zip}`, 14, yOffset);
          yOffset += 5;
          doc.text(`Status: ${siteData.status}`, 14, yOffset);
          yOffset += 5;
          doc.text(`Budget: ${siteData.budget}`, 14, yOffset);
          yOffset += 5;
          doc.text(`Expenses: ${siteData.expenses}`, 14, yOffset);
          yOffset += 10;
        }

        if (
          selectedSections.includes("transactions") &&
          siteData?.transactions?.length > 0
        ) {
          doc.setFontSize(14);
          doc.text("Transactions", 14, yOffset);
          yOffset += 10;
          autoTable(doc, {
            startY: yOffset,
            head: [["Date", "Type", "Amount", "Description"]],
            body: siteData.transactions.map((t) => [
              new Date(t.date).toLocaleDateString(),
              t.type,
              t.amount,
              t.description || "-",
            ]),
            ...tableOptions,
          });
          yOffset = doc.lastAutoTable.finalY + 10;
        }

        if (
          selectedSections.includes("attendances") &&
          attendances.length > 0
        ) {
          doc.setFontSize(14);
          doc.text("Attendances", 14, yOffset);
          yOffset += 10;
          autoTable(doc, {
            startY: yOffset,
            head: [
              ["Date", "Total Employees", "Effective Attendance", "Percentage"],
            ],
            body: attendances.map((a) => [
              new Date(a.date).toLocaleDateString(),
              a.totalEmployees,
              a.totalEffectiveAttendance,
              a.percentage.toFixed(2),
            ]),
            ...tableOptions,
          });
          yOffset = doc.lastAutoTable.finalY + 10;
        }

        if (
          selectedSections.includes("paymentTransactions") &&
          paymentTransactions.length > 0
        ) {
          doc.setFontSize(14);
          doc.text("Payment Transactions", 14, yOffset);
          yOffset += 10;
          autoTable(doc, {
            startY: yOffset,
            head: [["Date", "Amount", "Status"]],
            body: paymentTransactions.map((t) => [
              new Date(t.createdAt).toLocaleDateString(),
              t.amount,
              t.status || "Unknown",
            ]),
            ...tableOptions,
          });
          yOffset = doc.lastAutoTable.finalY + 10;
        }

        if (selectedSections.includes("purchases") && purchases.length > 0) {
          doc.setFontSize(14);
          doc.text("Purchases", 14, yOffset);
          yOffset += 10;
          autoTable(doc, {
            startY: yOffset,
            head: [["Date", "Items", "Total Amount", "Vendor"]],
            body: purchases.map((p) => [
              new Date(p.createdAt).toLocaleDateString(),
              p.items.map((i) => i.name).join(", "),
              p.totalAmount,
              p.vendor.name,
            ]),
            ...tableOptions,
          });
          yOffset = doc.lastAutoTable.finalY + 10;
        }

        if (
          selectedSections.includes("stockTransfers") &&
          stockTransfers.length > 0
        ) {
          doc.setFontSize(14);
          doc.text("Stock Transfers", 14, yOffset);
          yOffset += 10;
          autoTable(doc, {
            startY: yOffset,
            head: [
              [
                "Date",
                "Stock Name",
                "Quantity",
                "From Site",
                "To Site",
                "Status",
              ],
            ],
            body: stockTransfers.map((t) => [
              new Date(t.createdAt).toLocaleDateString(),
              t.stock?.name,
              t.quantity,
              t.fromSite ? t.fromSite.name : "Company",
              t.toSite?.name,
              t.status,
            ]),
            ...tableOptions,
          });
          yOffset = doc.lastAutoTable.finalY + 10;
        }

        if (selectedSections.includes("stocks") && stocks.length > 0) {
          doc.setFontSize(14);
          doc.text("Stocks", 14, yOffset);
          yOffset += 10;
          autoTable(doc, {
            startY: yOffset,
            head: [["Name", "Quantity", "Unit", "Category"]],
            body: stocks.map((s) => [s.name, s.quantity, s.unit, s.category]),
            ...tableOptions,
          });
          yOffset = doc.lastAutoTable.finalY + 10;
        }
      }

      // Save the PDF
      doc.save(
        filters.clientId
          ? `client-${filters.clientId}-report.pdf`
          : "all-clients-report.pdf"
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  return (
    <div
      className={`transition-all duration-500 ${
        isAnimating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-6 mb-6 border border-pink-100">
        <div className="flex items-center mb-4">
          <Filter className="w-5 h-5 text-pink-600 mr-2" />
          <h3 className="font-semibold text-gray-800">Report Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-4">
          <select
            className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
          </select>
          <select
            className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
            value={filters.clientId}
            onChange={(e) =>
              setFilters({ ...filters, clientId: e.target.value })
            }
          >
            <option value="">All Clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
            value={filters.startDate}
            onChange={(e) =>
              setFilters({ ...filters, startDate: e.target.value })
            }
          />
          <input
            type="date"
            className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
            value={filters.endDate}
            onChange={(e) =>
              setFilters({ ...filters, endDate: e.target.value })
            }
          />
        </div>
        <button
          onClick={handleGenerateReport}
          className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Report"}
        </button>
      </div>
      {filters.clientId && (
        <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-200">
          <h3 className="font-medium text-gray-700 mb-4">PDF Export Options</h3>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                value="siteDetails"
                onChange={handleSectionChange}
                className="mr-2 accent-pink-500"
              />{" "}
              Site Details
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                value="transactions"
                onChange={handleSectionChange}
                className="mr-2 accent-pink-500"
              />{" "}
              Transactions
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                value="attendances"
                onChange={handleSectionChange}
                className="mr-2 accent-pink-500"
              />{" "}
              Attendances
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                value="purchases"
                onChange={handleSectionChange}
                className="mr-2 accent-pink-500"
              />{" "}
              Purchases
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                value="stockTransfers"
                onChange={handleSectionChange}
                className="mr-2 accent-pink-500"
              />{" "}
              Stock Transfers
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                value="stocks"
                onChange={handleSectionChange}
                className="mr-2 accent-pink-500"
              />{" "}
              Stocks
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                value="paymentTransactions"
                onChange={handleSectionChange}
                className="mr-2 accent-pink-500"
              />{" "}
              Payment Transactions
            </label>
          </div>
        </div>
      )}
      <div className="flex items-center space-x-3 mb-6">
        <button
          onClick={exportToPDF}
          className="flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          disabled={loading || data.length === 0}
        >
          <FileDown className="w-4 h-4 mr-2" /> Export PDF
        </button>

        <button
          onClick={handleGenerateReport}
          className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          disabled={loading}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />{" "}
          Refresh
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {(!filters.clientId && data.length === 0 && !loading) ||
        (filters.clientId && !siteData && !loading) ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-100 to-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-pink-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Generate Report
            </h3>
            <p className="text-gray-500">
              Please select filters and generate the report.
            </p>
          </div>
        ) : loading ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-100 to-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-8 h-8 text-pink-500 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Loading Report
            </h3>
            <p className="text-gray-500">Fetching client report data...</p>
          </div>
        ) : (
          <div className="p-6">
            <p className="text-gray-600">
              Report data loaded. Use the export buttons above to download.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
