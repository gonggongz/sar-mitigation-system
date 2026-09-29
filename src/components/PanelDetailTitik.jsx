import { useState } from 'react'
import { ikonBencana, labelBencana } from '../data/jenisBencana'
import { infoSumber, infoValidasi, infoPenanganan, infoCaraLokasi, formatWaktu, formatAngka, labelDesaKec, warnaKeparahan, Badge } from '../data/statusTitik'
import PanelCuaca from './PanelCuaca'
import RekomendasiAI from './RekomendasiAI'
import PanelPenanganan from './PanelPenanganan'
import PanelVerifikasi from './PanelVerifikasi'
import FotoLightbox from './FotoLightbox'
import { adaFoto } from '../services/foto'
import { useFotoUrl } from '../hooks/useFotoUrl'
import { t } from '../i18n'

const tabList = [
  { id: 'ringkasan', kunci: 'detail.tabRingkasan' },
  { id: 'cuaca', kunci: 'detail.tabCuaca' },
  { id: 'ai', kunci: 'detail.tabAi' },
  { id: 'penanganan', kunci: 'detail.tabPenanganan' },
]

function Baris({ label, children }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 border-b border-slate-700/60 last:border-0">
      <span className="text-slate-400 shrink-0">{label}</span>
      <span className="text-white text-right">{children}</span>
    </div>
  )
}

// Dipasang dengan key = id titik (lihat App.jsx), jadi tiap ganti titik
// semua isi panel (cuaca, AI, form penanganan) mulai dari awal lagi
function PanelDetailTitik({ titik, titikData, onPilihTitik, onTutup }) {
  const [tab, setTab] = useState('ringkasan')
  const [dataCuaca, setDataCuaca] = useState(null)
  const [fotoBesar, setFotoBesar] = useState(false)
  const foto = useFotoUrl(titik)

  const keterangan = `${ikonBencana(titik.jenis_bencana)} ${labelBencana(titik.jenis_bencana)} — ${titik.kecamatan}`

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl flex flex-col min-h-0 h-full">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-white font-semibold truncate">{keterangan}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{formatWaktu(titik.waktu)} · {infoSumber(titik)}</p>
          </div>
          <button onClick={onTutup} className="text-slate-400 hover:text-white text-lg leading-none px-1" aria-label={t('detail.tutup')}>✕</button>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          <Badge info={infoPenanganan(titik.status_penanganan)} />
          <Badge info={infoValidasi(titik.status)} />
        </div>

        <div className="flex gap-1 mt-3 bg-slate-900/60 p-1 rounded-lg">
          {tabList.map((tb) => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition ${tab === tb.id ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              {t(tb.kunci)}
            </button>
          ))}
        </div>
      </div>

      {/* Semua tab tetap terpasang (cuma disembunyikan) biar data cuaca & AI
          langsung diambil begitu titik dipilih, tanpa nunggu tabnya dibuka */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        <div hidden={tab !== 'ringkasan'} className="text-sm flex flex-col gap-4">
          <PanelVerifikasi titik={titik} titikData={titikData} onPilihTitik={onPilihTitik} />

          {foto.url ? (
            <button onClick={() => setFotoBesar(true)} className="block group relative">
              <img src={foto.url} alt={t('detail.fotoAlt', { lokasi: titik.kecamatan })} className="w-full h-48 object-cover rounded-lg" />
              <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-80 group-hover:opacity-100">{t('detail.perbesar')}</span>
            </button>
          ) : adaFoto(titik) ? (
            <div className="h-48 rounded-lg bg-slate-900/60 flex items-center justify-center text-xs text-slate-400">
              {foto.error ? `⚠️ ${t(foto.error)}` : t('detail.memuatFoto')}
            </div>
          ) : (
            <div className="h-20 rounded-lg border border-dashed border-slate-600 flex items-center justify-center text-xs text-slate-500">
              {t('detail.tanpaFoto')}
            </div>
          )}

          <div>
            <Baris label={t('detail.keparahan')}>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: warnaKeparahan(titik.persentase_hp_mati) }} />
                {titik.persentase_hp_mati}%
              </span>
            </Baris>
            <Baris label={t('detail.jiwa')}>{titik.jumlah_jiwa_terdampak ? t('detail.jiwaNilai', { n: formatAngka(titik.jumlah_jiwa_terdampak) }) : '-'}</Baris>
            {titik.desa && <Baris label={t('detail.desa')}>{labelDesaKec(titik.desa, titik.kecamatan)}</Baris>}
            <Baris label={t('detail.titik')}>
              {infoCaraLokasi(titik)}
              {titik.akurasi_lokasi_m != null && ` (±${titik.akurasi_lokasi_m} m)`}
            </Baris>
            <Baris label={t('detail.koordinat')}>{titik.lat?.toFixed(4)}, {titik.lng?.toFixed(4)}</Baris>
            {titik.jumlah_tim_diturunkan != null && <Baris label={t('detail.tim')}>{t('detail.timNilai', { n: titik.jumlah_tim_diturunkan })}</Baris>}
            {titik.korban_selamat != null && <Baris label={t('detail.selamat')}>{titik.korban_selamat}</Baris>}
            {titik.korban_meninggal != null && <Baris label={t('detail.meninggal')}>{titik.korban_meninggal}</Baris>}
            {titik.logistik_diberikan && <Baris label={t('detail.logistik')}>{titik.logistik_diberikan}</Baris>}
            {titik.waktu_update_penanganan && <Baris label={t('detail.update')}>{formatWaktu(titik.waktu_update_penanganan)}</Baris>}
          </div>

          {titik.catatan && (
            <div>
              <p className="text-slate-400 mb-1">{t('detail.catatan')}</p>
              <p className="text-white bg-slate-900/50 rounded-lg p-3 whitespace-pre-line">{titik.catatan}</p>
            </div>
          )}
        </div>

        <div hidden={tab !== 'cuaca'}>
          <PanelCuaca titik={titik} onDataDidapat={setDataCuaca} />
        </div>

        <div hidden={tab !== 'ai'}>
          <RekomendasiAI titik={titik} dataCuaca={dataCuaca} />
        </div>

        <div hidden={tab !== 'penanganan'}>
          <PanelPenanganan titik={titik} />
        </div>
      </div>

      {fotoBesar && foto.url && <FotoLightbox url={foto.url} keterangan={keterangan} onTutup={() => setFotoBesar(false)} />}
    </div>
  )
}

export default PanelDetailTitik
