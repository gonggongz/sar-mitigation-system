import { useState } from 'react'
import { jenisBencanaList, ikonBencana, labelBencana } from '../data/jenisBencana'
import { infoPenanganan, infoSumber, formatWaktu, Badge } from '../data/statusTitik'
import { adaFoto } from '../services/foto'
import { useFotoUrl } from '../hooks/useFotoUrl'
import FotoLightbox from './FotoLightbox'
import { t } from '../i18n'

// Satu kartu foto. Link fotonya diambil sendiri-sendiri per kartu,
// karena link cuma bisa dibuat kalau yang minta relawan terdaftar.
function KartuFoto({ titik, onBuka }) {
  const foto = useFotoUrl(titik)

  return (
    <button
      onClick={() => foto.url && onBuka(titik, foto.url)}
      disabled={!foto.url}
      className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden text-left hover:border-blue-500 transition group disabled:hover:border-slate-700"
    >
      <div className="aspect-[4/3] bg-slate-900 overflow-hidden flex items-center justify-center">
        {foto.url ? (
          <img src={foto.url} alt={t('galeri.fotoAlt', { lokasi: titik.kecamatan })} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
        ) : (
          <span className="text-xs text-slate-500">{foto.error ? `⚠️ ${t(foto.error)}` : t('umum.memuat')}</span>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-white text-sm font-semibold truncate">{ikonBencana(titik.jenis_bencana)} {titik.kecamatan}</p>
        <p className="text-[11px] text-slate-400 truncate">{labelBencana(titik.jenis_bencana)} · {formatWaktu(titik.waktu)}</p>
        <div className="mt-1.5"><Badge info={infoPenanganan(titik.status_penanganan)} /></div>
      </div>
    </button>
  )
}

// Kumpulan semua foto laporan buat bahan evaluasi bencana (khusus relawan).
// onLihatDiDashboard = pindah ke tab dashboard & buka detail titik foto itu.
function GaleriFoto({ titikData, onLihatDiDashboard }) {
  const [filterJenis, setFilterJenis] = useState('semua')
  const [filterKecamatan, setFilterKecamatan] = useState('semua')
  const [fotoAktif, setFotoAktif] = useState(null)   // { titik, url }

  const titikBerfoto = titikData.filter(adaFoto)
  const daftarKecamatan = [...new Set(titikBerfoto.map((x) => x.kecamatan))].sort()
  const daftar = titikBerfoto.filter((x) =>
    (filterJenis === 'semua' || x.jenis_bencana === filterJenis) &&
    (filterKecamatan === 'semua' || x.kecamatan === filterKecamatan)
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1">
          <h2 className="text-white font-semibold">{t('galeri.judul')}</h2>
          <p className="text-xs text-slate-400">{t('galeri.jumlah', { n: daftar.length, total: titikBerfoto.length })}</p>
        </div>
        <div className="flex gap-2">
          <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)} className="bg-slate-700 text-white text-sm rounded-lg p-2">
            <option value="semua">{t('galeri.semuaJenis')}</option>
            {jenisBencanaList.map((j) => <option key={j.id} value={j.id}>{j.ikon} {labelBencana(j.id)}</option>)}
          </select>
          <select value={filterKecamatan} onChange={(e) => setFilterKecamatan(e.target.value)} className="bg-slate-700 text-white text-sm rounded-lg p-2">
            <option value="semua">{t('galeri.semuaKec')}</option>
            {daftarKecamatan.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      {daftar.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-10 text-center text-slate-400 text-sm">
          {titikBerfoto.length === 0 ? t('galeri.kosongTotal') : t('galeri.kosongFilter')}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          {daftar.map((titik) => (
            <KartuFoto key={titik.id} titik={titik} onBuka={(x, url) => setFotoAktif({ titik: x, url })} />
          ))}
        </div>
      )}

      {fotoAktif && (
        <FotoLightbox
          url={fotoAktif.url}
          keterangan={`${ikonBencana(fotoAktif.titik.jenis_bencana)} ${labelBencana(fotoAktif.titik.jenis_bencana)} — ${fotoAktif.titik.kecamatan} · ${formatWaktu(fotoAktif.titik.waktu)} · ${infoSumber(fotoAktif.titik)}`}
          onTutup={() => setFotoAktif(null)}
        >
          <button
            onClick={() => { onLihatDiDashboard(fotoAktif.titik.id); setFotoAktif(null) }}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg"
          >
            {t('galeri.bukaDetail')}
          </button>
          {fotoAktif.titik.catatan && <p className="w-full text-center text-sm text-slate-300">“{fotoAktif.titik.catatan}”</p>}
        </FotoLightbox>
      )}
    </div>
  )
}

export default GaleriFoto
