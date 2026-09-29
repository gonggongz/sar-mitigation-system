import { t } from '../i18n'

// Nama & deskripsi tiap jenis ada di kamus (i18n/kamus.js, kunci "bencana.<id>")
// biar ikut berganti bahasa. Pakai labelBencana() / deskripsiBencana(), jangan teks langsung.
export const jenisBencanaList = [
  { id: 'longsor', ikon: '⛰️' },
  { id: 'banjir', ikon: '🌊' },
  { id: 'tsunami', ikon: '🌀' },
  { id: 'kebakaran_hutan', ikon: '🔥' },
  { id: 'kekeringan', ikon: '🏜️' },
]

const adaJenis = (id) => jenisBencanaList.some((j) => j.id === id)

export function ikonBencana(id) {
  return jenisBencanaList.find((j) => j.id === id)?.ikon || '❓'
}

export function labelBencana(id) {
  return adaJenis(id) ? t(`bencana.${id}`) : t('bencana.tidakDiketahui')
}

export function deskripsiBencana(id) {
  return adaJenis(id) ? t(`bencana.${id}.desc`) : ''
}
