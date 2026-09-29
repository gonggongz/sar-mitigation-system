import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const auth = getAuth(app);

// Aktifin "penyimpanan sementara di browser" buat Firestore.
// Kalau sinyal internet putus sebentar pas relawan lagi isi form,
// data yang mereka kirim gak langsung gagal — Firestore nyimpennya
// dulu di penyimpanan lokal browser, terus otomatis dikirim beneran
// begitu internetnya nyambung lagi.
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Ini muncul kalau user buka aplikasi di lebih dari 1 tab browser
    // bersamaan — fitur ini cuma bisa aktif di 1 tab. Gak masalah,
    // aplikasi tetap jalan normal, cuma fitur offline-nya nonaktif.
    console.warn('Offline persistence cuma bisa aktif di 1 tab.')
  } else if (err.code === 'unimplemented') {
    // Browser lama yang gak dukung fitur ini — juga gak masalah,
    // aplikasi tetap jalan normal seperti biasa
    console.warn('Browser ini tidak mendukung offline persistence.')
  }
});