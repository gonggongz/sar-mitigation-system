import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import { t } from '../i18n'

// Akun relawan dibuat manual oleh administrator lewat Firebase Console,
// jadi di sini sengaja cuma ada form masuk — gak ada form daftar.
// Balikin kunci kamus, diterjemahin waktu ditampilkan.
function kunciErrorLogin(code) {
  if (code === 'auth/invalid-credential' || code === 'auth/invalid-email') return 'login.errSalah'
  if (code === 'auth/too-many-requests') return 'login.errBanyak'
  if (code === 'auth/network-request-failed') return 'login.errKoneksi'
  return 'login.errUmum'
}

function FormLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const masuk = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
      // Gak perlu pindah halaman manual — App.jsx dengerin status login
      // dan otomatis nampilin dashboard begitu login berhasil
    } catch (err) {
      setError(kunciErrorLogin(err.code))
      setLoading(false)
    }
  }

  return (
    <form onSubmit={masuk} className="bg-slate-800 border border-slate-700 p-5 rounded-xl text-white flex flex-col gap-4">
      <div>
        <h3 className="font-semibold">{t('login.judul')}</h3>
        <p className="text-xs text-slate-400 mt-1">{t('login.ket')}</p>
      </div>

      <div>
        <label className="text-sm text-slate-400 block mb-1">{t('login.email')}</label>
        <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-700 rounded-lg p-2" />
      </div>

      <div>
        <label className="text-sm text-slate-400 block mb-1">{t('login.password')}</label>
        <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-700 rounded-lg p-2" />
      </div>

      <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold py-2 rounded-lg transition">
        {loading ? t('login.memproses') : t('login.masuk')}
      </button>

      {error && <p className="text-sm text-center text-red-400">{t(error)}</p>}
    </form>
  )
}

export default FormLogin
