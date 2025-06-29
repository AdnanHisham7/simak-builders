import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  getSiteDetails,
  updateSite,
  Site,
  getSites,
  updatePhaseStatus,
  uploadDocument,
  markSiteAsCompleted,
} from "@/services/siteService";
import SelectUserModal from "./SelectUserModal";
import AddPurchaseModal from "./AddPurchaseModal";
import {
  ChevronLeft,
  MapPin,
  DollarSign,
  Users,
  Calendar,
  CheckCircle2,
  Circle,
  UserPlus,
  ShoppingCart,
  TrendingUp,
  Clock,
  Building,
  Eye,
  UserX,
  Plus,
  Activity,
  Package,
  Download,
  Wrench,
  X,
  FileText,
  Upload,
  User,
} from "lucide-react";
import RequestTransferModal from "./RequestTransferModal";
import {
  getPurchasesBySite,
  verifyPurchase,
  deleteBillUpload,
} from "@/services/purchaseService";
// import { User } from "@/services/userService";
import {
  getStocksBySite,
  getStockTransfers,
  logStockUsage,
  requestStockTransfer,
} from "@/services/stockService";
import LogUsageModal from "./LogUsageModal";
import {
  getAttendanceDetailsForDay,
  getSiteAttendance,
} from "@/services/attendanceService";
import MarkAttendanceModal from "./MarkAttendanceModal";
import AttendanceByDay from "./AttendanceByDay";
import AddMachineryRentalModal from "./AddMachineryModal";
import {
  getMachineryRentalsBySite,
  verifyMachineryRental,
} from "@/services/machineryRentalService";
import TransactionsModal from "./TransactionsModal";
import { toast } from "sonner";
import { privateClient } from "@/api";
import CompleteSiteModal from "./CompleteSiteModal";

interface Transaction {
  date: string;
  amount: number;
  type: "purchase" | "rental" | "attendance" | "stockTransfer";
  description: string;
  relatedId: string;
  user: { id: string; name: string };
}

interface ExtendedSite extends Site {
  transactions: Transaction[];
}

