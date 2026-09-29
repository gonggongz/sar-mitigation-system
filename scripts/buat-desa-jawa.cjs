// Bikin src/data/desa_jawa.json: semua desa/kelurahan di Jawa lengkap dengan
// kode adm4 BMKG (Kemendagri) + titik tengah lat/lng.
//
// Sumber:
//  - src/data/wilayah.sql  → kode & nama resmi Kemendagri (dipakai BMKG sebagai adm4)
//  - idn_admin_boundaries.xlsx dari HDX (https://data.humdata.org/dataset/cod-ab-idn)
//    → titik tengah desa. Sumber: BPS via OCHA, lisensi CC BY-IGO.
//
// Kode BPS (HDX) beda sistem dengan kode Kemendagri, jadi dicocokkan lewat
// nama kabupaten + kecamatan + desa. Desa yang gak ketemu pasangannya dilewati.
//
// Cara pakai:
//  1. Download idn_admin_boundaries.xlsx dari HDX
//  2. Ekstrak (file .xlsx itu sebenarnya zip) ke sebuah folder
//  3. node scripts/buat-desa-jawa.cjs <folder-hasil-ekstrak>

const fs = require('fs')
const path = require('path')

const folderXlsx = process.argv[2]
if (!folderXlsx) {
  console.error('Pakai: node scripts/buat-desa-jawa.cjs <folder-hasil-ekstrak-xlsx>')
  process.exit(1)
}

const akar = path.join(__dirname, '..')
const PROVINSI_JAWA = /^3[1-6]/   // 31 DKI, 32 Jabar, 33 Jateng, 34 DIY, 35 Jatim, 36 Banten

// ---- Baca xlsx (tanpa library): sheet "idn_admin4" = sheet5 ----
const sharedStrings = [...fs.readFileSync(path.join(folderXlsx, 'xl/sharedStrings.xml'), 'utf8').matchAll(/<si>([\s\S]*?)<\/si>/g)]
  .map((m) => [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join(''))

function kolomKeIndex(huruf) {
  return [...huruf].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1
}

function bacaSheet(nama) {
  const xml = fs.readFileSync(path.join(folderXlsx, `xl/worksheets/${nama}.xml`), 'utf8')
  const hasil = []
  for (const r of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const baris = []
    for (const c of r[1].matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const isi = c[3] || ''
      const v = isi.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? isi.match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1] ?? ''
      baris[kolomKeIndex(c[1])] = / t="s"/.test(c[2]) ? sharedStrings[+v] : v
    }
    hasil.push(baris)
  }
  return hasil
}

const [header, ...barisBps] = bacaSheet('sheet5')
const kol = (nama) => header.indexOf(nama)
const iDesa = kol('adm4_name'), iPcode = kol('adm4_pcode'), iKec = kol('adm3_name'), iKab = kol('adm2_name'), iLat = kol('center_lat'), iLng = kol('center_lon')

// ---- Baca wilayah.sql ----
const normal = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
const namaWilayah = {}
const desaKemendagri = []
for (const b of fs.readFileSync(path.join(akar, 'src/data/wilayah.sql'), 'utf8').split(/\r?\n/)) {
  const m = b.match(/^\('([\d.]+)','(.*)'\),?;?$/)
  if (!m || !PROVINSI_JAWA.test(m[1])) continue
  const nama = m[2].replace(/''/g, "'")
  namaWilayah[m[1]] = nama
  if (m[1].length === 13) desaKemendagri.push({ kode: m[1], nama })
}

const indeks = new Map()
for (const d of desaKemendagri) {
  const kunci = `${d.kode.slice(0, 5)}|${normal(namaWilayah[d.kode.slice(0, 8)] || '')}|${normal(d.nama)}`
  indeks.set(kunci, indeks.has(kunci) ? null : d)   // null = ganda, gak dipakai
}

// Nomor kabupaten/kota BPS gak selalu sama dengan Kemendagri
// (mis. Jakarta Selatan: BPS 3171, Kemendagri 31.74), jadi dicocokkan lewat nama.
// "Kabupaten Bandung" → "bandung", "Kota Administrasi Jakarta Barat" → "kotajakartabarat"
const namaKabNormal = (s) => normal(s.replace(/^Kabupaten (Administrasi )?/i, '').replace(/^Kota Administrasi /i, 'Kota '))
const kabKemendagri = new Map()
for (const [kode, nama] of Object.entries(namaWilayah)) {
  if (kode.length === 5) kabKemendagri.set(`${kode.slice(0, 2)}|${namaKabNormal(nama)}`, kode)
}
function kodeKab(pcode, namaKabBps) {
  return kabKemendagri.get(`${pcode.slice(2, 4)}|${namaKabNormal(namaKabBps || '')}`)
    || `${pcode.slice(2, 4)}.${pcode.slice(4, 6)}`   // cadangan: anggap nomornya sama
}

// ---- Cocokkan ----
const hasil = []
const gagal = []
for (const x of barisBps) {
  const pcode = x[iPcode] || ''
  if (!/^ID3[1-6]/.test(pcode)) continue
  const kab = kodeKab(pcode, x[iKab])
  const d = indeks.get(`${kab}|${normal(x[iKec] || '')}|${normal(x[iDesa] || '')}`)
  const lat = parseFloat(x[iLat]), lng = parseFloat(x[iLng])
  if (!d || !isFinite(lat) || !isFinite(lng)) {
    gagal.push(`${x[iDesa]} / ${x[iKec]} / ${pcode}`)
    continue
  }
  hasil.push({
    kode: d.kode,
    nama: d.nama,
    kec: namaWilayah[d.kode.slice(0, 8)],
    kab: namaWilayah[d.kode.slice(0, 5)],
    lat: Math.round(lat * 1e5) / 1e5,   // 5 desimal ≈ 1 meter, cukup buat titik tengah
    lng: Math.round(lng * 1e5) / 1e5,
  })
}
// Kalau 2 desa BPS nyambung ke kode Kemendagri yang sama (nama & kecamatannya kembar),
// gak ketahuan mana koordinat yang benar — dua-duanya dibuang
const jumlahPerKode = {}
for (const d of hasil) jumlahPerKode[d.kode] = (jumlahPerKode[d.kode] || 0) + 1
const bersih = hasil.filter((d) => jumlahPerKode[d.kode] === 1).sort((a, b) => a.kode.localeCompare(b.kode))

const tujuan = path.join(akar, 'src/data/desa_jawa.json')
fs.writeFileSync(tujuan, '[\n' + bersih.map((d) => '  ' + JSON.stringify(d)).join(',\n') + '\n]\n')

const kodeTerpakai = new Set(bersih.map((d) => d.kode))
console.log(`Desa BPS di Jawa     : ${hasil.length + gagal.length}`)
console.log(`Berhasil dicocokkan  : ${bersih.length}`)
console.log(`Gagal dicocokkan     : ${gagal.length}`)
console.log(`Dibuang karena kembar: ${hasil.length - bersih.length}`)
console.log(`Desa Kemendagri tanpa koordinat: ${desaKemendagri.filter((d) => !kodeTerpakai.has(d.kode)).length} dari ${desaKemendagri.length}`)
console.log(`Ditulis ke ${path.relative(akar, tujuan)} (${(fs.statSync(tujuan).size / 1024).toFixed(0)} KB)`)
if (process.env.TAMPILKAN_GAGAL) console.log(gagal.join('\n'))
