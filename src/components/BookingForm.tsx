/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar, 
  User, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  ChevronRight, 
  Printer, 
  ArrowLeft,
  XCircle,
  FileText
} from "lucide-react";
import { Student, Booking, ClassType, CLASSES } from "../types";
import { generateTimeSlots } from "../data";
import { dbService } from "../dbService";
import { SchoolLogo } from "./SchoolLogo";

interface BookingFormProps {
  students: Student[];
  bookings: Booking[];
  onBookingAdded: (booking: Booking) => void;
  addToast: (message: string, type: "success" | "error" | "info") => void;
}

export default function BookingForm({ students, bookings, onBookingAdded, addToast }: BookingFormProps) {
  // Wizard steps: "class_select" | "details_form" | "confirm_preview" | "receipt"
  const [step, setStep] = useState<"class_select" | "details_form" | "confirm_preview" | "receipt">("class_select");
  
  // Selections
  const [selectedClass, setSelectedClass] = useState<ClassType | "">("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [parentName, setParentName] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  
  // Results
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);

  // Load existing personal booking from local storage if page reloads (persists local confirmation)
  useEffect(() => {
    const saved = localStorage.getItem("mumtaz_personal_active_booking");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Verify booking still exists in database
        const stillExists = bookings.some(b => b.id === parsed.id);
        if (stillExists) {
          setActiveBooking(parsed);
          setStep("receipt");
        } else {
          localStorage.removeItem("mumtaz_personal_active_booking");
        }
      } catch (e) {
        localStorage.removeItem("mumtaz_personal_active_booking");
      }
    }
  }, [bookings]);

  // Generate and filter available times for the chosen class
  const classLimits = dbService.getClassLimits();
  const limitForClass = selectedClass ? classLimits[selectedClass] : "";

  const baseTimeSlots = generateTimeSlots();
  const timeSlots = limitForClass
    ? baseTimeSlots.filter(t => t <= limitForClass)
    : baseTimeSlots;

  const bookedTimesForClass = bookings
    .filter(b => b.className === selectedClass)
    .map(b => b.timeSlot);
  
  const availableSlots = timeSlots.filter(t => !bookedTimesForClass.includes(t));

  // Filter students for the selected class
  const classStudents = students.filter(s => s.className === selectedClass);
  
  // Filter out students who have already been booked
  const bookedStudentIds = bookings.map(b => b.studentId);
  const unbookedStudents = classStudents.filter(s => !bookedStudentIds.includes(s.id));

  const handleClassSelect = (cls: ClassType) => {
    setSelectedClass(cls);
    setSelectedStudent(null);
    setSelectedTime("");
    setStep("details_form");
  };

  const handleNextToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      addToast("Silakan pilih nama siswa terlebih dahulu", "error");
      return;
    }
    if (!parentName.trim()) {
      addToast("Silakan masukkan nama orang tua atau wali", "error");
      return;
    }
    if (!selectedTime) {
      addToast("Silakan pilih sesi waktu pengambilan", "error");
      return;
    }
    setStep("confirm_preview");
  };

  const handleConfirmAndSave = async () => {
    if (!selectedClass || !selectedStudent || !parentName.trim() || !selectedTime) return;

    try {
      const newBooking = await dbService.addBooking({
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        className: selectedClass,
        timeSlot: selectedTime,
        parentName: parentName.trim()
      });

      onBookingAdded(newBooking);
      setActiveBooking(newBooking);
      localStorage.setItem("mumtaz_personal_active_booking", JSON.stringify(newBooking));
      addToast("Jadwal pengambilan rapor berhasil disimpan secara permanen!", "success");
      setStep("receipt");
    } catch (err: any) {
      addToast(err.message || "Gagal menyimpan jadwal", "error");
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleCancelReceipt = () => {
    localStorage.removeItem("mumtaz_personal_active_booking");
    setActiveBooking(null);
    setSelectedClass("");
    setSelectedStudent(null);
    setParentName("");
    setSelectedTime("");
    setStep("class_select");
    addToast("Silakan lakukan pendaftaran jadwal baru.", "info");
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-3xl bg-white border border-slate-100 shadow-xl overflow-hidden shadow-slate-200/50">
      
      {/* Dynamic Form Header */}
      {step !== "receipt" && (
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 px-8 py-8 text-white text-center sm:text-left">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-700/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-1">Pendaftaran Jadwal Mandiri</p>
              <h2 className="text-2xl font-bold font-sans tracking-tight">Jadwal Pengambilan Rapor</h2>
            </div>
            <div className="bg-white p-1 rounded-2xl hidden sm:block shadow-md">
              <SchoolLogo className="w-12 h-12" />
            </div>
          </div>
        </div>
      )}

      {/* Progress Stepper indicator */}
      {step !== "receipt" && (
        <div className="border-b border-slate-100 px-8 py-4 bg-slate-50/50 flex justify-between items-center text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              step === "class_select" ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-700"
            }`}>1</span>
            <span>Pilih Kelas</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              step === "details_form" ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-700"
            }`}>2</span>
            <span>Isi Jadwal & Wali</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              step === "confirm_preview" ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-700"
            }`}>3</span>
            <span>Konfirmasi</span>
          </div>
        </div>
      )}

      {/* Body Section with Transitions */}
      <div className="p-8">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: CLASS SELECTION */}
          {step === "class_select" && (
            <motion.div
              key="class_select"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Pilih Tingkat Kelas Siswa:
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {CLASSES.map((cls) => {
                  const classBookingCount = bookings.filter(b => b.className === cls).length;
                  const totalClassStudents = students.filter(s => s.className === cls).length;
                  const remainingStudents = Math.max(0, totalClassStudents - classBookingCount);

                  return (
                    <button
                      key={cls}
                      onClick={() => handleClassSelect(cls)}
                      className="group flex flex-col p-5 text-left rounded-2xl border border-slate-200/80 bg-slate-50/30 hover:bg-indigo-50/30 hover:border-indigo-200 transition-all hover:shadow-md hover:shadow-indigo-100/40"
                    >
                      <span className="text-lg font-bold text-slate-800 group-hover:text-indigo-900 transition-colors">
                        {cls}
                      </span>
                      <div className="mt-3 space-y-1">
                        <span className="text-[11px] text-slate-500 block">
                          Total: <strong className="text-slate-700">{totalClassStudents} siswa</strong>
                        </span>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          remainingStudents === 0 
                            ? "bg-rose-50 text-rose-700 border border-rose-100" 
                            : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        }`}>
                          {remainingStudents === 0 ? "Semua Terjadwal" : `${remainingStudents} sisa kuota`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Mulai pukul 08.00 WIB
                </span>
                <span className="flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  Istirahat: 11.40 - 13.00 WIB
                </span>
              </div>
            </motion.div>
          )}

          {/* STEP 2: DETAILS & SCHEDULING FORM */}
          {step === "details_form" && (
            <motion.div
              key="details_form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <form onSubmit={handleNextToConfirm} className="space-y-6">
                
                {/* Back button and Class label */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => setStep("class_select")}
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Kembali
                  </button>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-800 text-xs font-bold rounded-full">
                    Grup Kehadiran: {selectedClass}
                  </span>
                </div>

                {/* Student select field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-800" htmlFor="studentSelect">
                    Nama Siswa / Anak:
                  </label>
                  <p className="text-xs text-slate-500">
                    Siswa terpilih yang terdaftar di <strong className="text-slate-600">{selectedClass}</strong> dan belum memiliki jadwal.
                  </p>
                  <select
                    id="studentSelect"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                    value={selectedStudent?.id || ""}
                    onChange={(e) => {
                      const student = unbookedStudents.find(s => s.id === e.target.value);
                      setSelectedStudent(student || null);
                    }}
                    required
                  >
                    <option value="">-- Pilih Nama Siswa --</option>
                    {unbookedStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>

                  {unbookedStudents.length === 0 && (
                    <div className="mt-2 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2 text-xs text-rose-800">
                      <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      <span>
                        Semua siswa di {selectedClass} telah didaftarkan jadwal pengambilannya atau data siswa tersebut belum ditambahkan oleh Admin sekolah.
                      </span>
                    </div>
                  )}
                </div>

                {/* Parent / Wali Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-800" htmlFor="parentNameInput">
                    Nama Orang Tua / Wali Murid:
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                      <User className="w-4 h-4 text-slate-400" />
                    </span>
                    <input
                      id="parentNameInput"
                      type="text"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                      placeholder="Masukkan nama lengkap orang tua / wali"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Time dropdown */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-800" htmlFor="timeSlotSelect">
                    Pilih Sesi Waktu Pengambilan (10 Menit/Sesi):
                  </label>
                  <p className="text-xs text-slate-500">
                    Jadwal yang telah dipesan orang tua lain di kelas ini **dihilangkan secara otomatis** dari menu.
                  </p>
                  
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                      <Clock className="w-4 h-4 text-slate-400" />
                    </span>
                    <select
                      id="timeSlotSelect"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      required
                      disabled={unbookedStudents.length === 0}
                    >
                      <option value="">-- Pilih Jam Pengambilan (WIB) --</option>
                      {availableSlots.map(time => (
                        <option key={time} value={time}>
                          Pukul {time} WIB
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-2 text-xs text-indigo-600 font-medium">
                    Tersisa <span className="font-bold">{availableSlots.length}</span> dari {timeSlots.length} slot waktu di {selectedClass}.
                  </div>
                </div>

                {/* Sesi Terisi list in selected class */}
                <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />
                    Sesi Terisi di Kelas {selectedClass}:
                  </h4>
                  {bookedTimesForClass.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {bookings
                        .filter(b => b.className === selectedClass)
                        .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot))
                        .map(b => (
                          <div key={b.id} className="p-1 px-2 bg-white border border-slate-100 rounded-md text-[11px] text-slate-600 flex justify-between items-center">
                            <span className="font-semibold text-indigo-955">{b.timeSlot} WIB</span>
                            <span className="truncate max-w-[85px] text-slate-400 font-medium" title={`Siswa: ${b.studentName} (Wali: ${b.parentName})`}>
                              ({b.studentName})
                            </span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic font-medium">Belum ada sesi yang terisi di kelas ini.</p>
                  )}
                </div>

                {/* Submission CTA */}
                <button
                  type="submit"
                  disabled={unbookedStudents.length === 0}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-lg shadow-indigo-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  Lanjutkan Konfirmasi
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>

              {/* Rekapitulasi Jadwal Terdaftar di Sekolah */}
              <div className="pt-6 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    Daftar Jadwal yang Sudah Diambil (Seluruh Kelas):
                  </h3>
                  <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-black px-2 py-0.5 rounded-full">
                    {bookings.length} Sesi Terisi
                  </span>
                </div>
                
                {bookings.length > 0 ? (
                  <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2">
                    {CLASSES.map(cls => {
                      const classBookings = bookings
                        .filter(b => b.className === cls)
                        .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
                      
                      if (classBookings.length === 0) return null;
                      
                      return (
                        <div key={cls} className="bg-slate-50/50 rounded-xl p-3 border border-slate-200/60 shadow-sm">
                          <span className="text-[10px] font-black tracking-wider text-indigo-800 uppercase block mb-2">
                            {cls} ({classBookings.length} Sesi Terbooking)
                          </span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {classBookings.map(b => (
                              <div key={b.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs bg-white border border-slate-100 rounded-lg text-slate-700">
                                <span className="font-extrabold text-indigo-900">{b.timeSlot} WIB</span>
                                <span className="text-[10px] text-slate-400 truncate font-medium max-w-[120px]" title={`Siswa: ${b.studentName} (Wali: ${b.parentName})`}>
                                  {b.studentName}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Belum ada sesi pengambilan rapor yang diambil untuk semua kelas. Silakan pilih kelas Anda di atas untuk menjadi pemesan pertama!
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 3: CONFIRM PREVIEW (SAFETY RULE: AFTER BOOKED CAN'T CHANGE) */}
          {step === "confirm_preview" && (
            <motion.div
              key="confirm_preview"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 text-center"
            >
              <div className="w-16 h-16 bg-amber-50 border border-amber-200 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Periksa & Konfirmasi Jadwal</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  Silakan tinjau data di bawah ini dengan saksama. Demi keadilan antrean, jadwal yang telah disimpan **tidak dapat diubah atau diedit kembali**.
                </p>
              </div>

              {/* Detail Review Box */}
              <div className="bg-slate-50/80 rounded-2xl border border-slate-200/60 p-6 text-left space-y-4 max-w-md mx-auto">
                <div className="flex justify-between border-b border-slate-200/50 pb-2">
                  <span className="text-xs text-slate-500">KELAS TINGKAT</span>
                  <span className="text-sm font-bold text-slate-800">{selectedClass}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/50 pb-2">
                  <span className="text-xs text-slate-500">NAMA SISWA / ANAK</span>
                  <span className="text-sm font-bold text-slate-800">{selectedStudent?.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/50 pb-2">
                  <span className="text-xs text-slate-500">WALI MURID (PENGAMBIL)</span>
                  <span className="text-sm font-bold text-slate-800">{parentName}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-xs text-slate-500">WAKTU SESI TERJADWAL</span>
                  <span className="text-sm font-extrabold text-indigo-700 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Pukul {selectedTime} WIB
                  </span>
                </div>
              </div>

              {/* Legal Warning Notice */}
              <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 text-left max-w-md mx-auto flex items-start gap-2.5">
                <CheckCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Kebijakan Konfirmasi Kunci:</strong>
                  Sistem menutup akses edit untuk mencegah penimbunan sesi. Jika salah input, Anda harus menghubungi guru kelas/Admin sekolah secara langsung.
                </div>
              </div>

              {/* Double Confirm Actions */}
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-2">
                <button
                  onClick={() => setStep("details_form")}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-all cursor-pointer"
                >
                  Ubah Data
                </button>
                <button
                  onClick={handleConfirmAndSave}
                  className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-600/20 active:scale-[0.99] transition-all cursor-pointer"
                >
                  Simpan & Kunci Jadwal
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: CONFIRMED READ-ONLY RECEIPT SLIP */}
          {step === "receipt" && activeBooking && (
            <motion.div
              key="receipt"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6"
            >
              {/* Receipt Visual Structure */}
              <div id="print-area" className="p-8 border-2 border-dashed border-emerald-300 bg-emerald-50/20 rounded-2xl relative overflow-hidden">
                {/* Stamp visual effect */}
                <div className="absolute -top-10 -right-10 w-44 h-44 border-8 border-emerald-600/10 rounded-full flex items-center justify-center transform rotate-12 pointer-events-none select-none">
                  <span className="text-xs font-bold text-emerald-600/20 uppercase tracking-widest text-center">
                    MUMTAZ<br />SCHEDULER
                  </span>
                </div>

                <div className="text-center space-y-2 mb-6 border-b border-emerald-100 pb-5">
                  <div className="flex justify-center mb-3">
                    <SchoolLogo className="w-16 h-16" />
                  </div>
                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                    <CheckCircle className="w-4 h-4" /> TERKONFIRMASI SECARA PERMANEN
                  </span>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mt-1">BUKTI ANTRIAN PENGAMBILAN RAPOR</h3>
                  <p className="text-xs text-slate-500">
                    Harap hadir tepat waktu sesuai jadwal demi ketertiban bersama di lingkup sekolah.
                  </p>
                </div>

                {/* Grid metrics details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium text-slate-600">
                  <div className="bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Nama Siswa / Anak</span>
                    <strong className="text-sm font-bold text-slate-800">{activeBooking.studentName}</strong>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Kelas Tingkat</span>
                    <strong className="text-sm font-bold text-slate-800">{activeBooking.className}</strong>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Nama Orang Tua / Wali</span>
                    <strong className="text-sm font-bold text-slate-800">{activeBooking.parentName}</strong>
                  </div>
                  <div className="bg-white border border-emerald-100 bg-emerald-50/30 rounded-xl p-3.5 shadow-sm">
                    <span className="text-[10px] text-emerald-600 uppercase tracking-wider block mb-1 font-semibold">Sesi Waktu Terkunci</span>
                    <strong className="text-sm font-black text-emerald-900 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Pukul {activeBooking.timeSlot} WIB
                    </strong>
                  </div>
                </div>

                {/* Dynamic barcode visual for auth feel */}
                <div className="mt-6 flex flex-col items-center justify-center p-4 bg-white border border-slate-100 rounded-xl text-center">
                  {/* Pseudo Barcode Lines */}
                  <div className="flex gap-0.5 items-stretch h-10 w-56 select-none grayscale opacity-70">
                    {[3,1,4,1,5,9,2,6,5,3,5,8,9,7,9,3,2,3,8,4,6,2,6,4,3,3,8,3,2,7,9,5,0,2,8,8,4,1,9,7,1,6,9,3,9,9,3,7,5,1,0].map((weight, i) => (
                      <div key={i} className={`bg-slate-800 ${weight % 2 === 0 ? 'w-0.5' : 'w-1'}`} />
                    ))}
                  </div>
                  <span className="text-[9px] font-mono tracking-widest text-slate-400 mt-1.5 uppercase">
                    ID-{activeBooking.id.toUpperCase().split("-")[1]} / {new Date(activeBooking.bookedAt).toLocaleDateString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Utility Panel */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handlePrintReceipt}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  Cetak Bukti (PDF / Kertas)
                </button>
                <button
                  onClick={handleCancelReceipt}
                  className="py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-950 text-white text-sm font-bold shadow-md transition-all cursor-pointer"
                >
                  Daftar Anak Lain
                </button>
              </div>

              <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-3.5 flex gap-2.5 text-xs text-amber-900">
                <FileText className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Tip Penting:</strong> Silakan simpan tangkapan layar (screenshot) layar ini atau cetak dalam format PDF di ponsel Anda untuk ditunjukkan kepada wali kelas setibanya di sekolah.
                </span>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
