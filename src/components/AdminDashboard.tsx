/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Lock, 
  Trash2, 
  UserPlus, 
  FileSpreadsheet, 
  FileText, 
  ShieldCheck, 
  Download, 
  Users, 
  Calendar, 
  Clock, 
  Search,
  Filter,
  Plus,
  RefreshCw,
  XCircle,
  HelpCircle,
  TrendingUp,
  Award,
  Printer,
  Database,
  Settings,
  Key,
  Cloud
} from "lucide-react";
import { Student, Booking, ClassType, CLASSES } from "../types";
import { dbService } from "../dbService";
import { generateTimeSlots } from "../data";
import { exportToExcel } from "../utils/exports";
import { SchoolLogo } from "./SchoolLogo";

interface AdminDashboardProps {
  students: Student[];
  bookings: Booking[];
  onDataChanged: () => void;
  addToast: (message: string, type: "success" | "error" | "info") => void;
}

export default function AdminDashboard({ students, bookings, onDataChanged, addToast }: AdminDashboardProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem("mumtaz_admin_logged") === "true";
  });
  const [password, setPassword] = useState("");
  
  // Tabs: "rekap" | "jadwal" | "siswa" | "firebase"
  const [activeTab, setActiveTab] = useState<"rekap" | "jadwal" | "siswa" | "firebase">("rekap");

  // Firebase configurations state
  const [fbApiKey, setFbApiKey] = useState(() => {
    try {
      const saved = localStorage.getItem("mumtaz_firebase_config");
      return saved ? JSON.parse(saved).apiKey || "" : "";
    } catch { return ""; }
  });
  const [fbAuthDomain, setFbAuthDomain] = useState(() => {
    try {
      const saved = localStorage.getItem("mumtaz_firebase_config");
      return saved ? JSON.parse(saved).authDomain || "" : "";
    } catch { return ""; }
  });
  const [fbProjectId, setFbProjectId] = useState(() => {
    try {
      const saved = localStorage.getItem("mumtaz_firebase_config");
      return saved ? JSON.parse(saved).projectId || "" : "";
    } catch { return ""; }
  });
  const [fbStorageBucket, setFbStorageBucket] = useState(() => {
    try {
      const saved = localStorage.getItem("mumtaz_firebase_config");
      return saved ? JSON.parse(saved).storageBucket || "" : "";
    } catch { return ""; }
  });
  const [fbMessagingSenderId, setFbMessagingSenderId] = useState(() => {
    try {
      const saved = localStorage.getItem("mumtaz_firebase_config");
      return saved ? JSON.parse(saved).messagingSenderId || "" : "";
    } catch { return ""; }
  });
  const [fbAppId, setFbAppId] = useState(() => {
    try {
      const saved = localStorage.getItem("mumtaz_firebase_config");
      return saved ? JSON.parse(saved).appId || "" : "";
    } catch { return ""; }
  });
  const [fbDatabaseId, setFbDatabaseId] = useState(() => {
    try {
      const saved = localStorage.getItem("mumtaz_firebase_config");
      return saved ? JSON.parse(saved).firestoreDatabaseId || "(default)" : "(default)";
    } catch { return "(default)"; }
  });
  
  // Searches & Filters
  const [rekapPeriodFilter, setRekapPeriodFilter] = useState<"semua" | "pagi" | "siang">("semua");
  const [scheduleClassFilter, setScheduleClassFilter] = useState<ClassType | "semua">("semua");
  const [scheduleSearch, setScheduleSearch] = useState("");
  
  const [siswaClassFilter, setSiswaClassFilter] = useState<ClassType | "semua">("semua");
  const [siswaSearch, setSiswaSearch] = useState("");
  
  // Student Action States
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentClass, setNewStudentClass] = useState<ClassType>("Kelas 7");
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  // Print Preview Modal state
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Class limits state & logic
  const [classLimits, setClassLimits] = useState<Record<string, string>>(() => {
    return dbService.getClassLimits();
  });

  const allTimeSlots = useMemo(() => generateTimeSlots(), []);

  const handleLimitChange = async (cls: ClassType, limitValue: string) => {
    const updatedLimits = { ...classLimits, [cls]: limitValue };
    setClassLimits(updatedLimits);
    try {
      await dbService.saveClassLimits(updatedLimits);
      onDataChanged();
      if (limitValue) {
        addToast(`Jadwal pengambilan rapor terakhir untuk ${cls} dibatasi sampai jam ${limitValue} WIB`, "success");
      } else {
        addToast(`Batasan jadwal untuk ${cls} dihapus (semua sesi tersedia)`, "info");
      }
    } catch (err) {
      addToast("Gagal menyimpan batasan kelas di server.", "error");
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "SiMumtaz123") {
      setIsLoggedIn(true);
      sessionStorage.setItem("mumtaz_admin_logged", "true");
      addToast("Selamat Datang, Admin Sekolah Islam Mumtaz! Hak akses dikonfirmasi.", "success");
      setPassword("");
    } else {
      addToast("Password salah! Silakan coba lagi.", "error");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem("mumtaz_admin_logged");
    addToast("Berhasil keluar dari sesi administrasi.", "info");
  };

  // Add booking directly from admin panel (Custom Override)
  const handleDeleteBooking = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus jadwal pengambilan rapor untuk siswa "${name}"? Tindakan ini permanen.`)) {
      try {
        await dbService.deleteBooking(id);
        onDataChanged();
        addToast(`Jadwal untuk ${name} berhasil dihapus dari database.`, "success");
      } catch (err) {
        addToast("Gagal menghapus jadwal dari server.", "error");
      }
    }
  };

  // Student Actions
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) {
      addToast("Nama siswa tidak boleh kosong.", "error");
      return;
    }
    
    try {
      await dbService.addStudent(newStudentName, newStudentClass);
      setNewStudentName("");
      setIsAddingStudent(false);
      onDataChanged();
      addToast("Data siswa baru berhasil ditambahkan secara permanen.", "success");
    } catch (err) {
      addToast("Gagal menambah data siswa di server.", "error");
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (confirm(`Hapus siswa "${name}"? Semua data jadwal yang melekat pada siswa ini akan dihapus secara permanen dari database.`)) {
      try {
        await dbService.deleteStudent(id);
        onDataChanged();
        addToast(`Siswa ${name} dan jadwalnya dihapus secara permanen.`, "success");
      } catch (err) {
        addToast("Gagal menghapus siswa di server.", "error");
      }
    }
  };

  const handleResetDB = async () => {
    if (confirm("⚠️ PERINGATAN! Tindakan ini akan menghapus SELURUH jadwal pemesanan dan mereset daftar siswa ke seting standar bawaan sekolah. Lanjutkan?")) {
      try {
        await dbService.resetDatabase();
        setClassLimits({});
        onDataChanged();
        addToast("Sistem database dikosongkan dan di-reset.", "info");
      } catch (err) {
        addToast("Gagal mereset database di server.", "error");
      }
    }
  };

  const handleSaveFirebaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbApiKey.trim() || !fbProjectId.trim() || !fbAppId.trim()) {
      addToast("API Key, Project ID, dan App ID wajib diisi!", "error");
      return;
    }

    const configObj = {
      apiKey: fbApiKey.trim(),
      authDomain: fbAuthDomain.trim(),
      projectId: fbProjectId.trim(),
      storageBucket: fbStorageBucket.trim(),
      messagingSenderId: fbMessagingSenderId.trim(),
      appId: fbAppId.trim(),
      firestoreDatabaseId: fbDatabaseId.trim(),
    };

    try {
      localStorage.setItem("mumtaz_firebase_config", JSON.stringify(configObj));
      addToast("Menyimpan pengaturan Firebase dan memuat ulang database...", "info");
      
      const { initializeFirebase } = await import("../firebase");
      initializeFirebase();
      await dbService.initialize();
      
      onDataChanged();
      addToast("Koneksi Cloud Firestore berhasil diaktifkan secara real-time!", "success");
    } catch (err: any) {
      addToast(`Gagal mengaktifkan Firebase: ${err.message || err}`, "error");
    }
  };

  const handleClearFirebaseConfig = async () => {
    if (confirm("Apakah Anda yakin ingin menghapus kredensial Firebase dan kembali menggunakan penyimpanan luring LocalStorage otomatis?")) {
      localStorage.removeItem("mumtaz_firebase_config");
      addToast("Menghapus kredensial Firebase...", "info");
      const { initializeFirebase } = await import("../firebase");
      initializeFirebase();
      await dbService.initialize();
      onDataChanged();
      addToast("Kembali ke mode penyimpanan lokal offline.", "success");
    }
  };

  // Filters logic
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchClass = scheduleClassFilter === "semua" || b.className === scheduleClassFilter;
      const matchSearch = b.studentName.toLowerCase().includes(scheduleSearch.toLowerCase()) || 
                          b.parentName.toLowerCase().includes(scheduleSearch.toLowerCase());
      
      let matchPeriod = true;
      if (rekapPeriodFilter === "pagi") {
        matchPeriod = b.timeSlot < "12:00";
      } else if (rekapPeriodFilter === "siang") {
        matchPeriod = b.timeSlot >= "12:00";
      }

      return matchClass && matchSearch && matchPeriod;
    });
  }, [bookings, scheduleClassFilter, scheduleSearch, rekapPeriodFilter]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchClass = siswaClassFilter === "semua" || s.className === siswaClassFilter;
      const matchSearch = s.name.toLowerCase().includes(siswaSearch.toLowerCase());
      return matchClass && matchSearch;
    });
  }, [students, siswaClassFilter, siswaSearch]);

  // Rekapitulasi Statistics Calculation
  const totalStudentsCount = students.length;
  const totalScheduledCount = bookings.length;
  const totalRemainingCount = Math.max(0, totalStudentsCount - totalScheduledCount);
  const percentComplete = totalStudentsCount > 0 ? Math.round((totalScheduledCount / totalStudentsCount) * 100) : 0;

  // Breakdown statistics per Class
  const classBreakdown = useMemo(() => {
    return CLASSES.map(cls => {
      const totalInClass = students.filter(s => s.className === cls).length;
      const scheduledInClass = bookings.filter(b => b.className === cls).length;
      return {
        className: cls,
        total: totalInClass,
        scheduled: scheduledInClass,
        percent: totalInClass > 0 ? Math.round((scheduledInClass / totalInClass) * 100) : 0
      };
    });
  }, [students, bookings]);

  // Export files triggers
  const triggerExcelExport = () => {
    exportToExcel(bookings, students);
    addToast("Mengunduh Rekap Excel (CSV)...", "success");
  };

  const triggerPDFPrint = () => {
    setShowPrintModal(true);
  };

  if (!isLoggedIn) {
    return (
      <div className="w-full max-w-md mx-auto rounded-3xl bg-white border border-slate-100 shadow-xl overflow-hidden p-8 text-center space-y-6">
        <div className="flex justify-center">
          <SchoolLogo className="w-20 h-20" />
        </div>
        
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 font-sans tracking-tight">Login Dashboard Admin</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Masukkan kata sandi administrasi sekolah untuk membuka panel pengaturan jadwal, mengelola data siswa, dan mencetak laporan resmi.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div className="space-y-1.5ClassName">
            <label className="text-xs font-bold text-slate-700 block" htmlFor="adminPw">KATA SANDI ADMIN:</label>
            <input
              id="adminPw"
              type="password"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm tracking-wide"
              placeholder="Masukkan password admin..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span className="text-[10px] text-slate-400 block mt-1">
              Petunjuk: Default password tertulis di panduan sistem.
            </span>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md transition-all active:scale-[0.99] cursor-pointer"
          >
            Masuk Administrasi
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      
      {/* Admin Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 text-white px-8 py-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-800 px-2 py-0.5 rounded">MODE ADMINISTRATOR</span>
          </div>
          <h2 className="text-2xl font-black font-sans tracking-tight">Dashboard Sekolah Islam Mumtaz</h2>
          <p className="text-xs text-slate-400">Pengaturan antrean, pengelolaan siswa, dan unduh berkas rekapitulasi kehadiran.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleResetDB}
            className="flex-1 sm:flex-initial py-2 px-3 bg-red-950/40 hover:bg-red-950/60 border border-red-900 text-red-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Mulai Ulang DB
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 sm:flex-initial py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Keluar Sesi
          </button>
        </div>
      </div>

      {/* Internal Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          onClick={() => setActiveTab("rekap")}
          className={`pb-3 border-b-2 px-1 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "rekap" ? "border-indigo-600 text-indigo-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Rekapitulasi Kehadiran
        </button>
        <button
          onClick={() => setActiveTab("jadwal")}
          className={`pb-3 border-b-2 px-1 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "jadwal" ? "border-indigo-600 text-indigo-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Jadwal Terdaftar ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab("siswa")}
          className={`pb-3 border-b-2 px-1 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "siswa" ? "border-indigo-600 text-indigo-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          Kelola Siswa ({students.length})
        </button>
        <button
          onClick={() => setActiveTab("firebase")}
          className={`pb-3 border-b-2 px-1 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "firebase" ? "border-indigo-600 text-indigo-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Database className="w-4 h-4" />
          Setelan Database {dbService.getProvider() === "mysql" ? "🔵 SQL" : dbService.getProvider() === "firebase" ? "🟢 Firebase" : "⚪ Offline"}
        </button>
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        
        {/* SUB-VIEW 1 : REKAPITULASI SUMMARY & CHART */}
        {activeTab === "rekap" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider">Total Siswa</span>
                  <strong className="text-2xl font-black text-slate-800">{totalStudentsCount}</strong>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider">Jadwal Dibuat</span>
                  <strong className="text-2xl font-black text-emerald-700">{totalScheduledCount}</strong>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider">Belum Reservasi</span>
                  <strong className="text-2xl font-black text-amber-700">{totalRemainingCount}</strong>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                <div className="p-4 bg-indigo-900 text-indigo-100 rounded-2xl">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider">Persentase</span>
                  <strong className="text-2xl font-black text-slate-800">{percentComplete}%</strong>
                </div>
              </div>
            </div>

            {/* Quick action reporting bar */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">Cetak & Unduh Laporan Cepat</h4>
                <p className="text-xs text-slate-400">Unduh data kehadiran resmi sebagai bahan perekaman guru wali kelas.</p>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={triggerExcelExport}
                  className="flex-1 sm:flex-initial py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Print Excel (.CSV)
                </button>
                <button
                  onClick={triggerPDFPrint}
                  className="flex-1 sm:flex-initial py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  Pratinjau Cetak/PDF
                </button>
              </div>
            </div>

            {/* Graphical Class Density Chart */}
            <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-6">
              <div className="space-y-1 border-b border-slate-100 pb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Persentase Keterisian Sesi Antrean per Kelas</h3>
                  <p className="text-xs text-slate-400">Rasio perbandingan siswa terdaftar jadwal dibanding jumlah total siswa per kelas.</p>
                </div>
                <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">Update Real-Time</span>
              </div>

              <div className="space-y-5">
                {classBreakdown.map(item => (
                  <div key={item.className} className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">{item.className}</span>
                      <span className="text-slate-500 font-medium">
                        <strong className="text-slate-800 font-semibold">{item.scheduled}</strong> dari {item.total} siswa ({item.percent}%)
                      </span>
                    </div>
                    {/* Visual Progress Bar simulating graph */}
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percent}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className={`h-full rounded-full ${
                          item.percent === 100 
                            ? "bg-emerald-500" 
                            : item.percent > 50 
                            ? "bg-indigo-600" 
                            : "bg-amber-500"
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* SUB-VIEW 2: SCHEDULES / BOOKINGS TABLE LIST */}
        {activeTab === "jadwal" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Filter controls */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm gap-4 grid grid-cols-1 sm:grid-cols-12 items-center">
              
              {/* Search */}
              <div className="sm:col-span-5 relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="w-4 h-4 text-slate-400" />
                </span>
                <input
                  type="text"
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-indigo-500"
                  placeholder="Cari nama anak atau wali..."
                  value={scheduleSearch}
                  onChange={(e) => setScheduleSearch(e.target.value)}
                />
              </div>

              {/* Class Filter */}
              <div className="sm:col-span-3 flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <select
                  className="w-full py-2 px-3 border border-slate-200 rounded-xl bg-white text-xs font-semibold focus:outline-none"
                  value={scheduleClassFilter}
                  onChange={(e) => setScheduleClassFilter(e.target.value as any)}
                >
                  <option value="semua">Semua Kelas</option>
                  {CLASSES.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              {/* Period Filter */}
              <div className="sm:col-span-4 justify-self-end flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setRekapPeriodFilter("semua")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    rekapPeriodFilter === "semua" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Semua Jam
                </button>
                <button
                  type="button"
                  onClick={() => setRekapPeriodFilter("pagi")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    rekapPeriodFilter === "pagi" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Pagi
                </button>
                <button
                  type="button"
                  onClick={() => setRekapPeriodFilter("siang")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    rekapPeriodFilter === "siang" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Siang
                </button>
              </div>

            </div>

            {/* Attendance List Table */}
            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                      <th className="px-6 py-4 text-xs tracking-wider">NO</th>
                      <th className="px-6 py-4 text-xs tracking-wider">TINGKAT KELAS</th>
                      <th className="px-6 py-4 text-xs tracking-wider">NAMA SISWA</th>
                      <th className="px-6 py-4 text-xs tracking-wider">SESI DI-BOOKING (WIB)</th>
                      <th className="px-6 py-4 text-xs tracking-wider">NAMA ORANG TUA/WALI</th>
                      <th className="px-6 py-4 text-xs tracking-wider">STATUS</th>
                      <th className="px-6 py-4 text-xs tracking-wider text-right">AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((b, index) => (
                      <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-55/30 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-slate-400 font-semibold">{index + 1}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-800 text-xs font-bold rounded-lg">
                            {b.className}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800">{b.studentName}</td>
                        <td className="px-6 py-4 font-black text-indigo-600">Pukul {b.timeSlot} WIB</td>
                        <td className="px-6 py-4 text-slate-600 font-medium">{b.parentName}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                            Terkunci
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteBooking(b.id, b.studentName)}
                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                            title="Hapus Jadwal (Permanen)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    
                    {filteredBookings.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-slate-400 font-semibold">
                          Tidak menemukan data jadwal pengambilan rapor.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* SUB-VIEW 3: MANAGE STUDENTS LIST */}
        {activeTab === "siswa" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Split layout: Quick Student Register & Listings */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left sidebar stacked column */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Form to insert physical student */}
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <UserPlus className="w-5 h-5 text-indigo-600" />
                      Tambah Data Siswa Baru
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Tambahkan siswa baru agar orang tua dapat melakukan pendaftaraan jadwal mandiri.
                    </p>
                  </div>

                  <form onSubmit={handleAddStudent} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block" htmlFor="newSiswaName">Nama Lengkap Siswa:</label>
                      <input
                        id="newSiswaName"
                        type="text"
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Masukkan nama lengkap siswa..."
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block" htmlFor="newSiswaClass">Tingkat Kelas:</label>
                      <select
                        id="newSiswaClass"
                        className="w-full py-2 px-3 border border-slate-200 rounded-xl bg-white text-xs font-semibold focus:outline-none"
                        value={newStudentClass}
                        onChange={(e) => setNewStudentClass(e.target.value as ClassType)}
                        required
                      >
                        {CLASSES.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Simpan Siswa
                    </button>
                  </form>
                </div>

                {/* Fitur Admin: Batas Sesi Jadwal Terakhir */}
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <Clock className="w-5 h-5 text-indigo-600" />
                      Jadwal Pengambilan Terakhir
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Tentukan sesi pengambilan rapor <strong>terakhir</strong> yang diperbolehkan untuk masing-masing kelas.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {CLASSES.map(cls => (
                      <div key={cls} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black text-slate-700 uppercase" htmlFor={`limit-${cls}`}>{cls}</label>
                          {classLimits[cls] && (
                            <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.5 rounded-full font-bold">
                              Maks: {classLimits[cls]} WIB
                            </span>
                          )}
                        </div>
                        <select
                          id={`limit-${cls}`}
                          className="w-full py-1.5 px-2.5 border border-slate-200 rounded-xl bg-white text-xs font-semibold focus:outline-none"
                          value={classLimits[cls] || ""}
                          onChange={(e) => handleLimitChange(cls, e.target.value)}
                        >
                          <option value="">-- Tanpa Batas / Semua Sesi --</option>
                          {allTimeSlots.map(t => (
                            <option key={t} value={t}>{t} WIB</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Student datagrid */}
              <div className="lg:col-span-8 space-y-4">
                
                {/* Visual filter search students */}
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
                  <div className="relative w-full sm:max-w-xs">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className="w-4 h-4 text-slate-400" />
                    </span>
                    <input
                      type="text"
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                      placeholder="Cari murid..."
                      value={siswaSearch}
                      onChange={(e) => setSiswaSearch(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <select
                      className="py-1.5 px-3 border border-slate-200 rounded-xl bg-white text-xs font-semibold focus:outline-none"
                      value={siswaClassFilter}
                      onChange={(e) => setSiswaClassFilter(e.target.value as any)}
                    >
                      <option value="semua">Semua Kelas</option>
                      {CLASSES.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Grid table representation */}
                <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                  <div className="overflow-y-auto max-h-96">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 sticky top-0 z-10">
                          <th className="px-6 py-3 tracking-wider">KELAS</th>
                          <th className="px-6 py-3 tracking-wider">NAMA SISWA</th>
                          <th className="px-6 py-3 tracking-wider">STATUS JADWAL</th>
                          <th className="px-6 py-3 tracking-wider text-right">AKSI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map(student => {
                          const hasBooked = bookings.some(b => b.studentId === student.id);
                          return (
                            <tr key={student.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-3">
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-bold rounded">
                                  {student.className}
                                </span>
                              </td>
                              <td className="px-6 py-3 font-bold text-slate-800">{student.name}</td>
                              <td className="px-6 py-3">
                                {hasBooked ? (
                                  <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full font-semibold">
                                    Sudah Terdaftar Jadwal
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-2 py-0.5 bg-slate-50 text-slate-400 rounded-full">
                                    Belum Menentukan Sesi
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-3 text-right">
                                <button
                                  onClick={() => handleDeleteStudent(student.id, student.name)}
                                  className="p-1.5 text-rose-500 hover:text-white hover:bg-rose-600 rounded-lg transition-all cursor-pointer"
                                  title="Hapus Siswa permanently"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}

                        {filteredStudents.length === 0 && (
                          <tr>
                            <td colSpan={4} className="text-center py-8 text-slate-400 font-medium">
                              Belum ada data siswa terdaftar.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        )}

        {/* SUB-VIEW 4: DATABASE & CLOUD SYNC CONFIGURATION */}
        {activeTab === "firebase" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              
              {/* Header Status Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Database className="w-5 h-5 text-indigo-600" />
                    Manajemen Penyimpanan Database (SQL / Cloud)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Atur media penyimpanan data pengambilan rapor Anda. Sistem secara otomatis menyelaraskan mode penyimpanan terbaik.
                  </p>
                </div>
                
                {/* Connection state badges */}
                <div>
                  {dbService.getProvider() === "mysql" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-800 border border-sky-200 text-xs font-bold rounded-full">
                      <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                      Terhubung: MySQL cPanel (Aktif 🔵)
                    </span>
                  ) : dbService.getProvider() === "firebase" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-full">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Terhubung: Firebase Firestore (Aktif 🟢)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-full">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      Mode Offline: LocalStorage (Aktif ⚪)
                    </span>
                  )}
                </div>
              </div>

              {/* Dynamic Warning if tab doesn't show or provider is local */}
              {dbService.getProvider() === "local" && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 leading-relaxed font-semibold">
                  ⚠️ <strong>Info Cache Hosting:</strong> Jika Anda baru saja mengunggah hasil build ke hosting, pastikan Anda menekan tombol <strong>Ctrl + F5</strong> atau gunakan <strong>Mode Penyamaran (Incognito)</strong> agar browser tidak memuat file lama dari cache dan tab pengaturan database ini terlihat dengan benar!
                </div>
              )}

              {/* TWO OPTIONS COLLAPSIBLE PANEL */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* PANEL A: MySQL cPanel */}
                <div className="border border-indigo-100 bg-indigo-50/20 rounded-2xl p-5 sm:p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold font-mono">PIL. A</div>
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <Cloud className="w-4 h-4 text-indigo-600" />
                      Menggunakan Database MySQL / SQL cPanel
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Aplikasi ini telah kami lengkapi dengan file jembatan PHP backend siap pakai, yaitu <strong><code>api.php</code></strong>. Ini adalah cara termudah dan teraman untuk menyimpan data di cPanel hosting konvensional tanpa setup Node.js.
                  </p>
                  
                  <div className="space-y-2 pt-2">
                    <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Langkah Setup di cPanel:</h5>
                    <ol className="list-decimal pl-4 text-xs text-slate-600 space-y-1.5">
                      <li>Buka cPanel Anda, buat database MySQL baru, user, dan password melalui menu <strong>MySQL Database Wizard</strong>.</li>
                      <li>Dapatkan hasil build dengan menekan tombol **Ekspor** di editor, lalu cari file <strong><code>api.php</code></strong> di folder <code>dist/</code> (hasil build) atau folder <code>public/</code>.</li>
                      <li>Unggah semua file dari folder <code>dist</code> (termasuk <code>api.php</code>) langsung ke dalam folder <strong><code>public_html</code></strong> di File Manager cPanel Anda.</li>
                      <li>Edit berkas <code>api.php</code> langsung dari File Manager cPanel, ubah kredensial di atas file ke MySQL Anda:
                        <pre className="mt-1.5 p-2 bg-slate-800 text-slate-200 rounded-lg text-[10px] font-mono whitespace-pre-wrap overflow-x-auto">
{`define('DB_NAME', 'nama_database_anda');
define('DB_USER', 'user_database_anda');
define('DB_PASS', 'sandi_database_anda');`}
                        </pre>
                      </li>
                      <li>Simpan file <code>api.php</code>. Sistem akan otomatis mendeteksi database MySQL tersebut sejak pemuatan awal halaman!</li>
                    </ol>
                  </div>
                </div>

                {/* PANEL B: Client-side Firebase */}
                <div className="border border-slate-100 bg-slate-50/40 rounded-2xl p-5 sm:p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold font-mono">PIL. B</div>
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <Settings className="w-4 h-4 text-indigo-600" />
                      Koneksi Firebase Client (Tanpa Database SQL)
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Suka Google Firebase Cloud Firestore? Anda bisa mengintegrasikannya secara client-side langsung tanpa perlu mengelola server backend atau PHP. Cukup masukkan kredensial Firebase Web App di bawah ini:
                  </p>

                  <div className="space-y-1 text-xs text-slate-500 bg-white border border-slate-100 rounded-xl p-3 leading-normal">
                    <strong>Syarat Aktivasi Firebase:</strong> Buat proyek Firestore di konsol Firebase Anda, daftarkan aplikasi web baru (Web App), lalu pastikan <strong>Aturan Keamanan (Security Rules)</strong> Firestore disetel terbuka agar client diizinkan membaca/menulis data tanpa otentikasi.
                  </div>

                  {/* Firebase configuration form nestled inside Panel B */}
                  <form onSubmit={handleSaveFirebaseConfig} className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 block">FIREBASE API KEY (apiKey):</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 bg-white focus:border-indigo-500 focus:outline-none text-[10px] font-mono"
                          placeholder="AIzaSy..."
                          value={fbApiKey}
                          onChange={(e) => setFbApiKey(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 block">PROJECT ID (projectId):</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 bg-white focus:border-indigo-500 focus:outline-none text-[10px] font-mono"
                          placeholder="mumtaz-rapor-xxxx"
                          value={fbProjectId}
                          onChange={(e) => setFbProjectId(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 block">APP ID (appId):</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 bg-white focus:border-indigo-500 focus:outline-none text-[10px] font-mono"
                          placeholder="1:xxxxx:web:xxxxxx"
                          value={fbAppId}
                          onChange={(e) => setFbAppId(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 block">AUTH DOMAIN (authDomain):</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 bg-white focus:border-indigo-500 focus:outline-none text-[10px] font-mono"
                          placeholder="xxxx.firebaseapp.com"
                          value={fbAuthDomain}
                          onChange={(e) => setFbAuthDomain(e.target.value)}
                        />
                      </div>

                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        type="submit"
                        className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        Simpan & Aktifkan Firebase Cloud
                      </button>

                      {localStorage.getItem("mumtaz_firebase_config") && (
                        <button
                          type="button"
                          onClick={handleClearFirebaseConfig}
                          className="py-2 px-4 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Hapus Kredensial Firebase (Gunakan Offline / MySQL)
                        </button>
                      )}
                    </div>
                  </form>
                </div>

              </div>

            </div>
          </motion.div>
        )}

      </div>

      {/* PRINT PREVIEW PDF DIALOG OVERLAY */}
      <AnimatePresence>
        {showPrintModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 flex flex-col h-[85vh]"
            >
              {/* Modal header */}
              <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-base">Pratinjau Cetak Laporan Kehadiran Rapor</h3>
                </div>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Printable Body Area */}
              <div className="flex-1 overflow-y-auto p-12 bg-slate-50" id="official-report-body">
                <div className="w-full max-w-3xl mx-auto bg-white border border-slate-200 shadow-md p-10 font-sans space-y-6 text-slate-900 rounded-xl">
                  
                  {/* Kop Surat Header */}
                  <div className="flex items-center gap-6 border-b-4 border-double border-slate-900 pb-5">
                    <SchoolLogo className="w-20 h-20 flex-shrink-0" />
                    <div className="text-left flex-1 space-y-1">
                      <h1 className="text-base sm:text-lg font-black uppercase tracking-wider leading-none text-slate-900">YAYASAN PENDIDIKAN ISLAM MUMTAZ INDONESIA</h1>
                      <h2 className="text-sm sm:text-base font-black text-indigo-900 uppercase tracking-tight leading-none mt-1">SEKOLAH ISLAM MUMTAZ</h2>
                      <p className="text-[10px] text-slate-500 leading-normal font-semibold">
                        Jalan K.H. Ahmad Dahlan No. 12, Enggal, Bandar Lampung. Telp: (0721) 234-567 / Website: www.sekolahislammumtaz.sch.id
                      </p>
                    </div>
                  </div>

                  {/* Document Title */}
                  <div className="text-center space-y-1 py-2">
                    <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-800">LAPORAN REKAPITULASI SESI PENGAMBILAN RAPOR SISWA</h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Tanggal Cetak: {new Date().toLocaleString("id-ID")} - Jumlah Reservasi: {bookings.length} Sesi Terdaftar
                    </p>
                  </div>

                  {/* Standard Static Table */}
                  <table className="w-full border-collapse border border-slate-400 text-xs text-left">
                    <thead>
                      <tr className="bg-slate-100 font-bold border-b border-slate-400">
                        <th className="border border-slate-400 px-3 py-2 text-center w-10">NO</th>
                        <th className="border border-slate-400 px-3 py-2">KELAS</th>
                        <th className="border border-slate-400 px-3 py-2">NAMA LENGKAP SISWA</th>
                        <th className="border border-slate-400 px-3 py-2 text-center">SESI WAKTU (WIB)</th>
                        <th className="border border-slate-400 px-3 py-2">NAMA ORANG TUA / WALI</th>
                        <th className="border border-slate-400 px-3 py-2 text-center">KEHADIRAN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.length > 0 ? (
                        bookings.map((b, index) => (
                          <tr key={b.id} className="border-b border-slate-300">
                            <td className="border border-slate-400 px-3 py-1.5 text-center font-mono">{index + 1}</td>
                            <td className="border border-slate-400 px-3 py-1.5 font-bold">{b.className}</td>
                            <td className="border border-slate-400 px-3 py-1.5 font-bold">{b.studentName}</td>
                            <td className="border border-slate-400 px-3 py-1.5 text-center font-bold text-indigo-700">Pukul {b.timeSlot} WIB</td>
                            <td className="border border-slate-400 px-3 py-1.5">{b.parentName}</td>
                            <td className="border border-slate-400 px-3 py-1.5 text-center text-[10px] text-slate-400 font-bold font-mono">[  ] HADIR</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center py-6 border border-slate-400 text-slate-400 italic">
                            Belum ada jadwal pengambilan rapor yang terdaftar di sistem.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Tanda Tangan */}
                  <div className="pt-10 flex justify-end text-xs">
                    <div className="w-48 text-center space-y-12">
                      <p>Jakarta, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                      <div className="pt-4 border-b border-slate-900 font-bold uppercase">Kepala Sekolah Islam Mumtaz</div>
                      <p className="text-[10px] text-slate-500">NIP. 198203042005011002</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Modal footer with real Print Command */}
              <div className="bg-slate-50 border-t border-slate-100 p-4 px-6 flex justify-end gap-3 flex-shrink-0">
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="py-2 px-4 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-500 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    // Visual browser printing focus
                    const origTitle = document.title;
                    document.title = `Rekap_Kehadiran_Rapor_${new Date().toISOString().slice(0, 10)}`;
                    window.print();
                    document.title = origTitle;
                  }}
                  className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1 shadow transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Cetak (Kertas / PDF)
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
