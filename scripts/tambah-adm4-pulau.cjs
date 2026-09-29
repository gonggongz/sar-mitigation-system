// Nambahin kode adm4 BMKG ke tiap pulau di src/data/pulau_jawa.json,
// diambil dari desa terdekat di src/data/desa_jawa.json (jarak titik tengah).
// Pulau gak punya kode desa sendiri, jadi cuaca BMKG-nya pakai desa terdekat.
//
// Cara pakai: node scripts/tambah-adm4-pulau.cjs
// (jalankan lagi kalau desa_jawa.json atau daftar pulaunya berubah)

const fs = require('fs')
const path = require('path')

const akar = path.join(__dirname, '..')
const filePulau = path.join(akar, 'src/data/pulau_jawa.json')
const pulauList = JSON.parse(fs.readFileSync(filePulau, 'utf8'))
const desaList = JSON.parse(fs.readFileSync(path.join(akar, 'src/data/desa_jawa.json'), 'utf8'))

// Jarak garis lurus di permukaan bumi (haversine), dalam km
function jarakKm(a, b) {
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLng = (b.lng - a.lng) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}

const hasil = pulauList.map((p) => {
  // Buang field lama biar script ini aman dijalankan berulang
  const { kode, nama, lat, lng } = p
  let terdekat = null
  let jarakTerdekat = Infinity
  for (const d of desaList) {
    const j = jarakKm(p, d)
    if (j < jarakTerdekat) { jarakTerdekat = j; terdekat = d }
  }
  return {
    kode, nama, lat, lng,
    adm4: terdekat.kode,
    desa_terdekat: `${terdekat.nama}, ${terdekat.kec}`,
    jarak_desa_km: Math.round(jarakTerdekat * 10) / 10,
  }
})

fs.writeFileSync(filePulau, '[\n' + hasil.map((p) => '  ' + JSON.stringify(p)).join(',\n') + '\n]\n')

const jarak = hasil.map((p) => p.jarak_desa_km).sort((a, b) => a - b)
const persentil = (q) => jarak[Math.floor(q * (jarak.length - 1))]
console.log(`Pulau diproses : ${hasil.length}`)
console.log(`Jarak ke desa terdekat (km): median ${persentil(0.5)}, 90% ≤ ${persentil(0.9)}, terjauh ${jarak[jarak.length - 1]}`)
console.log(`Ditulis ke ${path.relative(akar, filePulau)}`)
