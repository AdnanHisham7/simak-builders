import { useState, useEffect, useMemo } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { getUnseenEnquiriesCount } from "@/services/messageService";
import { DashboardContext } from "../../context/DashboardContext";

const DashboardLayout = ({ children, menus }: DashboardLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);
  const { userType } = useSelector((state: RootState) => state.auth);

  const memoizedMenus = useMemo(() => menus, [menus]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (userType === 'admin') {
      const fetchUnseenCount = async () => {
        try {
          const count = await getUnseenEnquiriesCount();
          setUnseenCount(count);
        } catch (error) {
          console.error("Failed to fetch unseen enquiries count", error);
        }
      };
      fetchUnseenCount();
    }
  }, [userType]);

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  return (
    <DashboardContext.Provider value={{ unseenCount, setUnseenCount }}>
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 transition-all duration-500">
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <motion.div
          className={`
            ${isMobile ? "fixed z-30" : "relative"} 
            ${sidebarOpen || !isMobile ? "" : "-translate-x-full"}
            bg-white border-r border-gray-200 h-full shadow-sm
          `}
          initial={false}
          animate={{
            width: sidebarCollapsed ? 80 : 256,
            x: isMobile && !sidebarOpen ? -256 : 0,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <Sidebar collapsed={sidebarCollapsed} menus={memoizedMenus} unseenCount={unseenCount} />
        </motion.div>

        <motion.div
          className="flex-1 flex flex-col overflow-hidden"
          initial={false}
          animate={{
            marginLeft: isMobile ? 0 : 0,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <Header
            toggleSidebar={toggleSidebar}
            sidebarCollapsed={sidebarCollapsed}
            isMobile={isMobile}
          />
          <main className="h-full flex-1 flex flex-col overflow-y-auto p-4 sm:p-6">
            {children}
          </main>
        </motion.div>
      </div>
    </DashboardContext.Provider>
  );
};

export default DashboardLayout;

interface DashboardLayoutProps {
  children: React.ReactNode;
  menus: any;
}