import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { store } from "@/store/store";
import { clearUser } from "@/store/slices/authSlice";
import { toast } from "sonner";
import PortalLayout from "@/pages/Dashboard/PortalLayout";
import { clientMenus } from "@/constants/menu";

const ClientProtected = () => {
  const { isAuthenticated, userType, user } = useSelector(
    (state: RootState) => state.auth
  );

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (user?.isBlocked) {
    store.dispatch(clearUser());
    toast.error("Your account has been blocked. Please contact support.");
    return <Navigate to="/login" replace />;
  }

  if (userType !== "client") {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <PortalLayout menus={clientMenus} roleLabel="Client Portal">
      <Outlet />
    </PortalLayout>
  );
};

export default ClientProtected;