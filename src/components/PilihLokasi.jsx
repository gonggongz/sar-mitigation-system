import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Circle, useMap, useMapEvents } from 'react-leaflet'
import { muatDesaJawa, cariDesa, desaTerdekat } from '../services/desa'
import { labelCaraLokasi, labelDesaKec } from '../data/statusTitik'
import { t } from '../i18n'

// Kalau desa terdekat lebih jauh dari ini, titiknya dianggap di luar cakupan data desa Jawa
const BATAS_CAKUPAN_KM = 15

// Error-nya berisi kunci kamus, diterjemahin waktu ditampilkan
function ambilGps() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('lokasi.gpsTakDidukung'))
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, akurasi: Math.round(pos.coords.accuracy) }),
      (err) => reject(new Error(err.code === 1 ? 'lokasi.gpsDitolak' : 'lokasi.gpsGagal')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    )
  })
}

// Peta ikut pindah tiap kali titiknya berubah (dari GPS, pencarian, atau ketukan)
function PengikutTitik({ lokasi }) {
  const map = useMap()
  useEffect(() => {
    if (lokasi) map.flyTo([lokasi.lat, lokasi.lng], Math.max(map.getZoom(), 14), { duration: 0.8 })
  }, [lokasi?.lat, lokasi?.lng])   // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

function PenangkapKetukan({ onKetuk }) {
  useMapEvents({ click: (e) => onKetuk(e.latlng) })
  return null
}

// lokasi = { lat, lng, cara: 'gps'|'desa'|'peta', akurasi?, desa: {kode, nama, kec, kab} } atau null
function PilihLokasi({ lokasi, onUbah }) {
  const [mode, setMode] = useState(null)   // null | 'disini' | 'lain'
  const [desaList, setDesaList] = useState(null)
  const [errorData, setErrorData] = useState(false)
  const [gpsMencari, setGpsMencari] = useState(false)
  const [pesan, setPesan] = useState('')   // kunci kamus
  const [kataKunci, setKataKunci] = useState('')
  const [saranTerbuka, setSaranTerbuka] = useState(false)
  const [indexSorot, setIndexSorot] = useState(0)
  const inputRef = useRef(null)

  // Data desa langsung diunduh begitu form dibuka, biar siap waktu dipakai
  useEffect(() => {
    muatDesaJawa().then(setDesaList).catch(() => setErrorData(true))
  }, [])

  const saran = desaList && saranTerbuka ? cariDesa(desaList, kataKunci) : []

  // Titik bebas (GPS / ketukan peta) → dicarikan desa terdekat buat label & kode cuaca BMKG
  const pasangTitik = async (titik, cara) => {
    const list = desaList || await muatDesaJawa()
    const hasil = desaTerdekat(list, titik)
    if (!hasil || hasil.jarakKm > BATAS_CAKUPAN_KM) {
      setPesan('lokasi.luarCakupan')
      return
    }
    setPesan('')
    onUbah({ ...titik, cara, desa: hasil.desa })
  }

  const pilihDiSini = async () => {
    setMode('disini')
    setPesan('')
    setGpsMencari(true)
    try {
      await pasangTitik(await ambilGps(), 'gps')
    } catch (err) {
      setPesan(err.message)
      onUbah(null)
    }
    setGpsMencari(false)
  }

  const pilihTempatLain = () => {
    setMode('lain')
    setPesan('')
    if (lokasi?.cara === 'gps') onUbah(null)   // lokasi HP pelapor jangan kebawa
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const pilihDesa = (d) => {
    onUbah({ lat: d.lat, lng: d.lng, cara: 'desa', desa: d })
    setKataKunci('')
    setSaranTerbuka(false)
    setPesan('')
  }

  const tombolKeyboard = (e) => {
    if (!saran.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setIndexSorot((i) => (i + 1) % saran.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIndexSorot((i) => (i - 1 + saran.length) % saran.length) }
    else if (e.key === 'Enter') { e.preventDefault(); pilihDesa(saran[indexSorot] || saran[0]) }   // jangan sampai form kekirim
    else if (e.key === 'Escape') setSaranTerbuka(false)
  }

  const kelasPilihan = (aktif) =>
    `flex-1 text-left rounded-lg border p-3 transition ${aktif ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 bg-slate-700/50 hover:border-slate-400'}`

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-slate-400">{t('lokasi.tanya')}</p>

      <div className="flex flex-col sm:flex-row gap-2">
        <button type="button" onClick={pilihDiSini} disabled={gpsMencari} className={kelasPilihan(mode === 'disini')}>
          <span className="block text-sm font-semibold">{t('lokasi.disini')}</span>
          <span className="block text-xs text-slate-400">{t('lokasi.disiniKet')}</span>
        </button>
        <button type="button" onClick={pilihTempatLain} className={kelasPilihan(mode === 'lain')}>
          <span className="block text-sm font-semibold">{t('lokasi.lain')}</span>
          <span className="block text-xs text-slate-400">{t('lokasi.lainKet')}</span>
        </button>
      </div>

      {errorData && <p className="text-xs text-red-400">{t('lokasi.errData')}</p>}
      {gpsMencari && <p className="text-xs text-slate-400">{t('lokasi.mencariGps')}</p>}
      {pesan && <p className="text-xs text-amber-300">⚠️ {t(pesan)}</p>}

      {mode === 'lain' && (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={kataKunci}
            onChange={(e) => { setKataKunci(e.target.value); setSaranTerbuka(true); setIndexSorot(0) }}
            onFocus={() => setSaranTerbuka(true)}
            onBlur={() => setSaranTerbuka(false)}
            onKeyDown={tombolKeyboard}
            placeholder={desaList ? t('lokasi.cari') : t('lokasi.memuatDesa')}
            disabled={!desaList}
            role="combobox"
            aria-expanded={saran.length > 0}
            aria-controls="saran-desa"
            aria-autocomplete="list"
            className="w-full bg-slate-700 rounded-lg p-2 text-sm disabled:opacity-60"
          />
          {saranTerbuka && kataKunci.trim().length >= 2 && desaList && (
            <ul id="saran-desa" role="listbox" className="absolute z-[1100] left-0 right-0 mt-1 bg-slate-900 border border-slate-600 rounded-lg shadow-xl max-h-72 overflow-y-auto">
              {saran.length === 0 && <li className="px-3 py-2 text-xs text-slate-400">{t('lokasi.tidakKetemu')}</li>}
              {saran.map((d, i) => (
                <li key={d.kode} role="option" aria-selected={i === indexSorot}>
                  <button
                    type="button"
                    // onMouseDown (bukan onClick) biar kepilih sebelum input kehilangan fokus
                    onMouseDown={(e) => { e.preventDefault(); pilihDesa(d) }}
                    onMouseEnter={() => setIndexSorot(i)}
                    className={`w-full text-left px-3 py-2 ${i === indexSorot ? 'bg-slate-700' : ''}`}
                  >
                    <span className="block text-sm text-white">{d.nama}</span>
                    <span className="block text-xs text-slate-400">{t('wilayah.kec', { kec: d.kec })} · {d.kab}</span>
                  </button>
                </li>
              ))}
              {saran.length >= 8 && (
                <li className="px-3 py-2 text-[11px] text-slate-500 border-t border-slate-700">
                  {t('lokasi.banyakHasil')}
                </li>
              )}
            </ul>
          )}
        </div>
      )}

      {mode && (
        <div className="flex flex-col gap-1">
          <div className="h-56 rounded-lg overflow-hidden border border-slate-600">
            <MapContainer center={[-6.95, 107.55]} zoom={9} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
              <PenangkapKetukan onKetuk={(p) => pasangTitik({ lat: p.lat, lng: p.lng }, 'peta')} />
              <PengikutTitik lokasi={lokasi} />
              {lokasi?.akurasi && (
                <Circle center={[lokasi.lat, lokasi.lng]} radius={lokasi.akurasi} pathOptions={{ color: '#3b82f6', weight: 1, fillOpacity: 0.1 }} />
              )}
              {lokasi && (
                <CircleMarker center={[lokasi.lat, lokasi.lng]} radius={9} pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#dc2626', fillOpacity: 1 }} />
              )}
            </MapContainer>
          </div>
          <p className="text-[11px] text-slate-500">{t('lokasi.ketukPeta')}</p>
        </div>
      )}

      {lokasi && (
        <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-3 text-sm">
          <p className="text-white font-semibold">{labelDesaKec(lokasi.desa.nama, lokasi.desa.kec)}</p>
          <p className="text-xs text-slate-400">{lokasi.desa.kab}</p>
          <p className="text-xs text-slate-400 mt-1">
            {labelCaraLokasi(lokasi.cara)}
            {lokasi.akurasi && t('lokasi.akurasi', { n: lokasi.akurasi })}
            {lokasi.cara !== 'desa' && t('lokasi.perkiraan')}
          </p>
        </div>
      )}
    </div>
  )
}

export default PilihLokasi
