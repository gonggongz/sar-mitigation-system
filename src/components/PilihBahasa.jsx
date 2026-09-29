import { daftarBahasa, gantiBahasa, useBahasa, t } from '../i18n'

// Tombol ID | EN di header. Pilihan disimpan di browser (lihat i18n/index.js)
function PilihBahasa() {
  const bahasa = useBahasa()

  return (
    <div role="group" aria-label={t('bahasa.label')} className="inline-flex shrink-0 rounded-lg border border-slate-600 overflow-hidden text-xs font-semibold">
      {daftarBahasa.map((b) => (
        <button
          key={b}
          type="button"
          onClick={() => gantiBahasa(b)}
          aria-pressed={bahasa === b}
          lang={b}
          className={`px-2.5 py-1.5 transition ${bahasa === b ? 'bg-slate-200 text-slate-900' : 'text-slate-300 hover:bg-slate-700'}`}
        >
          {b.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

export default PilihBahasa
