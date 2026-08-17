import { useState, useEffect, useMemo, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { getUnseenEnquiriesCount } from "@/services/messageService";
import { getPendingDeactivationCount } from "@/services/userService";
import { getOpenFeedbackCount } from "@/services/feedbackService";
import { getPendingExpenseRequestCount } from "@/services/expenseRequestService";
import { DashboardContext } from "../../context/DashboardContext";

interface MenuSection {
  title?: string;
  items: { name: string; path: string; icon: any }[];
}

interface DashboardLayoutProps {
  children: ReactNode;
  menus: MenuSection[];
}

const SIDEBAR_WIDTH_EXPANDED = 256;
const SIDEBAR_WIDTH_COLLAPSED = 76;

const DashboardLayout = ({ children, menus }: DashboardLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);
  const [pendingDeactivationCount, setPendingDeactivationCount] = useState(0);
  const [feedbackOpenCount, setFeedbackOpenCount] = useState(0);
  const [expenseRequestPendingCount, setExpenseRequestPendingCount] = useState(0);
  const { userType } = useSelector((state: RootState) => state.auth);

  const memoizedMenus = useMemo(() => menus, [menus]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (userType !== "admin") return;

    let isMounted = true;
    const fetchUnseenCount = async () => {
      try {
        const count = await getUnseenEnquiriesCount();
        if (isMounted) setUnseenCount(count);
      } catch (error) {
        // Non-critical: the badge simply stays at its last known value.
      }
    };

    fetchUnseenCount();
    return () => {
      isMounted = false;
    };
  }, [userType]);

  useEffect(() => {
    if (userType !== "admin") return;

    let isMounted = true;
    const fetchPendingDeactivationCount = async () => {
      try {
        const count = await getPendingDeactivationCount();
        if (isMounted) setPendingDeactivationCount(count);
      } catch (error) {
        // Non-critical: the badge simply stays at its last known value.
      }
    };

    fetchPendingDeactivationCount();
    return () => {
      isMounted = false;
    };
  }, [userType]);

  useEffect(() => {
    if (userType !== "admin") return;

    let isMounted = true;
    const fetchFeedbackOpenCount = async () => {
      try {
        const count = await getOpenFeedbackCount();
        if (isMounted) setFeedbackOpenCount(count);
      } catch (error) {
        // Non-critical: the badge simply stays at its last known value.
      }
    };

    fetchFeedbackOpenCount();
    return () => {
      isMounted = false;
    };
  }, [userType]);

  useEffect(() => {
    if (userType !== "admin") return;

    let isMounted = true;
    const fetchExpenseRequestPendingCount = async () => {
      try {
        const count = await getPendingExpenseRequestCount();
        if (isMounted) setExpenseRequestPendingCount(count);
      } catch (error) {
        // Non-critical: the badge simply stays at its last known value.
      }
    };

    fetchExpenseRequestPendingCount();
    return () => {
      isMounted = false;
    };
  }, [userType]);

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => !prev);
    }
  };

  const sidebarWidth = sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;
  const springTransition = { type: "spring" as const, stiffness: 320, damping: 34 };

  return (
    <DashboardContext.Provider
      value={{
        unseenCount,
        setUnseenCount,
        pendingDeactivationCount,
        setPendingDeactivationCount,
        feedbackOpenCount,
        setFeedbackOpenCount,
        expenseRequestPendingCount,
        setExpenseRequestPendingCount,
      }}
    >
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-console-bg via-console-bg to-brand-50/40">
        <AnimatePresence>
          {isMobile && sidebarOpen && (
            <motion.div
              key="sidebar-overlay"
              className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-[1px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        <motion.aside
          className={`${
            isMobile ? "fixed inset-y-0 left-0 z-30" : "relative"
          } h-full shrink-0 overflow-hidden border-r border-console-border shadow-console`}
          initial={false}
          animate={{
            width: isMobile ? 256 : sidebarWidth,
            x: isMobile && !sidebarOpen ? -256 : 0,
          }}
          transition={springTransition}
        >
          <Sidebar
            collapsed={!isMobile && sidebarCollapsed}
            menus={memoizedMenus}
            unseenCount={unseenCount}
            pendingDeactivationCount={pendingDeactivationCount}
            feedbackOpenCount={feedbackOpenCount}
            expenseRequestPendingCount={expenseRequestPendingCount}
          />
        </motion.aside>

        <div className="flex flex-1 flex-col overflow-hidden">
          <Header
            toggleSidebar={toggleSidebar}
            sidebarCollapsed={sidebarCollapsed}
            isMobile={isMobile}
            sidebarOpen={sidebarOpen}
          />
          <main className="no-scrollbar flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </DashboardContext.Provider>
  );
};

export default DashboardLayout;