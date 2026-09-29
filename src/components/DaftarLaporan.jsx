import { useState } from 'react'
import { ikonBencana, labelBencana } from '../data/jenisBencana'
import { infoSumber, infoPenanganan, infoValidasi, perluVerifikasi, titikTersembunyi, formatWaktu, Badge } from '../data/statusTitik'
import { adaFoto } from '../services/foto'
import { t } from '../i18n'

const filterList = ['aktif', 'belum', 'ditangani', 'verifikasi', 'semua', 'arsip']

function cocokFilter(titik, filter) {
  // Duplikat / tidak valid cuma muncul di filter "Arsip"
  if (filter === 'arsip') return titikTersembunyi(titik)
  if (titikTersembunyi(titik)) return false
  const p = titik.status_penanganan || 'belum_ditangani'
  if (filter === 'aktif') return p !== 'selesai_ditangani'
  if (filter === 'belum') return p === 'belum_ditangani'
  if (filter === 'ditangani') return p === 'sedang_ditangani'
  if (filter === 'verifikasi') return perluVerifikasi(titik) && p !== 'selesai_ditangani'
  return true
}

function DaftarLaporan({ titikData, idTerpilih, onPilihTitik }) {
  const [filter, setFilter] = useState('aktif')
  const [cari, setCari] = useState('')

  const kataCari = cari.trim().toLowerCase()
  const daftar = titikData.filter((x) =>
    cocokFilter(x, filter) &&
    (!kataCari || x.kecamatan?.toLowerCase().includes(kataCari) || x.desa?.toLowerCase().includes(kataCari) || labelBencana(x.jenis_bencana).toLowerCase().includes(kataCari))
  )

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl flex flex-col min-h-0 h-full">
      <div className="p-3 border-b border-slate-700 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm">{t('daftar.judul')}</h2>
          <span className="text-xs text-slate-400">{t('daftar.jumlah', { n: daftar.length })}</span>
        </div>
        <input
          type="search"
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder={t('daftar.cari')}
          className="w-full bg-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-slate-400"
        />
        <div className="flex flex-wrap gap-1">
          {filterList.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-2.5 py-1 rounded-full transition ${filter === f ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            >
              {t(`filter.${f}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5 min-h-0">
        {daftar.length === 0 && <p className="text-sm text-slate-400 text-center py-6">{t('daftar.kosong')}</p>}
        {daftar.map((titik) => {
          const terpilih = titik.id === idTerpilih
          return (
            <button
              key={titik.id}
              onClick={() => onPilihTitik(titik.id)}
              className={`text-left rounded-lg p-2.5 transition border ${terpilih ? 'bg-slate-700 border-blue-500' : 'bg-slate-900/40 border-transparent hover:bg-slate-700'}`}
            >
              <div className="flex items-start gap-2.5">
                <span className="text-xl leading-none mt-0.5">{ikonBencana(titik.jenis_bencana)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-white text-sm font-semibold truncate">{titik.desa ? `${titik.desa}, ${titik.kecamatan}` : titik.kecamatan}</p>
                    <span className="text-[11px] text-slate-400 shrink-0">{formatWaktu(titik.waktu)}</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    {labelBencana(titik.jenis_bencana)} · {infoSumber(titik)}
                    {adaFoto(titik) && ' · 📷'}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    <Badge info={infoPenanganan(titik.status_penanganan)} />
                    {titik.status !== 'tervalidasi' && <Badge info={infoValidasi(titik.status)} />}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default DaftarLaporan
