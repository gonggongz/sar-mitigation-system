import { perluVerifikasi, formatAngka } from '../data/statusTitik'
import { t } from '../i18n'

// Angka-angka ringkas di atas dashboard biar relawan langsung tau kondisi umum
function KartuRingkasan({ titikData }) {
  const berlangsung = titikData.filter((x) => !x.status_penanganan || x.status_penanganan === 'belum_ditangani')
  const ditangani = titikData.filter((x) => x.status_penanganan === 'sedang_ditangani')
  const selesai = titikData.filter((x) => x.status_penanganan === 'selesai_ditangani')
  const belumDiverifikasi = titikData.filter((x) => perluVerifikasi(x) && x.status_penanganan !== 'selesai_ditangani')
  const jiwaTerdampak = [...berlangsung, ...ditangani].reduce((total, x) => total + (x.jumlah_jiwa_terdampak || 0), 0)

  const kartu = [
    { kunci: 'stat.belum', nilai: berlangsung.length, ikon: '🔴', warna: 'text-red-300' },
    { kunci: 'stat.ditangani', nilai: ditangani.length, ikon: '🚑', warna: 'text-blue-300' },
    { kunci: 'stat.selesai', nilai: selesai.length, ikon: '✅', warna: 'text-green-300' },
    { kunci: 'stat.verifikasi', nilai: belumDiverifikasi.length, ikon: '⚠️', warna: 'text-amber-300' },
    { kunci: 'stat.jiwa', nilai: formatAngka(jiwaTerdampak), ikon: '👥', warna: 'text-white' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {kartu.map((k) => (
        <div key={k.kunci} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
          <p className="text-xs text-slate-400">{k.ikon} {t(k.kunci)}</p>
          <p className={`text-2xl font-bold mt-1 tabular-nums ${k.warna}`}>{k.nilai}</p>
        </div>
      ))}
    </div>
  )
}

export default KartuRingkasan
