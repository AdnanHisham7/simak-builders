// src/routes/clientRoutes.tsx
import { Route } from "react-router-dom";
import RoleLayoutRoute from "../router/RoleLayoutRoute";
import ClientBasicInfo from "@/pages/Profile/ClientBasicInfo";
import ClientDashboard from "@/pages/ClientDashboard";

export const clientRoutes = [
  <Route
    key="client-dashboard"
    path="client/dashboard"
    element={
      <RoleLayoutRoute allowedRoles={["client"]}>
        <ClientDashboard />
      </RoleLayoutRoute>
    }
  />,

  <Route
    key="client-dashboard"
    path="client/profile"
    element={
      <RoleLayoutRoute allowedRoles={["client"]}>
        <ClientBasicInfo />
      </RoleLayoutRoute>
    }
  />,
 
];
