import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'

// Gemini gak lagi dipanggil langsung dari browser (biar API key gak bocor).
// Browser cuma kirim ID titik + ringkasan cuaca ke Cloud Function "rekomendasiAI",
// terus server yang manggil Gemini pakai key rahasianya sendiri.
const panggilRekomendasiAI = httpsCallable(functions, 'rekomendasiAI')

// bahasa: 'id' | 'en' — bahasa jawaban AI, ngikutin bahasa tampilan
export async function mintaRekomendasiAI(titik, dataCuaca, adaRisikoHujan, bahasa = 'id') {
  try {
    const hasil = await panggilRekomendasiAI({
      titikId: titik.id,
      bahasa,
      // null = lokasi tanpa data cuaca (mis. pulau tanpa kode BMKG)
      cuaca: dataCuaca
        ? {
            adaRisikoHujan,
            suhu: dataCuaca.prakiraan[0]?.t,
            kondisi: dataCuaca.prakiraan[0]?.weather_desc,
          }
        : null,
    })
    return hasil.data.rekomendasi
  } catch (error) {
    throw new Error(error.message || 'Gagal mendapat respons dari Gemini AI')
  }
}
