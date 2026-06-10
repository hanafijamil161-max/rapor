/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student, Booking } from "../types";

// Exports bookings data to a standard Excel CSV format
export function exportToExcel(bookings: Booking[], students: Student[]) {
  // Helper to match student name for context
  const getStudentClass = (studentId: string) => {
    const s = students.find(item => item.id === studentId);
    return s ? s.className : "-";
  };

  // CSV headers
  const csvHeaders = ["No", "Kelas", "Nama Siswa", "Sesi Waktu (WIB)", "Nama Orang Tua / Wali", "Status Konfirmasi", "Waktu Pendaftaran"];
  
  // Format Rows
  const csvRows = bookings.map((b, index) => {
    return [
      index + 1,
      b.className,
      b.studentName,
      b.timeSlot,
      `"${b.parentName.replace(/"/g, '""')}"`,
      b.confirmed ? "Terkonfirmasi" : "Pending",
      new Date(b.bookedAt).toLocaleString("id-ID")
    ];
  });

  const delimiter = ",";
  const csvContent = [
    csvHeaders.join(delimiter),
    ...csvRows.map(row => row.join(delimiter))
  ].join("\n");

  // UTF-8 BOM to force Excel to read UTF-8 properly
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  const timestamp = new Date().toISOString().slice(0, 10);
  link.setAttribute("href", url);
  link.setAttribute("download", `Rekap_Kehadiran_Rapor_${timestamp}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
