import { useEffect, useState } from 'react'
import { mintaRekomendasiAI } from '../services/gemini'
import { cekRisikoHujanLebat } from '../services/cuaca'
import { t, useBahasa } from '../i18n'

// Dipasang ulang tiap ganti titik, jadi Gemini cuma dipanggil sekali per titik
// begitu data cuacanya siap — bukan tiap kali data titik berubah di Firestore.
// Kalau bahasa diganti, analisisnya diminta ulang dalam bahasa baru.
function RekomendasiAI({ titik, dataCuaca }) {
  const bahasa = useBahasa()
  const [rekomendasi, setRekomendasi] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  // Lokasi tanpa kode BMKG (mis. pulau) gak akan pernah dapet data cuaca,
  // jadi analisisnya langsung jalan tanpa nunggu cuaca
  const tanpaCuaca = !titik.adm4

  const minta = () => {
    setLoading(true)
    setError(null)
    setRekomendasi('')
    mintaRekomendasiAI(titik, dataCuaca, dataCuaca ? cekRisikoHujanLebat(dataCuaca.prakiraan) : false, bahasa)
      .then((hasil) => setRekomendasi(hasil))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (dataCuaca || tanpaCuaca) minta()
  }, [dataCuaca, bahasa])   // eslint-disable-line react-hooks/exhaustive-deps

  if (!dataCuaca && !tanpaCuaca) return <p className="text-sm text-slate-400">{t('ai.menunggu')}</p>

  return (
    <div className="text-white flex flex-col gap-3">
      <div className="bg-gradient-to-br from-indigo-900 to-slate-800 p-4 rounded-lg border border-indigo-500/30">
        <p className="text-xs text-indigo-300 mb-2">{t('ai.judul')}{tanpaCuaca && t('ai.tanpaCuaca')}</p>
        {loading && <p className="text-slate-300 text-sm">{t('ai.menganalisis')}</p>}
        {error && <p className="text-red-400 text-sm">{t('umum.error', { pesan: error })}</p>}
        {rekomendasi && <p className="text-sm leading-relaxed whitespace-pre-line">{rekomendasi}</p>}
      </div>
      <button onClick={minta} disabled={loading} className="self-start text-xs text-indigo-300 hover:text-indigo-200 underline disabled:text-slate-500">
        {t('ai.ulang')}
      </button>
    </div>
  )
}

export default RekomendasiAI
