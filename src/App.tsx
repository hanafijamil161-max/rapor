/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar, 
  ShieldCheck, 
  Clock, 
  CheckCircle, 
  Info, 
  XCircle,
  GraduationCap,
  ExternalLink,
  Users
} from "lucide-react";
import { Student, Booking } from "./types";
import { dbService } from "./dbService";
import BookingForm from "./components/BookingForm";
import AdminDashboard from "./components/AdminDashboard";
import Notification, { Toast } from "./components/Notification";
import { SchoolLogo } from "./components/SchoolLogo";

export default function App() {
  const [activePortal, setActivePortal] = useState<"parent" | "admin">("parent");
  
  // Database reactive states
  const [students, setStudents] = useState<Student[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [refreshCount, setRefreshCount] = useState(0);

  // Toast notifications state
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Initialize and reload data
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      await dbService.initialize();
      if (isMounted) {
        setStudents(dbService.getStudents());
        setBookings(dbService.getBookings());
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [refreshCount]);

  const triggerDataReload = () => {
    setRefreshCount(prev => prev + 1);
  };

  const addToast = (message: string, type: "success" | "error" | "info") => {
    const id = `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Keep checking for custom URL or hash parameters if needed (optional)
  useEffect(() => {
    if (window.location.hash === "#admin") {
      setActivePortal("admin");
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      
      {/* Dynamic Header App Bar */}
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
          
          {/* Logo & Brand title */}
          <div className="flex items-center gap-3">
            <SchoolLogo className="w-14 h-14" />
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none uppercase">Sekolah Islam Mumtaz</h1>
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 tracking-widest uppercase block mt-1">SI-RAPOR SEKOLAH</span>
            </div>
          </div>

          {/* Navigation Action */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActivePortal(prev => prev === "parent" ? "admin" : "parent");
              }}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm border cursor-pointer ${
                activePortal === "admin"
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100/50"
                  : "bg-slate-900 border-slate-900 text-white hover:bg-slate-800"
              }`}
            >
              {activePortal === "parent" ? (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Portal Admin
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  Halaman Wali Murid
                </>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* Main Body Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 self-center">
        <AnimatePresence mode="wait">
          
          {/* PORTAL WALI MURID (PARENT BOOKING FLOW) */}
          {activePortal === "parent" && (
            <motion.div
              key="parent_portal"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
            >
              {/* Central Booking Form */}
              <div className="no-print">
                <BookingForm
                  students={students}
                  bookings={bookings}
                  onBookingAdded={triggerDataReload}
                  addToast={addToast}
                />
              </div>
            </motion.div>
          )}

          {/* PORTAL ADMIN (ADMIN DASHBOARD MANAGEMENT) */}
          {activePortal === "admin" && (
            <motion.div
              key="admin_portal"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
            >
              <AdminDashboard
                students={students}
                bookings={bookings}
                onDataChanged={triggerDataReload}
                addToast={addToast}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Global Interactive Print Render Support (For A4 physical printing layout) */}
      <div id="print-area" className="hidden print:block absolute inset-0 bg-white" />

      {/* Beautiful humble Footer branding */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 font-medium tracking-wide no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>©2026 Sekolah Islam Mumtaz.</p>
          <div className="flex gap-4 items-center">
            <span className="flex items-center gap-1">
              Sekolah Islam Mumtaz • Sistem Pengambilan Rapor Siswa v1.2
            </span>
          </div>
        </div>
      </footer>

      {/* Floating Notifications Toaster */}
      <Notification toasts={toasts} onClose={removeToast} />

    </div>
  );
}
