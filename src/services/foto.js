import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase'

// Batas yang sama juga dicek di storage.rules — di sini cuma biar pelapor
// dapet pesan yang jelas sebelum upload, bukan error dari server
export const UKURAN_MAKS_FOTO = 5 * 1024 * 1024   // 5 MB

// Balikin kunci kamus pesan error (diterjemahin waktu ditampilkan), atau null kalau aman
export function cekFoto(file) {
  if (!file.type.startsWith('image/')) return 'foto.bukanGambar'
  if (file.size > UKURAN_MAKS_FOTO) return 'foto.terlaluBesar'
  return null
}

// Upload foto & balikin LOKASI file-nya di Storage (bukan link publik).
// Lokasi ini yang disimpan di Firestore. Link buat nampilin fotonya baru dibuat
// pas relawan buka, dan storage.rules nolak kalau yang minta bukan relawan.
export async function unggahFoto(file) {
  const ekstensi = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
  const path = `laporan-foto/${Date.now()}_${crypto.randomUUID()}.${ekstensi}`
  await uploadBytes(ref(storage, path), file, { contentType: file.type })
  return path
}

export function adaFoto(titik) {
  return !!titik.foto_path
}

// Link foto disimpan sementara di memori biar gak minta ulang ke server
// tiap kali komponen yang sama muncul lagi (misal buka-tutup galeri)
const cacheUrl = new Map()

export function ambilUrlFoto(titik) {
  if (!titik.foto_path) return Promise.resolve(null)
  if (!cacheUrl.has(titik.foto_path)) {
    const janji = getDownloadURL(ref(storage, titik.foto_path)).catch((err) => {
      cacheUrl.delete(titik.foto_path)   // kalau gagal, boleh dicoba lagi nanti
      throw err
    })
    cacheUrl.set(titik.foto_path, janji)
  }
  return cacheUrl.get(titik.foto_path)
}
