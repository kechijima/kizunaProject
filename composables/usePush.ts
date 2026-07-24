import { getMessaging, getToken, isSupported, deleteToken } from 'firebase/messaging'
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'

// FCM Web Push の有効化・無効化を扱うコンポーザブル
export const usePush = () => {
  const { auth, db } = useFirebase()
  const config = useRuntimeConfig()

  const supported = ref(false)
  const permission = ref<NotificationPermission>('default')
  const enabling = ref(false)
  const currentToken = ref<string | null>(null)

  const init = async () => {
    if (typeof window === 'undefined') return
    supported.value = 'Notification' in window && (await isSupported().catch(() => false))
    if (supported.value) permission.value = Notification.permission
  }

  const registerSW = async (): Promise<ServiceWorkerRegistration> => {
    return navigator.serviceWorker.register('/firebase-messaging-sw.js')
  }

  // 通知を有効化：許可要求 → トークン取得 → Firestoreへ保存
  const enable = async (): Promise<{ ok: boolean; message: string }> => {
    if (!supported.value) return { ok: false, message: 'このブラウザは通知に対応していません' }
    const vapidKey = config.public.fcmVapidKey as string
    if (!vapidKey) return { ok: false, message: '通知設定（VAPIDキー）が未設定です。管理者にお問い合わせください' }

    enabling.value = true
    try {
      const perm = await Notification.requestPermission()
      permission.value = perm
      if (perm !== 'granted') return { ok: false, message: '通知が許可されませんでした' }

      const registration = await registerSW()
      const messaging = getMessaging()
      const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration })
      if (!token) return { ok: false, message: 'トークンの取得に失敗しました' }

      const uid = auth.currentUser?.uid ?? 'unknown'
      await setDoc(doc(db, 'push_tokens', token), {
        uid,
        email: auth.currentUser?.email ?? '',
        userAgent: navigator.userAgent,
        createdAt: serverTimestamp(),
      })
      currentToken.value = token
      return { ok: true, message: '通知を有効にしました' }
    } catch (e: any) {
      return { ok: false, message: '有効化に失敗しました: ' + (e?.message ?? String(e)) }
    } finally {
      enabling.value = false
    }
  }

  // 通知を無効化：トークン削除
  const disable = async (): Promise<{ ok: boolean; message: string }> => {
    try {
      const messaging = getMessaging()
      const vapidKey = config.public.fcmVapidKey as string
      const registration = await registerSW()
      const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration }).catch(() => null)
      if (token) {
        await deleteDoc(doc(db, 'push_tokens', token)).catch(() => {})
        await deleteToken(messaging).catch(() => {})
      }
      currentToken.value = null
      return { ok: true, message: '通知を無効にしました' }
    } catch (e: any) {
      return { ok: false, message: '無効化に失敗しました: ' + (e?.message ?? String(e)) }
    }
  }

  return { supported, permission, enabling, currentToken, init, enable, disable }
}
