import { createContext, useContext } from "react";

interface DashboardContextType {
  unseenCount: number;
  setUnseenCount: (count: number) => void;
}

export const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error(
      "useDashboardContext must be used within a DashboardProvider"
    );
  }
  return context;
};
