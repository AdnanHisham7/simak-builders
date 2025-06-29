import { useState, useEffect, useMemo } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { motion } from "framer-motion";
// import PageHeader from "./PageHeader";

const ArchitectDashboardLayout = ({ children }: ArchitectDashboardLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Memoize the menus to prevent unnecessary re-renders

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

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 transition-all duration-500">
      {/* Main Content */}
      <motion.div
        className="flex-1 flex flex-col overflow-hidden"
        initial={false}
        animate={{
          marginLeft: isMobile ? 0 : 0, // Don't change margin, let the sidebar width control spacing
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
  );
};

export default ArchitectDashboardLayout;


interface ArchitectDashboardLayoutProps {
  children: React.ReactNode;
}

