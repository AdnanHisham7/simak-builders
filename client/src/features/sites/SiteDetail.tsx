import React, { useEffect, useRef, useState, useMemo } from "react";
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
  updateSupervisionPercentage,
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
  ChevronDown,
  ChevronRight,
  FileX,
  Trash2,
  Edit2,
  Percent,
  Check,
  Search,
  Briefcase,
} from "lucide-react";
import ConvertToPortfolioModal from "./ConvertToPortfolioModal";
import { getProjectBySiteId, Project as PortfolioProject } from "@/services/portfolioService";
import RequestTransferModal from "../stocks/RequestTransferModal";
import {
  getPurchasesBySite,
  verifyPurchase,
  updatePurchaseItem,
  deleteBillUpload,
  deletePurchase,
} from "@/services/purchaseService";
import { searchItems, ItemSuggestion } from "@/services/itemService";
import { PURCHASE_CATEGORIES } from "@/constants/purchaseOptions";
import {
  getStocksBySite,
  logStockUsage,
  requestStockTransfer,
  Stock,
} from "@/services/stockService";
import LogUsageModal from "../stocks/LogUsageModal";
import {
  getAttendanceDetailsForDay,
  getSiteAttendance,
} from "@/services/attendanceService";
import MarkAttendanceModal from "./MarkAttendanceModal";
import AttendanceByDay from "./AttendanceByDay";
import AddMiscellaneousExpenseModal from "./AddMiscellaneousExpenseModal";
import {
  deleteMiscellaneousExpense,
  getMiscellaneousExpensesBySite,
  verifyMiscellaneousExpense,
  updateMiscellaneousExpense,
} from "@/services/miscellaneousExpenseService";
import TransactionsModal from "./TransactionsModal";
import { toast } from "sonner";
import { privateClient } from "@/api";
import CompleteSiteModal from "./CompleteSiteModal";
import ClientPaymentsModal from "./ClientPaymentsModal";
import SiteContractorsManager from "../contractors/SiteContractorsManager";
import { Card } from "@/components/ui/Card";
import GradientStatCard from "@/components/ui/GradientStatCard";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import PageLoader from "@/components/ui/PageLoader";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Tooltip from "@/components/ui/Tooltip";
import { cn } from "@/lib/cn";

interface SiteTransaction {
  date: string;
  amount: number;
  type:
    | "purchase"
    | "miscellaneous"
    | "attendance"
    | "stockTransfer"
    | "client_payment"
    | "contractor_payment";
  description: string;
  relatedId: string;
  user: { id: string; name: string };
}

interface ExtendedSite extends Omit<Site, "transactions"> {
  transactions: SiteTransaction[];
}

const TAB_CONFIG = [
  { id: "overview", label: "Overview", icon: Eye },
  { id: "team", label: "Team", icon: Users },
  { id: "contractors", label: "Contractors", icon: Users },
  { id: "attendance", label: "Attendance", icon: Calendar },
  { id: "purchases", label: "Purchases", icon: ShoppingCart },
  { id: "miscellaneous", label: "Miscellaneous", icon: Wrench },
  { id: "stocks", label: "Stocks", icon: Package },
  { id: "documents", label: "Documents", icon: FileText },
] as const;

const SectionCard: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={cn("rounded-console border border-console-border bg-white p-6", className)}>
    {children}
  </div>
);

