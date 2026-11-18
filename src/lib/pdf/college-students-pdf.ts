import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { College, Student } from "@/types/database.types";
import { formatStudentClass, CLASS_OPTIONS } from "@/lib/class-helper";

export interface CollegeStudentsPDFOptions {
  college: College;
  students: Student[];
  targetClass?: string | "ALL";
}

/**
 * Helper to get nice role label
 */
function getRoleLabel(role: string | null | undefined): string {
  if (!role) return "Member";
  const r = role.toLowerCase().trim();
  if (r === "leader") return "Orbit Leader";
  if (r === "asst_leader") return "Asst Leader";
  if (r === "district_leader") return "District Leader";
  if (r === "constituency_leader") return "Constituency Leader";
  if (r === "member") return "Member";
  return role;
}

/**
 * Helper to sort class codes logically in WAFY academic order
 */
function getClassOrderRank(code: string): number {
  const index = CLASS_OPTIONS.findIndex(
    (opt) => opt.code.toUpperCase() === code.toUpperCase()
  );
  return index !== -1 ? index : 999;
}

/**
 * Generates and downloads a colorful, margin-balanced, well-designed PDF report
 * of a college's student directory — either for all classes or for a specific class.
 */
export async function downloadCollegeStudentsPDF({
  college,
  students,
  targetClass = "ALL",
}: CollegeStudentsPDFOptions): Promise<void> {
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

  // Filter students if targetClass is not ALL
  const isAll = !targetClass || targetClass === "ALL";
  const filteredStudents = isAll
    ? students
    : students.filter((s) => {
        const cls = (s.class_name || "1").trim();
        return (
          cls === targetClass ||
          formatStudentClass(cls) === formatStudentClass(targetClass)
        );
      });

  const totalFiltered = filteredStudents.length;
  const assignedCount = filteredStudents.filter(
    (s) => s.orbit_id && s.orbit_id !== "none"
  ).length;
  const unassignedCount = Math.max(0, totalFiltered - assignedCount);

  // Group students by class
  const classMap = new Map<string, Student[]>();
  filteredStudents.forEach((student) => {
    const rawClass = (student.class_name || "1").trim();
    if (!classMap.has(rawClass)) {
      classMap.set(rawClass, []);
    }
    classMap.get(rawClass)!.push(student);
  });

  // Sort groups in academic order
  const sortedClasses = Array.from(classMap.keys()).sort((a, b) => {
    return getClassOrderRank(a) - getClassOrderRank(b);
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

  let currentY = 15;

  // Main Heading: College Name with Affiliation Number
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // slate-900

  const mainHeading = `${college.name} [AFF: ${college.affno}]`;
  const truncatedHeading =
    mainHeading.length > 58 ? `${mainHeading.slice(0, 55)}...` : mainHeading;
  doc.text(truncatedHeading, marginX, currentY);

  currentY += 5.5;

  // Report Subtitle
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(37, 99, 235); // primary blue

  const reportSubtitle = isAll
    ? "OFFICIAL CAMPUS SCHOLARS DIRECTORY — ALL CLASSES"
    : `OFFICIAL CLASS ROSTER — ${formatStudentClass(targetClass).toUpperCase()}`;
  doc.text(reportSubtitle, marginX, currentY);

  // Date & Generation Timestamp (Right-aligned)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(
    `Generated: ${todayStr} at ${timeStr}`,
    pageWidth - marginX,
    currentY - 5.5,
    { align: "right" }
  );

  const locationText = [college.place, college.district, college.state || "Kerala"]
    .filter(Boolean)
    .join(", ");
  const truncatedLocation =
    locationText.length > 36 ? `${locationText.slice(0, 33)}...` : locationText;
  doc.text(truncatedLocation, pageWidth - marginX, currentY, { align: "right" });

  currentY += 4.5;

  // Dividing Rule
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.4);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);

  currentY += 4;

  // =========================================================================
  // 3 SUMMARY STATISTIC PILL BOXES
  // =========================================================================
  const boxWidth = (contentWidth - 6) / 3;
  const boxHeight = 11.5;

  // Box 1: Total Scholars
  doc.setFillColor(239, 246, 255); // blue-50
  doc.setDrawColor(191, 219, 254); // blue-200
  doc.roundedRect(marginX, currentY, boxWidth, boxHeight, 1.5, 1.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(29, 78, 216); // blue-700
  doc.text(`${totalFiltered.toLocaleString()} Scholars`, marginX + 3.5, currentY + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    isAll ? "Total Enrolled across Classes" : "Enrolled in this Stage",
    marginX + 3.5,
    currentY + 8.8
  );

  // Box 2: Classes Represented
  const box2X = marginX + boxWidth + 3;
  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(box2X, currentY, boxWidth, boxHeight, 1.5, 1.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(
    isAll ? `${sortedClasses.length} Academic Stages` : formatStudentClass(targetClass),
    box2X + 3.5,
    currentY + 5
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    isAll ? "Distinct Batches in Campus" : "Designated Class Stage",
    box2X + 3.5,
    currentY + 8.8
  );

  // Box 3: Orbit Allocation Status
  const box3X = box2X + boxWidth + 3;
  doc.setFillColor(254, 243, 199); // amber-50
  doc.setDrawColor(253, 230, 138); // amber-200
  doc.roundedRect(box3X, currentY, boxWidth, boxHeight, 1.5, 1.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(180, 83, 9); // amber-700
  doc.text(`${assignedCount} Assigned`, box3X + 3.5, currentY + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    unassignedCount > 0 ? `${unassignedCount} Awaiting Orbit Placement` : "100% Orbit Allocation",
    box3X + 3.5,
    currentY + 8.8
  );

  currentY += boxHeight + 6;

  // =========================================================================
  // CLASS TABLES
  // =========================================================================
  sortedClasses.forEach((clsCode) => {
    const classStudents = classMap.get(clsCode) || [];
    const formattedClassName = formatStudentClass(clsCode);

    // Ensure space for the class section header (minimum 36mm)
    if (currentY > pageHeight - 36) {
      doc.addPage();
      currentY = 16;
    }

    // Class Section Header Banner
    const bannerHeight = 7;
    doc.setFillColor(37, 99, 235); // #2563EB Royal Blue
    doc.roundedRect(marginX, currentY, contentWidth, bannerHeight, 1, 1, "F");

    // Left: Class Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`Class: ${formattedClassName}`, marginX + 3, currentY + 4.8);

    // Right: Student Count
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    const countText = `${classStudents.length} ${
      classStudents.length === 1 ? "Scholar" : "Scholars"
    }`;
    doc.text(countText, pageWidth - marginX - 3, currentY + 4.8, { align: "right" });

    currentY += bannerHeight + 1.5;

    // Student Rows for this Class
    const tableRows = classStudents.map((s, idx) => {
      const assignedOrbit = s.orbit?.name || s.orbit_id || "Unassigned";
      const roleText = getRoleLabel(s.role);
      const contactText = s.phone || s.g_phone || "—";

      return [
        String(idx + 1),
        s.cicno || "—",
        s.student_name || "—",
        s.place || "—",
        assignedOrbit,
        roleText,
        contactText,
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [["#", "CIC No", "Scholar Name", "Hometown / Place", "Assigned Orbit", "Role", "Contact"]],
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
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 20, halign: "center", fontStyle: "bold" },
        2: { cellWidth: 48 },
        3: { cellWidth: 32 },
        4: { cellWidth: 32 },
        5: { cellWidth: 20 },
        6: { cellWidth: 22, halign: "center" },
      },
      margin: { left: marginX, right: marginX, bottom: 15 },
      rowPageBreak: "avoid",
      pageBreak: "auto",
    });

    const lastTable = (doc as any).lastAutoTable;
    if (lastTable && lastTable.finalY) {
      currentY = lastTable.finalY + 5.5;
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
      `${college.name} [AFF: ${college.affno}] • Official Campus Scholars Directory`,
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
  const cleanAff = (college.short_name || college.affno || "College").replace(/[^a-zA-Z0-9_-]/g, "_");
  const cleanScope = isAll
    ? "All_Students"
    : `Class_${formatStudentClass(targetClass).replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  const filename = `${cleanAff}_${cleanScope}_${new Date().toISOString().slice(0, 10)}.pdf`;

  doc.save(filename);
}
