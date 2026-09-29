import { jenisBencanaList, labelBencana } from '../data/jenisBencana'
import { panduanBencana } from '../data/panduanBencana'
import { t, bahasaAktif } from '../i18n'

// Pakai <details> bawaan HTML biar bisa buka-tutup tanpa state tambahan
function PanduanBencana() {
  const panduan = panduanBencana[bahasaAktif()] || panduanBencana.id

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-white">{t('panduan.judul')}</h2>
      {jenisBencanaList.map((j) => (
        <details key={j.id} className="group bg-slate-900 border border-slate-700 rounded-lg">
          <summary className="cursor-pointer list-none px-3 py-2.5 text-sm text-white flex items-center justify-between">
            <span>{j.ikon} {labelBencana(j.id)}</span>
            <span className="text-slate-500 transition group-open:rotate-180">▾</span>
          </summary>
          <ul className="px-3 pb-3 flex flex-col gap-1.5 text-sm text-slate-300 list-disc list-inside">
            {(panduan[j.id] || []).map((poin) => (
              <li key={poin}>{poin}</li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  )
}

export default PanduanBencana
