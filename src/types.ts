/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Student {
  id: string;
  name: string;
  className: string; // "Kelas 7", "Kelas 8", etc.
}

export interface Booking {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  timeSlot: string; // e.g., "08:10"
  parentName: string;
  confirmed: boolean;
  bookedAt: string; // ISO connection date string
}

export type ClassType = "Kelas 7" | "Kelas 8" | "Kelas 9" | "Kelas 10" | "Kelas 11" | "Kelas 12";

export const CLASSES: ClassType[] = [
  "Kelas 7",
  "Kelas 8",
  "Kelas 9",
  "Kelas 10",
  "Kelas 11",
  "Kelas 12"
];
