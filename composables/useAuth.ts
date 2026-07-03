import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

export const useAuth = () => {
  const { auth, db } = useFirebase()
  const user = useState<User | null>('auth-user', () => null)
  const adminProfile = useState<{ name: string; role: string } | null>('admin-profile', () => null)
  const loading = useState<boolean>('auth-loading', () => true)

  const login = async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email, password)
    return credential.user
  }

  const logout = async () => {
    await signOut(auth)
    user.value = null
    adminProfile.value = null
    navigateTo('/login')
  }

  const fetchAdminProfile = async (uid: string) => {
    const snap = await getDoc(doc(db, 'admins', uid))
    if (snap.exists()) {
      adminProfile.value = snap.data() as { name: string; role: string }
    }
  }

  const init = () => {
    onAuthStateChanged(auth, async (u) => {
      user.value = u
      if (u) {
        await fetchAdminProfile(u.uid)
      }
      loading.value = false
    })
  }

  return { user, adminProfile, loading, login, logout, init }
}
