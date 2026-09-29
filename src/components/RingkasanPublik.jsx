import { useEffect, useState } from 'react'
import { waktuRelatif } from '../data/statusTitik'
import { t } from '../i18n'

// Versi ringkas KartuRingkasan buat halaman depan: cuma 3 angka yang
// relevan buat warga, plus info kapan laporan terakhir masuk
function RingkasanPublik({ titikData, siap }) {
  // Dipakai buat nge-refresh tulisan "x menit lalu" tiap 30 detik
  const [sekarang, setSekarang] = useState(() => Date.now())
  useEffect(() => {
    const interval = setInterval(() => setSekarang(Date.now()), 30000)
    return () => clearInterval(interval)
  }, [])

  const berlangsung = titikData.filter((x) => !x.status_penanganan || x.status_penanganan === 'belum_ditangani')
  const ditangani = titikData.filter((x) => x.status_penanganan === 'sedang_ditangani')
  const selesai = titikData.filter((x) => x.status_penanganan === 'selesai_ditangani')
  // titikData udah diurutin dari yang terbaru (lihat useTitikAnomali)
  const laporanTerbaru = titikData[0]

  const kartu = [
    { kunci: 'stat.belum', nilai: berlangsung.length, ikon: '🔴', warna: 'text-red-300' },
    { kunci: 'stat.ditangani', nilai: ditangani.length, ikon: '🚑', warna: 'text-blue-300' },
    { kunci: 'stat.selesai', nilai: selesai.length, ikon: '✅', warna: 'text-green-300' },
  ]

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-3">
        {kartu.map((k) => (
          <div key={k.kunci} className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-3">
            <p className="text-xs text-slate-400">{k.ikon} {t(k.kunci)}</p>
            <p className={`text-2xl font-bold mt-1 tabular-nums ${k.warna}`}>{siap ? k.nilai : '–'}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 flex items-center gap-2">
        <span className={`inline-block w-2 h-2 rounded-full ${siap ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
        {!siap
          ? t('ringkas.menghubungkan')
          : laporanTerbaru
            ? t('ringkas.terbaru', { waktu: waktuRelatif(laporanTerbaru.waktu, sekarang) })
            : t('ringkas.kosong')}
      </p>
    </div>
  )
}

export default RingkasanPublik
