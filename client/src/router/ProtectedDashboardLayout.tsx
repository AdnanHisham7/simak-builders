import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import DashboardLayout from "@/pages/Dashboard/DashboardLayout";
import {
  adminMenus,
  architectMenus,
  clientMenus,
  siteManagerMenus,
  supervisorMenus,
} from "@/constants/menu";
import { store } from "@/store/store";
import { clearUser } from "@/store/slices/authSlice";
import { toast } from "sonner";

interface ProtectedDashboardLayoutProps {
  allowedRoles: (
    | "client"
    | "admin"
    | "siteManager"
    | "supervisor"
    | "architect"
    | null
  )[];
}

const ProtectedDashboardLayout: React.FC<ProtectedDashboardLayoutProps> = ({
  allowedRoles,
}) => {
  const { isAuthenticated, userType, user } = useSelector(
    (state: RootState) => state.auth
  );

  // Check if user is not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  // Check if user is blocked
  if (user?.isBlocked) {
    store.dispatch(clearUser());
    toast.error("Your account has been blocked. Please contact support.");
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user?.isAdmin;


  if (!allowedRoles.includes(userType)) {
    return <Navigate to="/unauthorized" replace />;
  }

  console.log(isAdmin, userType, allowedRoles)

  // Check if user role is not allowed
  if (!isAdmin && userType && !allowedRoles.includes(userType)) {
    return <Navigate to="/unauthorized" replace />;
  }

  console.log(
    userType,
    "userTypeuserTypeuserTypeuserTypeuserTypeuserTypeuserTypeuserTypeuserType"
  );
  const menus =
    userType === "admin"
      ? adminMenus
      : userType === "siteManager"
      ? siteManagerMenus
      : userType === "supervisor"
      ? supervisorMenus
      : userType === "architect"
      ? architectMenus
      : clientMenus;

  return (
    <DashboardLayout menus={menus}>
      <Outlet />
    </DashboardLayout>
  );
};

export default ProtectedDashboardLayout;
