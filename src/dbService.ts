import { Student, Booking } from "./types";
import { SEED_STUDENTS } from "./data";
import { getDb } from "./firebase";
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  writeBatch 
} from "firebase/firestore";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const withTimeout = <T>(promise: Promise<T>, timeoutMs = 3500, errorMsg = "Koneksi ke server lambat"): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(errorMsg)), timeoutMs);
    })
  ]);
};

const STUDENTS_KEY = "mumtaz_rapor_students";
const BOOKINGS_KEY = "mumtaz_rapor_bookings";
const LIMITS_KEY = "mumtaz_rapor_class_limits";

let cachedStudents: Student[] = [];
let cachedBookings: Booking[] = [];
let cachedLimits: Record<string, string> = {};

// Active Connection Provider State
// "mysql"    -> Connecting to api.php (MySQL cPanel database)
// "firebase" -> Connecting to client-side Firebase Firestore
// "local"    -> Browser-only offline storage index (LocalStorage)
let activeProvider: "mysql" | "firebase" | "local" = "local";
let isMysqlConnected = false; // true if connection credentials inside api.php are active

export const dbService = {
  // Return current database provider
  getProvider(): "mysql" | "firebase" | "local" {
    return activeProvider;
  },

  // Check if active Cloud Connection is used
  isCloudConnected(): boolean {
    return activeProvider === "mysql" || activeProvider === "firebase";
  },

  // Check if MySQL setup is configured successfully
  isMysqlConfigured(): boolean {
    return activeProvider === "mysql" && isMysqlConnected;
  },

  // Initialize and load data from PHP MySQL, Firebase Firestore, or local fallback
  async initialize(): Promise<void> {
    try {
      // 1. Try to detect PHP MySQL bridge 'api.php' in the same folder first (cPanel Priority)
      const pingRes = await fetch("api.php?action=ping").catch(() => null);
      if (pingRes && (pingRes.status === 200 || pingRes.status === 500)) {
        const pingData = await pingRes.json().catch(() => null);
        if (pingData && (pingData.status === "connected" || pingData.status === "need_config")) {
          activeProvider = "mysql";
          
          if (pingData.status === "connected") {
            isMysqlConnected = true;
            // Load real data from MySQL
            const dataRes = await fetch("api.php?action=get_data");
            if (dataRes.ok) {
              const resJson = await dataRes.json();
              if (resJson.status === "success") {
                cachedStudents = resJson.students || [];
                cachedBookings = resJson.bookings || [];
                cachedLimits = resJson.classLimits || {};
                
                // Keep local fallback storage in-sync
                localStorage.setItem(STUDENTS_KEY, JSON.stringify(cachedStudents));
                localStorage.setItem(BOOKINGS_KEY, JSON.stringify(cachedBookings));
                localStorage.setItem(LIMITS_KEY, JSON.stringify(cachedLimits));

                // Auto-migration if database displays previous student list format
                const needsMigration = cachedStudents.length === 0 || 
                                       cachedStudents.some(s => s.name === "Rizky Pratama" || s.name === "Ahmad Fauzi") ||
                                       !cachedStudents.some(s => s.name === "Achmad Daffa Almirzaki");
                if (needsMigration) {
                  await this.resetDatabase();
                }
                return;
              }
            }
          } else {
            // "need_config": api.php exists but user hasn't typed real DB name/user/pwd inside api.php
            isMysqlConnected = false;
            console.warn("api.php detected, but MySQL connection is pending. Please configure DB credentials inside api.php.");
          }
        }
      }
    } catch (e) {
      console.warn("MySQL database check exception:", e);
    }

        // 2. Try to fall back to Firebase Client Firestore if config is loaded
    if (activeProvider === "local") {
      try {
        const db = getDb();
        if (db) {
          activeProvider = "firebase";
          
          // Fetch Students with 3-second timeout
          const studentsSnap = await withTimeout(
            getDocs(collection(db, "students")),
            3000,
            "Timeout saat memuat daftar siswa dari Firebase"
          ).catch(err => {
            handleFirestoreError(err, OperationType.GET, "students");
          });
          
          let loadedStudents: Student[] = [];
          if (studentsSnap) {
            studentsSnap.forEach(docSnap => {
              loadedStudents.push(docSnap.data() as Student);
            });
          }

          // Auto-seed collection if empty (smooth onboarding)
          if (loadedStudents.length === 0) {
            console.info("Firestore 'students' collection is empty. Seeding...");
            const batch = writeBatch(db);
            for (const s of SEED_STUDENTS) {
              const docRef = doc(db, "students", s.id);
              batch.set(docRef, s);
            }
            await withTimeout(
              batch.commit(),
              3000,
              "Timeout saat seeding data siswa ke Firebase"
            ).catch(err => {
              handleFirestoreError(err, OperationType.WRITE, "students/seeding");
            });
            loadedStudents = [...SEED_STUDENTS];
          }
          cachedStudents = loadedStudents;

          // Fetch Bookings with 3-second timeout
          const bookingsSnap = await withTimeout(
            getDocs(collection(db, "bookings")),
            3000,
            "Timeout saat memuat daftar jadwal dari Firebase"
          ).catch(err => {
            handleFirestoreError(err, OperationType.GET, "bookings");
          });
          const loadedBookings: Booking[] = [];
          if (bookingsSnap) {
            bookingsSnap.forEach(docSnap => {
              loadedBookings.push(docSnap.data() as Booking);
            });
          }
          cachedBookings = loadedBookings;

          // Fetch Class Limits with 3-second timeout
          const limitsSnap = await withTimeout(
            getDocs(collection(db, "classLimits")),
            3000,
            "Timeout saat memuat batasan kelas dari Firebase"
          ).catch(err => {
            handleFirestoreError(err, OperationType.GET, "classLimits");
          });
          const loadedLimits: Record<string, string> = {};
          if (limitsSnap) {
            limitsSnap.forEach(docSnap => {
              const data = docSnap.data();
              if (data.className && data.limit) {
                loadedLimits[data.className] = data.limit;
              }
            });
          }
          cachedLimits = loadedLimits;

          // Sync local storage copies
          localStorage.setItem(STUDENTS_KEY, JSON.stringify(cachedStudents));
          localStorage.setItem(BOOKINGS_KEY, JSON.stringify(cachedBookings));
          localStorage.setItem(LIMITS_KEY, JSON.stringify(cachedLimits));

          // Auto-migration if database displays previous student list format
          const needsMigration = cachedStudents.length === 0 || 
                                 cachedStudents.some(s => s.name === "Rizky Pratama" || s.name === "Ahmad Fauzi") ||
                                 !cachedStudents.some(s => s.name === "Achmad Daffa Almirzaki");
          if (needsMigration) {
            await this.resetDatabase();
          }
          return;
        }
      } catch (e) {
        console.warn("Firebase fallback loading connection error. Reverting to local fallback:", e);
        activeProvider = "local";
      }
    }

    // 3. Offline LocalStorage loading (if neither SQL nor Firebase is loaded)
    if (activeProvider === "local") {
      const localStudents = localStorage.getItem(STUDENTS_KEY);
      const localBookings = localStorage.getItem(BOOKINGS_KEY);
      const localLimits = localStorage.getItem(LIMITS_KEY);
      
      cachedStudents = localStudents ? JSON.parse(localStudents) : SEED_STUDENTS;
      cachedBookings = localBookings ? JSON.parse(localBookings) : [];
      cachedLimits = localLimits ? JSON.parse(localLimits) : {};

      // Auto-migration if database displays previous student list format
      const needsMigration = cachedStudents.length === 0 || 
                             cachedStudents.some(s => s.name === "Rizky Pratama" || s.name === "Ahmad Fauzi") ||
                             !cachedStudents.some(s => s.name === "Achmad Daffa Almirzaki");
      if (needsMigration) {
        await this.resetDatabase();
      }
    }
  },

  // Students GET / POST / DELETE
  getStudents(): Student[] {
    return cachedStudents.length > 0 ? cachedStudents : SEED_STUDENTS;
  },

  async addStudent(name: string, className: string): Promise<Student> {
    const studentId = `student-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newStudent: Student = {
      id: studentId,
      name: name.trim(),
      className
    };

    // MySQL Post
    if (activeProvider === "mysql" && isMysqlConnected) {
      try {
        const res = await fetch("api.php?action=add_student", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newStudent)
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Gagal menyimpan siswa di MySQL");
        }
        const savedStudent = await res.json();
        cachedStudents.push(savedStudent);
        localStorage.setItem(STUDENTS_KEY, JSON.stringify(cachedStudents));
        return savedStudent;
      } catch (err: any) {
        console.error("MySQL Add Student Error:", err);
        throw err;
      }
    }

    // Firebase Post with timeout
    if (activeProvider === "firebase") {
      const db = getDb();
      if (db) {
        try {
          await withTimeout(
            setDoc(doc(db, "students", studentId), newStudent),
            3000,
            "Timeout saat menyimpan siswa ke Firebase"
          );
          cachedStudents.push(newStudent);
          localStorage.setItem(STUDENTS_KEY, JSON.stringify(cachedStudents));
          return newStudent;
        } catch (err: any) {
          console.warn("Firebase Add Student failed, falling back to local:", err);
          // If Firestore write fails, save locally to keep app functional
          cachedStudents.push(newStudent);
          localStorage.setItem(STUDENTS_KEY, JSON.stringify(cachedStudents));
          return newStudent;
        }
      }
    }

    // Offline Local storage
    cachedStudents.push(newStudent);
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(cachedStudents));
    return newStudent;
  },

  async deleteStudent(id: string): Promise<void> {
    // MySQL Delete
    if (activeProvider === "mysql" && isMysqlConnected) {
      try {
        const res = await fetch(`api.php?action=delete_student&id=${id}`, {
          method: "DELETE"
        });
        if (!res.ok) {
          throw new Error("Gagal menghapus siswa di database MySQL");
        }
      } catch (err) {
        console.error("MySQL Delete Student Error:", err);
        throw err;
      }
    }

    // Firebase Delete with timeout
    if (activeProvider === "firebase") {
      const db = getDb();
      if (db) {
        try {
          await withTimeout(
            deleteDoc(doc(db, "students", id)),
            3000,
            "Timeout saat menghapus siswa dari Firebase"
          );
          
          // Cascading delete student's bookings in Firestore
          const affectedBookings = cachedBookings.filter(b => b.studentId === id);
          for (const b of affectedBookings) {
            await withTimeout(
              deleteDoc(doc(db, "bookings", b.id)),
              2000,
              `Timeout saat menghapus jadwal terkait ${b.id}`
            ).catch(err => console.warn("Cascading delete booking failed: ", err));
          }
        } catch (err) {
          console.warn("Firebase Delete Student failed or timed out: ", err);
        }
      }
    }

    cachedStudents = cachedStudents.filter(s => s.id !== id);
    cachedBookings = cachedBookings.filter(b => b.studentId !== id);
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(cachedStudents));
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(cachedBookings));
  },

  // Bookings GET / POST / DELETE
  getBookings(): Booking[] {
    return cachedBookings;
  },

  async addBooking(bookingData: Omit<Booking, "id" | "confirmed" | "bookedAt">): Promise<Booking> {
    // Quick local connection verification
    const isTaken = cachedBookings.some(
      b => b.className === bookingData.className && b.timeSlot === bookingData.timeSlot
    );
    if (isTaken) {
      throw new Error(`Jadwal ${bookingData.timeSlot} sudah diisi oleh orang tua siswa lain di kelas yang sama.`);
    }

    const hasBooked = cachedBookings.some(b => b.studentId === bookingData.studentId);
    if (hasBooked) {
      throw new Error(`Siswa ${bookingData.studentName} sudah memiliki jadwal pengambilan rapor.`);
    }

    const bookingId = `booking-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newBooking: Booking = {
      ...bookingData,
      id: bookingId,
      confirmed: true,
      bookedAt: new Date().toISOString()
    };

    // MySQL Booking Input
    if (activeProvider === "mysql" && isMysqlConnected) {
      try {
        const res = await fetch("api.php?action=add_booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bookingData)
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Gagal menyimpan pendaftaran jadwal di MySQL");
        }
        const savedBooking = await res.json();
        cachedBookings.push(savedBooking);
        localStorage.setItem(BOOKINGS_KEY, JSON.stringify(cachedBookings));
        return savedBooking;
      } catch (err: any) {
        console.error("MySQL Add Booking Error:", err);
        throw err;
      }
    }

    // Firebase Firestore Booking Input with timeout and local fallback
    if (activeProvider === "firebase") {
      const db = getDb();
      if (db) {
        try {
          await withTimeout(
            setDoc(doc(db, "bookings", bookingId), newBooking),
            3500,
            "Timeout saat menyimpan jadwal ke Firebase"
          );
          cachedBookings.push(newBooking);
          localStorage.setItem(BOOKINGS_KEY, JSON.stringify(cachedBookings));
          return newBooking;
        } catch (err: any) {
          console.warn("Firebase Firestore Booking Input failed or timed out. Falling back to local offline storage:", err);
          // High-Resilience Fallback: Save locally so user gets their confirmation/receipt!
          cachedBookings.push(newBooking);
          localStorage.setItem(BOOKINGS_KEY, JSON.stringify(cachedBookings));
          return newBooking;
        }
      }
    }

    // LocalStorage input
    cachedBookings.push(newBooking);
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(cachedBookings));
    return newBooking;
  },

  async deleteBooking(id: string): Promise<void> {
    // MySQL Delete Booking
    if (activeProvider === "mysql" && isMysqlConnected) {
      try {
        const res = await fetch(`api.php?action=delete_booking&id=${id}`, {
          method: "DELETE"
        });
        if (!res.ok) throw new Error("Gagal menghapus jadwal di database MySQL");
      } catch (err) {
        console.error("MySQL Delete Booking Error:", err);
        throw err;
      }
    }

    // Firebase Delete Booking with timeout
    if (activeProvider === "firebase") {
      const db = getDb();
      if (db) {
        try {
          await withTimeout(
            deleteDoc(doc(db, "bookings", id)),
            3000,
            "Timeout saat menghapus jadwal dari Firebase"
          );
        } catch (err) {
          console.warn("Firebase Delete Booking failed or timed out:", err);
        }
      }
    }

    cachedBookings = cachedBookings.filter(b => b.id !== id);
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(cachedBookings));
  },

  // Class limits GET / SAVE
  getClassLimits(): Record<string, string> {
    return cachedLimits;
  },

  async saveClassLimits(limits: Record<string, string>): Promise<void> {
    // MySQL Save Limits
    if (activeProvider === "mysql" && isMysqlConnected) {
      try {
        const res = await fetch("api.php?action=save_class_limits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(limits)
        });
        if (!res.ok) throw new Error("Gagal menyimpan batasan kelas di database MySQL");
      } catch (err) {
        console.error("MySQL Save Limits Error:", err);
        throw err;
      }
    }

    // Firebase Save Limits with timeout
    if (activeProvider === "firebase") {
      const db = getDb();
      if (db) {
        try {
          // Write all current limits to Firestore with timeout
          for (const [className, limit] of Object.entries(limits)) {
            await withTimeout(
              setDoc(doc(db, "classLimits", className), { className, limit }),
              2000,
              "Timeout saat menyimpan batas kelas ke Firebase"
            );
          }
          // Remove any limits deleted locally
          const currentLimitKeys = Object.keys(limits);
          const cachedLimitKeys = Object.keys(cachedLimits);
          for (const oldClass of cachedLimitKeys) {
            if (!currentLimitKeys.includes(oldClass)) {
              await withTimeout(
                deleteDoc(doc(db, "classLimits", oldClass)),
                2000,
                "Timeout saat menghapus batasan kelas di Firebase"
              );
            }
          }
        } catch (err) {
          console.warn("Firebase saveClassLimits failed or timed out: ", err);
        }
      }
    }

    cachedLimits = limits;
    localStorage.setItem(LIMITS_KEY, JSON.stringify(cachedLimits));
  },

  async resetDatabase(): Promise<void> {
    // MySQL Database Reset
    if (activeProvider === "mysql" && isMysqlConnected) {
      try {
        const res = await fetch("api.php?action=reset_database", {
          method: "POST"
        });
        if (!res.ok) throw new Error("Gagal mereset database MySQL");
        const resJson = await res.json();
        
        cachedStudents = resJson.students || SEED_STUDENTS;
        cachedBookings = [];
        cachedLimits = {};
        
        localStorage.setItem(STUDENTS_KEY, JSON.stringify(cachedStudents));
        localStorage.setItem(BOOKINGS_KEY, JSON.stringify([]));
        localStorage.setItem(LIMITS_KEY, JSON.stringify({}));
        return;
      } catch (err) {
        console.error("MySQL Database Reset Exception:", err);
        throw err;
      }
    }

    // Firebase Database Reset with timeouts
    if (activeProvider === "firebase") {
      const db = getDb();
      if (db) {
        try {
          // Delete all bookings in Firestore with timeout
          for (const b of cachedBookings) {
            await withTimeout(
              deleteDoc(doc(db, "bookings", b.id)),
              1500,
              `Timeout saat menghapus booking ${b.id}`
            ).catch(err => console.warn(err));
          }

          // Delete all students from Firestore with timeout
          const studentsSnap = await withTimeout(
            getDocs(collection(db, "students")),
            3000,
            "Timeout saat mengambil daftar siswa untuk direset"
          );
          for (const d of studentsSnap.docs) {
            await withTimeout(
              deleteDoc(doc(db, "students", d.id)),
              1500,
              `Timeout saat menghapus siswa ${d.id}`
            ).catch(err => console.warn(err));
          }

          // Seeding with default students
          const batch = writeBatch(db);
          for (const s of SEED_STUDENTS) {
            const docRef = doc(db, "students", s.id);
            batch.set(docRef, s);
          }
          await withTimeout(
            batch.commit(),
            3500,
            "Timeout saat melakukan seeding data siswa baru"
          );

          // Delete all custom classLimits
          const limitsSnap = await withTimeout(
            getDocs(collection(db, "classLimits")),
            3000,
            "Timeout saat memuat batasan kelas untuk di-reset"
          ).catch(() => null);
          if (limitsSnap) {
            for (const d of limitsSnap.docs) {
              await withTimeout(
                deleteDoc(doc(db, "classLimits", d.id)),
                1500,
                `Timeout menghapus batasan kelas ${d.id}`
              ).catch(err => console.warn(err));
            }
          }
        } catch (err) {
          console.warn("Firebase resetDatabase partially failed or timed out:", err);
        }
      }
    }

    cachedStudents = SEED_STUDENTS;
    cachedBookings = [];
    cachedLimits = {};
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(cachedStudents));
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(cachedBookings));
    localStorage.setItem(LIMITS_KEY, JSON.stringify(cachedLimits));
  }
};
