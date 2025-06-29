import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { RootState } from "../store/store";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

const AdminRoute: React.FC<Props> = ({ children }) => {
  const { isAuthenticated, user, userType } = useSelector(
    (state: RootState) => state.auth
  );

  console.log("role:", userType);
  console.log("email:", user?.email);

  if (!isAuthenticated || !user?.isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default AdminRoute;