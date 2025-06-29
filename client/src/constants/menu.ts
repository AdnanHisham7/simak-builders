import {
  Grid,
  BarChart3,
  Users,
  Briefcase,
  Truck,
  Building,
  Settings,
  DollarSign,
  CheckSquare,
  FileText,
  Activity,
  MessageCircle,
  Package,
} from "lucide-react";

export const adminMenus = [
  {
    title: "Main",
    items: [
      { name: "Dashboard", icon: Grid, path: "/admin/dashboard" },
      { name: "Enquiries", icon: Users, path: "/admin/enquiries" },
      { name: "Employees", icon: Users, path: "/admin/employees" },
      { name: "Contractors", icon: Briefcase, path: "/admin/contractors" },
      { name: "Vendors", icon: Truck, path: "/admin/vendors" },
      { name: "Salary", icon: Truck, path: "/admin/salary" },
      { name: "Clients", icon: Users, path: "/admin/clients" },
      { name: "Site Managers", icon: Users, path: "/admin/site-managers" },
      { name: "Supervisors", icon: Users, path: "/admin/supervisors" },
      { name: "Architects", icon: Users, path: "/admin/architects" },
      { name: "Sites", icon: Building, path: "/admin/sites" },
      { name: "Stocks", icon: Package, path: "/admin/stocks" },
      { name: "Reports", icon: BarChart3, path: "/admin/reports" },
      { name: "Settings", icon: Settings, path: "/admin/settings" },
    ],
  },
];

export const siteManagerMenus = [
  {
    title: "Main",
    items: [
      { name: "Dashboard", icon: Grid, path: "/siteManager/dashboard" },
      { name: "Sites", icon: CheckSquare, path: "/siteManager/sites" },
      { name: "Reports", icon: BarChart3, path: "/siteManager/reports" },
      { name: "Settings", icon: Settings, path: "/siteManager/settings" },
    ],
  },
];

export const supervisorMenus = [
  {
    title: "Main",
    items: [
      { name: "Dashboard", icon: Grid, path: "/supervisor/dashboard" },
      { name: "Sites", icon: Building, path: "/supervisor/sites" },
      { name: "Attendance", icon: CheckSquare, path: "/supervisor/attendance" },
      { name: "Purchases", icon: DollarSign, path: "/supervisor/purchases" },
      { name: "Contractors", icon: Briefcase, path: "/supervisor/contractors" },
      { name: "Reports", icon: BarChart3, path: "/supervisor/reports" },
    ],
  },
];

export const architectMenus = [
  {
    title: "Main",
    items: [
      { name: "Dashboard", icon: Grid, path: "/architect/dashboard" },
      { name: "Sites", icon: Building, path: "/architect/sites" },
      { name: "Documents", icon: FileText, path: "/architect/documents" },
      {
        name: "Expense Requests",
        icon: DollarSign,
        path: "/architect/expense-requests",
      },
    ],
  },
];

export const clientMenus = [
  {
    title: "Main",
    items: [
      { name: "Dashboard", icon: Grid, path: "/client/dashboard" },
      { name: "Site Progress", icon: Activity, path: "/client/site-progress" },
      { name: "Feedback", icon: MessageCircle, path: "/client/feedback" },
    ],
  },
];
