import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

// Semua titik bencana secara realtime, diurutin dari yang paling baru.
// Dipakai bareng sama peta, daftar laporan, galeri & panel detail,
// jadi semuanya selalu nampilin data yang sama & ikut update otomatis.
export function useTitikAnomali() {
  const [titikData, setTitikData] = useState([])
  const [siap, setSiap] = useState(false)

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'titik_anomali'), (snapshot) => {
      const data = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.waktu || '').localeCompare(a.waktu || ''))
      setTitikData(data)
      setSiap(true)
    })
    return () => unsubscribe()
  }, [])

  return { titikData, siap }
}
