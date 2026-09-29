import { useEffect, useState } from 'react'
import { ambilUrlFoto } from '../services/foto'

// Ambil link foto sebuah titik (cuma berhasil kalau yang login relawan terdaftar).
// Hasil: { url, error, memuat }
export function useFotoUrl(titik) {
  const kunci = titik?.foto_path || null
  const [hasil, setHasil] = useState({ kunci: null, url: null, error: null })

  useEffect(() => {
    if (!kunci) return
    let batal = false
    ambilUrlFoto(titik)
      .then((url) => { if (!batal) setHasil({ kunci, url, error: null }) })
      // error berisi kunci kamus, diterjemahin waktu ditampilkan (biar ikut ganti bahasa)
      .catch(() => { if (!batal) setHasil({ kunci, url: null, error: 'foto.gagalMuat' }) })
    return () => { batal = true }
  }, [kunci])   // eslint-disable-line react-hooks/exhaustive-deps

  // Kalau hasil yang tersimpan masih punya titik sebelumnya, anggap lagi memuat
  if (!kunci) return { url: null, error: null, memuat: false }
  if (hasil.kunci !== kunci) return { url: null, error: null, memuat: true }
  return { url: hasil.url, error: hasil.error, memuat: false }
}
