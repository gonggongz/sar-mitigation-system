import { useState } from 'react'
import { db } from '../firebase'
import { collection, doc, writeBatch } from 'firebase/firestore'
import { cekFoto, unggahFoto } from '../services/foto'
import { jenisBencanaList, labelBencana } from '../data/jenisBencana'
import PilihLokasi from './PilihLokasi'
import { normalisasiHp } from '../services/kontak'
import { t } from '../i18n'

const skorTingkatKerusakan = { ringan: 55, sedang: 75, parah: 92 }

// sebagaiRelawan = true cuma kalau form dibuka dari dashboard relawan yang udah login.
// Dulu ada dropdown "melapor sebagai" yang bisa dipilih siapa aja, jadi warga
// bisa bikin laporannya langsung berstatus "tervalidasi". Sekarang statusnya
// ditentukan dari login, bukan dari pilihan pelapor.
function FormValidasi({ sebagaiRelawan = false }) {
  // Lokasi kejadian dipilih eksplisit oleh pelapor (lihat PilihLokasi.jsx) — bukan otomatis
  // dari GPS HP, karena pelapor bisa aja udah ngungsi jauh dari lokasi kejadian
  const [lokasi, setLokasi] = useState(null)
  const [jenisBencana, setJenisBencana] = useState(jenisBencanaList[0].id)
  const [tingkatKerusakan, setTingkatKerusakan] = useState('sedang')
  const [jumlahJiwa, setJumlahJiwa] = useState('')
  const [catatan, setCatatan] = useState('')
  // Kontak pelapor (opsional, khusus warga) — disimpan terpisah, cuma relawan yang bisa baca
  const [namaPelapor, setNamaPelapor] = useState('')
  const [hpPelapor, setHpPelapor] = useState('')
  const [foto, setFoto] = useState(null)
  const [errorFoto, setErrorFoto] = useState('')
  const [kunciInputFoto, setKunciInputFoto] = useState(0)   // diganti biar input file kosong lagi setelah kirim
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')

  const pilihFoto = (file) => {
    const masalah = file ? cekFoto(file) : null
    setErrorFoto(masalah || '')
    setFoto(masalah ? null : file || null)
  }

  const kirimLaporan = async (e) => {
    e.preventDefault()
    if (errorFoto) return
    if (!lokasi) {
      setStatus(t('form.errLokasi'))
      return
    }
    const hp = hpPelapor.trim() ? normalisasiHp(hpPelapor) : null
    if (hpPelapor.trim() && !hp) {
      setStatus(t('form.errHp'))
      return
    }
    setLoading(true)

    try {
      // Upload foto ditaruh di dalam try juga, biar kalau gagal
      // tombolnya gak nyangkut di "Mengirim..." selamanya
      let fotoPath = null
      if (foto) {
        setStatus(t('form.unggah'))
        fotoPath = await unggahFoto(foto)
      }

      setStatus(t('form.mengirim'))

      // Laporan publik & kontak pelapor (privat) ditulis bareng dalam 1 batch:
      // kalau salah satu ditolak, dua-duanya batal. ID-nya sama biar gampang dicocokkan.
      const refTitik = doc(collection(db, 'titik_anomali'))
      const batch = writeBatch(db)
      batch.set(refTitik, {
        kecamatan: lokasi.desa.kec,
        desa: lokasi.desa.nama,
        kabupaten: lokasi.desa.kab,
        lat: lokasi.lat,
        lng: lokasi.lng,
        adm4: lokasi.desa.kode,   // kode desa Kemendagri = kode wilayah cuaca BMKG
        cara_lokasi: lokasi.cara,   // 'gps' | 'desa' | 'peta'
        akurasi_lokasi_m: lokasi.akurasi ?? null,
        jenis_bencana: jenisBencana,
        persentase_hp_mati: skorTingkatKerusakan[tingkatKerusakan],
        jumlah_jiwa_terdampak: jumlahJiwa ? Number(jumlahJiwa) : null,
        catatan: catatan,
        // Yang disimpan cuma lokasi file-nya, bukan link publik —
        // fotonya cuma bisa dibuka relawan (lihat storage.rules)
        foto_path: fotoPath,
        lokasi_presisi_gps: lokasi.cara === 'gps',   // field lama, masih dibaca laporan versi sebelumnya
        waktu: new Date().toISOString(),
        sumber_deteksi: sebagaiRelawan ? 'validasi_relawan' : 'laporan_warga_langsung',
        status: sebagaiRelawan ? 'tervalidasi' : 'laporan_langsung',
      })
      if (!sebagaiRelawan && hp) {
        batch.set(doc(db, 'titik_privat', refTitik.id), {
          nama_pelapor: namaPelapor.trim().slice(0, 60) || null,
          hp_pelapor: hp,
          waktu: new Date().toISOString(),
        })
      }
      await batch.commit()
      setStatus(t('form.berhasil'))
      setCatatan('')
      setJumlahJiwa('')
      setNamaPelapor('')   // dikosongin juga, siapa tau HP-nya dipakai gantian di posko
      setHpPelapor('')
      setFoto(null)
      setKunciInputFoto((k) => k + 1)   // sekalian ngereset pilihan lokasi
      setLokasi(null)
    } catch (error) {
      setStatus(t('umum.gagal', { pesan: error.message }))
    }
    setLoading(false)
  }

  return (
    <form onSubmit={kirimLaporan} className="bg-slate-800 p-5 rounded-xl text-white flex flex-col gap-4">
      <div>
        <h3 className="font-semibold">{t('form.judul')}</h3>
        <p className="text-xs text-slate-400 mt-1">
          {sebagaiRelawan ? t('form.relawan') : t('form.warga')}
        </p>
      </div>

      <div>
        <label className="text-sm text-slate-400 block mb-1">{t('form.jenis')}</label>
        <select value={jenisBencana} onChange={(e) => setJenisBencana(e.target.value)} className="w-full bg-slate-700 rounded-lg p-2">
          {jenisBencanaList.map((j) => (
            <option key={j.id} value={j.id}>{j.ikon} {labelBencana(j.id)}</option>
          ))}
        </select>
      </div>

      <PilihLokasi key={kunciInputFoto} lokasi={lokasi} onUbah={setLokasi} />

      <div>
        <label className="text-sm text-slate-400 block mb-1">{t('form.kerusakan')}</label>
        <select value={tingkatKerusakan} onChange={(e) => setTingkatKerusakan(e.target.value)} className="w-full bg-slate-700 rounded-lg p-2">
          <option value="ringan">{t('form.ringan')}</option>
          <option value="sedang">{t('form.sedang')}</option>
          <option value="parah">{t('form.parah')}</option>
        </select>
      </div>

      <div>
        <label className="text-sm text-slate-400 block mb-1">{t('form.jiwa')}</label>
        <input type="number" min="0" value={jumlahJiwa} onChange={(e) => setJumlahJiwa(e.target.value)} className="w-full bg-slate-700 rounded-lg p-2" placeholder={t('form.jiwaContoh')} />
      </div>

      <div>
        <label className="text-sm text-slate-400 block mb-1">{t('form.foto')}</label>
        <input
          key={kunciInputFoto}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => pilihFoto(e.target.files[0])}
          className="w-full bg-slate-700 rounded-lg p-2 text-sm"
        />
        {errorFoto && <p className="text-xs text-red-400 mt-1">{t(errorFoto)}</p>}
        <p className="text-xs text-slate-500 mt-1">{t('form.fotoKet')}</p>
      </div>

      <div>
        <label className="text-sm text-slate-400 block mb-1">{t('form.catatan')}</label>
        <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} className="w-full bg-slate-700 rounded-lg p-2 text-sm" rows={3} placeholder={t('form.catatanContoh')} />
      </div>

      {!sebagaiRelawan && (
        <fieldset className="border border-slate-700 rounded-lg p-3 flex flex-col gap-2">
          <legend className="text-sm text-slate-400 px-1">{t('form.kontak')}</legend>
          <input type="text" value={namaPelapor} onChange={(e) => setNamaPelapor(e.target.value)} maxLength={60} autoComplete="name" className="w-full bg-slate-700 rounded-lg p-2 text-sm" placeholder={t('form.nama')} />
          <input type="tel" inputMode="tel" value={hpPelapor} onChange={(e) => setHpPelapor(e.target.value)} autoComplete="tel" className="w-full bg-slate-700 rounded-lg p-2 text-sm" placeholder={t('form.hp')} />
          <p className="text-xs text-slate-500">{t('form.kontakKet')}</p>
        </fieldset>
      )}

      <button type="submit" disabled={loading || !!errorFoto || !lokasi} className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-semibold py-2 rounded-lg transition">
        {loading ? t('umum.mengirim') : lokasi ? t('form.kirim') : t('form.lokasiDulu')}
      </button>

      {status && <p className="text-sm text-center">{status}</p>}
    </form>
  )
}

export default FormValidasi