import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ActivityLogItem } from "@/services/dashboardService";
import { CompanyProfile } from "@/services/companyService";

interface ExportDailyActivityPdfOptions {
  activities: ActivityLogItem[];
  selectedDate: Date;
  companyProfile?: CompanyProfile | null;
  filterResource?: string;
  filterAction?: string;
  searchQuery?: string;
}

const formatResourceLabel = (resource: string): string => {
  const map: Record<string, string> = {
    site: "Sites",
    stock: "Inventory/Stock",
    expenseRequest: "Expense Requests",
    miscellaneousExpense: "Misc Expenses",
    expense: "Expenses",
    purchase: "Purchases",
    contractor: "Contractors",
    employee: "Employees",
    vendor: "Vendors",
    user: "User Management",
    auth: "Authentication",
    company: "Company Finance",
    company_profile: "Company Profile",
    attendance: "Attendance",
    feedback: "Feedback",
  };
  return map[resource] || resource.charAt(0).toUpperCase() + resource.slice(1);
};

const formatActionLabel = (action: string): string => {
  const map: Record<string, string> = {
    create: "Created",
    update: "Updated",
    delete: "Deleted",
    approve: "Approved",
    reject: "Rejected",
    login: "Logged In",
    attendance: "Marked Attendance",
    view: "Viewed",
  };
  return map[action] || action.charAt(0).toUpperCase() + action.slice(1);
};

export const exportDailyActivityPdf = ({
  activities,
  selectedDate,
  companyProfile,
  filterResource,
  filterAction,
  searchQuery,
}: ExportDailyActivityPdfOptions): void => {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const dateHeading = format(selectedDate, "EEEE, dd MMMM yyyy");
  const fileDateStamp = format(selectedDate, "yyyy-MM-dd");
  const generatedAtText = format(new Date(), "dd MMM yyyy, hh:mm a");

  // --- 1. Top Header ---
  let y = 14;

  // Company Name
  const companyName = companyProfile?.name || "SIMAK CONSTRUCTIONS";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(24, 24, 27); // zinc-900
  doc.text(companyName.toUpperCase(), margin, y);

  // Date Tag on Right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(140, 100, 36); // brand #8C6424
  doc.text("ACTIVITY AUDIT REPORT", pageWidth - margin, y, { align: "right" });

  y += 5.5;

  // Subtitle / Address on left
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // slate-500
  const subAddress = [
    companyProfile?.city,
    companyProfile?.state,
    companyProfile?.phone,
  ]
    .filter(Boolean)
    .join("  |  ");
  if (subAddress) {
    doc.text(subAddress, margin, y);
  } else {
    doc.text("Construction Management ERP", margin, y);
  }

  // Generated timestamp on right
  doc.text(`Generated: ${generatedAtText}`, pageWidth - margin, y, {
    align: "right",
  });

  y += 4;

  // Divider Line
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  y += 6;

  // --- 2. Executive Summary Box ---
  const boxTop = y;
  const uniqueUsers = new Set(
    activities.map((a) => a.user?.name || "System").filter(Boolean),
  );

  // Group by resource
  const resourceCounts: Record<string, number> = {};
  activities.forEach((act) => {
    const res = act.resource || "other";
    resourceCounts[res] = (resourceCounts[res] || 0) + 1;
  });

  // Background Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, boxTop, contentWidth, 24, 2, 2, "FD");

  // Date Highlight
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(`Activity Log for: ${dateHeading}`, margin + 5, boxTop + 6.5);

  // Stats text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(
    `Total Logged Actions: ${activities.length}   |   Active Team Members: ${uniqueUsers.size}`,
    margin + 5,
    boxTop + 12.5,
  );

  // Module breakdown tags
  const breakdownParts = Object.entries(resourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([res, count]) => `${formatResourceLabel(res)}: ${count}`);

  const breakdownString = breakdownParts.length
    ? `Key Categories: ${breakdownParts.join("   •   ")}`
    : "No activity recorded for this date";

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(breakdownString, margin + 5, boxTop + 18.5);

  y = boxTop + 28;

  // Filter notice if applied
  const activeFilters = [];
  if (filterResource && filterResource !== "all") {
    activeFilters.push(`Category: ${formatResourceLabel(filterResource)}`);
  }
  if (filterAction && filterAction !== "all") {
    activeFilters.push(`Action: ${formatActionLabel(filterAction)}`);
  }
  if (searchQuery && searchQuery.trim()) {
    activeFilters.push(`Search: "${searchQuery.trim()}"`);
  }

  if (activeFilters.length > 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(140, 100, 36);
    doc.text(`Applied Filters: ${activeFilters.join("  |  ")}`, margin, y);
    y += 4.5;
  }

  // --- 3. Chronological Activity Table ---
  const tableData = activities.map((log, index) => {
    let timeStr = "-";
    try {
      timeStr = format(new Date(log.timestamp), "hh:mm a");
    } catch {
      timeStr = "-";
    }

    const userName = log.user?.name || "System";
    const userRole = log.user?.role ? ` (${log.user.role})` : "";
    const member = `${userName}${userRole}`;

    const moduleLabel = formatResourceLabel(log.resource);
    const actionLabel = formatActionLabel(log.action);
    const details = log.details || `${actionLabel} on ${moduleLabel}`;

    return [
      String(index + 1),
      timeStr,
      member,
      `${moduleLabel}\n[${actionLabel}]`,
      details,
    ];
  });

  if (tableData.length === 0) {
    tableData.push([
      "-",
      "-",
      "-",
      "-",
      `No activities found for ${dateHeading}.`,
    ]);
  }

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin, bottom: 18 },
    head: [["#", "Time", "Team Member", "Module / Action", "Activity Details"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      cellPadding: 2.8,
      halign: "left",
    },
    bodyStyles: {
      textColor: [30, 41, 59],
      fontSize: 8,
      cellPadding: 2.6,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      valign: "middle",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    columnStyles: {
      0: { cellWidth: 9, halign: "center" },
      1: { cellWidth: 19, halign: "center" },
      2: { cellWidth: 38 },
      3: { cellWidth: 32 },
      4: { cellWidth: "auto" },
    },
    didDrawPage: (data) => {
      const pageNumber = data.pageNumber;
      const totalPages = (doc.internal as any).getNumberOfPages();

      // Footer
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // slate-400

      doc.text(
        "Simak ERP System  •  Confidential Daily Operations Audit",
        margin,
        pageHeight - 8,
      );
      doc.text(
        `Page ${pageNumber} of ${totalPages}`,
        pageWidth - margin,
        pageHeight - 8,
        { align: "right" },
      );
    },
  });

  // Download the PDF
  doc.save(`Activity_Audit_${fileDateStamp}.pdf`);
};
