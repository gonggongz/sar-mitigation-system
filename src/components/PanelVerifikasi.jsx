import { useEffect, useState } from 'react'
import { db, auth } from '../firebase'
import { doc, onSnapshot, writeBatch, arrayUnion } from 'firebase/firestore'
import { labelBencana } from '../data/jenisBencana'
import { infoValidasi, perluVerifikasi, titikTersembunyi, formatWaktu, Badge } from '../data/statusTitik'
import { jarakKm } from '../services/desa'
import { linkWhatsApp } from '../services/kontak'
import { t } from '../i18n'

// Laporan lain sejauh ini dianggap "di sekitar" (bukti pendukung & kandidat duplikat)
const RADIUS_SEKITAR_KM = 5

const keputusanList = {
  valid: { status: 'tervalidasi', kunci: 'verif.valid', kelas: 'bg-green-600 hover:bg-green-700' },
  duplikat: { status: 'duplikat', kunci: 'verif.duplikat', kelas: 'bg-slate-600 hover:bg-slate-500' },
  ditolak: { status: 'ditolak', kunci: 'verif.ditolak', kelas: 'bg-rose-700 hover:bg-rose-600' },
}

// Status awal sebelum diverifikasi, dipakai waktu relawan "buka lagi" keputusannya
function statusAwal(titik) {
  return titik.sumber_deteksi ? 'laporan_langsung' : 'belum_divalidasi'
}

