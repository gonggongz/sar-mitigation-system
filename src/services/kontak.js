// Nomor HP pelapor disimpan di koleksi "titik_privat" (cuma bisa dibaca relawan),
// BUKAN di titik_anomali yang bisa dibaca publik. Lihat firestore.rules.

// "0812-3456 789" / "62812..." / "+62 812..." → "+628123456789". null kalau gak valid.
export function normalisasiHp(teks) {
  const angka = (teks || '').replace(/[\s\-().]/g, '')
  let hasil
  if (/^\+628\d{7,12}$/.test(angka)) hasil = angka
  else if (/^628\d{7,12}$/.test(angka)) hasil = '+' + angka
  else if (/^08\d{7,12}$/.test(angka)) hasil = '+62' + angka.slice(1)
  return hasil || null
}

// Link WhatsApp butuh angka doang tanpa "+"
export function linkWhatsApp(hp) {
  return `https://wa.me/${(hp || '').replace(/\D/g, '')}`
}