const SiteDetail: React.FC = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const { user, userType } = useSelector((state: RootState) => state.auth);
  const [site, setSite] = useState<ExtendedSite | null>(null);
  const [sites, setSites] = useState<{ _id: string; name: string }[]>([]);

  const [purchases, setPurchases] = useState<any[]>([]);
  const [machineryRentals, setMachineryRentals] = useState<any[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddPurchaseModalOpen, setIsAddPurchaseModalOpen] = useState(false);
  const [isAddMachineryRentalModalOpen, setIsAddMachineryRentalModalOpen] =
    useState(false);
  const [isLogUsageModalOpen, setIsLogUsageModalOpen] = React.useState(false);

  const [isRequestTransferModalOpen, setIsRequestTransferModalOpen] =
    useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [attendanceData, setAttendanceData] = useState<
    { date: string; count: number; level: number }[]
  >([]);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDayAttendance, setSelectedDayAttendance] = useState<
    any[] | null
  >(null);

  const [selectedTab, setSelectedTab] = useState<
    | "overview"
    | "team"
    | "attendance"
    | "purchases"
    | "stocks"
    | "machineryRentals"
    | "documents"
  >("overview");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMarkAttendanceModalOpen, setIsMarkAttendanceModalOpen] =
    useState(false);
  const [currentRole, setCurrentRole] = useState<
    "siteManager" | "architect" | "supervisor" | null
  >(null);

  const [isTransactionsModalOpen, setIsTransactionsModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSite = async () => {
      try {
        const siteData = await getSiteDetails(siteId!);
        setSite(siteData);

        const stocksData = await getStocksBySite(siteId!);
        setStocks(stocksData);

        const sitesData = await getSites();
        setSites(sitesData);

        setLoading(false);
        setTimeout(() => setIsAnimating(true), 100);
      } catch (err) {
        console.error("Error fetching site details:", err);
        setError("Failed to fetch site details.");
        setLoading(false);
      }
    };
    fetchSite();
  }, [siteId]);

  useEffect(() => {
    if (selectedTab === "purchases") {
      fetchPurchases();
    } else if (selectedTab === "attendance") {
      fetchAttendance();
    } else if (selectedTab === "machineryRentals") {
      fetchMachineryRentals();
    }
  }, [selectedTab, siteId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [attendanceData]);

  const fetchPurchases = async () => {
    try {
      const data = await getPurchasesBySite(siteId!);
      const sortedData = data.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setPurchases(sortedData);
    } catch (err) {
      console.error("Error fetching purchases:", err);
    }
  };

  const fetchMachineryRentals = async () => {
    try {
      const data = await getMachineryRentalsBySite(siteId!);
      const sortedData = data.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setMachineryRentals(sortedData);
    } catch (err) {
      console.error("Error fetching machinery rentals:", err);
    }
  };

  const fetchAttendance = async () => {
    setIsAttendanceLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setMonth(endDate.getMonth() - 10);

      const data = await getSiteAttendance(
        siteId!,
        startDate.toISOString(),
        endDate.toISOString()
      );

      const dateRange = [];
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        dateRange.push(currentDate.toISOString().split("T")[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const attendanceMap = new Map(data.map((d: any) => [d.date, d]));

      const getLevel = (percentage: number) => {
        if (percentage === 0) return 0;
        if (percentage <= 25) return 1;
        if (percentage <= 50) return 2;
        if (percentage <= 75) return 3;
        return 4;
      };

      const attendanceData = dateRange.map((date) => {
        const record = attendanceMap.get(date);
        if (record) {
          const percentage = record.percentage;
          return {
            date,
            count: record.totalEffectiveAttendance,
            level: getLevel(percentage),
          };
        }
        return { date, count: 0, level: 0 };
      });

      setAttendanceData(attendanceData);
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setError("Failed to fetch attendance data.");
    } finally {
      setIsAttendanceLoading(false);
    }
  };

  const handleVerifyMachineryRental = async (rentalId: string) => {
    try {
      await verifyMachineryRental(rentalId);
      fetchMachineryRentals();
    } catch (err) {
      console.error("Error verifying machinery rental:", err);
    }
  };

  const handleLogUsage = async (usageData) => {
    try {
      await logStockUsage(usageData);
      const updatedStocks = await getStocksBySite(siteId!);
      setStocks(updatedStocks);
      setIsLogUsageModalOpen(false);
    } catch (err) {
      setError("Failed to log usage");
    }
  };

  const canVerifyPurchase = userType === "admin";

  const canMarkAttendance =
    userType === "admin" ||
    (userType === "siteManager" &&
      site?.siteManagers.some((m) => m.id === user?.id));

  const handleVerify = async (purchaseId: string) => {
    try {
      await verifyPurchase(purchaseId);
      fetchPurchases();
    } catch (err) {
      console.error("Error verifying purchase:", err);
    }
  };

  const downloadSiteDocumentsZip = async () => {
    try {
      const response = await privateClient.get(
        `/sites/${siteId}/documents/zip`,
        {
          responseType: "blob",
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `site_${siteId}_documents.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading site documents:", error);
      toast.error("Failed to download site documents.");
    }
  };

  const downloadPurchaseBillsZip = async () => {
    try {
      const response = await privateClient.get(
        `/sites/${siteId}/purchases/bills/zip`,
        {
          responseType: "blob",
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `site_${siteId}_purchase_bills.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading purchase bills:", error);
      toast.error("Failed to download purchase bills.");
    }
  };

  const handleMarkAsCompleted = async (
    deleteSiteDocuments: boolean,
    deletePurchaseBills: boolean
  ) => {
    try {
      await markSiteAsCompleted(
        siteId!,
        deleteSiteDocuments,
        deletePurchaseBills
      );
      const updatedSite = await getSiteDetails(siteId!);
      setSite(updatedSite);
      toast.success("Site marked as completed successfully.");
    } catch (error) {
      console.error("Error marking site as completed:", error);
      toast.error("Failed to mark site as completed.");
    }
  };

  const handleDeletePurchase = async (purchaseId: string) => {
    if (window.confirm("Are you sure you want to delete this purchase?")) {
      try {
        // Placeholder for captcha token; replace with actual reCAPTCHA integration
        const captchaToken = "dummy-token";
        await deletePurchase(purchaseId, captchaToken);
        fetchPurchases();
      } catch (err) {
        console.error("Error deleting purchase:", err);
        setError("Failed to delete purchase.");
      }
    }
  };

  const openAddModal = (role: "siteManager" | "architect" | "supervisor") => {
    setCurrentRole(role);
    setIsModalOpen(true);
  };

  const handleRequestTransfer = async (transferData) => {
    try {
      await requestStockTransfer(transferData);
      const updatedStocks = await getStocksBySite(siteId!);
      setStocks(updatedStocks);
      setIsRequestTransferModalOpen(false);
    } catch (err) {
      setError("Failed to request transfer");
    }
  };

  const handlePhaseToggle = async (phaseId: string) => {
    if (userType !== "admin") return;
    const updatedPhases = site!.phases.map((phase) =>
      phase.id === phaseId
        ? { ...phase, isCompleted: !phase.isCompleted }
        : phase
    );
    try {
      await updateSite(site!.id, { phases: updatedPhases });
      setSite({ ...site!, phases: updatedPhases });
    } catch (err) {
      console.error("Error updating phase:", err);
      setError("Failed to update phase.");
    }
  };

  const handleResetPhases = async () => {
    if (userType !== "admin") return;
    if (
      !window.confirm(
        "Are you sure you want to reset all phases to 'not started'?"
      )
    )
      return;
    const resetPhases = site!.phases.map((phase) => ({
      _id: phase.id,
      name: phase.name,
      status: "not started",
      completionDate: null,
    }));
    try {
      await updateSite(site!.id, { phases: resetPhases });
      const updatedPhases = site!.phases.map((phase) => ({
        ...phase,
        status: "not started",
        completionDate: undefined,
      }));
      setSite({ ...site!, phases: updatedPhases });
    } catch (err) {
      console.error("Error resetting phases:", err);
      setError("Failed to reset phases.");
    }
  };

  const handlePhaseStatusChange = async (
    phaseId: string,
    newStatus: string
  ) => {
    try {
      await updatePhaseStatus(site!.id, phaseId, newStatus);
      const updatedPhases = site!.phases.map((phase) =>
        phase.id === phaseId ? { ...phase, status: newStatus } : phase
      );
      setSite({ ...site!, phases: updatedPhases });
    } catch (err) {
      console.error("Error updating phase status:", err);
      setError("Failed to update phase status.");
    }
  };

  const handleAddTeamMember = async (
    user: User,
    role: "siteManager" | "architect" | "supervisor"
  ) => {
    try {
      let updatedIds: string[];
      let field: string;

      if (role === "siteManager") {
        updatedIds = [...site!.siteManagers.map((m) => m.id), user.id];
        field = "siteManagerIds";
      } else if (role === "architect") {
        updatedIds = [...site!.architects.map((a) => a.id), user.id];
        field = "architectIds";
      } else {
        updatedIds = [...site!.supervisors.map((s) => s.id), user.id];
        field = "supervisorIds";
      }
      await updateSite(site!.id, { [field]: updatedIds });
      const updatedSite = await getSiteDetails(site!.id);
      setSite(updatedSite);
      setIsModalOpen(false);
    } catch (err) {
      setError("Failed to add team member.");
    }
  };

  const handleRemoveTeamMember = async (
    memberId: string,
    role: "siteManager" | "architect" | "supervisor"
  ) => {
    if (userType !== "admin") return;
    const field =
      role === "siteManager"
        ? "siteManagers"
        : role === "architect"
        ? "architects"
        : "supervisors";
    const updatedMembers = site![field].filter(
      (member) => member.id !== memberId
    );
    const updateField =
      role === "siteManager"
        ? "siteManagerIds"
        : role === "architect"
        ? "architectIds"
        : "supervisorIds";
    try {
      await updateSite(site!.id, {
        [updateField]: updatedMembers.map((m) => m.id),
      });
      setSite({ ...site!, [field]: updatedMembers });
    } catch (err) {
      setError("Failed to remove team member.");
    }
  };

  const handleDeleteBillUpload = async (purchaseId: string) => {
    if (window.confirm("Are you sure you want to delete the bill upload?")) {
      try {
        await deleteBillUpload(purchaseId);
        setPurchases(
          purchases.map((p) =>
            p._id === purchaseId ? { ...p, billUpload: null } : p
          )
        );
        toast.success("Bill successfully deleted");
      } catch (err) {
        console.error("Error deleting bill upload:", err);
        setError("Failed to delete bill upload.");
      }
    }
  };

  const handleDayClick = async (date: string) => {
    setSelectedDate(date);
    setSelectedDayAttendance(null);
    try {
      const data = await getAttendanceDetailsForDay(siteId!, date);
      setSelectedDayAttendance(data || []);
    } catch (error) {
      console.error("Error fetching attendance details:", error);
      setSelectedDayAttendance([]);
    }
  };

  const handleUpload = async (
    siteId: string,
    file: File,
    category: "client" | "site"
  ) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);
      await uploadDocument(siteId, formData);
      const updatedSite = await getSiteDetails(siteId);
      setSite(updatedSite);
    } catch (error) {
      console.error("Error uploading document:", error);
      setError("Failed to upload document.");
    }
  };

  const getAttendanceColor = (level: number) => {
    const colors = [
      "bg-gray-100",
      "bg-green-200",
      "bg-green-300",
      "bg-green-500",
      "bg-green-700",
    ];
    return colors[level] || colors[0];
  };

  const getAttendanceHoverColor = (level: number) => {
    const colors = [
      "hover:bg-gray-200",
      "hover:bg-green-300",
      "hover:bg-green-400",
      "hover:bg-green-600",
      "hover:bg-green-800",
    ];
    return colors[level] || colors[0];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getMonthLabels = () => {
    const months = [];
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push(date.toLocaleDateString("en-US", { month: "short" }));
    }
    return months;
  };

  const getDayLabels = () => ["Mon", "Wed", "Fri"];

  const getMonthLabelsPositions = () => {
    const labels = [];
    let lastMonth = null;

    renderAttendanceGrid().forEach((week, index) => {
      const firstDay = week.find((d) => d !== null);
      if (!firstDay) return;

      const month = new Date(firstDay.date).toLocaleString("default", {
        month: "short",
      });
      if (month !== lastMonth) {
        labels.push({ label: month, index });
        lastMonth = month;
      }
    });

    return labels;
  };

  const renderAttendanceGrid = () => {
    const weeks = [];
    let currentWeek = [];

    attendanceData.forEach((day, index) => {
      const date = new Date(day.date);
      const dayOfWeek = date.getDay();

      if (index === 0) {
        for (let i = 0; i < dayOfWeek; i++) {
          currentWeek.push(null);
        }
      }

      currentWeek.push(day);

      if (dayOfWeek === 6 || index === attendanceData.length - 1) {
        while (currentWeek.length < 7) {
          currentWeek.push(null);
        }
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });

    return weeks;
  };

  const canAddPurchase =
    userType === "admin" ||
    userType === "siteManager" ||
    userType === "supervisor";
  const canManageStocks = userType === "siteManager" || userType === "admin";
  const canAddMachineryRental = canAddPurchase;
  const canUploadDocuments = userType === "admin" || userType === "siteManager";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        Loading site details...
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building className="w-8 h-8 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Site Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            {error || "The requested site could not be found."}
          </p>
          <button
            onClick={() => navigate(`/${userType}/sites`)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Sites
          </button>
        </div>
      </div>
    );
  }

  const completedPhases = site.phases.filter(
    (phase) => phase.status === "completed"
  ).length;
  const totalPhases = site.phases.length;
  const progressPercentage =
    totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0;

  const clientDocuments = site.documents.filter(
    (doc) => doc.category === "client"
  );
  const siteDocuments = site.documents.filter((doc) => doc.category === "site");

  const tabs = [
    { id: "overview", label: "Overview", icon: Eye },
    { id: "team", label: "Team", icon: Users },
    { id: "attendance", label: "Attendance", icon: Calendar },
    { id: "purchases", label: "Purchases", icon: ShoppingCart },
    { id: "machineryRentals", label: "Machinery/Rentals", icon: Wrench },
    { id: "stocks", label: "Stocks", icon: Package },
    { id: "documents", label: "Documents", icon: FileText },
  ];

  return (
    <div className="bg-gray-50">
      <div className="bg-white/10 backdrop-blur-xl bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/${userType}/sites`)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="font-medium">Back to Sites</span>
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {site.name}
                </h1>
                <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {site.address}, {site.city}, {site.state} {site.zip}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  site.status === "InProgress"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {site.status}
              </div>
              {userType === "admin" && site.status === "InProgress" && (
                <button
                  onClick={() => setIsCompleteModalOpen(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark as Completed</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div
            className={`relative bg-white rounded-2xl shadow-lg border border-gray-200 transition-all duration-300 transform overflow-hidden ${
              isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
            } hover:shadow-xl hover:scale-105`}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-2xl" />
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Budget</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{site.budget.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          <div
            className={`relative bg-white rounded-2xl shadow-lg border border-gray-200 transition-all duration-300 transform overflow-hidden ${
              isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
            } hover:shadow-xl hover:scale-105 cursor-pointer`}
            style={{ transitionDelay: "100ms" }}
            onClick={() => setIsTransactionsModalOpen(true)}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-t-2xl" />
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expenses</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{site.expenses.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          <div
            className={`relative bg-white rounded-2xl shadow-lg border border-gray-200 transition-all duration-300 transform overflow-hidden ${
              isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
            } hover:shadow-xl hover:scale-105`}
            style={{ transitionDelay: "200ms" }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-teal-500 rounded-t-2xl" />
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Progress</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(progressPercentage)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          <div
            className={`relative bg-white rounded-2xl shadow-lg border border-gray-200 transition-all duration-300 transform overflow-hidden ${
              isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
            } hover:shadow-xl hover:scale-105`}
            style={{ transitionDelay: "300ms" }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-2xl" />
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Team Size</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {site.siteManagers.length + site.architects.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8 transition-all duration-500 transform ${
            isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
          style={{ transitionDelay: "400ms" }}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Project Progress
            </h3>
            <span className="text-sm text-gray-600">
              {completedPhases} of {totalPhases} phases completed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-all duration-200 ${
                      selectedTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {selectedTab === "overview" && (
          <div
            className={`relative bg-white rounded-2xl shadow-lg border border-gray-200 transition-all duration-500 transform overflow-hidden ${
              isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
            style={{ transitionDelay: "500ms" }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl" />
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                  <CheckCircle2 className="w-7 h-7 text-blue-600" />
                  <span>Phase Checklist</span>
                </h2>
                {userType === "admin" && (
                  <button
                    onClick={handleResetPhases}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                  >
                    Reset Phases
                  </button>
                )}
              </div>
              <div className="grid gap-4">
                {site.phases.map((phase, index) => (
                  <div
                    key={phase.id}
                    className={`flex items-center p-4 rounded-xl border-2 transition-all duration-200 ${
                      phase.status === "completed"
                        ? "bg-green-50 border-green-200 hover:border-green-300"
                        : phase.status === "pending"
                        ? "bg-yellow-50 border-yellow-200 hover:border-yellow-300"
                        : "bg-gray-50 border-gray-200 hover:border-gray-300"
                    }`}
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    {phase.status === "not started" && (
                      <Circle className="w-5 h-5 text-gray-400 mr-4" />
                    )}
                    {phase.status === "pending" && (
                      <Clock className="w-5 h-5 text-yellow-500 mr-4" />
                    )}
                    {phase.status === "completed" && (
                      <CheckCircle2 className="w-5 h-5 text-green-500 mr-4" />
                    )}
                    {userType === "siteManager" &&
                      phase.status === "not started" && (
                        <button
                          onClick={() =>
                            handlePhaseStatusChange(phase.id, "pending")
                          }
                          className="mr-4 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200"
                        >
                          Request Completion
                        </button>
                      )}
                    {userType === "siteManager" &&
                      phase.status === "pending" && (
                        <span className="mr-4 text-yellow-600">
                          Pending Verification
                        </span>
                      )}
                    {userType === "admin" && phase.status === "pending" && (
                      <button
                        onClick={() =>
                          handlePhaseStatusChange(phase.id, "completed")
                        }
                        className="mr-4 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all duration-200"
                      >
                        Verify Completion
                      </button>
                    )}
                    {userType === "admin" && phase.status === "not started" && (
                      <button
                        onClick={() =>
                          handlePhaseStatusChange(phase.id, "completed")
                        }
                        className="mr-4 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200"
                      >
                        Mark as Completed
                      </button>
                    )}
                    <span
                      className={`font-medium ${
                        phase.status === "completed"
                          ? "text-green-800"
                          : phase.status === "pending"
                          ? "text-yellow-800"
                          : "text-gray-700"
                      }`}
                    >
                      {phase.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTab === "team" && (
          <div className="grid gap-6">
            <div
              className={`relative bg-white rounded-2xl shadow-lg border border-gray-200 transition-all duration-500 transform ${
                isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
              }`}
              style={{ transitionDelay: "500ms" }}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-2xl" />
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                    <Users className="w-6 h-6 text-blue-600" />
                    <span>Site Managers</span>
                  </h3>
                  {userType === "admin" && (
                    <button
                      onClick={() => openAddModal("siteManager")}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Add Manager</span>
                    </button>
                  )}
                </div>
                <div className="grid gap-3">
                  {site.siteManagers.map((manager, index) => (
                    <div
                      key={manager.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {manager.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">
                          {manager.name}
                        </span>
                      </div>
                      {userType === "admin" && (
                        <button
                          onClick={() =>
                            handleRemoveTeamMember(manager.id, "siteManager")
                          }
                          className="text-red-600 hover:text-red-800 p-2 rounded-lg"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {site.architects.length > 0 && (
              <div
                className={`relative bg-white rounded-2xl shadow-lg border border-gray-200 transition-all duration-500 transform ${
                  isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
                }`}
                style={{ transitionDelay: "600ms" }}
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-2xl" />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                      <Building className="w-6 h-6 text-purple-600" />
                      <span>Architects</span>
                    </h3>
                    {userType === "admin" && (
                      <button
                        onClick={() => openAddModal("architect")}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Add Architect</span>
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3">
                    {site.architects.map((architect, index) => (
                      <div
                        key={architect.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-purple-600 font-semibold text-sm">
                              {architect.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">
                            {architect.name}
                          </span>
                        </div>
                        {userType === "admin" && (
                          <button
                            onClick={() =>
                              handleRemoveTeamMember(architect.id, "architect")
                            }
                            className="text-red-600 hover:text-red-800 p-2 rounded-lg"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {site.supervisors.length > 0 && (
              <div
                className={`relative bg-white rounded-2xl shadow-lg border border-gray-200 transition-all duration-500 transform ${
                  isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
                }`}
                style={{ transitionDelay: "700ms" }}
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-teal-500 rounded-t-2xl" />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                      <Users className="w-6 h-6 text-green-600" />
                      <span>Supervisors</span>
                    </h3>
                    {userType === "admin" && (
                      <button
                        onClick={() => openAddModal("supervisor")}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Add Supervisor</span>
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3">
                    {site.supervisors.map((supervisor, index) => (
                      <div
                        key={supervisor.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-semibold text-sm">
                              {supervisor.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">
                            {supervisor.name}
                          </span>
                        </div>
                        {userType === "admin" && (
                          <button
                            onClick={() =>
                              handleRemoveTeamMember(
                                supervisor.id,
                                "supervisor"
                              )
                            }
                            className="text-red-600 hover:text-red-800 p-2 rounded-lg"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedTab === "attendance" && (
          <div
            className={`relative bg-white rounded-2xl shadow-lg border border-gray-200 transition-all duration-500 transform overflow-hidden ${
              isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
            style={{ transitionDelay: "500ms" }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-teal-500 rounded-t-2xl" />
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                    <Calendar className="w-7 h-7 text-green-600" />
                    <span>Employee Attendance</span>
                  </h2>
                  <p className="text-gray-600 mt-2">
                    Track daily employee attendance with visual insights
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  {canMarkAttendance && (
                    <button
                      onClick={() => setIsMarkAttendanceModalOpen(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Mark Attendance</span>
                    </button>
                  )}
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>Less</span>
                    <div className="flex space-x-1">
                      {[0, 1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`w-3 h-3 rounded-sm ${getAttendanceColor(
                            level
                          )}`}
                        />
                      ))}
                    </div>
                    <span>More</span>
                  </div>
                </div>
              </div>

              {isAttendanceLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                  <span className="ml-2 text-gray-600">
                    Loading attendance data...
                  </span>
                </div>
              ) : (
                <div className="overflow-x-auto" ref={scrollRef}>
                  <div className="inline-block min-w-full">
                    <div className="flex mb-1 ml-[40px]">
                      {renderAttendanceGrid().map((_, index) => {
                        const labelObj = getMonthLabelsPositions().find(
                          (l) => l.index === index
                        );
                        return (
                          <div
                            key={index}
                            className="w-3 mr-1 text-xs text-gray-600"
                          >
                            {labelObj ? labelObj.label : ""}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex">
                      <div className="flex flex-col mr-2">
                        {["Mon", "Wed", "Fri"].map((dayLabel, i) => (
                          <div
                            key={i}
                            className="text-xs text-gray-600 h-3 mb-1"
                            style={{ marginTop: i === 0 ? "12px" : "18px" }}
                          >
                            {dayLabel}
                          </div>
                        ))}
                      </div>

                      <div className="flex">
                        {renderAttendanceGrid().map((week, weekIndex) => (
                          <div key={weekIndex} className="flex flex-col mr-1">
                            {week.map((day, dayIndex) => (
                              <div
                                key={`${weekIndex}-${dayIndex}`}
                                className={`w-3 h-3 mb-1 rounded-sm cursor-pointer transition-all duration-200 ${
                                  day
                                    ? `${getAttendanceColor(
                                        day.level
                                      )} ${getAttendanceHoverColor(
                                        day.level
                                      )} hover:scale-110`
                                    : "bg-gray-100"
                                }`}
                                onClick={() => day && handleDayClick(day.date)}
                                onMouseEnter={() =>
                                  day && setHoveredDate(day.date)
                                }
                                onMouseLeave={() => setHoveredDate(null)}
                                title={
                                  day
                                    ? `${formatDate(
                                        day.date
                                      )}: ${day.count?.toFixed(
                                        1
                                      )} effective attendance`
                                    : ""
                                }
                              ></div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTab === "purchases" && (
          <div
            className={`relative bg-white rounded-2xl shadow-lg border border-gray-200 transition-all duration-500 transform overflow-hidden ${
              isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
            style={{ transitionDelay: "500ms" }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-2xl" />
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                  <ShoppingCart className="w-7 h-7 text-blue-600" />
                  <span>Purchases</span>
                </h2>
                {canAddPurchase && (
                  <button
                    onClick={() => setIsAddPurchaseModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Purchase</span>
                  </button>
                )}
              </div>
              {purchases.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vendor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {purchases.map((purchase) => (
                      <tr key={purchase.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(purchase.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          ₹{purchase.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {purchase.vendor?.name || purchase.vendor}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              purchase.status === "verified"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {purchase.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {canVerifyPurchase &&
                              purchase.status === "pending" && (
                                <button
                                  onClick={() => handleVerify(purchase._id)}
                                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                  Verify
                                </button>
                              )}
                            {purchase.billUpload && purchase.billUpload.url && (
                              <div>
                                <a
                                  href={`${import.meta.env.VITE_API_URL}${
                                    purchase.billUpload.url
                                  }`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800"
                                  title="View Bill"
                                >
                                  <Eye className="w-4 h-4" />
                                </a>
                              </div>
                            )}
                            {userType === "admin" && purchase.billUpload && (
                              <button
                                onClick={() =>
                                  handleDeleteBillUpload(purchase._id)
                                }
                                className="text-red-600 hover:text-red-800"
                                title="Delete Bill Upload"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-600">
                  No purchases found for this site.
                </p>
              )}
            </div>
          </div>
        )}

        {selectedTab === "stocks" && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center space-x-3">
                <Package className="w-7 h-7 text-blue-600" />
                <span>Stocks</span>
              </h2>
              {canManageStocks && (
                <div className="space-x-4">
                  <button
                    onClick={() => setIsRequestTransferModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                  >
                    Request Transfer
                  </button>
                  <button
                    onClick={() => setIsLogUsageModalOpen(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg"
                  >
                    Log Usage
                  </button>
                </div>
              )}
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Quantity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stocks.map((stock) => (
                  <tr key={stock._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {stock.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {stock.quantity} {stock.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedTab === "machineryRentals" && (
          <div
            className={`relative bg-white rounded-2xl shadow-lg border border-gray-200 transition-all duration-500 transform overflow-hidden ${
              isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
            style={{ transitionDelay: "500ms" }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-2xl" />
            <div className="p-8">
              <div className="flex justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center space-x-3">
                  <Wrench className="w-7 h-7 text-blue-600" />
                  <span>Machinery/Rentals</span>
                </h2>
                {canAddMachineryRental && (
                  <button
                    onClick={() => setIsAddMachineryRentalModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Machinery/Rental</span>
                  </button>
                )}
              </div>
              {machineryRentals.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {machineryRentals.map((rental) => (
                      <tr key={rental._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(rental.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {rental.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          ₹{rental.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              rental.status === "verified"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {rental.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {userType === "admin" &&
                            rental.status === "pending" && (
                              <button
                                onClick={() =>
                                  handleVerifyMachineryRental(rental._id)
                                }
                                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                              >
                                Verify
                              </button>
                            )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-600">
                  No machinery/rentals found for this site.
                </p>
              )}
            </div>
          </div>
        )}

        {selectedTab === "documents" && (
          <div
            className={`relative bg-white rounded-2xl shadow-lg border border-gray-200 transition-all duration-500 transform overflow-hidden ${
              isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
            style={{ transitionDelay: "500ms" }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-2xl" />
            <div className="p-8">
              <div className="space-y-6">
                {/* Client Documentation */}
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-700 flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Client Documentation ({clientDocuments.length})
                    </h4>
                    {canUploadDocuments && (
                      <label className="relative cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleUpload(
                                site.id,
                                e.target.files[0],
                                "client"
                              );
                            }
                          }}
                        />
                        <div className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                          <Upload className="h-4 w-4" />
                          <span>Upload Client Document</span>
                        </div>
                      </label>
                    )}
                  </div>
                  {clientDocuments.length === 0 ? (
                    <p className="text-gray-500 text-sm mt-2">
                      No client documents uploaded yet
                    </p>
                  ) : (
                    <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                      {clientDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {doc.name}
                              </p>
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <span>{(doc.size / 1024).toFixed(1)} KB</span>
                                <span>•</span>
                                <User className="h-3 w-3" />
                                <span>{doc.uploadedBy.name}</span>
                                <span>•</span>
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {new Date(
                                    doc.uploadDate
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <a
                              href={`${import.meta.env.VITE_API_URL}${doc.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <Download className="h-4 w-4 text-gray-500" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Site Documentation */}
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-700 flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Site Documentation ({siteDocuments.length})
                    </h4>
                    {canUploadDocuments && (
                      <label className="relative cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleUpload(site.id, e.target.files[0], "site");
                            }
                          }}
                        />
                        <div className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                          <Upload className="h-4 w-4" />
                          <span>Upload Site Document</span>
                        </div>
                      </label>
                    )}
                  </div>
                  {siteDocuments.length === 0 ? (
                    <p className="text-gray-500 text-sm mt-2">
                      No site documents uploaded yet
                    </p>
                  ) : (
                    <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                      {siteDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {doc.name}
                              </p>
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <span>{(doc.size / 1024).toFixed(1)} KB</span>
                                <span>•</span>
                                <User className="h-3 w-3" />
                                <span>{doc.uploadedBy.name}</span>
                                <span>•</span>
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {new Date(
                                    doc.uploadDate
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <a
                              href={`${import.meta.env.VITE_API_URL}${doc.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <Download className="h-4 w-4 text-gray-500" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {isAddPurchaseModalOpen && (
          <AddPurchaseModal
            siteId={siteId!}
            onClose={() => {
              setIsAddPurchaseModalOpen(false);
              if (selectedTab === "purchases") fetchPurchases();
            }}
          />
        )}
        {isRequestTransferModalOpen && (
          <RequestTransferModal
            isOpen={isRequestTransferModalOpen}
            onClose={() => setIsRequestTransferModalOpen(false)}
            onSubmit={handleRequestTransfer}
            sites={sites}
            stocks={stocks}
            allowedToSites={sites.map((s) => s.id)}
          />
        )}
        {isLogUsageModalOpen && (
          <LogUsageModal
            isOpen={isLogUsageModalOpen}
            onClose={() => setIsLogUsageModalOpen(false)}
            onSubmit={handleLogUsage}
            sites={sites}
            stocks={stocks}
          />
        )}
        {isModalOpen && currentRole && (
          <SelectUserModal
            role={currentRole}
            excludedIds={
              currentRole === "siteManager"
                ? site.siteManagers.map((m) => m.id)
                : currentRole === "architect"
                ? site.architects.map((a) => a.id)
                : site.supervisors.map((s) => s.id)
            }
            onSelect={(user) => handleAddTeamMember(user, currentRole)}
            onClose={() => setIsModalOpen(false)}
          />
        )}
        {isMarkAttendanceModalOpen && (
          <MarkAttendanceModal
            siteId={siteId!}
            onClose={() => setIsMarkAttendanceModalOpen(false)}
            onAttendanceMarked={fetchAttendance}
          />
        )}
        {selectedDate && (
          <AttendanceByDay
            selectedDate={selectedDate}
            selectedDayAttendance={selectedDayAttendance}
            formatDate={formatDate}
            onClose={() => setSelectedDate(null)}
          />
        )}
        {isAddMachineryRentalModalOpen && (
          <AddMachineryRentalModal
            siteId={siteId!}
            onClose={() => setIsAddMachineryRentalModalOpen(false)}
          />
        )}
        {isTransactionsModalOpen && site.transactions && (
          <TransactionsModal
            transactions={site.transactions}
            onClose={() => setIsTransactionsModalOpen(false)}
          />
        )}
        {isCompleteModalOpen && (
          <CompleteSiteModal
            isOpen={isCompleteModalOpen}
            onClose={() => setIsCompleteModalOpen(false)}
            onConfirm={handleMarkAsCompleted}
            downloadSiteDocuments={downloadSiteDocumentsZip}
            downloadPurchaseBills={downloadPurchaseBillsZip}
          />
        )}
      </div>
    </div>
  );
};

export default SiteDetail;
