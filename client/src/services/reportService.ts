import { privateClient } from "@/api";

export interface ReportFilterParams {
  siteId?: string;
  year?: string | number;
  month?: string | number;
  startDate?: string;
  endDate?: string;
  date?: string;
  employeeId?: string;
  vendorId?: string;
  contractorId?: string;
  paymentStatus?: string;
  lenderId?: string;
  capitalType?: string;
  type?: string;
}

// 1. Annual / Financial Overview
export interface AnnualFinancialReportData {
  kpis: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    margin: number;
    materialSpend: number;
    contractorSpend: number;
    laborSpend: number;
    miscSpend: number;
  };
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    expense: number;
    profit: number;
    margin: number;
    materials: number;
    contractors: number;
    labor: number;
    misc: number;
  }>;
  categoryBreakdown: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  siteComparison: Array<{
    siteId: string;
    siteName: string;
    revenue: number;
    expense: number;
    profit: number;
    margin: number;
  }>;
}

export const getAnnualFinancialReport = async (
  params: ReportFilterParams
): Promise<AnnualFinancialReportData> => {
  const res = await privateClient.get("/reports/annual-financial", { params });
  return res.data;
};

// 2. Salary & Payroll Report
export interface SalaryPayrollReportData {
  kpis: {
    totalGrossEarned: number;
    totalDisbursed: number;
    totalPending: number;
    totalManDays: number;
    activeEmployees: number;
  };
  roleDistribution: Array<{
    name: string;
    value: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    totalWage: number;
    paidAmount: number;
    pendingAmount: number;
  }>;
  employeeRegister: Array<{
    employeeId: string;
    name: string;
    phone: string;
    position: string;
    dailyWage: number;
    totalDays: number;
    totalEarned: number;
    totalPaid: number;
    pendingAmount: number;
  }>;
}

export const getSalaryPayrollReport = async (
  params: ReportFilterParams
): Promise<SalaryPayrollReportData> => {
  const res = await privateClient.get("/reports/salary", { params });
  return res.data;
};

// 3. Comprehensive Vendor Procurement Report
export interface VendorProcurementReportData {
  kpis: {
    totalPurchasesAmount: number;
    totalPaid: number;
    totalCredit: number;
    totalInvoices: number;
  };
  categoryBreakdown: Array<{
    name: string;
    value: number;
  }>;
  monthlySpendTrend: Array<{
    month: string;
    totalAmount: number;
    paidAmount: number;
    creditAmount: number;
  }>;
  topVendors: Array<{
    vendorId: string;
    name: string;
    phone: string;
    invoiceCount: number;
    totalAmount: number;
    paidAmount: number;
    balance: number;
  }>;
  purchases: Array<{
    id: string;
    date: string;
    vendorName: string;
    siteName: string;
    itemsCount: number;
    totalAmount: number;
    paymentMethod: string;
    isPaid: boolean;
    billUrl?: string;
    notes?: string;
  }>;
}

export const getComprehensiveVendorsReport = async (
  params: ReportFilterParams
): Promise<VendorProcurementReportData> => {
  const res = await privateClient.get("/reports/vendors-comprehensive", { params });
  return res.data;
};

// 4. Contractor Work & Payout Report
export interface ContractorReportData {
  kpis: {
    totalContractValue: number;
    totalAdvances: number;
    totalExpenses: number;
    totalAdditional: number;
    totalPaid: number;
    pendingBalance: number;
    totalContractors: number;
  };
  monthlyTrend: Array<{
    month: string;
    advance: number;
    expense: number;
    additional: number;
    total: number;
  }>;
  typeDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  contractorSummaries: Array<{
    contractorId: string;
    name: string;
    phone: string;
    category: string;
    siteName: string;
    contractAmount: number;
    advances: number;
    expenses: number;
    additional: number;
    netPaid: number;
    balance: number;
  }>;
  transactions: Array<{
    id: string;
    date: string;
    contractorName: string;
    siteName: string;
    type: string;
    amount: number;
    description: string;
    category: string;
  }>;
}

export const getComprehensiveContractorsReport = async (
  params: ReportFilterParams
): Promise<ContractorReportData> => {
  const res = await privateClient.get("/reports/contractors-comprehensive", { params });
  return res.data;
};

// 5. Capital Infusion & Debt / Lender Report
export interface CapitalLendersReportData {
  kpis: {
    totalInfused: number;
    totalOwnCapital: number;
    totalLendedCapital: number;
    totalSettled: number;
    totalOutstandingDebt: number;
    activeLenders: number;
  };
  monthlyTrend: Array<{
    month: string;
    ownInfusion: number;
    lendedInfusion: number;
    settlement: number;
  }>;
  capitalDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  lenderSummaries: Array<{
    id: string;
    name: string;
    phone: string;
    notes: string;
    totalLended: number;
    totalSettled: number;
    outstandingBalance: number;
  }>;
  transactions: Array<{
    id: string;
    date: string;
    type: string;
    category: string;
    amount: number;
    lenderName: string;
    description: string;
  }>;
}

export const getCapitalLendersReport = async (
  params: ReportFilterParams
): Promise<CapitalLendersReportData> => {
  const res = await privateClient.get("/reports/capital-lenders", { params });
  return res.data;
};
