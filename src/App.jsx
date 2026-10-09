import { useEffect, useState } from 'react'
import { db, auth } from './firebase'
import { collection, addDoc, doc, getDoc } from 'firebase/firestore'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import FormLogin from './components/FormLogin'
import PetaAnomali from './components/PetaAnomali'
import FormValidasi from './components/FormValidasi'
import { jenisBencanaList, labelBencana } from './data/jenisBencana'
import { lokasiList } from './data/lokasi'
import PapanInformasi from './components/PapanInformasi'
import RingkasanPublik from './components/RingkasanPublik'
import NomorDarurat from './components/NomorDarurat'
import PanduanBencana from './components/PanduanBencana'
import KeteranganWarna from './components/KeteranganWarna'
import KartuRingkasan from './components/KartuRingkasan'
import DaftarLaporan from './components/DaftarLaporan'
import PanelDetailTitik from './components/PanelDetailTitik'
import GaleriFoto from './components/GaleriFoto'
import { useTitikAnomali } from './hooks/useTitikAnomali'
import { titikTersembunyi } from './data/statusTitik'
import PilihBahasa from './components/PilihBahasa'
import { t, useBahasa } from './i18n'

function App() {
  // Berlangganan bahasa aktif: begitu diganti, App (dan semua anaknya) dirender ulang
  useBahasa()
  const [peran, setPeran] = useState(null)   // null = belum pilih, 'relawan' | 'masyarakat'
  const [tab, setTab] = useState('dashboard')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [sumberSimulasi, setSumberSimulasi] = useState('kecamatan')   // 'kecamatan' | 'pulau'
  // Yang disimpan cuma ID-nya; data titiknya selalu diambil dari data realtime,
  // jadi panel detail ikut update kalau relawan lain ngubah status penanganan
  const [idTerpilih, setIdTerpilih] = useState(null)
  const { titikData, siap: titikSiap } = useTitikAnomali()
  const titikTerpilih = titikData.find((x) => x.id === idTerpilih) || null
  // Laporan duplikat / tidak valid disembunyikan dari peta, angka ringkasan & galeri.
  // Daftar laporan relawan tetap dapet semua data (ada filter "Arsip").
  const titikTampil = titikData.filter((x) => !titikTersembunyi(x))
  const [user, setUser] = useState(null)
  const [authSiap, setAuthSiap] = useState(false)   // false = masih ngecek sesi login tersimpan
  // Status akun di daftar relawan resmi (koleksi "relawan", ID dokumen = UID akun):
  // 'memeriksa' | 'terdaftar' | 'tidak_terdaftar' | 'gagal'
  const [statusRelawan, setStatusRelawan] = useState('memeriksa')

  // Login aja belum cukup — akunnya juga harus didaftarin admin di koleksi "relawan".
  // Aturan yang sama dicek lagi di Firestore rules & Cloud Function, jadi ini cuma buat tampilan.
  const cekStatusRelawan = async (u) => {
    setStatusRelawan('memeriksa')
    try {
      const snap = await getDoc(doc(db, 'relawan', u.uid))
      setStatusRelawan(snap.exists() ? 'terdaftar' : 'tidak_terdaftar')
    } catch {
      // Biasanya karena offline & datanya belum pernah tersimpan di cache browser
      setStatusRelawan('gagal')
    }
  }

  // Dengerin status login. Firebase nyimpen sesi di browser,
  // jadi relawan yang udah pernah masuk gak perlu login ulang tiap buka aplikasi
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthSiap(true)
      if (u) cekStatusRelawan(u)
    })
    return () => unsubscribe()
  }, [])

  const keluar = async () => {
    await signOut(auth)
    setPeran(null)
    setIdTerpilih(null)
  }

  const suntikDataDummy = async () => {
    setLoading(true)
    setStatus(t('umum.mengirim'))
    const persentaseHpMati = Math.floor(Math.random() * (95 - 60 + 1)) + 60
    const jenisTerpilih = jenisBencanaList[Math.floor(Math.random() * jenisBencanaList.length)]

    try {
      let lokasi
      if (sumberSimulasi === 'pulau') {
        // Di-load pas dibutuhin aja, biar halaman depan gak ikut ngunduh 869 pulau
        const { default: pulauJawa } = await import('./data/pulau_jawa.json')
        const pulau = pulauJawa[Math.floor(Math.random() * pulauJawa.length)]
        // Pulau gak punya kode desa sendiri, jadi cuaca BMKG-nya pakai desa terdekat
        // (lihat scripts/tambah-adm4-pulau.cjs). Nama pulau ditaruh di field "kecamatan"
        // karena field itu yang dipakai sebagai label lokasi di peta, daftar laporan, galeri, dll.
        lokasi = {
          kecamatan: pulau.nama, lat: pulau.lat, lng: pulau.lng,
          adm4: pulau.adm4 || null,
          jenis_lokasi: 'pulau', kode_pulau: pulau.kode,
          desa_cuaca: pulau.desa_terdekat || null,
          jarak_desa_cuaca_km: pulau.jarak_desa_km ?? null,
        }
      } else {
        const l = lokasiList[Math.floor(Math.random() * lokasiList.length)]
        lokasi = { kecamatan: l.kecamatan, lat: l.lat, lng: l.lng, adm4: l.adm4 }
      }

      const ref = await addDoc(collection(db, 'titik_anomali'), {
        ...lokasi,
        jenis_bencana: jenisTerpilih.id,
        persentase_hp_mati: persentaseHpMati,
        waktu: new Date().toISOString(),
        status: 'belum_divalidasi',
      })
      // Langsung dipilih biar peta terbang ke titik barunya (penting buat pulau yang jauh dari Bandung)
      setIdTerpilih(ref.id)
      setStatus(`✅ ${lokasi.kecamatan} · ${labelBencana(jenisTerpilih.id)} · ${persentaseHpMati}%`)
    } catch (error) {
      setStatus(t('umum.gagal', { pesan: error.message }))
    }
    setLoading(false)
  }

  const pilihTitik = (id) => {
    setIdTerpilih(id)
    setTab('dashboard')
  }

  // ====== TAMPILAN 1: Landing / gerbang peran ======
  // Prioritas halaman ini: warga yang lagi panik harus bisa lapor / nelpon
  // tanpa scroll, jadi tombol lapor & angka ringkas ditaruh paling atas
  if (!peran) {
    return (
      <div className="min-h-screen bg-slate-900 p-4 lg:p-6">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-4">
          <header className="border-b border-slate-700 pb-4 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">🚨 SAR Mitigasi</h1>
              <p className="text-sm text-slate-400">{t('landing.subjudul')}</p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <PilihBahasa />
              <button
                onClick={() => setPeran('relawan')}
                className="shrink-0 text-sm text-slate-300 hover:text-white border border-slate-600 hover:border-slate-400 px-3 py-1.5 rounded-lg transition"
              >
                {t('landing.masukRelawan')}
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4 items-start">
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setPeran('masyarakat')}
                className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-lg px-6 py-4 rounded-xl shadow-lg shadow-red-900/40 transition"
              >
                {t('landing.lapor')}
              </button>
              <p className="text-xs text-slate-400 text-center">{t('landing.laporKet')}</p>
            </div>
            <RingkasanPublik titikData={titikTampil} siap={titikSiap} />
          </div>

          <PapanInformasi titikData={titikTampil} />

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-4 items-start">
            <div className="bg-slate-800 border border-slate-700 p-3 rounded-xl flex flex-col gap-2">
              <KeteranganWarna />
              <PetaAnomali titikData={titikTampil} modeTerbatas className="h-[360px] lg:h-[560px]" />
            </div>

            <div className="flex flex-col gap-4">
              <NomorDarurat />
              <PanduanBencana />
            </div>
          </div>

          {/* Atribusi wajib: data desa BPS lewat OCHA/HDX berlisensi CC BY-IGO */}
          <footer className="border-t border-slate-700 pt-3 text-[11px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
            <span className="font-semibold text-slate-400">{t('sumber.judul')}:</span>
            <span>{t('sumber.cuaca')}: <a href="https://data.bmkg.go.id" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-300">BMKG</a></span>
            <span>{t('sumber.desa')}: BPS via <a href="https://data.humdata.org/dataset/cod-ab-idn" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-300">OCHA/HDX</a> (<a href="https://creativecommons.org/licenses/by/3.0/igo/" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-300">CC BY-IGO</a>)</span>
            <span>{t('sumber.peta')}: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-300">OpenStreetMap</a> contributors, OpenTopoMap</span>
          </footer>
        </div>
      </div>
    )
  }

  // ====== TAMPILAN 2: Masyarakat (dipangkas) ======
  if (peran === 'masyarakat') {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="max-w-[1800px] mx-auto flex flex-col gap-6">
          <header className="border-b border-slate-700 pb-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">🚨 SAR Mitigasi</h1>
              <p className="text-sm text-slate-400">{t('masyarakat.subjudul')}</p>
            </div>
            <div className="flex items-center gap-3">
              <PilihBahasa />
              <button onClick={() => setPeran(null)} className="text-sm text-slate-400 hover:text-white underline">
                {t('umum.kembali')}
              </button>
            </div>
          </header>

          <div className="max-w-lg mx-auto w-full">
            <FormValidasi />
          </div>
        </div>
      </div>
    )
  }

  // ====== TAMPILAN 3a: Relawan tapi belum login / belum terdaftar ======
  if (!authSiap || !user || statusRelawan !== 'terdaftar') {
    let isi
    if (!authSiap) {
      isi = <p className="text-slate-400 text-sm text-center">{t('gerbang.cekSesi')}</p>
    } else if (!user) {
      isi = <FormLogin />
    } else if (statusRelawan === 'memeriksa') {
      isi = <p className="text-slate-400 text-sm text-center">{t('gerbang.cekStatus')}</p>
    } else {
      isi = (
        <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl text-white flex flex-col gap-3 text-center">
          {statusRelawan === 'tidak_terdaftar' ? (
            <>
              <h3 className="font-semibold">{t('gerbang.belumTerdaftarJudul')}</h3>
              <p className="text-sm text-slate-400">
                {t('gerbang.belumTerdaftarSebelum')} <span className="text-white">{user.email}</span> {t('gerbang.belumTerdaftarSesudah')}
              </p>
            </>
          ) : (
            <>
              <h3 className="font-semibold">{t('gerbang.gagalCekJudul')}</h3>
              <p className="text-sm text-slate-400">{t('gerbang.gagalCekIsi')}</p>
              <button onClick={() => cekStatusRelawan(user)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition">
                {t('umum.cobaLagi')}
              </button>
            </>
          )}
          <button onClick={keluar} className="text-sm text-red-400 hover:text-red-300 underline">
            {t('umum.keluar')}
          </button>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="max-w-[1800px] mx-auto flex flex-col gap-6">
          <header className="border-b border-slate-700 pb-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">🚨 SAR Mitigasi</h1>
              <p className="text-sm text-slate-400">{t('gerbang.subjudul')}</p>
            </div>
            <div className="flex items-center gap-3">
              <PilihBahasa />
              <button onClick={() => setPeran(null)} className="text-sm text-slate-400 hover:text-white underline">
                {t('umum.kembali')}
              </button>
            </div>
          </header>

          <div className="max-w-md mx-auto w-full">
            {isi}
          </div>
        </div>
      </div>
    )
  }

  // ====== TAMPILAN 3b: Relawan/SAR — dashboard komando ======
  const tabUtama = [
    { id: 'dashboard', label: t('dash.tabDashboard') },
    { id: 'galeri', label: t('dash.tabGaleri') },
    { id: 'lapor', label: t('dash.tabLapor') },
  ]

  return (
    <div className="min-h-screen bg-slate-900 p-4 lg:p-6">
      <div className="max-w-[1800px] mx-auto flex flex-col gap-4">
        <header className="border-b border-slate-700 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">🚨 SAR Mitigasi</h1>
            <p className="text-sm text-slate-400">{t('dash.subjudul')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm text-slate-400 hidden md:inline">🧑‍🚒 {user.email}</span>
            <PilihBahasa />
            <button onClick={() => setPeran(null)} className="text-sm text-slate-400 hover:text-white underline">
              {t('dash.gantiPeran')}
            </button>
            <button onClick={keluar} className="text-sm text-red-400 hover:text-red-300 underline">
              {t('umum.keluar')}
            </button>
          </div>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700">
          <div className="flex gap-1 overflow-x-auto">
            {tabUtama.map((tb) => (
              <button
                key={tb.id}
                onClick={() => setTab(tb.id)}
                className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition whitespace-nowrap ${tab === tb.id ? 'bg-slate-800 text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'}`}
              >
                {tb.label}
              </button>
            ))}
          </div>
          {/* Simulasi anomali sinyal HP buat keperluan demo/testing */}
          <div className="flex items-center gap-2 pb-2">
            {status && <span className="text-xs text-slate-400">{status}</span>}
            <select
              value={sumberSimulasi}
              onChange={(e) => setSumberSimulasi(e.target.value)}
              disabled={loading}
              title={t('sim.lokasiTitle')}
              className="text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-2 py-1.5"
            >
              <option value="kecamatan">{t('sim.kecamatan')}</option>
              <option value="pulau">{t('sim.pulau')}</option>
            </select>
            <button
              onClick={suntikDataDummy}
              disabled={loading}
              title={t('sim.title')}
              className="text-xs bg-red-500/15 border border-red-500/40 text-red-300 hover:bg-red-500/25 disabled:opacity-50 px-3 py-1.5 rounded-lg transition"
            >
              {loading ? t('umum.mengirim') : t('sim.tombol')}
            </button>
          </div>
        </div>

        {tab === 'dashboard' && (
          <>
            <KartuRingkasan titikData={titikTampil} />

            <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)_380px] lg:grid-rows-[minmax(0,1fr)] gap-4 lg:h-[calc(100vh-300px)] lg:min-h-[560px]">
              <div className="h-[420px] lg:h-auto min-h-0">
                <DaftarLaporan titikData={titikData} idTerpilih={idTerpilih} onPilihTitik={pilihTitik} />
              </div>

              <div className="bg-slate-800 border border-slate-700 p-3 rounded-xl flex flex-col gap-2 min-h-0">
                <p className="text-xs text-slate-400">
                  {t('dash.petaKet')}
                </p>
                <PetaAnomali
                  titikData={titikTampil}
                  idTerpilih={idTerpilih}
                  onPilihTitik={pilihTitik}
                  className="h-[420px] lg:h-auto lg:flex-1"
                />
              </div>

              <div className="min-h-0">
                {titikTerpilih ? (
                  <PanelDetailTitik key={titikTerpilih.id} titik={titikTerpilih} titikData={titikData} onPilihTitik={pilihTitik} onTutup={() => setIdTerpilih(null)} />
                ) : (
                  <div className="h-full min-h-[200px] bg-slate-800 border border-dashed border-slate-600 rounded-xl flex flex-col items-center justify-center text-center p-6 gap-2">
                    <span className="text-3xl">🗺️</span>
                    <p className="text-white font-semibold text-sm">{t('dash.kosongJudul')}</p>
                    <p className="text-slate-400 text-xs">{t('dash.kosongIsi')}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {tab === 'galeri' && <GaleriFoto titikData={titikTampil} onLihatDiDashboard={pilihTitik} />}

        {tab === 'lapor' && (
          <div className="max-w-lg mx-auto w-full">
            <FormValidasi sebagaiRelawan />
          </div>
        )}
      </div>
    </div>
  )
}

export default App