// Data privat (kontak pelapor + riwayat verifikasi) ada di titik_privat/{id},
// cuma bisa dibaca relawan. Yang ditulis ke titik_anomali (publik) cuma statusnya.
function PanelVerifikasi({ titik, titikData, onPilihTitik }) {
  const [privat, setPrivat] = useState(null)
  const [pilihan, setPilihan] = useState(null)   // null | 'valid' | 'duplikat' | 'ditolak'
  const [alasan, setAlasan] = useState('')
  const [idDuplikatDari, setIdDuplikatDari] = useState('')
  const [loading, setLoading] = useState(false)
  const [pesan, setPesan] = useState('')

  useEffect(() => {
    return onSnapshot(
      doc(db, 'titik_privat', titik.id),
      (snap) => setPrivat(snap.exists() ? snap.data() : {}),
      () => setPrivat({})
    )
  }, [titik.id])

  // x = laporan lain di sekitar titik ini
  const sekitar = titikData
    .filter((x) => x.id !== titik.id && !titikTersembunyi(x) && x.lat != null)
    .map((x) => ({ x, jarak: jarakKm(titik, x) }))
    .filter((s) => s.jarak <= RADIUS_SEKITAR_KM)
    .sort((a, b) => a.jarak - b.jarak)

  const butuhKeputusan = perluVerifikasi(titik)
  const riwayat = privat?.riwayat_verifikasi || []
  const terakhir = riwayat[riwayat.length - 1]

  const simpan = async (keputusan) => {
    if (keputusan === 'ditolak' && !alasan.trim()) return setPesan(t('verif.errAlasan'))
    if (keputusan === 'duplikat' && !idDuplikatDari) return setPesan(t('verif.errAsli'))

    const statusBaru = keputusan === 'buka' ? statusAwal(titik) : keputusanList[keputusan].status
    const sekarang = new Date().toISOString()
    setLoading(true)
    setPesan('')
    try {
      const batch = writeBatch(db)
      batch.update(doc(db, 'titik_anomali', titik.id), {
        status: statusBaru,
        waktu_verifikasi: keputusan === 'buka' ? null : sekarang,
        duplikat_dari: keputusan === 'duplikat' ? idDuplikatDari : null,
      })
      // Siapa & kenapa disimpan di dokumen privat, biar email relawan gak kebuka ke publik
      batch.set(doc(db, 'titik_privat', titik.id), {
        riwayat_verifikasi: arrayUnion({
          keputusan,
          status: statusBaru,
          alasan: alasan.trim().slice(0, 300),
          duplikat_dari: keputusan === 'duplikat' ? idDuplikatDari : null,
          oleh_uid: auth.currentUser?.uid || null,
          oleh_email: auth.currentUser?.email || null,
          waktu: sekarang,
        }),
      }, { merge: true })
      await batch.commit()
      setPilihan(null)
      setAlasan('')
      setIdDuplikatDari('')
    } catch (err) {
      setPesan(t('verif.gagal', { pesan: err.message }))
    }
    setLoading(false)
  }

  const hp = privat?.hp_pelapor
  const ringkasLaporan = (x, jarak) =>
    `${labelBencana(x.jenis_bencana)} — ${x.desa || x.kecamatan} · ${jarak.toFixed(1)} km · ${formatWaktu(x.waktu)}`

  return (
    <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-white">{t('verif.judul')}</p>
        <Badge info={infoValidasi(titik.status)} />
      </div>

      {/* Kontak pelapor — data privat */}
      {privat === null ? (
        <p className="text-xs text-slate-400">{t('verif.memuatKontak')}</p>
      ) : hp ? (
        <div className="text-xs flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-slate-400">👤 {privat.nama_pelapor || t('verif.pelapor')}:</span>
          <a href={`tel:${hp}`} className="text-blue-300 hover:text-blue-200 underline">{hp}</a>
          <a href={linkWhatsApp(hp)} target="_blank" rel="noreferrer" className="text-green-300 hover:text-green-200 underline">WhatsApp</a>
          <span className="text-slate-500 w-full">{t('verif.rahasia')}</span>
        </div>
      ) : (
        <p className="text-xs text-slate-500">{t('verif.tanpaKontak')}</p>
      )}

      {/* Bukti pendukung */}
      <div className="text-xs">
        <p className="text-slate-400">
          {sekitar.length
            ? t('verif.sekitarAda', { n: sekitar.length, r: RADIUS_SEKITAR_KM })
            : t('verif.sekitarKosong', { r: RADIUS_SEKITAR_KM })}
        </p>
        {sekitar.slice(0, 4).map(({ x, jarak }) => (
          <button key={x.id} type="button" onClick={() => onPilihTitik?.(x.id)} className="block w-full text-left text-slate-300 hover:text-white truncate">
            · {ringkasLaporan(x, jarak)} · {infoValidasi(x.status).teks}
          </button>
        ))}
      </div>

      {/* Keputusan terakhir */}
      {!butuhKeputusan && (
        <div className="text-xs text-slate-400">
          {terakhir ? (
            <>
              {t('verif.diputuskan', { waktu: formatWaktu(terakhir.waktu) })} <span className="text-slate-200">{terakhir.oleh_email || t('verif.relawan')}</span>
              {terakhir.alasan && <> — “{terakhir.alasan}”</>}
            </>
          ) : titik.sumber_deteksi === 'validasi_relawan' ? (
            t('verif.olehRelawan')
          ) : null}
          {titik.status === 'duplikat' && titik.duplikat_dari && (
            <button type="button" onClick={() => onPilihTitik?.(titik.duplikat_dari)} className="block text-blue-300 hover:text-blue-200 underline mt-1">
              {t('verif.lihatAsli')}
            </button>
          )}
        </div>
      )}

      {/* Tombol keputusan */}
      {butuhKeputusan ? (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-1.5">
            {Object.entries(keputusanList).map(([id, k]) => (
              <button
                key={id}
                type="button"
                onClick={() => { setPilihan(id); setPesan('') }}
                className={`text-xs font-semibold text-white py-2 rounded-lg transition ${k.kelas} ${pilihan && pilihan !== id ? 'opacity-40' : ''}`}
              >
                {t(k.kunci)}
              </button>
            ))}
          </div>

          {pilihan && (
            <div className="flex flex-col gap-2">
              {pilihan === 'duplikat' && (
                <select value={idDuplikatDari} onChange={(e) => setIdDuplikatDari(e.target.value)} className="w-full bg-slate-700 rounded-lg p-2 text-xs text-white">
                  <option value="">{t('verif.pilihAsli')}</option>
                  {sekitar.map(({ x, jarak }) => (
                    <option key={x.id} value={x.id}>{ringkasLaporan(x, jarak)}</option>
                  ))}
                </select>
              )}
              {pilihan === 'duplikat' && sekitar.length === 0 && (
                <p className="text-xs text-amber-300">{t('verif.tidakAdaAsli')}</p>
              )}
              <textarea
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                rows={2}
                maxLength={300}
                className="w-full bg-slate-700 rounded-lg p-2 text-xs text-white"
                placeholder={pilihan === 'ditolak' ? t('verif.alasanWajib') : t('verif.catatanOpsional')}
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => simpan(pilihan)} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white text-xs font-semibold py-2 rounded-lg transition">
                  {loading ? t('umum.menyimpan') : t('verif.simpan')}
                </button>
                <button type="button" onClick={() => { setPilihan(null); setPesan('') }} className="text-xs text-slate-400 hover:text-white px-3">
                  {t('umum.batal')}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button type="button" onClick={() => simpan('buka')} disabled={loading} className="self-start text-xs text-slate-400 hover:text-white underline disabled:opacity-50">
          {t('verif.buka')}
        </button>
      )}

      {pesan && <p className="text-xs">{pesan}</p>}
    </div>
  )
}

export default PanelVerifikasi
