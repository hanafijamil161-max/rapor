import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import firebaseConfigPlaceholder from "../firebase-applet-config.json";

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
}

export function getFirebaseConfig(): FirebaseConfig | null {
  // 1. Try local storage first (gives maximum flexibility for hosting on static servers like cPanel)
  try {
    const local = localStorage.getItem("mumtaz_firebase_config");
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed.apiKey && parsed.apiKey !== "YOUR_FIREBASE_API_KEY" && parsed.projectId) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to parse local firebase config:", e);
  }

  // 2. Try import.meta.env variables safely
  const metaEnv = (import.meta as any).env || {};
  const envConfig: Partial<FirebaseConfig> = {
    apiKey: metaEnv.VITE_FIREBASE_API_KEY,
    authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: metaEnv.VITE_FIREBASE_PROJECT_ID,
    storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: metaEnv.VITE_FIREBASE_APP_ID,
    firestoreDatabaseId: metaEnv.VITE_FIREBASE_DATABASE_ID || "(default)",
  };

  if (envConfig.apiKey && envConfig.apiKey !== "" && envConfig.projectId) {
    return envConfig as FirebaseConfig;
  }

  // 3. Try json configuration (fallback if deployed matching system blueprint)
  if (
    firebaseConfigPlaceholder &&
    firebaseConfigPlaceholder.apiKey &&
    firebaseConfigPlaceholder.apiKey !== "YOUR_FIREBASE_API_KEY"
  ) {
    return firebaseConfigPlaceholder as FirebaseConfig;
  }

  return null;
}

let firebaseApp: any = null;
let firestoreDb: any = null;

export function initializeFirebase() {
  const config = getFirebaseConfig();
  if (!config) {
    console.info("Firestore client-side configuration is not set. Offline fallback mode.");
    return { app: null, db: null };
  }

  try {
    if (getApps().length === 0) {
      firebaseApp = initializeApp(config);
    } else {
      firebaseApp = getApp();
    }
    firestoreDb = getFirestore(firebaseApp, config.firestoreDatabaseId || "(default)");
    return { app: firebaseApp, db: firestoreDb };
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    return { app: null, db: null };
  }
}

export function getDb() {
  if (!firestoreDb) {
    const { db } = initializeFirebase();
    return db;
  }
  return firestoreDb;
}
