const { onRequest, onCall, HttpsError } = require("firebase-functions/https");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// Daftar kecamatan yang dipantau — sama persis dengan yang dipakai frontend (src/data/lokasi.js)
const lokasiList = require("./data/lokasi.json")

// Kamus jenis bencana yang sama kayak di frontend, biar Gemini tau pilihan yang valid
const jenisBencanaValid = ['longsor', 'banjir', 'tsunami', 'kebakaran_hutan', 'kekeringan']

const skorTingkatKerusakan = { ringan: 55, sedang: 75, parah: 92 }

async function ekstrakLaporanDenganGemini(pesan) {
  const apiKey = process.env.GEMINI_API_KEY
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
  const daftarLokasi = lokasiList.map((l) => l.kecamatan).join(', ')

  const prompt = `Kamu adalah asisten yang mengekstrak data laporan bencana dari pesan WhatsApp berbahasa Indonesia.
Lokasi yang valid hanya salah satu dari: ${daftarLokasi}.
Jenis bencana yang valid hanya salah satu dari: ${jenisBencanaValid.join(', ')}.

Pesan: "${pesan}"

Jika pesan ini adalah laporan bencana yang valid (menyebutkan salah satu lokasi & jenis bencana di atas), balas HANYA dengan JSON persis format ini, tanpa teks lain, tanpa markdown:
{"valid": true, "kecamatan": "<salah satu dari daftar lokasi>", "jenis_bencana": "<salah satu dari daftar jenis bencana, tebak dari konteks kalau tidak disebut eksplisit>", "tingkat_kerusakan": "ringan atau sedang atau parah", "jumlah_jiwa_terdampak": <angka atau null>, "catatan": "<ringkasan singkat dalam bahasa Indonesia>"}

Jika pesan BUKAN laporan bencana yang valid, balas HANYA dengan JSON ini:
{"valid": false, "alasan": "<alasan singkat>"}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  })

  const data = await response.json()
  let teks = data.candidates?.[0]?.content?.parts?.[0]?.text || '{"valid": false, "alasan": "gagal memproses"}'
  teks = teks.replace(/```json/g, '').replace(/```/g, '').trim()
  return JSON.parse(teks)
}

// Rekomendasi AI buat dashboard relawan. Dulu Gemini dipanggil langsung dari browser,
// jadi API key-nya ikut kebawa ke bundle JS. Sekarang key cuma ada di server.
// Data titik dibaca sendiri dari Firestore (bukan dari kiriman browser),
// biar orang gak bisa nyelipin prompt sembarangan lewat endpoint ini.
exports.rekomendasiAI = onCall(async (request) => {
  // Cuma relawan terdaftar yang boleh pakai, biar kuota Gemini gak dihabisin orang luar
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Silakan masuk sebagai relawan terlebih dahulu')
  }
  const relawan = await db.collection('relawan').doc(request.auth.uid).get()
  if (!relawan.exists) {
    throw new HttpsError('permission-denied', 'Akun belum terdaftar sebagai relawan')
  }

  const { titikId, cuaca } = request.data || {}
  // Bahasa jawaban ngikutin bahasa tampilan aplikasi. Selain 'en' → Indonesia.
  const pakaiInggris = request.data?.bahasa === 'en'

  if (typeof titikId !== 'string' || !titikId) {
    throw new HttpsError('invalid-argument', 'titikId wajib diisi')
  }

  const snap = await db.collection('titik_anomali').doc(titikId).get()
  if (!snap.exists) {
    throw new HttpsError('not-found', 'Titik bencana tidak ditemukan')
  }
  const titik = snap.data()

  const adaRisikoHujan = !!cuaca?.adaRisikoHujan
  const suhu = Number.isFinite(Number(cuaca?.suhu)) ? Number(cuaca.suhu) : '-'
  const kondisi = typeof cuaca?.kondisi === 'string' ? cuaca.kondisi.slice(0, 50) : '-'

  const statusKomunikasi = titik.sumber_deteksi === 'laporan_warga_langsung'
    ? 'Komunikasi/sinyal di lokasi MASIH AKTIF (laporan datang langsung dari warga terdampak)'
    : titik.sumber_deteksi === 'validasi_relawan'
    ? 'Lokasi sudah divalidasi langsung oleh relawan/tim SAR di lapangan'
    : 'Terdeteksi dari anomali sinyal HP mati mendadak, KOMUNIKASI DIDUGA TERPUTUS di lokasi ini'

  const prompt = `
Kamu adalah asisten AI untuk sistem mitigasi bencana yang membantu tim SAR (Search and Rescue) di Indonesia.

Berikut data yang terdeteksi:
- Lokasi: ${titik.desa ? `Desa/Kel. ${titik.desa}, Kec. ` : ''}${titik.kecamatan}${titik.kabupaten ? `, ${titik.kabupaten}` : ''}
- Tingkat keparahan: ${titik.persentase_hp_mati}%
- Status deteksi: ${statusKomunikasi}
${titik.jumlah_jiwa_terdampak ? `- Perkiraan jiwa terdampak: ${titik.jumlah_jiwa_terdampak} orang` : ''}
${titik.catatan ? `- Catatan dari lapangan: ${titik.catatan}` : ''}
${cuaca
  ? `- Kondisi cuaca 24 jam ke depan: ${adaRisikoHujan ? 'Berpotensi hujan lebat/sedang' : 'Cuaca relatif stabil'}
- Suhu saat ini: ${suhu}°C, kondisi: ${kondisi}`
  : '- Data cuaca: TIDAK TERSEDIA untuk lokasi ini, jangan berasumsi soal cuaca'}
${titik.jenis_lokasi === 'pulau' ? `- Lokasi berupa pulau: akses kemungkinan harus lewat laut/udara${cuaca && titik.desa_cuaca ? `. Data cuaca di atas diambil dari desa terdekat (${titik.desa_cuaca}, ±${titik.jarak_desa_cuaca_km} km), kondisi laut bisa berbeda` : ''}` : ''}

Berdasarkan data di atas, berikan:
1. Tingkat urgensi (${pakaiInggris ? 'Low/Medium/High/Critical' : 'Rendah/Sedang/Tinggi/Kritis'}) dengan alasan singkat
2. Rekomendasi aksi konkret untuk tim SAR dalam 1-2 kalimat, termasuk perkiraan kebutuhan logistik dasar (air, makanan, tenda) jika data jiwa terdampak tersedia
3. Peringatan jika ada risiko bencana susulan (banjir/longsor) akibat cuaca

Jawab dengan format singkat dan jelas, gunakan ${pakaiInggris ? 'bahasa INGGRIS (English) — seluruh jawaban wajib dalam bahasa Inggris' : 'bahasa Indonesia'}, maksimal 100 kata. Jangan gunakan markdown atau simbol bintang.
`

  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  })

  if (!response.ok) {
    console.error('Gemini error', response.status, await response.text())
    throw new HttpsError('unavailable', 'Gagal mendapat respons dari Gemini AI')
  }

  const data = await response.json()
  const teksJawaban = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!teksJawaban) {
    throw new HttpsError('internal', 'Format respons AI tidak sesuai')
  }

  return { rekomendasi: teksJawaban }
})

exports.whatsappWebhook = onRequest(async (req, res) => {
  try {
    const { message, phone } = req.body

    if (!message) {
      return res.json({ reply: 'Pesan kosong. Contoh format laporan: "Lapor Cililin, longsor, kerusakan parah, sekitar 50 jiwa terdampak."' })
    }

    const hasil = await ekstrakLaporanDenganGemini(message)

    if (!hasil.valid) {
      return res.json({ reply: `Maaf, pesan belum bisa diproses sebagai laporan bencana (${hasil.alasan}). Contoh format: "Lapor Cililin, longsor, kerusakan parah, sekitar 50 jiwa terdampak."` })
    }

    const lokasi = lokasiList.find((l) => l.kecamatan === hasil.kecamatan)

    const ref = await db.collection('titik_anomali').add({
      kecamatan: lokasi.kecamatan,
      lat: lokasi.lat,
      lng: lokasi.lng,
      adm4: lokasi.adm4,
      jenis_bencana: jenisBencanaValid.includes(hasil.jenis_bencana) ? hasil.jenis_bencana : 'banjir',
      persentase_hp_mati: skorTingkatKerusakan[hasil.tingkat_kerusakan] || 70,
      jumlah_jiwa_terdampak: hasil.jumlah_jiwa_terdampak || null,
      catatan: hasil.catatan || '',
      waktu: new Date().toISOString(),
      sumber_deteksi: 'laporan_whatsapp',
      status: 'laporan_langsung',
    })

    // Nomor pengirim WA disimpan di koleksi privat (cuma relawan yang bisa baca),
    // biar relawan bisa konfirmasi laporan tanpa nomornya kebuka ke publik
    if (phone) {
      await db.collection('titik_privat').doc(ref.id).set({
        hp_pelapor: String(phone).slice(0, 30),
        sumber_kontak: 'whatsapp',
        waktu: new Date().toISOString(),
      }, { merge: true })
    }

    return res.json({ reply: `Terima kasih, laporan untuk ${lokasi.kecamatan} sudah kami terima dan sedang diproses. Tetap di tempat yang aman.` })
  } catch (error) {
    console.error(error)
    return res.json({ reply: 'Maaf, sistem sedang mengalami kendala. Silakan coba beberapa saat lagi.' })
  }
})