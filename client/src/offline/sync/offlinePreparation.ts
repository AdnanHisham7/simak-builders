import { syncEngine } from "./syncEngine";
import { getSites } from "@/services/siteService";
import { getEmployees } from "@/services/employeeService";
import { getVendors } from "@/services/vendorService";
import { offlineDB } from "../db";
import { networkManager } from "../network/networkStatus";

export interface PreparationProgress {
  status: "idle" | "preparing" | "ready" | "error";
  progressPercent: number;
  message: string;
}

type ProgressListener = (progress: PreparationProgress) => void;

class OfflinePreparationManager {
  private currentProgress: PreparationProgress = {
    status: "idle",
    progressPercent: 0,
    message: "Ready",
  };
  private listeners: Set<ProgressListener> = new Set();
  private hasPreparedSession = false;

  public subscribe(listener: ProgressListener): () => void {
    this.listeners.add(listener);
    listener(this.currentProgress);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(update: Partial<PreparationProgress>) {
    this.currentProgress = { ...this.currentProgress, ...update };
    for (const listener of this.listeners) {
      listener(this.currentProgress);
    }
  }

  public getProgress(): PreparationProgress {
    return this.currentProgress;
  }

  public async prepareForOffline(force = false): Promise<boolean> {
    if (this.hasPreparedSession && !force) {
      return true;
    }

    if (!networkManager.isOnline()) {
      const siteCount = await offlineDB.sites.count();
      if (siteCount > 0) {
        this.notify({
          status: "ready",
          progressPercent: 100,
          message: "Operating in offline mode with cached data",
        });
        return true;
      } else {
        this.notify({
          status: "error",
          progressPercent: 0,
          message: "No offline data available. Please connect to internet once.",
        });
        return false;
      }
    }

    this.notify({
      status: "preparing",
      progressPercent: 10,
      message: "Starting offline data preparation...",
    });

    try {
      // 1. Fetch sites (35%)
      this.notify({ progressPercent: 25, message: "Downloading assigned sites..." });
      await getSites();

      // 2. Fetch employees (60%)
      this.notify({ progressPercent: 50, message: "Downloading employees directory..." });
      await getEmployees();

      // 3. Fetch vendors (80%)
      this.notify({ progressPercent: 75, message: "Downloading vendors list..." });
      await getVendors();

      // 4. Sync latest data delta (85%)
      this.notify({ progressPercent: 85, message: "Reconciling recent transactions..." });
      await syncEngine.syncNow();

      // 5. Preload all app route bundles into cache for seamless offline tab switching
      this.notify({ progressPercent: 95, message: "Caching application pages for offline use..." });
      this.prefetchRouteBundles();

      this.hasPreparedSession = true;
      this.notify({
        status: "ready",
        progressPercent: 100,
        message: "SIMAK is fully prepared for offline use",
      });

      return true;
    } catch (err: any) {
      console.warn("[OfflinePreparation] Warning during prep:", err);
      this.notify({
        status: "ready",
        progressPercent: 100,
        message: "Offline data ready (partial sync)",
      });
      return false;
    }
  }

  public prefetchRouteBundles() {
    const prefetchLoaders = [
      () => import("@/features/dashboard/AdminDashboard"),
      () => import("@/features/enquiries/ListEnquiries"),
      () => import("@/features/sites/Sites"),
      () => import("@/features/sites/SiteDetail"),
      () => import("@/features/purchases/PurchaseDetail"),
      () => import("@/features/expenses/MiscellaneousExpenseDetail"),
      () => import("@/features/employees/Employees"),
      () => import("@/features/contractors/Contractors"),
      () => import("@/features/vendors/Vendors"),
      () => import("@/features/salary/Salary"),
      () => import("@/features/stocks/Stocks"),
      () => import("@/features/reports/Reports"),
      () => import("@/features/settings/Settings"),
      () => import("@/pages/profile/Profile"),
      () => import("@/features/feedback/AdminFeedback"),
      () => import("@/features/expenseRequests/AdminExpenseRequests"),
      () => import("@/features/company/CompanyPage"),
      () => import("@/features/clients/Clients"),
      () => import("@/features/team/SiteManagers"),
      () => import("@/features/team/Supervisors"),
      () => import("@/features/team/Architects"),
      () => import("@/pages/siteManager/SiteManagerDashboard"),
      () => import("@/features/team/ArchitectDashboard"),
      () => import("@/features/team/ArchitectExpenseRequests"),
      () => import("@/features/clients/ClientDashboard"),
      () => import("@/features/clients/ClientSiteProgress"),
      () => import("@/features/clients/ClientFeedback"),
    ];

    const runPrefetch = () => {
      for (const loader of prefetchLoaders) {
        try {
          loader().catch(() => {});
        } catch {
          // ignore prefetch errors
        }
      }
    };

    if (typeof window !== "undefined") {
      setTimeout(runPrefetch, 2000);
    }
  }
}

export const offlinePreparation = new OfflinePreparationManager();
