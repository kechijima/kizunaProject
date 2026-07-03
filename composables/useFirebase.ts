import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getApps } from 'firebase/app'

export const useFirebase = () => {
  const nuxtApp = useNuxtApp()
  return {
    auth: nuxtApp.$auth as ReturnType<typeof getAuth>,
    db: nuxtApp.$db as ReturnType<typeof getFirestore>,
  }
}
