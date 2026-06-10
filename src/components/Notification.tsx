/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, AlertCircle, X } from "lucide-react";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface NotificationProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export default function Notification({ toasts, onClose }: NotificationProps) {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onClose }: { key?: string; toast: Toast; onClose: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md ${
        toast.type === "success"
          ? "bg-emerald-50/95 border-emerald-200 text-emerald-900"
          : toast.type === "error"
          ? "bg-rose-50/95 border-rose-200 text-rose-900"
          : "bg-amber-50/95 border-amber-200 text-amber-900"
      }`}
    >
      <div className="mt-0.5">
        {toast.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-600" />}
        {toast.type === "error" && <AlertCircle className="w-5 h-5 text-rose-600" />}
        {toast.type === "info" && <AlertCircle className="w-5 h-5 text-amber-600" />}
      </div>
      <div className="flex-1 text-sm font-medium">{toast.message}</div>
      <button
        onClick={() => onClose(toast.id)}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
