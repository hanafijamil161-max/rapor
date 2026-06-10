/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student } from "./types";

// Generates morning slots (08:00 - 11:30) and afternoon slots (13:00 - 15:50)
export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  
  // Morning slots: 08:00 to 11:30
  let hour = 8;
  let minute = 0;
  while (hour < 11 || (hour === 11 && minute <= 30)) {
    const minStr = minute < 10 ? `0${minute}` : `${minute}`;
    const hrStr = hour < 10 ? `0${hour}` : `${hour}`;
    slots.push(`${hrStr}:${minStr}`);
    minute += 10;
    if (minute >= 60) {
      minute = 0;
      hour += 1;
    }
  }

  // Afternoon slots: 13:00 to 15:50
  hour = 13;
  minute = 0;
  while (hour < 15 || (hour === 15 && minute <= 50)) {
    const minStr = minute < 10 ? `0${minute}` : `${minute}`;
    const hrStr = hour < 10 ? `0${hour}` : `${hour}`;
    slots.push(`${hrStr}:${minStr}`);
    minute += 10;
    if (minute >= 60) {
      minute = 0;
      hour += 1;
    }
  }

  return slots;
}

export const SEED_STUDENTS: Student[] = [
  // Kelas 7
  { id: "s7-1", name: "Achmad Daffa Almirzaki", className: "Kelas 7" },
  { id: "s7-2", name: "Al A'Raaf Rafif Qurahman", className: "Kelas 7" },
  { id: "s7-3", name: "Albilly Asadil Shabran", className: "Kelas 7" },
  { id: "s7-4", name: "Alfarezi Ahza Setiadi", className: "Kelas 7" },
  { id: "s7-5", name: "Alif Azidane Azmi", className: "Kelas 7" },
  { id: "s7-6", name: "Ammar Raqilla Furqon", className: "Kelas 7" },
  { id: "s7-7", name: "Candra Ibrahim Kurniawan", className: "Kelas 7" },
  { id: "s7-8", name: "Dzaka Adibi Avicena", className: "Kelas 7" },
  { id: "s7-9", name: "Dzaky Bima Prayoga", className: "Kelas 7" },
  { id: "s7-10", name: "Faiz Mubarok", className: "Kelas 7" },
  { id: "s7-11", name: "Harun Al Rasyid Nugroho", className: "Kelas 7" },
  { id: "s7-12", name: "Jaya Raya Habibie Sofyan", className: "Kelas 7" },
  { id: "s7-13", name: "Kenzie Raffi Mahendra", className: "Kelas 7" },
  { id: "s7-14", name: "Muhammad Al Hafizhi", className: "Kelas 7" },
  { id: "s7-15", name: "Muhammad Dimas Algibran", className: "Kelas 7" },
  { id: "s7-16", name: "Muhammad Fachrel Rakaan Negara", className: "Kelas 7" },
  { id: "s7-17", name: "Muhammad Imam Al Ramadhan", className: "Kelas 7" },
  { id: "s7-18", name: "Muhammad Rasyid Farizki", className: "Kelas 7" },
  { id: "s7-19", name: "Raffasyah Dzaki Alvaro", className: "Kelas 7" },
  { id: "s7-20", name: "Risyad Yaqdhan Khairy", className: "Kelas 7" },
  { id: "s7-21", name: "Yusuf Daanish Fadhlurrohman", className: "Kelas 7" },

  // Kelas 8
  { id: "s8-1", name: "Ahmad Barra Atharayhan", className: "Kelas 8" },
  { id: "s8-2", name: "Akbar Rizki Langit", className: "Kelas 8" },
  { id: "s8-3", name: "Billy Faaruuq Kabsya Marjoko", className: "Kelas 8" },
  { id: "s8-4", name: "Dhimas Al Maajid Surya Setyadi", className: "Kelas 8" },
  { id: "s8-5", name: "Fathan Emeraldy Dwitama", className: "Kelas 8" },
  { id: "s8-6", name: "Haikal Akbar", className: "Kelas 8" },
  { id: "s8-7", name: "Khalid Tanuarga Rizla", className: "Kelas 8" },
  { id: "s8-8", name: "M. Ammar Azzam", className: "Kelas 8" },
  { id: "s8-9", name: "M. Arkaantama", className: "Kelas 8" },
  { id: "s8-10", name: "M. Dzaky Akmal Seoja", className: "Kelas 8" },
  { id: "s8-11", name: "M. Faliandra El Fariid", className: "Kelas 8" },
  { id: "s8-12", name: "M. Rafa Keitaro M.", className: "Kelas 8" },
  { id: "s8-13", name: "M. Thoriq Alfajri Khoir", className: "Kelas 8" },
  { id: "s8-14", name: "Muhammad Agha Haidar Edrika", className: "Kelas 8" },
  { id: "s8-15", name: "Muhammad Antar", className: "Kelas 8" },
  { id: "s8-16", name: "Raden Prabu Ridhollah", className: "Kelas 8" },
  { id: "s8-17", name: "Rizqullah Qary Faddilah", className: "Kelas 8" },
  { id: "s8-18", name: "Suja'i", className: "Kelas 8" },
  { id: "s8-19", name: "Yuki Dyta Ramadhan", className: "Kelas 8" },
  { id: "s8-20", name: "Zaidan Ibrahim", className: "Kelas 8" },
  { id: "s8-21", name: "Zarko Jabbar Al-Yildislillar Triloka", className: "Kelas 8" },

  // Kelas 10
  { id: "s10-1", name: "Ebi Irawan Ardianto", className: "Kelas 10" },
  { id: "s10-2", name: "Farrel Ikhwan Suryawan", className: "Kelas 10" },
  { id: "s10-3", name: "Fathan Ditya R", className: "Kelas 10" },
  { id: "s10-4", name: "Labib Luthfan Hisyam", className: "Kelas 10" },
  { id: "s10-5", name: "Muhammad Dzaki Jamail", className: "Kelas 10" },
  { id: "s10-6", name: "Raihan Yusuf Kurniawan", className: "Kelas 10" },

  // Kelas 11
  { id: "s11-1", name: "Ahmad Nurrohman", className: "Kelas 11" },
  { id: "s11-2", name: "Bintang Jauhar", className: "Kelas 11" },
  { id: "s11-3", name: "Bunayya Liwa Al Hamd", className: "Kelas 11" },
  { id: "s11-4", name: "Daffa Ramadhan Putra", className: "Kelas 11" },
  { id: "s11-5", name: "Daniya Rahman Zharif", className: "Kelas 11" },
  { id: "s11-6", name: "Fakhri Rizki Kowasanda", className: "Kelas 11" },
  { id: "s11-7", name: "M. Ariz Faiq", className: "Kelas 11" },
  { id: "s11-8", name: "M. Said Probo Kusumo", className: "Kelas 11" },
  { id: "s11-9", name: "Muhammad Arrofi Alydrus", className: "Kelas 11" },
  { id: "s11-10", name: "Muhammad Azzam Maulana", className: "Kelas 11" },
  { id: "s11-11", name: "Muhammad Kenzi Sholihan", className: "Kelas 11" },
  { id: "s11-12", name: "Neo Herdy Samantha", className: "Kelas 11" }
];
