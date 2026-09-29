import { jenisBencanaList, labelBencana, deskripsiBencana } from '../data/jenisBencana'

function LegendaPeta() {
  return (
    <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur rounded-lg p-2 flex gap-2 border border-slate-700">
      {jenisBencanaList.map((j) => (
        <div key={j.id} className="relative group">
          <div className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded cursor-help text-lg">
            {j.ikon}
          </div>
          {/* Kotak detail ini defaultnya disembunyikan (hidden),
              baru muncul (group-hover:block) pas mouse di atas ikonnya */}
          <div className="hidden group-hover:block absolute bottom-full left-0 mb-2 w-52 bg-slate-900 border border-slate-700 text-white text-xs p-2 rounded-lg shadow-lg">
            <p className="font-semibold mb-1">{j.ikon} {labelBencana(j.id)}</p>
            <p className="text-slate-300">{deskripsiBencana(j.id)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default LegendaPeta
