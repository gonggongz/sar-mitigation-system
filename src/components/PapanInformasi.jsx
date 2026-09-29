import { useEffect, useState } from 'react'
import { ikonBencana, labelBencana } from '../data/jenisBencana'
import { perluVerifikasi } from '../data/statusTitik'
import { t } from '../i18n'

// Teks berjalan di halaman depan, gantian nampilin tiap kejadian.
// Angka ringkasannya udah ada di RingkasanPublik, jadi di sini cuma detail kejadian.
function PapanInformasi({ titikData }) {
  const [indexAktif, setIndexAktif] = useState(0)

  const berlangsung = titikData.filter((x) => !x.status_penanganan || x.status_penanganan === 'belum_ditangani')
  const ditangani = titikData.filter((x) => x.status_penanganan === 'sedang_ditangani')
  const selesai = titikData.filter((x) => x.status_penanganan === 'selesai_ditangani')

  const judul = (x) => `${ikonBencana(x.jenis_bencana)} ${labelBencana(x.jenis_bencana)} — ${x.kecamatan}`
  const slides = [
    ...berlangsung.map((x) => ({
      teks: `${judul(x)} · ${t('penanganan.belum')}${perluVerifikasi(x) ? t('papan.belumVerif') : ''}`,
      warna: 'text-red-400',
    })),
    ...ditangani.map((x) => ({
      teks: `${judul(x)} · ${t('penanganan.sedang')}`,
      warna: 'text-blue-400',
    })),
    ...selesai.map((x) => ({
      teks: `${judul(x)} · ${t('penanganan.selesai')}`,
      warna: 'text-green-400',
    })),
  ]

  // Ini yang bikin slide-nya otomatis ganti tiap 3.5 detik
  useEffect(() => {
    if (slides.length <= 1) return
    const interval = setInterval(() => {
      setIndexAktif((prev) => (prev + 1) % slides.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [slides.length])

  if (slides.length === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-center text-slate-400 text-sm">
        {t('papan.kosong')}
      </div>
    )
  }

  const slideAktif = slides[indexAktif] || slides[0]

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 overflow-hidden h-12 flex items-center gap-3">
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{t('papan.label')}</span>
      <p key={indexAktif} className={`animate-slide-down text-sm font-semibold truncate ${slideAktif.warna}`}>
        {slideAktif.teks}
      </p>
    </div>
  )
}

export default PapanInformasi
