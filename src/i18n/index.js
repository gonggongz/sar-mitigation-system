import { useSyncExternalStore } from 'react'
import { kamus } from './kamus'

// Sistem bahasa sederhana (ID/EN) tanpa library.
// - t('kunci', { n: 3 }) → teks sesuai bahasa aktif, {n} diganti nilainya
// - Komponen gak perlu nerima bahasa lewat props: App.jsx manggil useBahasa(),
//   jadi begitu bahasa diganti, seluruh tampilan ikut dirender ulang.

const KUNCI_SIMPAN = 'sar-mitigasi-bahasa'
export const daftarBahasa = ['id', 'en']

function bahasaAwal() {
  try {
    const tersimpan = localStorage.getItem(KUNCI_SIMPAN)
    if (daftarBahasa.includes(tersimpan)) return tersimpan
  } catch {
    // localStorage bisa diblokir (mode privat, dll) — pakai bahasa browser aja
  }
  // Kunjungan pertama: ikut bahasa browser. Selain Indonesia → Inggris.
  return (navigator.language || 'id').toLowerCase().startsWith('id') ? 'id' : 'en'
}

let bahasa = bahasaAwal()
const pendengar = new Set()
document.documentElement.lang = bahasa

export function gantiBahasa(baru) {
  if (!daftarBahasa.includes(baru) || baru === bahasa) return
  bahasa = baru
  document.documentElement.lang = baru
  try {
    localStorage.setItem(KUNCI_SIMPAN, baru)
  } catch {
    // gak masalah kalau gak kesimpan, cuma berlaku sampai halaman ditutup
  }
  pendengar.forEach((f) => f())
}

function langganan(f) {
  pendengar.add(f)
  return () => pendengar.delete(f)
}

export function useBahasa() {
  return useSyncExternalStore(langganan, () => bahasa)
}

export function bahasaAktif() {
  return bahasa
}

// Locale buat format tanggal & angka
export function localeAktif() {
  return bahasa === 'en' ? 'en-GB' : 'id-ID'
}

export function t(kunci, nilai) {
  let teks = kamus[bahasa]?.[kunci] ?? kamus.id[kunci] ?? kunci
  if (nilai) teks = teks.replace(/\{(\w+)\}/g, (_, k) => (nilai[k] ?? ''))
  return teks
}
