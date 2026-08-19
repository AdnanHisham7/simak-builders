import React, { Suspense, lazy } from "react";
import { useSelector } from "react-redux";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import ToastProvider from "./components/ui/ToastProvider.tsx";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";

import "./App.css";
import ContactPage from "./pages/ContactPage.tsx";
import RedirectIfAuthenticated from "./router/RedirectIfAuthenticated.tsx";
import ResetPassword from "./pages/auth/ResetPassword";
import { LandingPage, NotFound } from "@/pages";
import Portfolio from "./pages/Portfolio.tsx";

import signupIllustration from "@/assets/signup-illustration.svg";
import loginIllustration from "@/assets/login-illustration.svg";
import { usePreloadImage } from "./hooks/usePreloadImage.tsx";
import AdminLogin from "./pages/AdminLogin.tsx";
import ProtectedDashboardLayout from "./router/ProtectedDashboardLayout.tsx";
import ArchitectProtected from "./router/ArchitectProtected.tsx";
import ClientProtected from "./router/ClientProtected.tsx";
import AboutUs from "./pages/AboutUs.tsx";
import PrivacyPolicyPage from "./pages/PrivacyPolicy.tsx";
import RedirectHandler from "./router/RedirectHandler.tsx";
import PageLoader from "./components/ui/PageLoader.tsx";
import { RootState } from "./store/store.ts";

const AdminDashboard = lazy(() => import("./features/dashboard/AdminDashboard.tsx"));
const Employees = lazy(() => import("./features/employees/Employees.tsx"));
const Contractors = lazy(() => import("./features/contractors/Contractors.tsx"));
const Vendors = lazy(() => import("./features/vendors/Vendors.tsx"));
const SiteManagers = lazy(() => import("./features/team/SiteManagers.tsx"));
const Supervisors = lazy(() => import("./features/team/Supervisors.tsx"));
const Architects = lazy(() => import("./features/team/Architects.tsx"));
const Sites = lazy(() => import("./features/sites/Sites.tsx"));
const Stocks = lazy(() => import("./features/stocks/Stocks.tsx"));
const Reports = lazy(() => import("./features/reports/Reports.tsx"));
const SettingsPage = lazy(() => import("./features/settings/Settings.tsx"));
const PortfolioAdmin = lazy(() => import("./pages/admin/Portfolio.tsx"));
const Profile = lazy(() => import("./pages/profile/Profile.tsx"));
const SiteDetail = lazy(() => import("./features/sites/SiteDetail.tsx"));
const Salary = lazy(() => import("./features/salary/Salary.tsx"));
const SiteManagerDashboard = lazy(() => import("./pages/siteManager/SiteManagerDashboard.tsx"));
const ArchitectDashboard = lazy(() => import("./features/team/ArchitectDashboard.tsx"));
const ArchitectExpenseRequests = lazy(() => import("./features/team/ArchitectExpenseRequests.tsx"));
const ClientDashboard = lazy(() => import("./features/clients/ClientDashboard.tsx"));
const ClientSiteProgress = lazy(() => import("./features/clients/ClientSiteProgress.tsx"));
const ClientFeedback = lazy(() => import("./features/clients/ClientFeedback.tsx"));
const Clients = lazy(() => import("./features/clients/Clients.tsx"));
const ListEnquiries = lazy(() => import("./features/enquiries/ListEnquiries.tsx"));
const AdminFeedback = lazy(() => import("./features/feedback/AdminFeedback.tsx"));
const AdminExpenseRequests = lazy(() => import("./features/expenseRequests/AdminExpenseRequests.tsx"));

const App: React.FC = () => {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );

  usePreloadImage(loginIllustration, !isAuthenticated);
  usePreloadImage(signupIllustration, !isAuthenticated);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <ToastProvider />
      <Router>
        <RedirectHandler />
        <Suspense fallback={<PageLoader fullHeight label="Loading" />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/policy" element={<PrivacyPolicyPage />} />

            {/* Login-related: Redirect if already logged in */}
            <Route
              path="/login"
              element={
                <RedirectIfAuthenticated>
                  <Login />
                </RedirectIfAuthenticated>
              }
            />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected Admin Routes */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route
              path="admin"
              element={<ProtectedDashboardLayout allowedRoles={["admin"]} />}
            >
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="employees" element={<Employees />} />
              <Route path="enquiries" element={<ListEnquiries />} />
              <Route path="feedback" element={<AdminFeedback />} />
              <Route path="expense-requests" element={<AdminExpenseRequests />} />
              <Route path="contractors" element={<Contractors />} />
              <Route path="vendors" element={<Vendors />} />
              <Route path="salary" element={<Salary />} />
              <Route path="clients" element={<Clients />} />
              <Route path="site-managers" element={<SiteManagers />} />
              <Route path="supervisors" element={<Supervisors />} />
              <Route path="architects" element={<Architects />} />
              <Route path="sites" element={<Sites />} />
              <Route path="sites/:siteId" element={<SiteDetail />} />
              <Route path="stocks" element={<Stocks />} />
              <Route path="reports" element={<Reports />} />
              <Route path="portfolio" element={<PortfolioAdmin />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="profile" element={<Profile />} />
              <Route
                path="site-managers/:managerId/dashboard"
                element={<SiteManagerDashboard />}
              />
            </Route>

            <Route
              path="siteManager"
              element={
                <ProtectedDashboardLayout allowedRoles={["siteManager"]} />
              }
            >
              <Route path="dashboard" element={<SiteManagerDashboard />} />
              <Route path="sites" element={<Sites />} />
              <Route path="sites/:siteId" element={<SiteDetail />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            <Route path="architect" element={<ArchitectProtected />}>
              <Route path="dashboard" element={<ArchitectDashboard />} />
              <Route
                path="expense-requests"
                element={<ArchitectExpenseRequests />}
              />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            <Route path="client" element={<ClientProtected />}>
              <Route path="dashboard" element={<ClientDashboard />} />
              <Route path="site-progress" element={<ClientSiteProgress />} />
              <Route path="feedback" element={<ClientFeedback />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="profile" element={<Profile />} />
            </Route>
            {/* Catch-all route for 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </GoogleOAuthProvider>
  );
};

export default App;