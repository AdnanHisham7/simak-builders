// src/router/RoleLayoutRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import DashboardLayout from "@/pages/Dashboard/DashboardLayout";
import { adminMenus, siteManagerMenus, supervisorMenus, architectMenus, clientMenus } from "@/constants/menu";
import { useMemo } from "react";

interface RoleLayoutRouteProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

const RoleLayoutRoute: React.FC<RoleLayoutRouteProps> = ({
  allowedRoles,
}) => {
  const { isAuthenticated, userType } = useSelector(
    (state: RootState) => state.auth
  );

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (userType && !allowedRoles.includes(userType))
    return <Navigate to="/unauthorized" replace />;

  const menus = useMemo(() => {
    switch (userType) {
      case "admin":
        return adminMenus;
      case "siteManager":
        return siteManagerMenus;
      case "supervisor":
        return supervisorMenus;
      case "architect":
        return architectMenus;
      case "client":
        return clientMenus;
      default:
        return [];
    }
  }, [userType]);

  return (
    <DashboardLayout menus={menus}>
      <Outlet />
    </DashboardLayout>
  );
};

export default RoleLayoutRoute;