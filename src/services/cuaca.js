// Fungsi ini manggil API resmi BMKG buat ambil prakiraan cuaca
// berdasarkan kode wilayah (adm4)
export async function ambilPrakiraanCuaca(adm4) {
  const url = `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${adm4}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('cuaca.gagal')   // kunci kamus, diterjemahin di PanelCuaca
  }

  const data = await response.json()

  // Data cuaca 3 hari ke depan ada di data.data[0].cuaca, isinya array per hari
  // Kita gabung jadi 1 array datar biar gampang diolah
  const semuaPrakiraan = data.data[0].cuaca.flat()

  return {
    lokasi: data.lokasi,
    prakiraan: semuaPrakiraan,
  }
}

// Fungsi ini cek apakah ada potensi hujan lebat/badai dalam 24 jam ke depan
// Kita ambil 8 data pertama = 24 jam (karena tiap data mewakili 3 jam)
export function cekRisikoHujanLebat(prakiraan) {
  const dalam24Jam = prakiraan.slice(0, 8)
  const adaHujanLebat = dalam24Jam.some((item) =>
    ['Hujan Lebat', 'Hujan Petir', 'Hujan Sedang'].includes(item.weather_desc)
  )
  return adaHujanLebat
}