import { t } from '../i18n'

// Keterangan warna titik di peta publik, pakai bahasa awam.
// Ambangnya ngikutin warnaKeparahan() di statusTitik.jsx
const tingkat = [
  { warna: '#dc2626', kunci: 'warna.parah' },
  { warna: '#f97316', kunci: 'warna.sedang' },
  { warna: '#eab308', kunci: 'warna.ringan' },
]

function KeteranganWarna() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
      <span className="text-slate-300 font-medium">{t('warna.judul')}</span>
      {tingkat.map((w) => (
        <span key={w.kunci} className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: w.warna }} />
          {t(w.kunci)}
        </span>
      ))}
      <span>{t('warna.ket')}</span>
    </div>
  )
}

export default KeteranganWarna
