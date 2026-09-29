import { useEffect } from 'react'
import { MapContainer, TileLayer, LayersControl, CircleMarker, Tooltip, Popup, useMap } from 'react-leaflet'
import { ikonBencana, labelBencana } from '../data/jenisBencana'
import { warnaKeparahan, infoPenanganan, perluVerifikasi, labelDesaKec, formatAngka } from '../data/statusTitik'
import { t } from '../i18n'
import LegendaPeta from './LegendaPeta'

const { BaseLayer } = LayersControl

function gayaBorderBerdasarkanStatus(status) {
  if (status === 'tervalidasi') return { weight: 3, dashArray: null }
  if (status === 'laporan_langsung') return { weight: 2, dashArray: '6, 4' }   // laporan warga
  return { weight: 2, dashArray: '2, 4' }
}

// Komponen kecil di dalam peta buat "terbang" ke titik yang lagi dipilih,
// baik dipilih dari klik peta maupun dari daftar laporan di samping
function PenggerakPeta({ titik }) {
  const map = useMap()
  useEffect(() => {
    if (titik) map.flyTo([titik.lat, titik.lng], Math.max(map.getZoom(), 13), { duration: 1.2 })
  }, [titik?.id])   // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

// modeTerbatas = peta publik di halaman depan: cuma info dasar, tanpa foto
// (foto bisa nunjukin korban/rumah warga, jadi cuma buat relawan)
function PetaAnomali({ titikData, idTerpilih, onPilihTitik, modeTerbatas = false, className = 'h-[600px]' }) {
  // Titik yang udah "selesai ditangani" gak ditampilin lagi di peta,
  // biar gak bentrok visual sama bencana baru — datanya tetep aman di database
  const titikAktif = titikData.filter((x) => x.status_penanganan !== 'selesai_ditangani')
  const titikTerpilih = titikAktif.find((x) => x.id === idTerpilih)

  return (
    <div className={`relative ${className}`}>
      <MapContainer center={[-6.95, 107.55]} zoom={10} style={{ height: '100%', width: '100%', borderRadius: '12px' }}>
        <LayersControl position="topright">
          <BaseLayer checked name={t('peta.standar')}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
          </BaseLayer>
          <BaseLayer name={t('peta.topo')}>
            <TileLayer url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors, SRTM | &copy; OpenTopoMap (CC-BY-SA)' maxZoom={17} maxNativeZoom={17} />
          </BaseLayer>
        </LayersControl>

        {!modeTerbatas && <PenggerakPeta titik={titikTerpilih} />}

        {titikAktif.map((titik) => {
          const warnaIsi = warnaKeparahan(titik.persentase_hp_mati)
          const gayaBorder = gayaBorderBerdasarkanStatus(titik.status)
          const terpilih = titik.id === idTerpilih

          return (
            <CircleMarker
              key={titik.id}
              center={[titik.lat, titik.lng]}
              radius={terpilih ? 22 : 17}
              pathOptions={{
                color: terpilih ? '#ffffff' : warnaIsi,
                fillColor: warnaIsi,
                fillOpacity: terpilih ? 0.8 : 0.6,
                weight: terpilih ? 4 : gayaBorder.weight,
                dashArray: terpilih ? null : gayaBorder.dashArray,
              }}
              eventHandlers={modeTerbatas ? undefined : { click: () => onPilihTitik?.(titik.id) }}
            >
              <Tooltip permanent direction="center" className="tooltip-ikon-bencana">
                {ikonBencana(titik.jenis_bencana)}
              </Tooltip>

              {modeTerbatas && (
                <Popup>
                  <strong>{titik.desa ? labelDesaKec(titik.desa, titik.kecamatan) : titik.kecamatan}</strong> — {labelBencana(titik.jenis_bencana)}
                  <br />
                  {t('peta.keparahan', { n: titik.persentase_hp_mati })}
                  {titik.jumlah_jiwa_terdampak && (
                    <>
                      <br />
                      👥 {t('peta.jiwa', { n: formatAngka(titik.jumlah_jiwa_terdampak) })}
                    </>
                  )}
                  <br />
                  {infoPenanganan(titik.status_penanganan).ikon} {infoPenanganan(titik.status_penanganan).teks}
                  {perluVerifikasi(titik) && (
                    <>
                      <br />
                      ⚠️ <em>{t('peta.belumVerif')}</em>
                    </>
                  )}
                </Popup>
              )}
            </CircleMarker>
          )
        })}
      </MapContainer>

      <LegendaPeta />
    </div>
  )
}

export default PetaAnomali
