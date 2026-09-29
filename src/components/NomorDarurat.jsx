import { nomorDaruratList } from '../data/nomorDarurat'
import { t } from '../i18n'

// Link "tel:" bikin HP langsung buka aplikasi telepon waktu diklik
function NomorDarurat() {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-white">{t('darurat.judul')}</h2>
      <div className="grid grid-cols-2 gap-2">
        {nomorDaruratList.map((n) => (
          <a
            key={n.nomor}
            href={`tel:${n.nomor}`}
            className={`rounded-lg px-3 py-2.5 border transition flex flex-col ${n.utama ? 'bg-red-600 hover:bg-red-700 border-red-500 text-white' : 'bg-slate-900 hover:bg-slate-700 border-slate-700 text-white'}`}
          >
            <span className="text-xl font-bold tabular-nums">{n.ikon} {n.nomor}</span>
            <span className={`text-xs ${n.utama ? 'text-red-100' : 'text-slate-400'}`}>{t(`darurat.${n.nomor}`)}</span>
          </a>
        ))}
      </div>
      <p className="text-[11px] text-slate-500">{t('darurat.ket')}</p>
    </div>
  )
}

export default NomorDarurat
