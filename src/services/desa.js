// Data desa se-Jawa (lihat scripts/buat-desa-jawa.cjs) lumayan besar (~2,9 MB),
// jadi baru diunduh pas form laporan dibuka, dan cukup sekali per kunjungan.
let janjiData = null

const normal = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()

export function muatDesaJawa() {
  if (!janjiData) {
    janjiData = import('../data/desa_jawa.json')
      .then(({ default: list }) =>
        // Teks pencarian disiapin sekali di depan biar tiap ketikan tetap cepat
        list.map((d) => ({ ...d, _nama: normal(d.nama), _cari: normal(`${d.nama} ${d.kec} ${d.kab}`) }))
      )
      .catch((err) => {
        janjiData = null   // biar bisa dicoba lagi
        throw err
      })
  }
  return janjiData
}

// Semua kata yang diketik harus ada (urutan bebas), jadi "cili bandung barat"
// tetap ketemu "Cililin, Kec. Cililin, Kab. Bandung Barat".
// Urutan hasil: nama desa persis > nama desa diawali kata kunci > sisanya.
export function cariDesa(list, kataKunci, maks = 8) {
  const q = normal(kataKunci)
  if (q.length < 2) return []
  const kata = q.split(' ')
  const hasil = []
  for (const d of list) {
    if (!kata.every((k) => d._cari.includes(k))) continue
    const skor = d._nama === q ? 0 : d._nama.startsWith(kata[0]) ? 1 : d._nama.includes(kata[0]) ? 2 : 3
    hasil.push({ d, skor })
  }
  hasil.sort((a, b) => a.skor - b.skor || a.d.nama.localeCompare(b.d.nama))
  return hasil.slice(0, maks).map((h) => h.d)
}

// Jarak garis lurus (haversine) dalam km
export function jarakKm(a, b) {
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLng = (b.lng - a.lng) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}

// Desa dengan titik tengah paling dekat. Ini perkiraan (bukan batas wilayah asli),
// jadi titik di pinggir desa bisa kebaca desa tetangga.
export function desaTerdekat(list, titik) {
  let terdekat = null
  let jarak = Infinity
  for (const d of list) {
    const j = jarakKm(titik, d)
    if (j < jarak) { jarak = j; terdekat = d }
  }
  return terdekat ? { desa: terdekat, jarakKm: jarak } : null
}
