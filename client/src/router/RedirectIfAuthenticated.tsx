import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { RootState } from "../store/store";
import { getLandingPagePath } from "@/constants/landingPages";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

const RedirectIfAuthenticated: React.FC<Props> = ({ children }) => {
  const { isAuthenticated, userType, user } = useSelector(
    (state: RootState) => state.auth
  );

  if (isAuthenticated) {
    const target = getLandingPagePath(userType, user?.preferences?.defaultLandingPage);
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
};

export default RedirectIfAuthenticated;
