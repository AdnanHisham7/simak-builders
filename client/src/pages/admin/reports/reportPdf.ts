import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface LoadedImage {
  dataURL: string;
  width: number;
  height: number;
}

export const loadImage = (url: string): Promise<LoadedImage> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Unable to acquire 2D canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve({
        dataURL: canvas.toDataURL("image/png"),
        width: img.width,
        height: img.height,
      });
    };
    img.onerror = reject;
    img.src = url;
  });
};

// Applies the header strictly to page 1 and the footer strictly to the final page.
export const applyHeaderFooter = (
  doc: jsPDF,
  headerData: LoadedImage,
  footerData: LoadedImage,
): void => {
  const totalPages = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  const headerHeight = (headerData.height / headerData.width) * pageWidth;
  const footerHeight = (footerData.height / footerData.width) * pageWidth;

  doc.setPage(1);
  doc.addImage(headerData.dataURL, "PNG", 0, 0, pageWidth, headerHeight);

  doc.setPage(totalPages);
  doc.addImage(footerData.dataURL, "PNG", 0, pageHeight - footerHeight, pageWidth, footerHeight);
};

export interface ReportPdfRow {
  itemOfWork: string;
  quantity: number | string | null | undefined;
  amount: number;
}

export interface ReportPdfSummaryRow {
  label: string;
  amount: number;
}

export interface ReportPdfOptions {
  title: string;
  siteName: string;
  address?: string;
  clientName?: string | null;
  periodLabel?: string | null;
  rows: ReportPdfRow[];
  summaryRows: ReportPdfSummaryRow[];
  headerImage: LoadedImage;
  footerImage: LoadedImage;
  fileName: string;
}

const formatCurrency = (value: number): string =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const generateProfessionalReportPdf = (options: ReportPdfOptions): jsPDF => {
  const { title, siteName, address, clientName, periodLabel, rows, summaryRows, headerImage, footerImage, fileName } =
    options;

  const doc = new jsPDF();
  let yOffset = 48;

  doc.setFont("Roboto-Regular", "normal");

  doc.setFontSize(16);
  doc.setTextColor(25, 25, 25);
  doc.text(title, 14, yOffset);
  yOffset += 7;

  doc.setFontSize(10.5);
  doc.setTextColor(80, 80, 80);
  doc.text(`Site: ${siteName}`, 14, yOffset);
  yOffset += 5;

  if (address) {
    doc.text(`Address: ${address}`, 14, yOffset);
    yOffset += 5;
  }

  if (clientName) {
    doc.text(`Client: ${clientName}`, 14, yOffset);
    yOffset += 5;
  }

  if (periodLabel) {
    doc.text(`Period: ${periodLabel}`, 14, yOffset);
    yOffset += 5;
  }

  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.2);
  doc.line(14, yOffset, 196, yOffset);
  yOffset += 6;

  const bodyRows = rows.map((row, index) => [
    String(index + 1),
    row.itemOfWork,
    row.quantity === null || row.quantity === undefined || row.quantity === "" ? "-" : String(row.quantity),
    formatCurrency(row.amount),
  ]);
  const itemRowCount = bodyRows.length;

  const summaryTableRows = summaryRows.map((summaryRow) => [
    "",
    summaryRow.label,
    "",
    formatCurrency(summaryRow.amount),
  ]);

  autoTable(doc, {
    startY: yOffset,
    margin: { top: 20, bottom: 26, left: 14, right: 14 },
    head: [["Sl.No", "Item of Work", "Quantity", "Amount (INR)"]],
    body: [...bodyRows, ...summaryTableRows],
    theme: "grid",
    styles: {
      font: "Roboto-Regular",
      fontSize: 9.5,
      cellPadding: 3,
      lineColor: [222, 224, 228],
      lineWidth: 0.15,
      textColor: [45, 45, 45],
      valign: "middle",
    },
    headStyles: {
      font: "Roboto-Regular",
      fontStyle: "bold",
      fontSize: 9.5,
      fillColor: [240, 242, 245],
      textColor: [30, 30, 30],
      lineColor: [205, 208, 213],
      lineWidth: 0.15,
      halign: "left",
    },
    alternateRowStyles: { fillColor: [250, 250, 251] },
    columnStyles: {
      0: { cellWidth: 14, halign: "center" },
      1: { cellWidth: 98 },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 38, halign: "right" },
    },
    didParseCell: (data) => {
      if (data.row.index >= itemRowCount) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [236, 239, 243];
      }
    },
  });

  applyHeaderFooter(doc, headerImage, footerImage);
  doc.save(fileName);

  return doc;
};