import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export interface ExportPdfOptions {
  element: HTMLElement;
  fileName: string;
  reportTitle?: string;
  filterParameters?: { label: string; value: string }[];
}

/**
 * Captures an analytics report container at 2x retina scale and compiles it into a cleanly paginated A4 PDF.
 *
 * The top interactive filter controls (with dropdowns/selects) are excluded from the canvas snapshot
 * and instead rendered directly at the top of the PDF as crisp, native vector text.
 */
export const exportAnalyticsReportToPdf = async ({
  element,
  fileName,
  reportTitle,
  filterParameters,
}: ExportPdfOptions): Promise<void> => {
  // 1. Identify the top filter container
  const filterBar = (
    element.querySelector<HTMLElement>('[data-report-filters="true"]') ||
    Array.from(element.children).find((child) => child.querySelector("select") !== null) ||
    element.firstElementChild
  ) as HTMLElement | null;

  // 2. Extract title & filter parameters if not explicitly provided
  const detectedTitle =
    reportTitle ||
    filterBar?.querySelector("h3")?.textContent?.replace(/Filters$/i, "Report").trim() ||
    "Simak Constructions — Analytics Report";

  const extractedParams: { label: string; value: string }[] =
    filterParameters || [];

  if (extractedParams.length === 0 && filterBar) {
    const labels = Array.from(filterBar.querySelectorAll<HTMLLabelElement>("label"));
    labels.forEach((label) => {
      const labelText = label.textContent?.trim() || "";
      const parent = label.parentElement;
      if (!parent) return;

      const select = parent.querySelector("select");
      const input = parent.querySelector("input");
      let val = "";

      if (select) {
        val = select.options[select.selectedIndex]?.text || select.value || "";
      } else if (input) {
        val = input.value || input.placeholder || "";
      }

      if (labelText && val) {
        extractedParams.push({ label: labelText, value: val });
      }
    });
  }

  // 3. Mark the interactive filter bar to be ignored by html2canvas so it is NOT snapshotted
  const hadIgnore = filterBar?.getAttribute("data-html2canvas-ignore");
  if (filterBar) {
    filterBar.setAttribute("data-html2canvas-ignore", "true");
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      ignoreElements: (el) =>
        el.getAttribute("data-html2canvas-ignore") === "true",
    });

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    const contentWidth = pageWidth - margin * 2; // 190mm

    // 4. Render native vector text header & filter summary on Page 1
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const timeStr = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const timestampText = `Exported: ${dateStr}, ${timeStr}`;

    // Title on left
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(15, 23, 42); // slate-900
    pdf.text(detectedTitle, margin, 14);

    // Exported timestamp on top-right corner
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139); // slate-500
    pdf.text(timestampText, pageWidth - margin, 14, { align: "right" });

    let yCursor = 18;

    if (extractedParams.length > 0) {
      const padX = 4;
      const padY = 3.2; // exact equal top and bottom visual padding
      const boxTop = yCursor;

      const paramText = extractedParams
        .map((p) => `${p.label}: ${p.value}`)
        .join("   |   ");

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);

      const splitLines = pdf.splitTextToSize(paramText, contentWidth - padX * 2);
      const lineHeight = 4.4;
      // Exact calculation ensuring top space (3.2mm) equals bottom space (3.2mm)
      const boxHeight = 9.8 + (splitLines.length - 1) * lineHeight + padY;

      // Draw background card
      pdf.setFillColor(248, 250, 252); // slate-50
      pdf.setDrawColor(226, 232, 240); // slate-200
      pdf.setLineWidth(0.3);
      pdf.roundedRect(margin, boxTop, contentWidth, boxHeight, 1.5, 1.5, "FD");

      // Left-aligned section title inside card
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 116, 139); // slate-500
      pdf.text("REPORT PARAMETERS & SCOPE", margin + padX, boxTop + 4.9);

      // Left-aligned parameter lines inside card
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(30, 41, 59); // slate-800

      splitLines.forEach((line: string, index: number) => {
        const lineY = boxTop + 9.2 + index * lineHeight;
        pdf.text(line, margin + padX, lineY);
      });

      yCursor = boxTop + boxHeight + 3;
    }

    // Divider line
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);
    pdf.line(margin, yCursor, pageWidth - margin, yCursor);
    yCursor += 4; // gap before report content

    // 5. Place the canvas content below the text header
    const page1AvailableHeight = pageHeight - margin - yCursor;
    const totalCanvasHeightMm = (canvas.height * contentWidth) / canvas.width;

    if (totalCanvasHeightMm <= page1AvailableHeight) {
      // Entire content fits on Page 1
      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        margin,
        yCursor,
        contentWidth,
        totalCanvasHeightMm,
        undefined,
        "FAST",
      );
    } else {
      // Multi-page slicing: Page 1 gets slice 1
      const slice1CanvasHeight =
        (canvas.width * page1AvailableHeight) / contentWidth;

      const page1Canvas = document.createElement("canvas");
      page1Canvas.width = canvas.width;
      page1Canvas.height = slice1CanvasHeight;
      const ctx1 = page1Canvas.getContext("2d");

      if (ctx1) {
        ctx1.fillStyle = "#ffffff";
        ctx1.fillRect(0, 0, page1Canvas.width, page1Canvas.height);
        ctx1.drawImage(
          canvas,
          0,
          0,
          canvas.width,
          slice1CanvasHeight,
          0,
          0,
          canvas.width,
          slice1CanvasHeight,
        );

        pdf.addImage(
          page1Canvas.toDataURL("image/png"),
          "PNG",
          margin,
          yCursor,
          contentWidth,
          page1AvailableHeight,
          undefined,
          "FAST",
        );
      }

      // Subsequent pages (Page 2, 3...)
      let renderedHeight = slice1CanvasHeight;
      const maxSubsequentPageHeight = pageHeight - margin * 2; // 277mm
      const subsequentSliceCanvasHeight =
        (canvas.width * maxSubsequentPageHeight) / contentWidth;

      while (renderedHeight < canvas.height) {
        pdf.addPage();

        const chunkHeight = Math.min(
          subsequentSliceCanvasHeight,
          canvas.height - renderedHeight,
        );

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = chunkHeight;
        const ctx = pageCanvas.getContext("2d");

        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            canvas,
            0,
            renderedHeight,
            canvas.width,
            chunkHeight,
            0,
            0,
            canvas.width,
            chunkHeight,
          );

          const pageImgData = pageCanvas.toDataURL("image/png");
          const renderedSliceHeight =
            (chunkHeight * contentWidth) / canvas.width;
          pdf.addImage(
            pageImgData,
            "PNG",
            margin,
            margin,
            contentWidth,
            renderedSliceHeight,
            undefined,
            "FAST",
          );
        }

        renderedHeight += chunkHeight;
      }
    }

    pdf.save(fileName);
  } finally {
    // Restore filter bar visibility in the live DOM
    if (filterBar) {
      if (hadIgnore !== null && hadIgnore !== undefined) {
        filterBar.setAttribute("data-html2canvas-ignore", hadIgnore);
      } else {
        filterBar.removeAttribute("data-html2canvas-ignore");
      }
    }
  }
};
