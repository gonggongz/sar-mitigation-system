import { useEffect } from 'react'
import { t } from '../i18n'

// Tampilan foto layar penuh. Tutup dengan klik di luar foto, tombol ✕, atau tombol Esc.
function FotoLightbox({ url, keterangan, onTutup, children }) {
  useEffect(() => {
    const tekanTombol = (e) => { if (e.key === 'Escape') onTutup() }
    window.addEventListener('keydown', tekanTombol)
    return () => window.removeEventListener('keydown', tekanTombol)
  }, [onTutup])

  return (
    <div className="fixed inset-0 z-[2000] bg-black/85 flex items-center justify-center p-4" onClick={onTutup}>
      <div className="max-w-5xl w-full flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between text-white">
          <p className="text-sm font-semibold">{keterangan}</p>
          <button onClick={onTutup} className="text-2xl leading-none text-slate-300 hover:text-white px-2" aria-label={t('umum.tutup')}>✕</button>
        </div>
        <img src={url} alt={keterangan} className="max-h-[75vh] w-auto mx-auto rounded-lg object-contain" />
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a href={url} target="_blank" rel="noreferrer" className="text-sm text-blue-300 hover:text-blue-200 underline">
            {t('lightbox.buka')}
          </a>
          {children}
        </div>
      </div>
    </div>
  )
}

export default FotoLightbox
