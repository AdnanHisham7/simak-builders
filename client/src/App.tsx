import React, { useEffect, useState } from "react";
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
import ProtectedRoute from "./router/ProtectedRoute.tsx";
import AdminRoute from "./router/AdminRoute.tsx";
import { LandingPage, BrowsingPage, CompanyProfile, NotFound } from "@/pages";
import Portfolio from "./pages/Portfolio.tsx";

import Loader from "./components/layout/Loader.tsx";
import signupIllustration from "@/assets/signup-illustration.svg";
import loginIllustration from "@/assets/login-illustration.svg";
import { usePreloadImage } from "./hooks/usePreloadImage.tsx";
import AdminLogin from "./pages/AdminLogin.tsx";
import AdminDashboard from "./features/dashboard/AdminDashboard.tsx";
import ProtectedDashboardLayout from "./router/ProtectedDashboardLayout.tsx";
import Employees from "./features/employees/Employees.tsx";
import Contractors from "./features/contractors/Contractors.tsx";
import Vendors from "./features/vendors/Vendors.tsx";
import SiteManagers from "./features/team/SiteManagers.tsx";
import Supervisors from "./features/team/Supervisors.tsx";
import Architects from "./features/team/Architects.tsx";
import Sites from "./features/sites/Sites.tsx";
import Stocks from "./features/stocks/Stocks.tsx";
import Reports from "./features/reports/Reports.tsx";
import SettingsPage from "./features/settings/Settings.tsx";
import PortfolioAdmin from "./pages/admin/Portfolio.tsx";
import Profile from "./pages/profile/Profile.tsx";
import SiteDetail from "./features/sites/SiteDetail.tsx";
import Salary from "./features/salary/Salary.tsx";
import SiteManagerDashboard from "./pages/siteManager/SiteManagerDashboard.tsx";
import ArchitectDashboard from "./features/team/ArchitectDashboard.tsx";
import ArchitectProtected from "./router/ArchitectProtected.tsx";
import ClientDashboard from "./features/clients/ClientDashboard.tsx";
import Clients from "./features/clients/Clients.tsx";
import ClientProtected from "./router/ClientProtected.tsx";
import ListEnquiries from "./features/enquiries/ListEnquiries.tsx";
import AboutUs from "./pages/AboutUs.tsx";
import PrivacyPolicyPage from "./pages/PrivacyPolicy.tsx";
import RedirectHandler from "./router/RedirectHandler.tsx";

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  usePreloadImage(loginIllustration);
  usePreloadImage(signupIllustration);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500); // Show loader for 2.5s

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) return <Loader />;

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <ToastProvider />
      <Router>
        <RedirectHandler />
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

          {/* Protected Route */}
          {/* <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <>Dashboard</>
              </ProtectedRoute>
            }
          /> */}

          {/* Protected Admin Routes */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route
            path="admin"
            element={<ProtectedDashboardLayout allowedRoles={["admin"]} />}
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="employees" element={<Employees />} />
            <Route path="enquiries" element={<ListEnquiries />} />
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
            <Route path="settings" element={<SettingsPage />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          <Route path="client" element={<ClientProtected />}>
            <Route path="dashboard" element={<ClientDashboard />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          {/* Catch-all route for 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
};

export default App;
