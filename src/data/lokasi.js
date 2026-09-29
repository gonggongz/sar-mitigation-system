// Daftar kecamatan yang dipantau (titik tengah + kode wilayah BMKG "adm4").
// Sumber aslinya ada di functions/data/lokasi.json supaya Cloud Function
// (yang di-deploy terpisah & gak bisa baca folder src/) pakai data yang sama.
// Mau nambah/ubah kecamatan? Cukup edit file JSON itu aja.
import lokasi from '../../functions/data/lokasi.json'

export const lokasiList = lokasi
