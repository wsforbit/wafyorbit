import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { CollegeUnassignedGroup } from "@/types/database.types";
import { formatStudentClass } from "@/lib/class-helper";

interface PDFOptions {
  groups: CollegeUnassignedGroup[];
  totalUnassigned: number;
  totalColleges: number;
}

/**
 * Generates and downloads a colorful, professional, margin-controlled PDF report
 * of all unassigned scholars grouped in college order.
 */
export async function downloadUnassignedStudentsPDF({
  groups,
  totalUnassigned,
  totalColleges,
}: PDFOptions): Promise<void> {
  // A4 dimensions: 210mm x 297mm
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm

  const todayStr = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // =========================================================================
  // PAGE 1 HEADER & BRANDING
  // =========================================================================

  // Top colorful accent strip (Royal Blue)
  doc.setFillColor(37, 99, 235); // #2563EB
  doc.rect(0, 0, pageWidth, 5.5, "F");

  // Secondary thin golden accent line
  doc.setFillColor(245, 158, 11); // #F59E0B
  doc.rect(0, 5.5, pageWidth, 1, "F");

  let currentY = 16;

  // Organization Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text("WAFY ORBIT — CENTRAL DIRECTORY AUDIT", marginX, currentY);

  currentY += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(37, 99, 235); // primary blue
  doc.text("OFFICIAL REPORT: UNASSIGNED SCHOLARS BY COLLEGE", marginX, currentY);

  // Date & Generation Timestamp (Right-aligned)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(
    `Generated: ${todayStr} at ${timeStr}`,
    pageWidth - marginX,
    currentY - 6,
    { align: "right" }
  );
  doc.text(
    "Status: Awaiting Orbit Allocation",
    pageWidth - marginX,
    currentY,
    { align: "right" }
  );

  currentY += 5;

  // Thin dividing line
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.4);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);

  currentY += 4;

  // =========================================================================
  // 3 SUMMARY STATISTIC PILL BOXES
  // =========================================================================
  const boxWidth = (contentWidth - 6) / 3; // 3 boxes with 3mm gap
  const boxHeight = 12.5;

  // Box 1: Total Unassigned Scholars
  doc.setFillColor(239, 246, 255); // blue-50
  doc.setDrawColor(191, 219, 254); // blue-200
  doc.roundedRect(marginX, currentY, boxWidth, boxHeight, 1.5, 1.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(29, 78, 216); // blue-700
  doc.text(totalUnassigned.toLocaleString(), marginX + 4, currentY + 5.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text("Unassigned Scholars Total", marginX + 4, currentY + 9.5);

  // Box 2: Total Colleges Affected
  const box2X = marginX + boxWidth + 3;
  doc.setFillColor(254, 243, 199); // amber-50
  doc.setDrawColor(253, 230, 138); // amber-200
  doc.roundedRect(box2X, currentY, boxWidth, boxHeight, 1.5, 1.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(180, 83, 9); // amber-700
  doc.text(totalColleges.toLocaleString(), box2X + 4, currentY + 5.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text("Affiliated Colleges Affected", box2X + 4, currentY + 9.5);

  // Box 3: Verification Notice
  const box3X = box2X + boxWidth + 3;
  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(box3X, currentY, boxWidth, boxHeight, 1.5, 1.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text("Institutional Registry", box3X + 4, currentY + 5.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("College-Order Master Roster", box3X + 4, currentY + 9.5);

  currentY += boxHeight + 6;

  // =========================================================================
  // COLLEGE TABLES (Iterate through all colleges in college order)
  // =========================================================================
  groups.forEach((group, index) => {
    // Check if we need a new page for the college header (leave at least 35mm)
    if (currentY > pageHeight - 38) {
      doc.addPage();
      currentY = 16;
    }

    // College Header Banner
    const bannerHeight = 7.5;
    doc.setFillColor(37, 99, 235); // #2563EB Royal Blue
    doc.roundedRect(marginX, currentY, contentWidth, bannerHeight, 1, 1, "F");

    // College Name and Affiliation No (Left)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    const collegeTitle = `${index + 1}. ${group.collegeName} [AFF: ${group.affno}]`;
    // Truncate if too long to leave room for right badge
    const truncatedTitle =
      collegeTitle.length > 55 ? `${collegeTitle.slice(0, 52)}...` : collegeTitle;
    doc.text(truncatedTitle, marginX + 3, currentY + 5.2);

    // Count and Location (Right)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    const locationText = [group.place, group.district].filter(Boolean).join(", ");
    const rightText = `${group.studentCount} Scholars${locationText ? ` • ${locationText}` : ""}`;
    doc.text(rightText, pageWidth - marginX - 3, currentY + 5.2, { align: "right" });

    currentY += bannerHeight + 1.5;

    // Student Rows for this College
    const tableRows = group.students.map((student, sIdx) => [
      String(sIdx + 1),
      student.cicno || "—",
      student.student_name || "—",
      formatStudentClass(student.class_name),
      student.place || group.place || "—",
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["#", "CIC No", "Scholar Name", "Academic Stage / Class", "Place / Hometown"]],
      body: tableRows,
      theme: "striped",
      headStyles: {
        fillColor: [241, 245, 249], // slate-100
        textColor: [30, 41, 59], // slate-800
        fontStyle: "bold",
        fontSize: 7.5,
        cellPadding: 1.8,
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [15, 23, 42],
        cellPadding: 1.6,
        lineColor: [241, 245, 249],
        lineWidth: 0.1,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // slate-50
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 24, halign: "center", fontStyle: "bold" },
        2: { cellWidth: 62 },
        3: { cellWidth: 40 },
        4: { cellWidth: 46 },
      },
      margin: { left: marginX, right: marginX, bottom: 15 },
      rowPageBreak: "avoid",
      pageBreak: "auto",
      didDrawPage: () => {
        // Keeps track of page transitions automatically
      },
    });

    // Update currentY for next college table
    const lastTable = (doc as any).lastAutoTable;
    if (lastTable && lastTable.finalY) {
      currentY = lastTable.finalY + 6;
    } else {
      currentY += 20;
    }
  });

  // =========================================================================
  // MULTI-PAGE NUMBERING & OFFICIAL FOOTERS
  // =========================================================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Bottom rule
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 9, pageWidth - marginX, pageHeight - 9);

    // Left Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      "Wafy Orbit Central Administration • Confidential & Official Institutional Record",
      marginX,
      pageHeight - 5.5
    );

    // Right Footer: Page X of Y
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - marginX,
      pageHeight - 5.5,
      { align: "right" }
    );
  }

  // File Download
  const filename = `Wafy_Orbit_Unassigned_Scholars_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