const SiteDetail: React.FC = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const { user, userType } = useSelector((state: RootState) => state.auth);
  const [site, setSite] = useState<ExtendedSite | null>(null);
  const [sites, setSites] = useState<{ id: string; name: string }[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [miscellaneousExpenses, setMiscellaneousExpenses] = useState<any[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddPurchaseModalOpen, setIsAddPurchaseModalOpen] = useState(false);
  const [isAddMiscellaneousModalOpen, setIsAddMiscellaneousModalOpen] =
    useState(false);
  const [isLogUsageModalOpen, setIsLogUsageModalOpen] = useState(false);
  const [isRequestTransferModalOpen, setIsRequestTransferModalOpen] =
    useState(false);
  const [attendanceData, setAttendanceData] = useState<
    { date: string; count: number; level: number }[]
  >([]);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDayAttendance, setSelectedDayAttendance] = useState<
    any[] | null
  >(null);
  const [selectedTab, setSelectedTab] = useState<
    (typeof TAB_CONFIG)[number]["id"]
  >("overview");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMarkAttendanceModalOpen, setIsMarkAttendanceModalOpen] =
    useState(false);
  const [currentRole, setCurrentRole] = useState<
    "siteManager" | "architect" | "supervisor" | null
  >(null);
  const [isTransactionsModalOpen, setIsTransactionsModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [linkedPortfolioProject, setLinkedPortfolioProject] =
    useState<PortfolioProject | null>(null);
  const [isEditingSupervision, setIsEditingSupervision] = useState(false);
  const [supervisionInput, setSupervisionInput] = useState("0");
  const [isSavingSupervision, setIsSavingSupervision] = useState(false);

  const [isClientPaymentsModalOpen, setIsClientPaymentsModalOpen] =
    useState(false);
  const [isManualPaymentModalOpen, setIsManualPaymentModalOpen] =
    useState(false);
  const [manualAmount, setManualAmount] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [manualDate, setManualDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [expandedPurchases, setExpandedPurchases] = useState<Set<string>>(
    new Set(),
  );
  const [editingItem, setEditingItem] = useState<{
    purchaseId: string;
    index: number;
  } | null>(null);
  const [editItemName, setEditItemName] = useState("");
  const [editItemCategory, setEditItemCategory] = useState("");
  const [editItemSuggestions, setEditItemSuggestions] = useState<
    ItemSuggestion[]
  >([]);
  const [showEditSuggestions, setShowEditSuggestions] = useState(false);
  const [savingItemEdit, setSavingItemEdit] = useState(false);
  const editItemSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const [purchaseSearchQuery, setPurchaseSearchQuery] = useState("");
  const [miscSearchQuery, setMiscSearchQuery] = useState("");
  const [stockSearchQuery, setStockSearchQuery] = useState("");
  const [documentSearchQuery, setDocumentSearchQuery] = useState("");

  const [editingMiscId, setEditingMiscId] = useState<string | null>(null);
  const [editMiscName, setEditMiscName] = useState("");
  const [editMiscCategory, setEditMiscCategory] = useState("");
  const [savingMiscEdit, setSavingMiscEdit] = useState(false);

  const [deletePurchaseTarget, setDeletePurchaseTarget] = useState<any | null>(
    null,
  );
  const [deletingPurchase, setDeletingPurchase] = useState(false);
  const [deleteMiscTarget, setDeleteMiscTarget] = useState<any | null>(null);
  const [deletingMisc, setDeletingMisc] = useState(false);
  const [resetPhasesConfirmOpen, setResetPhasesConfirmOpen] = useState(false);
  const [resettingPhases, setResettingPhases] = useState(false);
  const [verifyingPurchaseIds, setVerifyingPurchaseIds] = useState<Set<string>>(
    new Set(),
  );
  const [verifyingMiscIds, setVerifyingMiscIds] = useState<Set<string>>(
    new Set(),
  );

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSite = async () => {
      try {
        const siteData = await getSiteDetails(siteId!);
        setSite(siteData as ExtendedSite);

        const stocksData = await getStocksBySite(siteId!);
        setStocks(stocksData);
        const sitesData = await getSites();
        setSites(sitesData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching site details:", err);
        setError("Failed to fetch site details.");
        setLoading(false);
      }
    };
    fetchSite();
  }, [siteId]);

  useEffect(() => {
    if (userType !== "admin" || !siteId) return;
    getProjectBySiteId(siteId)
      .then(setLinkedPortfolioProject)
      .catch(() => setLinkedPortfolioProject(null));
  }, [siteId, userType]);

  const handleStartEditingSupervision = () => {
    setSupervisionInput(String(site?.supervisionPercentage ?? 0));
    setIsEditingSupervision(true);
  };

  const handleCancelEditingSupervision = () => {
    setIsEditingSupervision(false);
    setSupervisionInput(String(site?.supervisionPercentage ?? 0));
  };

  const handleSaveSupervision = async () => {
    const parsed = Number(supervisionInput);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
      toast.error("Supervision percentage must be between 0 and 100");
      return;
    }
    setIsSavingSupervision(true);
    try {
      await updateSupervisionPercentage(siteId!, parsed);
      setSite((prev) => (prev ? { ...prev, supervisionPercentage: parsed } : prev));
      setIsEditingSupervision(false);
      toast.success("Supervision percentage updated");
    } catch (err) {
      console.error("Error updating supervision percentage:", err);
      toast.error("Failed to update supervision percentage");
    } finally {
      setIsSavingSupervision(false);
    }
  };

  const handleManualPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(manualAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    try {
      await privateClient.post(`/client/${siteId}/client-payments/manual`, {
        amount,
        notes: manualNotes,
        date: manualDate,
      });
      toast.success("Manual client payment recorded (pending verification)");
      setIsManualPaymentModalOpen(false);
      setManualAmount("");
      setManualNotes("");
      setManualDate(new Date().toISOString().split("T")[0]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to record manual payment");
    }
  };

  const fetchPurchases = async () => {
    try {
      const data = await getPurchasesBySite(siteId!);
      const sortedData = data.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setPurchases(sortedData);
    } catch (err) {
      console.error("Error fetching purchases:", err);
    }
  };

  const fetchMiscellaneousExpenses = async () => {
    try {
      const data = await getMiscellaneousExpensesBySite(siteId!);
      const sortedData = [...data].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setMiscellaneousExpenses(sortedData);
    } catch (err) {
      console.error("Error fetching miscellaneous expenses:", err);
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
        endDate.toISOString(),
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
      const computedAttendanceData = dateRange.map((date) => {
        const record: any = attendanceMap.get(date);
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
      setAttendanceData(computedAttendanceData);
    } catch (err) {
      console.error("Error fetching attendance:", err);
      toast.error("Failed to fetch attendance data.");
    } finally {
      setIsAttendanceLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTab === "purchases") {
      fetchPurchases();
    } else if (selectedTab === "attendance") {
      fetchAttendance();
    } else if (selectedTab === "miscellaneous") {
      fetchMiscellaneousExpenses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab, siteId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [attendanceData]);

  const handleVerifyMiscellaneous = async (expenseId: string) => {
    if (verifyingMiscIds.has(expenseId)) return;
    setVerifyingMiscIds((prev) => new Set(prev).add(expenseId));
    try {
      const data = await verifyMiscellaneousExpense(expenseId);
      setMiscellaneousExpenses((prev) =>
        prev.map((exp) =>
          exp._id === expenseId ? { ...exp, status: "verified" } : exp,
        ),
      );
      if (data?.site) {
        setSite((prev) =>
          prev
            ? {
                ...prev,
                expenses: data.site.expenses,
                transactions: data.transaction
                  ? [data.transaction, ...prev.transactions]
                  : prev.transactions,
              }
            : prev,
        );
      }
      toast.success("Expense verified");
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to verify expense";
      toast.error(message);
      // The backend rejects a repeat verify with "already verified" once the
      // first request has gone through elsewhere (another admin tab, or a
      // stale notification panel). Reconcile local state instead of leaving
      // a pending badge on an expense that's actually done.
      if (typeof message === "string" && message.toLowerCase().includes("already verified")) {
        setMiscellaneousExpenses((prev) =>
          prev.map((exp) =>
            exp._id === expenseId ? { ...exp, status: "verified" } : exp,
          ),
        );
      }
    } finally {
      setVerifyingMiscIds((prev) => {
        const next = new Set(prev);
        next.delete(expenseId);
        return next;
      });
    }
  };

  const startEditMiscExpense = (exp: any) => {
    setEditingMiscId(exp._id);
    setEditMiscName(exp.name);
    setEditMiscCategory(exp.category);
  };

  const cancelEditMiscExpense = () => {
    setEditingMiscId(null);
    setEditMiscName("");
    setEditMiscCategory("");
  };

  const saveEditMiscExpense = async () => {
    if (!editingMiscId) return;
    if (!editMiscName.trim() || !editMiscCategory) {
      toast.error("Name and category are required");
      return;
    }
    setSavingMiscEdit(true);
    try {
      const data = await updateMiscellaneousExpense(editingMiscId, {
        name: editMiscName.trim(),
        category: editMiscCategory,
      });
      setMiscellaneousExpenses((prev) =>
        prev.map((exp) =>
          exp._id === editingMiscId
            ? {
                ...exp,
                name: data?.expense?.name ?? editMiscName.trim(),
                category: data?.expense?.category ?? editMiscCategory,
              }
            : exp,
        ),
      );
      toast.success("Expense updated successfully");
      cancelEditMiscExpense();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update expense.");
    } finally {
      setSavingMiscEdit(false);
    }
  };

  const MISC_EXPENSE_CATEGORIES = ["machinery", "rental", "service", "material"];

  const handleLogUsage = async (usageData: any) => {
    try {
      await logStockUsage(usageData);
      const updatedStocks = await getStocksBySite(siteId!);
      setStocks(updatedStocks);
      setIsLogUsageModalOpen(false);
      toast.success("Usage logged");
    } catch (err) {
      toast.error("Failed to log usage");
    }
  };

  const canVerifyPurchase = userType === "admin";
  const canMarkAttendance =
    userType === "admin" ||
    (userType === "siteManager" &&
      site?.siteManagers.some((m) => m.id === user?.id));

  const handleVerify = async (purchaseId: string) => {
    if (verifyingPurchaseIds.has(purchaseId)) return;
    setVerifyingPurchaseIds((prev) => new Set(prev).add(purchaseId));
    try {
      const data = await verifyPurchase(purchaseId);
      setPurchases((prev) =>
        prev.map((p) =>
          p._id === purchaseId
            ? { ...p, status: "verified", items: data?.purchase?.items ?? p.items }
            : p,
        ),
      );
      if (data?.site) {
        setSite((prev) =>
          prev
            ? {
                ...prev,
                expenses: data.site.expenses,
                transactions: data.transaction
                  ? [data.transaction, ...prev.transactions]
                  : prev.transactions,
              }
            : prev,
        );
      }
      // Stock levels change on verification too, keep the Stocks tab fresh.
      getStocksBySite(siteId!).then(setStocks).catch(() => {});
      toast.success("Purchase verified");
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to verify purchase";
      toast.error(message);
      if (typeof message === "string" && message.toLowerCase().includes("already verified")) {
        setPurchases((prev) =>
          prev.map((p) =>
            p._id === purchaseId ? { ...p, status: "verified" } : p,
          ),
        );
      }
    } finally {
      setVerifyingPurchaseIds((prev) => {
        const next = new Set(prev);
        next.delete(purchaseId);
        return next;
      });
    }
  };

  const startEditPurchaseItem = (
    purchaseId: string,
    index: number,
    currentName: string,
    currentCategory: string,
  ) => {
    setEditingItem({ purchaseId, index });
    setEditItemName(currentName);
    setEditItemCategory(currentCategory);
    setEditItemSuggestions([]);
    setShowEditSuggestions(false);
  };

  const cancelEditPurchaseItem = () => {
    setEditingItem(null);
    setEditItemName("");
    setEditItemCategory("");
    setEditItemSuggestions([]);
    setShowEditSuggestions(false);
  };

  const handleEditItemNameChange = (value: string) => {
    setEditItemName(value);
    setShowEditSuggestions(true);
    if (editItemSearchTimer.current) clearTimeout(editItemSearchTimer.current);
    if (!value || value.trim().length < 2) {
      setEditItemSuggestions([]);
      return;
    }
    editItemSearchTimer.current = setTimeout(async () => {
      try {
        const results = await searchItems(value.trim());
        setEditItemSuggestions(results);
      } catch (err) {
        console.error("Error fetching item suggestions:", err);
      }
    }, 300);
  };

  const saveEditPurchaseItem = async () => {
    if (!editingItem) return;
    if (!editItemName.trim() || !editItemCategory.trim()) {
      toast.error("Item name and category are required");
      return;
    }
    setSavingItemEdit(true);
    try {
      const data = await updatePurchaseItem(
        editingItem.purchaseId,
        editingItem.index,
        {
          name: editItemName.trim(),
          category: editItemCategory.trim(),
        },
      );
      setPurchases((prev) =>
        prev.map((p) => {
          if (p._id !== editingItem.purchaseId) return p;
          const items = [...p.items];
          items[editingItem.index] = data?.item ?? {
            ...items[editingItem.index],
            name: editItemName.trim(),
            category: editItemCategory.trim(),
          };
          return { ...p, items };
        }),
      );
      // A verified purchase's item edit can move stock between item names.
      getStocksBySite(siteId!).then(setStocks).catch(() => {});
      toast.success("Item updated successfully");
      cancelEditPurchaseItem();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update item.");
    } finally {
      setSavingItemEdit(false);
    }
  };

  const downloadSiteDocumentsZip = async () => {
    try {
      const response = await privateClient.get(
        `/sites/${siteId}/documents/zip`,
        { responseType: "blob" },
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
        { responseType: "blob" },
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
    deletePurchaseBills: boolean,
  ) => {
    try {
      await markSiteAsCompleted(siteId!, deleteSiteDocuments, deletePurchaseBills);
      const updatedSite = await getSiteDetails(siteId!);
      setSite(updatedSite as ExtendedSite);
      toast.success("Site marked as completed successfully.");
    } catch (error) {
      console.error("Error marking site as completed:", error);
      toast.error("Failed to mark site as completed.");
    }
  };

  const handleDeletePurchase = async () => {
    if (!deletePurchaseTarget) return;
    setDeletingPurchase(true);
    try {
      const targetId = deletePurchaseTarget._id;
      const data = await deletePurchase(targetId);
      setPurchases((prev) => prev.filter((p) => p._id !== targetId));
      // Deleting a verified purchase with a transportation fee also removes
      // its linked miscellaneous (transportation) expense on the backend.
      setMiscellaneousExpenses((prev) =>
        prev.filter((exp) => exp.purchaseId?._id !== targetId && exp.purchaseId !== targetId),
      );
      if (data?.site) {
        setSite((prev) =>
          prev ? { ...prev, expenses: data.site.expenses } : prev,
        );
      }
      toast.success("Purchase deleted successfully");
      setDeletePurchaseTarget(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete purchase.");
    } finally {
      setDeletingPurchase(false);
    }
  };

  const handleDeleteMiscellaneous = async () => {
    if (!deleteMiscTarget) return;
    setDeletingMisc(true);
    try {
      const targetId = deleteMiscTarget._id;
      const data = await deleteMiscellaneousExpense(targetId);
      setMiscellaneousExpenses((prev) =>
        prev.filter((exp) => exp._id !== targetId),
      );
      if (data?.site) {
        setSite((prev) =>
          prev ? { ...prev, expenses: data.site.expenses } : prev,
        );
      }
      toast.success("Miscellaneous expense deleted successfully");
      setDeleteMiscTarget(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete expense");
    } finally {
      setDeletingMisc(false);
    }
  };

  const openAddModal = (role: "siteManager" | "architect" | "supervisor") => {
    setCurrentRole(role);
    setIsModalOpen(true);
  };

  const handleRequestTransfer = async (transferData: any) => {
    try {
      await requestStockTransfer(transferData);
      const updatedStocks = await getStocksBySite(siteId!);
      setStocks(updatedStocks);
      setIsRequestTransferModalOpen(false);
      toast.success("Transfer requested");
    } catch (err) {
      toast.error("Failed to request transfer");
    }
  };

  const handleResetPhases = async () => {
    if (userType !== "admin") return;
    setResettingPhases(true);
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
        status: "not started" as const,
        completionDate: undefined,
      }));
      setSite({ ...site!, phases: updatedPhases });
      toast.success("Phases reset");
      setResetPhasesConfirmOpen(false);
    } catch (err) {
      console.error("Error resetting phases:", err);
      toast.error("Failed to reset phases.");
    } finally {
      setResettingPhases(false);
    }
  };

  const handlePhaseStatusChange = async (
    phaseId: string,
    newStatus: "not started" | "pending" | "completed",
  ) => {
    try {
      await updatePhaseStatus(site!.id, phaseId, newStatus);
      const updatedPhases = site!.phases.map((phase) =>
        phase.id === phaseId ? { ...phase, status: newStatus } : phase,
      );
      setSite({ ...site!, phases: updatedPhases });
    } catch (err) {
      console.error("Error updating phase status:", err);
      toast.error("Failed to update phase status.");
    }
  };

  const handleAddTeamMember = async (
    teamUser: any,
    role: "siteManager" | "architect" | "supervisor",
  ) => {
    try {
      let updatedIds: string[];
      let field: string;
      if (role === "siteManager") {
        updatedIds = [...site!.siteManagers.map((m) => m.id), teamUser.id];
        field = "siteManagerIds";
      } else if (role === "architect") {
        updatedIds = [...site!.architects.map((a) => a.id), teamUser.id];
        field = "architectIds";
      } else {
        updatedIds = [...site!.supervisors.map((s) => s.id), teamUser.id];
        field = "supervisorIds";
      }
      await updateSite(site!.id, { [field]: updatedIds });
      const updatedSite = await getSiteDetails(site!.id);
      setSite(updatedSite as ExtendedSite);
      setIsModalOpen(false);
      toast.success("Team member added");
    } catch (err) {
      toast.error("Failed to add team member.");
    }
  };

  const handleRemoveTeamMember = async (
    memberId: string,
    role: "siteManager" | "architect" | "supervisor",
  ) => {
    if (userType !== "admin") return;
    const field =
      role === "siteManager"
        ? "siteManagers"
        : role === "architect"
          ? "architects"
          : "supervisors";
    const updatedMembers = (site as any)[field].filter(
      (member: any) => member.id !== memberId,
    );
    const updateField =
      role === "siteManager"
        ? "siteManagerIds"
        : role === "architect"
          ? "architectIds"
          : "supervisorIds";
    try {
      await updateSite(site!.id, {
        [updateField]: updatedMembers.map((m: any) => m.id),
      });
      setSite({ ...site!, [field]: updatedMembers } as ExtendedSite);
      toast.success("Team member removed");
    } catch (err) {
      toast.error("Failed to remove team member.");
    }
  };

  const handleDeleteBillUpload = async (purchaseId: string) => {
    try {
      await deleteBillUpload(purchaseId);
      setPurchases(
        purchases.map((p) =>
          p._id === purchaseId ? { ...p, billUpload: null } : p,
        ),
      );
      toast.success("Bill successfully deleted");
    } catch (err) {
      console.error("Error deleting bill upload:", err);
      toast.error("Failed to delete bill upload.");
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
    targetSiteId: string,
    file: File,
    category: "client" | "site",
  ) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);
      await uploadDocument(targetSiteId, formData);
      const updatedSite = await getSiteDetails(targetSiteId);
      setSite(updatedSite as ExtendedSite);
      toast.success("Document uploaded");
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Failed to upload document.");
    }
  };

  const getAttendanceColor = (level: number) => {
    const colors = [
      "bg-success-50",
      "bg-success-100",
      "bg-success-500",
      "bg-success-600",
      "bg-success-700",
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

  const renderAttendanceGrid = () => {
    const weeks: any[] = [];
    let currentWeek: any[] = [];
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

  const getMonthLabelsPositions = () => {
    const labels: { label: string; index: number }[] = [];
    let lastMonth: string | null = null;
    renderAttendanceGrid().forEach((week, index) => {
      const firstDay = week.find((d: any) => d !== null);
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

  const togglePurchaseExpand = (purchaseId: string) => {
    setExpandedPurchases((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(purchaseId)) newSet.delete(purchaseId);
      else newSet.add(purchaseId);
      return newSet;
    });
  };

  const canAddPurchase =
    userType === "admin" || userType === "siteManager" || userType === "supervisor";
  const canManageStocks = userType === "siteManager" || userType === "admin";
  const canAddMiscellaneous = canAddPurchase;
  const canUploadDocuments = userType === "admin" || userType === "siteManager";

  const filteredPurchases = useMemo(() => {
    const query = purchaseSearchQuery.trim().toLowerCase();
    if (!query) return purchases;
    return purchases.filter((purchase) =>
      purchase.items.some((item: any) => item.name.toLowerCase().includes(query)),
    );
  }, [purchases, purchaseSearchQuery]);

  const getMatchingItems = useMemo(() => {
    const query = purchaseSearchQuery.trim().toLowerCase();
    if (!query) return null;
    const map = new Map<string, any[]>();
    purchases.forEach((purchase) => {
      const matched = purchase.items.filter((item: any) =>
        item.name.toLowerCase().includes(query),
      );
      if (matched.length > 0) map.set(purchase._id, matched);
    });
    return map;
  }, [purchases, purchaseSearchQuery]);

  const purchaseSearchAggregates = useMemo(() => {
    const query = purchaseSearchQuery.trim().toLowerCase();
    if (!query) return null;
    let totalQty = 0;
    let totalAmount = 0;
    purchases.forEach((purchase) => {
      purchase.items.forEach((item: any) => {
        if (item.name.toLowerCase().includes(query)) {
          totalQty += parseFloat(item.quantity) || 0;
          totalAmount += parseFloat(item.totalAmount) || 0;
        }
      });
    });
    return { totalQty, totalAmount };
  }, [purchases, purchaseSearchQuery]);

  const filteredMiscExpenses = useMemo(() => {
    const query = miscSearchQuery.trim().toLowerCase();
    if (!query) return miscellaneousExpenses;
    return miscellaneousExpenses.filter(
      (exp) =>
        exp.name.toLowerCase().includes(query) ||
        exp.category.toLowerCase().includes(query),
    );
  }, [miscellaneousExpenses, miscSearchQuery]);

  const filteredStocks = useMemo(() => {
    const query = stockSearchQuery.trim().toLowerCase();
    if (!query) return stocks;
    return stocks.filter(
      (stock) =>
        stock.name.toLowerCase().includes(query) ||
        (stock.category || "").toLowerCase().includes(query),
    );
  }, [stocks, stockSearchQuery]);

  const filteredClientDocuments = useMemo(() => {
    const allClientDocs = site?.documents.filter((doc) => doc.category === "client") || [];
    const query = documentSearchQuery.trim().toLowerCase();
    if (!query) return allClientDocs;
    return allClientDocs.filter((doc) => doc.name.toLowerCase().includes(query));
  }, [site, documentSearchQuery]);

  const filteredSiteDocuments = useMemo(() => {
    const allSiteDocs = site?.documents.filter((doc) => doc.category === "site") || [];
    const query = documentSearchQuery.trim().toLowerCase();
    if (!query) return allSiteDocs;
    return allSiteDocs.filter((doc) => doc.name.toLowerCase().includes(query));
  }, [site, documentSearchQuery]);

  if (loading) {
    return <PageLoader label="Loading site details" />;
  }

  if (error || !site) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-50 text-danger-600">
            <Building size={22} />
          </div>
          <h2 className="text-lg font-semibold text-console-text">Site not found</h2>
          <p className="mt-1 text-sm text-console-muted">
            {error || "The requested site could not be found."}
          </p>
          <Button className="mt-5" onClick={() => navigate(`/${userType}/sites`)}>
            Back to sites
          </Button>
        </Card>
      </div>
    );
  }

  const completedPhases = site.phases.filter((p) => p.status === "completed").length;
  const pendingPhases = site.phases.filter((p) => p.status === "pending").length;
  const notStartedPhases = site.phases.filter((p) => p.status === "not started").length;
  const totalPhases = site.phases.length;
  const progressPercentage = totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0;
  const clientDocuments = site.documents.filter((doc) => doc.category === "client");
  const siteDocuments = site.documents.filter((doc) => doc.category === "site");
  const budgetUtilizationPercentage =
    site.budget > 0 ? ((site.expenses || 0) / site.budget) * 100 : 0;
  const teamSize = site.siteManagers.length + site.architects.length + site.supervisors.length;

  return (
    <div className="space-y-6">
      {/* Sticky header: site name, location, status, supervision — glassmorphism, pinned on scroll */}
      <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 border-b border-white/40 bg-white/70 px-4 py-4 shadow-sm backdrop-blur-md backdrop-saturate-150 sm:px-6">
        <div className="grid grid-cols-1 items-center gap-3 lg:grid-cols-[auto_1fr_auto] lg:gap-6">
          <div className="lg:border-r lg:border-console-border/40 lg:pr-6">
            <button
              type="button"
              onClick={() => navigate(`/${userType}/sites`)}
              className="flex items-center gap-1.5 text-sm font-medium text-console-muted transition-colors hover:text-console-text"
            >
              <ChevronLeft size={16} /> Back to sites
            </button>
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold text-console-text">{site.name}</h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-console-muted">
              <MapPin size={13} className="shrink-0" />
              <span className="truncate">
                {site.address}, {site.city}, {site.state} {site.zip}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <Badge variant={site.status === "InProgress" ? "warning" : "success"}>
              {site.status}
            </Badge>
            <div className="flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50/90 px-3 py-1 text-sm font-medium text-brand-800 backdrop-blur-sm">
              <Percent size={13} />
              {isEditingSupervision ? (
                <>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    autoFocus
                    value={supervisionInput}
                    onChange={(e) => setSupervisionInput(e.target.value)}
                    className="w-16 rounded border border-brand-200 px-1 py-0.5 text-brand-900 focus:outline-none focus:ring-1 focus:ring-brand-400"
                  />
                  <button
                    type="button"
                    onClick={handleSaveSupervision}
                    disabled={isSavingSupervision}
                    className="text-success-600 hover:text-success-800 disabled:opacity-50"
                    title="Save"
                  >
                    <Check size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEditingSupervision}
                    disabled={isSavingSupervision}
                    className="text-console-muted hover:text-console-text disabled:opacity-50"
                    title="Cancel"
                  >
                    <X size={15} />
                  </button>
                </>
              ) : (
                <>
                  <span>Supervision: {site.supervisionPercentage ?? 0}%</span>
                  {userType === "admin" && (
                    <button
                      type="button"
                      onClick={handleStartEditingSupervision}
                      className="text-brand-600 hover:text-brand-800"
                      title="Edit supervision percentage"
                    >
                      <Edit2 size={13} />
                    </button>
                  )}
                </>
              )}
            </div>
            {userType === "admin" && site.status === "InProgress" && (
              <Button size="sm" onClick={() => setIsCompleteModalOpen(true)}>
                <CheckCircle2 size={15} /> Mark as completed
              </Button>
            )}
            {userType === "admin" && (
              linkedPortfolioProject ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/admin/portfolio?projectId=${linkedPortfolioProject.id}`)}
                >
                  <Briefcase size={15} /> View portfolio project
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsConvertModalOpen(true)}
                >
                  <Briefcase size={15} /> Convert to portfolio
                </Button>
              )
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GradientStatCard
          label="Received from client"
          value={site.budget}
          prefix="₹"
          tone="success"
          icon={DollarSign}
          helperText={`Balance: ₹${(site.budget - (site.expenses || 0)).toLocaleString("en-IN")}`}
          onClick={() => setIsClientPaymentsModalOpen(true)}
          action={
            userType === "admin" || userType === "siteManager"
              ? {
                  label: "Add payment",
                  onClick: () => setIsManualPaymentModalOpen(true),
                }
              : undefined
          }
        />

        <GradientStatCard
          label="Expenses"
          value={site.expenses}
          prefix="₹"
          tone="danger"
          icon={TrendingUp}
          helperText={
            site.budget > 0
              ? `${budgetUtilizationPercentage.toFixed(1)}% of received funds utilized`
              : "No funds received yet"
          }
          onClick={() => setIsTransactionsModalOpen(true)}
        />

        <div className="rounded-glass border border-console-border bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-console-muted">Progress</p>
              <p className="mt-1 text-xl font-semibold text-console-text">
                {Math.round(progressPercentage)}%
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Activity size={18} />
            </div>
          </div>
          <p className="mt-2 text-xs text-console-muted">
            {totalPhases > 0
              ? `${completedPhases} done • ${pendingPhases} pending • ${notStartedPhases} not started`
              : "No phases added yet"}
          </p>
        </div>

        <div className="rounded-glass border border-console-border bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-console-muted">Team size</p>
              <p className="mt-1 text-xl font-semibold text-console-text">
                {teamSize}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info-50 text-info-700">
              <Users size={18} />
            </div>
          </div>
          <p className="mt-2 text-xs text-console-muted">
            {site.siteManagers.length} managers • {site.architects.length} architects •{" "}
            {site.supervisors.length} supervisors
          </p>
        </div>
      </div>

      <SectionCard>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-console-text">Project progress</h3>
          <span className="text-sm text-console-muted">
            {completedPhases} of {totalPhases} phases completed
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-console-bg">
          <div
            className="h-2.5 rounded-full bg-brand-600 transition-all duration-700"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </SectionCard>

      <div className="flex flex-wrap gap-1 rounded-console border border-console-border bg-console-bg p-1">
        {TAB_CONFIG.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedTab(tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                selectedTab === tab.id
                  ? "bg-white text-brand-700 shadow-console"
                  : "text-console-muted hover:bg-white/60",
              )}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {selectedTab === "overview" && (
        <SectionCard>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2.5 text-base font-semibold text-console-text">
              <CheckCircle2 size={20} className="text-brand-600" />
              Phase checklist
            </h2>
            {userType === "admin" && (
              <Button size="sm" variant="danger" onClick={() => setResetPhasesConfirmOpen(true)}>
                Reset phases
              </Button>
            )}
          </div>
          <div className="grid gap-3">
            {site.phases.map((phase) => (
              <div
                key={phase.id}
                className={cn(
                  "flex items-center rounded-xl border p-4 transition-colors",
                  phase.status === "completed"
                    ? "border-success-200 bg-success-50"
                    : phase.status === "pending"
                      ? "border-warning-200 bg-warning-50"
                      : "border-console-border bg-console-bg",
                )}
              >
                {phase.status === "not started" && <Circle size={18} className="mr-3.5 text-slate-400" />}
                {phase.status === "pending" && <Clock size={18} className="mr-3.5 text-warning-500" />}
                {phase.status === "completed" && (
                  <CheckCircle2 size={18} className="mr-3.5 text-success-600" />
                )}
                {userType === "siteManager" && phase.status === "not started" && (
                  <button
                    type="button"
                    onClick={() => handlePhaseStatusChange(phase.id, "pending")}
                    className="mr-3.5 rounded-md bg-brand-700 px-3 py-1 text-sm text-white hover:bg-brand-800"
                  >
                    Request completion
                  </button>
                )}
                {userType === "siteManager" && phase.status === "pending" && (
                  <span className="mr-3.5 text-sm text-warning-700">Pending verification</span>
                )}
                {userType === "admin" && phase.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => handlePhaseStatusChange(phase.id, "completed")}
                    className="mr-3.5 rounded-md bg-success-600 px-3 py-1 text-sm text-white hover:bg-success-700"
                  >
                    Verify completion
                  </button>
                )}
                {userType === "admin" && phase.status === "not started" && (
                  <button
                    type="button"
                    onClick={() => handlePhaseStatusChange(phase.id, "completed")}
                    className="mr-3.5 rounded-md bg-brand-700 px-3 py-1 text-sm text-white hover:bg-brand-800"
                  >
                    Mark as completed
                  </button>
                )}
                <span
                  className={cn(
                    "text-sm font-medium",
                    phase.status === "completed"
                      ? "text-success-800"
                      : phase.status === "pending"
                        ? "text-warning-800"
                        : "text-console-text",
                  )}
                >
                  {phase.name}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {selectedTab === "team" && (
        <div className="grid gap-6">
          {[
            { role: "siteManager" as const, title: "Site Managers", members: site.siteManagers, icon: Users, tone: "info" },
            { role: "architect" as const, title: "Architects", members: site.architects, icon: Building, tone: "brand" },
            { role: "supervisor" as const, title: "Supervisors", members: site.supervisors, icon: Users, tone: "success" },
          ].map((group) => (
            <SectionCard key={group.role}>
              <div className="mb-5 flex items-center justify-between">
                <h3 className="flex items-center gap-2.5 text-base font-semibold text-console-text">
                  <group.icon size={18} className="text-brand-600" />
                  {group.title}
                </h3>
                {userType === "admin" && (
                  <Button size="sm" variant="secondary" onClick={() => openAddModal(group.role)}>
                    <UserPlus size={14} /> Add
                  </Button>
                )}
              </div>
              {group.members.length === 0 ? (
                <p className="py-4 text-center text-sm text-console-muted">
                  No {group.title.toLowerCase()} assigned to this site yet.
                </p>
              ) : (
                <div className="grid gap-2.5">
                  {group.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-xl bg-console-bg p-3.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800">
                          {member.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <span className="text-sm font-medium text-console-text">{member.name}</span>
                      </div>
                      {userType === "admin" && (
                        <Tooltip label="Remove member">
                          <button
                            type="button"
                            onClick={() => handleRemoveTeamMember(member.id, group.role)}
                            aria-label="Remove member"
                            className="rounded-lg p-2 text-danger-600 transition-colors hover:bg-danger-50"
                          >
                            <UserX size={16} />
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          ))}
        </div>
      )}

      {selectedTab === "contractors" && (
        <SiteContractorsManager siteId={siteId!} siteName={site.name} userType={userType as any} />
      )}

      {selectedTab === "attendance" && (
        <SectionCard>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2.5 text-base font-semibold text-console-text">
                <Calendar size={20} className="text-brand-600" />
                Employee attendance
              </h2>
              <p className="mt-1 text-sm text-console-muted">
                Track daily employee attendance with visual insights
              </p>
            </div>
            <div className="flex items-center gap-4">
              {canMarkAttendance && (
                <Button size="sm" onClick={() => setIsMarkAttendanceModalOpen(true)}>
                  <Plus size={15} /> Mark attendance
                </Button>
              )}
              <div className="flex items-center gap-2 text-xs text-console-muted">
                <span>Less</span>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((level) => (
                    <div key={level} className={cn("h-3 w-3 rounded-sm", getAttendanceColor(level))} />
                  ))}
                </div>
                <span>More</span>
              </div>
            </div>
          </div>
          {isAttendanceLoading ? (
            <PageLoader label="Loading attendance data" fullHeight={false} />
          ) : (
            <div className="overflow-x-auto" ref={scrollRef}>
              <div className="inline-block min-w-full">
                <div className="ml-[40px] mb-1 flex">
                  {renderAttendanceGrid().map((_, index) => {
                    const labelObj = getMonthLabelsPositions().find((l) => l.index === index);
                    return (
                      <div key={index} className="mr-1 w-3 text-xs text-console-muted">
                        {labelObj ? labelObj.label : ""}
                      </div>
                    );
                  })}
                </div>
                <div className="flex">
                  <div className="mr-2 flex flex-col">
                    {["Mon", "Wed", "Fri"].map((dayLabel, i) => (
                      <div
                        key={i}
                        className="mb-1 h-3 text-xs text-console-muted"
                        style={{ marginTop: i === 0 ? "12px" : "18px" }}
                      >
                        {dayLabel}
                      </div>
                    ))}
                  </div>
                  <div className="flex">
                    {renderAttendanceGrid().map((week, weekIndex) => (
                      <div key={weekIndex} className="mr-1 flex flex-col">
                        {week.map((day: any, dayIndex: number) => (
                          <div
                            key={`${weekIndex}-${dayIndex}`}
                            className={cn(
                              "mb-1 h-3 w-3 cursor-pointer rounded-sm transition-transform hover:scale-110",
                              day ? getAttendanceColor(day.level) : "bg-slate-100",
                            )}
                            onClick={() => day && handleDayClick(day.date)}
                            title={
                              day
                                ? `${formatDate(day.date)}: ${day.count?.toFixed(1)} effective attendance`
                                : ""
                            }
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {selectedTab === "purchases" && (
        <SectionCard>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2.5 text-base font-semibold text-console-text">
              <ShoppingCart size={20} className="text-brand-600" />
              Purchases
            </h2>
            {canAddPurchase && (
              <Button size="sm" onClick={() => setIsAddPurchaseModalOpen(true)}>
                <Plus size={15} /> Add purchase
              </Button>
            )}
          </div>

          <div className="mb-5">
            <div className="relative max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-console-muted" size={15} />
              <input
                type="text"
                placeholder="Search items in purchases..."
                value={purchaseSearchQuery}
                onChange={(e) => setPurchaseSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-console-border py-2.5 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
            {purchaseSearchQuery.trim() && purchaseSearchAggregates && (
              <div className="mt-3 flex flex-wrap items-center gap-6 rounded-lg border border-info-100 bg-info-50 p-4">
                <div>
                  <span className="text-sm text-console-muted">Total quantity of matching items:</span>
                  <span className="ml-2 font-semibold text-info-800">
                    {purchaseSearchAggregates.totalQty}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-console-muted">Total amount of matching items:</span>
                  <span className="ml-2 font-semibold text-info-800">
                    ₹{purchaseSearchAggregates.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPurchaseSearchQuery("")}
                  className="ml-auto text-sm font-medium text-info-700 hover:text-info-800"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {filteredPurchases.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-console-border">
                <thead className="bg-console-bg">
                  <tr>
                    <th className="w-10 px-4 py-3" />
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Vendor</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-console-border">
                  {filteredPurchases.map((purchase: any) => {
                    const isExpanded = expandedPurchases.has(purchase._id);
                    const itemsToShow = purchaseSearchQuery.trim()
                      ? getMatchingItems?.get(purchase._id) || []
                      : purchase.items;

                    return (
                      <React.Fragment key={purchase._id}>
                        <tr
                          className={cn("cursor-pointer hover:bg-console-bg", isExpanded && "bg-brand-50/50")}
                          onClick={() => togglePurchaseExpand(purchase._id)}
                        >
                          <td className="px-4 py-3.5">
                            {isExpanded ? (
                              <ChevronDown size={15} className="text-console-muted" />
                            ) : (
                              <ChevronRight size={15} className="text-console-muted" />
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-sm text-console-text">
                            {new Date(purchase.date || purchase.createdAt).toLocaleDateString()}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-sm font-semibold text-console-text">
                            ₹{purchase.totalAmount.toLocaleString("en-IN")}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-sm text-console-text">
                            {purchase.vendor?.name || purchase.vendor}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5">
                            <Badge variant={purchase.status === "verified" ? "success" : "warning"}>
                              {purchase.status}
                            </Badge>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              {canVerifyPurchase && purchase.status === "pending" && (
                                <button
                                  type="button"
                                  onClick={() => handleVerify(purchase._id)}
                                  disabled={verifyingPurchaseIds.has(purchase._id)}
                                  className="rounded-md bg-brand-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {verifyingPurchaseIds.has(purchase._id) ? "Verifying..." : "Verify"}
                                </button>
                              )}
                              {purchase.billUpload && purchase.billUpload.url && (
                                <a
                                  href={purchase.billUpload.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded-lg p-1.5 text-console-muted hover:bg-info-50 hover:text-info-700"
                                  title="View bill"
                                >
                                  <Eye size={15} />
                                </a>
                              )}
                              {userType === "admin" && purchase.billUpload && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBillUpload(purchase._id)}
                                  className="rounded-lg p-1.5 text-console-muted hover:bg-danger-50 hover:text-danger-700"
                                  title="Delete bill upload"
                                >
                                  <FileX size={15} />
                                </button>
                              )}
                              {(userType === "admin" || purchase.status === "pending") && (
                                <button
                                  type="button"
                                  onClick={() => setDeletePurchaseTarget(purchase)}
                                  className="rounded-lg p-1.5 text-console-muted hover:bg-danger-50 hover:text-danger-700"
                                  title={
                                    purchase.status === "verified"
                                      ? "Delete verified purchase (reversal)"
                                      : "Delete unverified purchase"
                                  }
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={6} className="bg-console-bg p-6">
                              <h4 className="mb-4 flex items-center text-sm font-semibold text-console-text">
                                <Package size={16} className="mr-2" />
                                Purchased items
                                {purchaseSearchQuery.trim() && (
                                  <span className="ml-3 text-xs font-normal text-console-muted">
                                    (showing matching items only)
                                  </span>
                                )}
                              </h4>
                              <div className="space-y-3">
                                {itemsToShow.map((item: any, idx: number) => {
                                  const originalIndex = purchase.items.findIndex(
                                    (origItem: any) => origItem === item,
                                  );
                                  const itemIndex = originalIndex !== -1 ? originalIndex : idx;
                                  const isEditingThisItem =
                                    editingItem?.purchaseId === purchase._id &&
                                    editingItem?.index === itemIndex;
                                  const canEditItem =
                                    userType === "admin" ||
                                    purchase.addedBy?._id === user?.id ||
                                    purchase.addedBy === user?.id;

                                  return (
                                    <div
                                      key={itemIndex}
                                      className="flex items-center justify-between rounded-xl border border-console-border bg-white p-4"
                                    >
                                      {isEditingThisItem ? (
                                        <div
                                          className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <div className="relative">
                                            <label className="mb-1 block text-xs font-medium text-console-muted">
                                              Item name
                                            </label>
                                            <input
                                              type="text"
                                              value={editItemName}
                                              autoComplete="off"
                                              onChange={(e) => handleEditItemNameChange(e.target.value)}
                                              onFocus={() => setShowEditSuggestions(true)}
                                              onBlur={() =>
                                                setTimeout(() => setShowEditSuggestions(false), 150)
                                              }
                                              className="w-full rounded-lg border border-console-border px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                            />
                                            {showEditSuggestions && editItemSuggestions.length > 0 && (
                                              <div className="absolute z-20 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-console-border bg-white shadow-console-lg">
                                                {editItemSuggestions.map((s) => (
                                                  <button
                                                    type="button"
                                                    key={s._id}
                                                    onMouseDown={() => {
                                                      setEditItemName(s.name);
                                                      if (s.category) setEditItemCategory(s.category);
                                                      setShowEditSuggestions(false);
                                                    }}
                                                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-brand-50"
                                                  >
                                                    <span>{s.name}</span>
                                                    {s.category && (
                                                      <span className="text-xs text-console-muted">
                                                        {s.category}
                                                      </span>
                                                    )}
                                                  </button>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                          <div>
                                            <label className="mb-1 block text-xs font-medium text-console-muted">
                                              Category
                                            </label>
                                            <select
                                              value={
                                                PURCHASE_CATEGORIES.includes(editItemCategory)
                                                  ? editItemCategory
                                                  : editItemCategory
                                                    ? "Other"
                                                    : ""
                                              }
                                              onChange={(e) => setEditItemCategory(e.target.value)}
                                              className="w-full rounded-lg border border-console-border px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                            >
                                              <option value="">Select category</option>
                                              {PURCHASE_CATEGORIES.filter((c) => c !== "Other").map((c) => (
                                                <option key={c} value={c}>
                                                  {c}
                                                </option>
                                              ))}
                                              <option value="Other">Other</option>
                                            </select>
                                            {(editItemCategory === "Other" ||
                                              (editItemCategory &&
                                                !PURCHASE_CATEGORIES.includes(editItemCategory))) && (
                                              <input
                                                type="text"
                                                placeholder="Enter custom category..."
                                                value={editItemCategory === "Other" ? "" : editItemCategory}
                                                onChange={(e) => setEditItemCategory(e.target.value)}
                                                className="mt-2 w-full rounded-lg border border-console-border px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                              />
                                            )}
                                          </div>
                                          <div className="mt-1 flex items-center justify-end gap-2 md:col-span-2">
                                            <button
                                              type="button"
                                              onClick={cancelEditPurchaseItem}
                                              disabled={savingItemEdit}
                                              className="rounded-lg border border-console-border px-3 py-1.5 text-sm text-console-muted hover:bg-console-bg disabled:opacity-50"
                                            >
                                              Cancel
                                            </button>
                                            <button
                                              type="button"
                                              onClick={saveEditPurchaseItem}
                                              disabled={savingItemEdit}
                                              className="rounded-lg bg-brand-700 px-3 py-1.5 text-sm text-white hover:bg-brand-800 disabled:opacity-50"
                                            >
                                              {savingItemEdit ? "Saving..." : "Save"}
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex flex-1 items-center gap-2">
                                          <div>
                                            <div className="text-sm font-medium text-console-text">{item.name}</div>
                                            <div className="text-xs text-console-muted">
                                              {item.category} • {item.unit}
                                            </div>
                                          </div>
                                          {canEditItem && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                startEditPurchaseItem(
                                                  purchase._id,
                                                  itemIndex,
                                                  item.name,
                                                  item.category,
                                                )
                                              }
                                              className="rounded p-1 text-console-muted transition-colors hover:bg-brand-50 hover:text-brand-700"
                                              title="Edit item name/category"
                                            >
                                              <Edit2 size={14} />
                                            </button>
                                          )}
                                        </div>
                                      )}
                                      {!isEditingThisItem && (
                                        <div className="flex items-center gap-6 text-right">
                                          <div>
                                            <div className="text-xs text-console-muted">Qty</div>
                                            <div className="text-sm font-semibold text-console-text">
                                              {item.quantity} {item.unit}
                                            </div>
                                          </div>
                                          <div>
                                            <div className="text-xs text-console-muted">Unit price</div>
                                            <div className="text-sm font-medium text-console-text">
                                              ₹{parseFloat(item.price).toFixed(2)}
                                            </div>
                                          </div>
                                          <div className="text-base font-bold text-success-700">
                                            ₹{parseFloat(item.totalAmount).toFixed(2)}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                                {itemsToShow.length === 0 && (
                                  <p className="text-sm text-console-muted">
                                    No matching items found in this purchase.
                                  </p>
                                )}
                              </div>

                              {parseFloat(purchase.transportationFee || 0) > 0 && (
                                <div className="mt-5 flex items-center justify-between rounded-xl border border-warning-200 bg-warning-50 p-4">
                                  <div className="flex items-center gap-3">
                                    <DollarSign size={18} className="text-warning-600" />
                                    <span className="text-sm font-medium text-warning-800">
                                      Transportation fee (recorded as miscellaneous service)
                                    </span>
                                  </div>
                                  <span className="text-lg font-semibold text-warning-800">
                                    ₹
                                    {parseFloat(purchase.transportationFee || 0).toLocaleString("en-IN", {
                                      minimumFractionDigits: 2,
                                    })}
                                  </span>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={ShoppingCart}
              title={purchaseSearchQuery.trim() ? "No purchases match the search" : "No purchases found"}
              description={
                purchaseSearchQuery.trim()
                  ? "Try a different search term."
                  : "Purchases recorded for this site will appear here."
              }
            />
          )}
        </SectionCard>
      )}

      {selectedTab === "stocks" && (
        <SectionCard>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2.5 text-base font-semibold text-console-text">
              <Package size={20} className="text-brand-600" />
              Stocks
            </h2>
            {canManageStocks && (
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setIsRequestTransferModalOpen(true)}>
                  Request transfer
                </Button>
                <Button size="sm" onClick={() => setIsLogUsageModalOpen(true)}>
                  Log usage
                </Button>
              </div>
            )}
          </div>

          {stocks.length > 0 && (
            <div className="mb-5">
              <div className="relative max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-console-muted" size={15} />
                <input
                  type="text"
                  placeholder="Search stock items..."
                  value={stockSearchQuery}
                  onChange={(e) => setStockSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-console-border py-2.5 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
              {stockSearchQuery.trim() && (
                <p className="mt-2 text-sm text-console-muted">
                  Found {filteredStocks.length} matching stock items.
                </p>
              )}
            </div>
          )}

          {stocks.length === 0 ? (
            <EmptyState icon={Package} title="No stock recorded for this site" />
          ) : filteredStocks.length === 0 ? (
            <EmptyState icon={Package} title="No stock items match the search" />
          ) : (
            <div className="overflow-hidden rounded-console border border-console-border">
              <table className="min-w-full divide-y divide-console-border">
                <thead className="bg-console-bg">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-console-border bg-white">
                  {filteredStocks.map((stock: any) => (
                    <tr key={stock._id}>
                      <td className="whitespace-nowrap px-4 py-3.5 text-sm text-console-text">{stock.name}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-sm text-console-text">
                        {stock.quantity} {stock.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      {selectedTab === "miscellaneous" && (
        <SectionCard>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2.5 text-base font-semibold text-console-text">
              <Wrench size={20} className="text-brand-600" />
              Miscellaneous expenses
            </h2>
            {canAddMiscellaneous && (
              <Button size="sm" onClick={() => setIsAddMiscellaneousModalOpen(true)}>
                <Plus size={15} /> Add expense
              </Button>
            )}
          </div>

          <div className="mb-5">
            <div className="relative max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-console-muted" size={15} />
              <input
                type="text"
                placeholder="Search expenses..."
                value={miscSearchQuery}
                onChange={(e) => setMiscSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-console-border py-2.5 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
            {miscSearchQuery.trim() && (
              <p className="mt-2 text-sm text-console-muted">
                Found {filteredMiscExpenses.length} matching expenses.
              </p>
            )}
          </div>

          {filteredMiscExpenses.length > 0 ? (
            <div className="overflow-x-auto rounded-console border border-console-border">
              <table className="min-w-full divide-y divide-console-border">
                <thead className="bg-console-bg">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Tip</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-console-border bg-white">
                  {filteredMiscExpenses.map((exp: any) => (
                    <tr key={exp._id}>
                      <td className="whitespace-nowrap px-4 py-3.5 text-sm text-console-text">
                        {new Date(exp.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5 text-sm capitalize text-console-text">
                        {editingMiscId === exp._id ? (
                          <select
                            value={editMiscCategory}
                            onChange={(e) => setEditMiscCategory(e.target.value)}
                            className="rounded-md border border-console-border px-2 py-1 text-sm capitalize focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                          >
                            {MISC_EXPENSE_CATEGORIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        ) : (
                          exp.category
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-sm text-console-text">
                        {editingMiscId === exp._id ? (
                          <input
                            type="text"
                            value={editMiscName}
                            onChange={(e) => setEditMiscName(e.target.value)}
                            className="rounded-md border border-console-border px-2 py-1 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                          />
                        ) : (
                          exp.name
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-sm text-console-text">
                        ₹{exp.amount.toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-sm text-console-text">
                        ₹{(exp.tip || 0).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-sm font-medium text-console-text">
                        ₹{(exp.amount + (exp.tip || 0)).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <Badge variant={exp.status === "verified" ? "success" : "warning"}>
                          {exp.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {editingMiscId === exp._id ? (
                            <>
                              <button
                                type="button"
                                onClick={saveEditMiscExpense}
                                disabled={savingMiscEdit}
                                className="rounded-md bg-brand-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-800 disabled:opacity-50"
                              >
                                {savingMiscEdit ? "Saving..." : "Save"}
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditMiscExpense}
                                disabled={savingMiscEdit}
                                className="rounded-md border border-console-border px-2.5 py-1 text-xs text-console-muted hover:bg-console-bg disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              {(userType === "admin" ||
                                exp.addedBy?._id === user?.id ||
                                exp.addedBy === user?.id) && (
                                <button
                                  type="button"
                                  onClick={() => startEditMiscExpense(exp)}
                                  className="rounded p-1 text-console-muted transition-colors hover:bg-brand-50 hover:text-brand-700"
                                  title="Edit name/category"
                                >
                                  <Edit2 size={14} />
                                </button>
                              )}
                              {userType === "admin" && exp.status === "pending" && (
                                <button
                                  type="button"
                                  onClick={() => handleVerifyMiscellaneous(exp._id)}
                                  disabled={verifyingMiscIds.has(exp._id)}
                                  className="rounded-md bg-brand-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {verifyingMiscIds.has(exp._id) ? "Verifying..." : "Verify"}
                                </button>
                              )}
                              {(userType === "admin" || exp.status === "pending") && (
                                <button
                                  type="button"
                                  onClick={() => setDeleteMiscTarget(exp)}
                                  className="rounded p-1 text-console-muted transition-colors hover:bg-danger-50 hover:text-danger-700"
                                  title={
                                    exp.status === "verified"
                                      ? "Delete verified expense (reversal)"
                                      : "Delete unverified expense"
                                  }
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                        {exp.notes && (
                          <p className="mt-1 flex items-center gap-2 text-xs text-console-muted">
                            Notes:{" "}
                            {exp.notes === "from purchase" && exp.purchaseId ? (
                              <span
                                className="inline-flex cursor-help items-center gap-1 underline decoration-dotted transition-colors hover:text-brand-700"
                                title={`Purchase ID: ${exp.purchaseId._id}\nAmount: ₹${exp.purchaseId.totalAmount?.toLocaleString()}\nDate: ${new Date(exp.purchaseId.date).toLocaleDateString()}`}
                              >
                                from purchase
                                <span className="rounded-full bg-info-100 px-1.5 py-0.5 font-mono text-[10px] text-info-700">
                                  ID
                                </span>
                              </span>
                            ) : (
                              exp.notes
                            )}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Wrench}
              title={
                miscSearchQuery.trim()
                  ? "No expenses match the search"
                  : "No miscellaneous expenses found"
              }
            />
          )}
        </SectionCard>
      )}

      {selectedTab === "documents" && (
        <SectionCard>
          <div className="mb-5">
            <div className="relative max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-console-muted" size={15} />
              <input
                type="text"
                placeholder="Search documents..."
                value={documentSearchQuery}
                onChange={(e) => setDocumentSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-console-border py-2.5 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
            {documentSearchQuery.trim() && (
              <p className="mt-2 text-sm text-console-muted">
                Found {filteredClientDocuments.length + filteredSiteDocuments.length} matching documents.
              </p>
            )}
          </div>

          <div className="space-y-6">
            {[
              {
                title: "Client Documentation",
                docs: filteredClientDocuments,
                totalCount: clientDocuments.length,
                category: "client" as const,
              },
              {
                title: "Site Documentation",
                docs: filteredSiteDocuments,
                totalCount: siteDocuments.length,
                category: "site" as const,
              },
            ].map((group) => (
              <div key={group.category}>
                <div className="flex items-center justify-between">
                  <h4 className="flex items-center text-sm font-medium text-console-text">
                    <FileText size={15} className="mr-2" />
                    {group.title} ({group.totalCount})
                  </h4>
                  {canUploadDocuments && (
                    <label className="relative cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleUpload(site.id, e.target.files[0], group.category);
                          }
                        }}
                      />
                      <div className="flex items-center gap-2 rounded-lg bg-brand-700 px-3 py-2 text-sm text-white transition-colors hover:bg-brand-800">
                        <Upload size={15} />
                        <span>Upload {group.category === "client" ? "client" : "site"} document</span>
                      </div>
                    </label>
                  )}
                </div>
                {group.totalCount === 0 ? (
                  <p className="mt-2 text-sm text-console-muted">No documents uploaded yet</p>
                ) : group.docs.length === 0 ? (
                  <p className="mt-2 text-sm text-console-muted">No documents match the search</p>
                ) : (
                  <div className="mt-2 max-h-48 space-y-2 overflow-y-auto">
                    {group.docs.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between rounded-lg bg-console-bg p-3 transition-colors hover:bg-slate-100"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <FileText size={15} className="shrink-0 text-console-muted" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-console-text">{doc.name}</p>
                            <div className="flex items-center gap-2 text-xs text-console-muted">
                              <span>{(doc.size / 1024).toFixed(1)} KB</span>
                              <span>•</span>
                              <User size={11} />
                              <span>{doc.uploadedBy.name}</span>
                              <span>•</span>
                              <Calendar size={11} />
                              <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded p-1.5 hover:bg-slate-200"
                        >
                          <Download size={15} className="text-console-muted" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {isAddPurchaseModalOpen && (
        <AddPurchaseModal
          siteId={siteId!}
          isAdmin={userType === "admin"}
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
          onSelect={(selectedUser: any) => handleAddTeamMember(selectedUser, currentRole)}
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

      <AddMiscellaneousExpenseModal
        isOpen={isAddMiscellaneousModalOpen}
        siteId={siteId!}
        isAdmin={userType === "admin"}
        onClose={() => {
          setIsAddMiscellaneousModalOpen(false);
          if (selectedTab === "miscellaneous") fetchMiscellaneousExpenses();
        }}
      />

      <TransactionsModal
        isOpen={isTransactionsModalOpen}
        transactions={site.transactions || []}
        onClose={() => setIsTransactionsModalOpen(false)}
      />

      {isCompleteModalOpen && (
        <CompleteSiteModal
          isOpen={isCompleteModalOpen}
          onClose={() => setIsCompleteModalOpen(false)}
          onConfirm={handleMarkAsCompleted}
          downloadSiteDocuments={downloadSiteDocumentsZip}
          downloadPurchaseBills={downloadPurchaseBillsZip}
        />
      )}

      {isConvertModalOpen && (
        <ConvertToPortfolioModal
          isOpen={isConvertModalOpen}
          onClose={() => setIsConvertModalOpen(false)}
          site={site}
          onConverted={() => {
            getProjectBySiteId(siteId!).then(setLinkedPortfolioProject);
          }}
        />
      )}

      {isClientPaymentsModalOpen && (
        <ClientPaymentsModal
          siteId={siteId!}
          onClose={() => setIsClientPaymentsModalOpen(false)}
          onPaymentChanged={() => {
            getSiteDetails(siteId!).then((updated) => setSite(updated as ExtendedSite));
          }}
        />
      )}

      <Modal
        isOpen={isManualPaymentModalOpen}
        onClose={() => {
          setIsManualPaymentModalOpen(false);
          setManualAmount("");
          setManualNotes("");
          setManualDate(new Date().toISOString().split("T")[0]);
        }}
        title="Record Direct Client Payment"
        description="Use this when the client paid offline. The payment stays unverified until approved."
      >
        <form onSubmit={handleManualPaymentSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-console-text">Amount (₹)</label>
            <input
              type="number"
              value={manualAmount}
              onChange={(e) => setManualAmount(e.target.value)}
              placeholder="Enter amount"
              step="0.01"
              autoFocus
              required
              className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-lg font-semibold focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-console-text">Date</label>
            <input
              type="date"
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
              required
              className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-console-text">
              Notes <span className="text-xs text-console-muted">(Optional)</span>
            </label>
            <textarea
              value={manualNotes}
              onChange={(e) => setManualNotes(e.target.value)}
              placeholder="Any remarks..."
              rows={3}
              className="w-full resize-none rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsManualPaymentModalOpen(false);
                setManualAmount("");
                setManualNotes("");
                setManualDate(new Date().toISOString().split("T")[0]);
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Record payment</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletePurchaseTarget}
        onClose={() => setDeletePurchaseTarget(null)}
        onConfirm={handleDeletePurchase}
        title="Delete purchase"
        message={
          deletePurchaseTarget?.status === "verified"
            ? "This is a verified purchase. Deleting will reverse all accounting entries (stock, expenses, source funds)."
            : "Are you sure you want to delete this unverified purchase?"
        }
        variant="danger"
        confirmText="Delete"
        isLoading={deletingPurchase}
      />

      <ConfirmDialog
        isOpen={!!deleteMiscTarget}
        onClose={() => setDeleteMiscTarget(null)}
        onConfirm={handleDeleteMiscellaneous}
        title="Delete miscellaneous expense"
        message={
          deleteMiscTarget?.status === "verified"
            ? "This expense is verified. Deleting will reverse the accounting entries."
            : "Are you sure you want to delete this unverified miscellaneous expense?"
        }
        variant="danger"
        confirmText="Delete"
        isLoading={deletingMisc}
      />

      <ConfirmDialog
        isOpen={resetPhasesConfirmOpen}
        onClose={() => setResetPhasesConfirmOpen(false)}
        onConfirm={handleResetPhases}
        title="Reset all phases"
        message="Are you sure you want to reset all phases to 'not started'? This cannot be undone."
        variant="warning"
        confirmText="Reset phases"
        isLoading={resettingPhases}
      />
    </div>
  );
};

export default SiteDetail;