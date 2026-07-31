import { useState, useEffect, useMemo, ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { getUnseenEnquiriesCount } from "@/services/messageService";
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

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => !prev);
    }
  };

  const sidebarWidth = sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  return (
    <DashboardContext.Provider value={{ unseenCount, setUnseenCount }}>
      <div className="flex h-screen overflow-hidden bg-console-bg">
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-slate-900/40"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <aside
          className={`${
            isMobile ? "fixed inset-y-0 left-0 z-30" : "relative"
          } h-full shrink-0 border-r border-console-border bg-white shadow-console transition-transform duration-200 ease-out`}
          style={{
            width: isMobile ? 256 : sidebarWidth,
            transform: isMobile && !sidebarOpen ? "translateX(-100%)" : "translateX(0)",
          }}
        >
          <Sidebar collapsed={!isMobile && sidebarCollapsed} menus={memoizedMenus} unseenCount={unseenCount} />
        </aside>

        <div className="flex flex-1 flex-col overflow-hidden">
          <Header
            toggleSidebar={toggleSidebar}
            sidebarCollapsed={sidebarCollapsed}
            isMobile={isMobile}
            sidebarOpen={sidebarOpen}
          />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </DashboardContext.Provider>
  );
};

export default DashboardLayout;
