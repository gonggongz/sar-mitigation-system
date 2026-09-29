import { useState } from 'react'
import { db } from '../firebase'
import { doc, updateDoc } from 'firebase/firestore'
import { t } from '../i18n'

// Komponen ini dipasang ulang tiap ganti titik, jadi isian form cukup
// diambil sekali dari data yang UDAH ADA di titik itu (kalau pernah diupdate)
function PanelPenanganan({ titik }) {
  const [statusPenanganan, setStatusPenanganan] = useState(titik.status_penanganan || 'belum_ditangani')
  const [jumlahTim, setJumlahTim] = useState(titik.jumlah_tim_diturunkan ?? '')
  const [logistik, setLogistik] = useState(titik.logistik_diberikan || '')
  const [korbanSelamat, setKorbanSelamat] = useState(titik.korban_selamat ?? '')
  const [korbanMeninggal, setKorbanMeninggal] = useState(titik.korban_meninggal ?? '')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')

  const simpanUpdate = async () => {
    setLoading(true)
    setStatus('')
    try {
      const ref = doc(db, 'titik_anomali', titik.id)
      await updateDoc(ref, {
        status_penanganan: statusPenanganan,
        jumlah_tim_diturunkan: jumlahTim !== '' ? Number(jumlahTim) : null,
        logistik_diberikan: logistik,
        korban_selamat: korbanSelamat !== '' ? Number(korbanSelamat) : null,
        korban_meninggal: korbanMeninggal !== '' ? Number(korbanMeninggal) : null,
        waktu_update_penanganan: new Date().toISOString(),
      })
      setStatus(t('penanganan.tersimpan'))
    } catch (error) {
      setStatus(t('umum.gagal', { pesan: error.message }))
    }
    setLoading(false)
  }

  return (
    <div className="text-white flex flex-col gap-3">
      <div>
        <label className="text-sm text-slate-400 block mb-1">{t('penanganan.label')}</label>
        <select value={statusPenanganan} onChange={(e) => setStatusPenanganan(e.target.value)} className="w-full bg-slate-700 rounded-lg p-2">
          <option value="belum_ditangani">{t('penanganan.belum')}</option>
          <option value="sedang_ditangani">{t('penanganan.sedang')}</option>
          <option value="selesai_ditangani">{t('penanganan.selesai')}</option>
        </select>
      </div>

      <div>
        <label className="text-sm text-slate-400 block mb-1">{t('penanganan.tim')}</label>
        <input type="number" min="0" value={jumlahTim} onChange={(e) => setJumlahTim(e.target.value)} className="w-full bg-slate-700 rounded-lg p-2" placeholder={t('penanganan.timContoh')} />
      </div>

      <div>
        <label className="text-sm text-slate-400 block mb-1">{t('penanganan.logistik')}</label>
        <textarea value={logistik} onChange={(e) => setLogistik(e.target.value)} className="w-full bg-slate-700 rounded-lg p-2 text-sm" rows={2} placeholder={t('penanganan.logistikContoh')} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-slate-400 block mb-1">{t('penanganan.selamat')}</label>
          <input type="number" min="0" value={korbanSelamat} onChange={(e) => setKorbanSelamat(e.target.value)} className="w-full bg-slate-700 rounded-lg p-2" />
        </div>
        <div>
          <label className="text-sm text-slate-400 block mb-1">{t('penanganan.meninggal')}</label>
          <input type="number" min="0" value={korbanMeninggal} onChange={(e) => setKorbanMeninggal(e.target.value)} className="w-full bg-slate-700 rounded-lg p-2" />
        </div>
      </div>

      <button onClick={simpanUpdate} disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold py-2 rounded-lg transition">
        {loading ? t('umum.menyimpan') : t('penanganan.simpan')}
      </button>

      {status && <p className="text-sm text-center">{status}</p>}
    </div>
  )
}

export default PanelPenanganan
