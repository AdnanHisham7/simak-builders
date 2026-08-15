export interface LandingPageOption {
  value: string;
  label: string;
}

const withRolePrefix = (role: string, path: string) =>
  path === "" ? `/${role}` : `/${role}/${path}`;

export const LANDING_PAGE_OPTIONS_BY_ROLE: Record<string, LandingPageOption[]> = {
  admin: [
    { value: "dashboard", label: "Dashboard" },
    { value: "enquiries", label: "Enquiries" },
    { value: "employees", label: "Employees" },
    { value: "clients", label: "Clients" },
    { value: "site-managers", label: "Site Managers" },
    { value: "supervisors", label: "Supervisors" },
    { value: "architects", label: "Architects" },
    { value: "contractors", label: "Contractors" },
    { value: "vendors", label: "Vendors" },
    { value: "sites", label: "Sites" },
    { value: "stocks", label: "Stocks" },
    { value: "salary", label: "Salary" },
    { value: "reports", label: "Reports" },
    { value: "portfolio", label: "Portfolio" },
  ],
  siteManager: [
    { value: "dashboard", label: "Dashboard" },
    { value: "sites", label: "Sites" },
    { value: "reports", label: "Reports" },
  ],
  architect: [{ value: "dashboard", label: "Dashboard" }],
  client: [{ value: "dashboard", label: "Dashboard" }],
  supervisor: [{ value: "dashboard", label: "Dashboard" }],
};

export const DEFAULT_LANDING_PAGE_BY_ROLE: Record<string, string> = {
  admin: "dashboard",
  siteManager: "dashboard",
  architect: "dashboard",
  client: "dashboard",
  supervisor: "dashboard",
};

// Only these roles currently have a working dashboard route group registered
// in App.tsx. Supervisor is intentionally excluded here even though it has a
// settings/preferences entry above — there is no routed "/supervisor/*"
// dashboard yet, so redirecting there would land on the 404 page.
const ROUTABLE_ROLES = ["admin", "siteManager", "architect", "client"];

export const getLandingPagePath = (
  role: string | null | undefined,
  preferredValue: string | null | undefined,
): string => {
  if (!role || !ROUTABLE_ROLES.includes(role)) return "/";

  const options = LANDING_PAGE_OPTIONS_BY_ROLE[role] || [];
  const fallback = DEFAULT_LANDING_PAGE_BY_ROLE[role] || "dashboard";
  const isValid =
    !!preferredValue && options.some((option) => option.value === preferredValue);
  const value = isValid ? (preferredValue as string) : fallback;

  return withRolePrefix(role, value);
};
