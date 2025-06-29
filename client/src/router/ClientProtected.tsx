import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { store } from "@/store/store";
import { clearUser } from "@/store/slices/authSlice";
import { toast } from "sonner";
import ArchitectDashboardLayout from "@/pages/Dashboard/ArchitectDashboardLayout";

const ClientProtected = () => {
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

  if (userType !== "client") {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <ArchitectDashboardLayout>
      <Outlet />
    </ArchitectDashboardLayout>
  );
};

export default ClientProtected;
