import { t, localeAktif } from '../i18n'

// Label & warna yang dipakai berulang di dashboard, dikumpulin di sini biar konsisten.
// Teksnya diambil dari kamus (i18n/kamus.js) biar ikut bahasa yang dipilih.

export function infoSumber(titik) {
  if (titik.sumber_deteksi === 'laporan_whatsapp') return t('sumber.whatsapp')
  if (titik.sumber_deteksi === 'validasi_relawan') return t('sumber.relawan')
  if (titik.sumber_deteksi === 'laporan_warga_langsung') return t('sumber.warga')
  return t('sumber.simulasi')
}

export function infoValidasi(status) {
  if (status === 'tervalidasi') return { teks: t('validasi.tervalidasi'), kelas: 'bg-green-500/15 text-green-300 border-green-500/30' }
  if (status === 'laporan_langsung') return { teks: t('validasi.perlu'), kelas: 'bg-amber-500/15 text-amber-300 border-amber-500/30' }
  if (status === 'duplikat') return { teks: t('validasi.duplikat'), kelas: 'bg-slate-500/15 text-slate-400 border-slate-500/30' }
  if (status === 'ditolak') return { teks: t('validasi.ditolak'), kelas: 'bg-rose-500/15 text-rose-300 border-rose-500/30' }
  return { teks: t('validasi.anomali'), kelas: 'bg-slate-500/15 text-slate-300 border-slate-500/30' }
}

// Laporan warga & anomali sinyal sama-sama belum dicek relawan
export function perluVerifikasi(titik) {
  return titik.status === 'laporan_langsung' || titik.status === 'belum_divalidasi'
}

// Laporan duplikat / tidak valid gak ditampilkan di peta & gak ikut dihitung,
// tapi datanya tetap disimpan (bisa dilihat relawan di filter "Arsip")
export function titikTersembunyi(titik) {
  return titik.status === 'duplikat' || titik.status === 'ditolak'
}

export function infoPenanganan(status) {
  if (status === 'selesai_ditangani') return { teks: t('penanganan.selesai'), ikon: '✅', kelas: 'bg-green-500/15 text-green-300 border-green-500/30' }
  if (status === 'sedang_ditangani') return { teks: t('penanganan.sedang'), ikon: '🚑', kelas: 'bg-blue-500/15 text-blue-300 border-blue-500/30' }
  return { teks: t('penanganan.belum'), ikon: '⏳', kelas: 'bg-red-500/15 text-red-300 border-red-500/30' }
}

// Cara titik lokasi laporan ditentukan (field cara_lokasi: 'gps' | 'desa' | 'peta', lihat PilihLokasi.jsx)
export function labelCaraLokasi(cara) {
  return ['gps', 'desa', 'peta'].includes(cara) ? t(`cara.${cara}`) : cara
}

// Buat panel detail relawan: seberapa bisa dipercaya titik di peta
export function infoCaraLokasi(titik) {
  if (titik.cara_lokasi) return labelCaraLokasi(titik.cara_lokasi)
  if (titik.lokasi_presisi_gps) return t('cara.gpsLama')   // laporan lama, sebelum ada cara_lokasi
  if (titik.jenis_lokasi === 'pulau') return t('cara.pulau')
  return t('cara.kecamatan')
}

export function warnaKeparahan(persen) {
  if (persen >= 85) return '#dc2626'
  if (persen >= 70) return '#f97316'
  return '#eab308'
}

export function formatWaktu(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString(localeAktif(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// "5 menit lalu" / "5 min ago" — lebih cepat dipahami warga daripada jam lengkap
export function waktuRelatif(iso, sekarang = Date.now()) {
  if (!iso) return '-'
  const menit = Math.floor((sekarang - new Date(iso).getTime()) / 60000)
  if (menit < 1) return t('waktu.baruSaja')
  if (menit < 60) return t('waktu.menit', { n: menit })
  const jam = Math.floor(menit / 60)
  if (jam < 24) return t('waktu.jam', { n: jam })
  return formatWaktu(iso)
}

// Angka sesuai format bahasa (1.234 / 1,234)
export function formatAngka(n) {
  return Number(n).toLocaleString(localeAktif())
}

// Wilayah: "Desa X, Kec. Y" / "X, Y District"
export function labelDesaKec(desa, kec) {
  return t('wilayah.desaKec', { desa, kec })
}

export function Badge({ info }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${info.kelas}`}>
      {info.ikon && <span>{info.ikon}</span>}
      {info.teks}
    </span>
  )
}
