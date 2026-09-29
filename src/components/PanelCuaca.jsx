import { useEffect, useState } from 'react'
import { ambilPrakiraanCuaca, cekRisikoHujanLebat } from '../services/cuaca'
import { t, bahasaAktif } from '../i18n'

// Komponen ini dipasang ulang (remount) tiap kali titik yang dipilih ganti,
// jadi cukup ambil data cuaca sekali per kode wilayah — gak ikut ngulang
// tiap kali data titiknya berubah di Firestore
function PanelCuaca({ titik, onDataDidapat }) {
  const [cuaca, setCuaca] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!titik.adm4) return   // lokasi pulau gak punya kode BMKG
    let batal = false
    ambilPrakiraanCuaca(titik.adm4)
      .then((hasil) => {
        if (batal) return
        setCuaca(hasil)
        onDataDidapat(hasil)
      })
      .catch((err) => { if (!batal) setError(err.message) })
    return () => { batal = true }
  }, [titik.adm4])   // eslint-disable-line react-hooks/exhaustive-deps

  if (!titik.adm4) {
    return <p className="text-sm text-slate-400">{t('cuaca.tanpaKode')}</p>
  }
  // err.message bisa kunci kamus (dari services/cuaca.js) atau pesan error browser
  if (error) return <p className="text-sm text-red-400">{t('umum.error', { pesan: t(error) })}</p>
  if (!cuaca) return <p className="text-sm text-slate-400">{t('cuaca.memuat')}</p>

  const berisiko = cekRisikoHujanLebat(cuaca.prakiraan)
  // BMKG juga nyediain keterangan cuaca versi Inggris
  const pakaiInggris = bahasaAktif() === 'en'

  return (
    <div className="text-white flex flex-col gap-3">
      <p className="text-sm font-semibold">🌦️ {cuaca.lokasi.desa}, {cuaca.lokasi.kecamatan}</p>
      {titik.jenis_lokasi === 'pulau' && (
        <p className="text-xs text-amber-300/90 -mt-2">
          {t('cuaca.pulau')}
          {titik.jarak_desa_cuaca_km != null && t('cuaca.pulauJarak', { n: titik.jarak_desa_cuaca_km })}
          {t('cuaca.pulauLaut')}
        </p>
      )}

      {berisiko && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-lg text-sm">
          {t('cuaca.hujan')}
        </div>
      )}

      <div className="grid grid-cols-4 gap-2 text-xs">
        {cuaca.prakiraan.slice(0, 8).map((item, i) => (
          <div key={i} className="bg-slate-700 p-2 rounded text-center">
            <div className="text-slate-400">{item.local_datetime.slice(11, 16)}</div>
            <div className="font-semibold">{item.t}°C</div>
            <div className="text-slate-300">{(pakaiInggris && item.weather_desc_en) || item.weather_desc}</div>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-500">{t('cuaca.sumber')}</p>
    </div>
  )
}

export default PanelCuaca
