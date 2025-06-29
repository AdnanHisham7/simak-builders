// src/routes/companyRoutes.tsx
import { Route } from "react-router-dom";
import RoleLayoutRoute from "../router/RoleLayoutRoute";
import BuilderDashboard from "@/pages/CompanyDashboard";
// import CompanyProfilePage from "@/pages/CompanyProfilePage";
// import ProjectLeadsPage
// import MyProjectsPage from "../pages/Company/MyProjectsPage";
// import MessagingPage from "../pages/Common/MessagingPage";

export const companyRoutes = [
  <Route
    key="company-dashbboard"
    path="company/dashboard"
    element={
      <RoleLayoutRoute allowedRoles={["company"]}>
        <BuilderDashboard />
      </RoleLayoutRoute>
    }
  />,
  // <Route
  //   key="company-profile"
  //   path="company/profile"
  //   element={
  //     <RoleLayoutRoute allowedRoles={["company"]}>
  //       <CompanyProfilePage />
  //     </RoleLayoutRoute>
  //   }
  // />,
  // <Route
  //   key="company-reviews"
  //   path="company/reviews"
  //   element={
  //     <RoleLayoutRoute allowedRoles={["company"]}>
  //       <ReviewPage />
  //     </RoleLayoutRoute>
  //   }
  // />,
];
