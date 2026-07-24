/* 絆プロジェクト 管理画面 サービスワーカー
 * - PWA のインストール要件を満たす（fetchハンドラ）
 * - FCM のバックグラウンド通知を受信して表示する
 */
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyDVHRA44so5akMJ7yvRPwmKoySPr085Ff4',
  authDomain: 'kizuna-project-d7a79.firebaseapp.com',
  projectId: 'kizuna-project-d7a79',
  storageBucket: 'kizuna-project-d7a79.firebasestorage.app',
  messagingSenderId: '810254592313',
  appId: '1:810254592313:web:b8da5c034b553d751120e8',
})

const messaging = firebase.messaging()

// バックグラウンド受信時に通知を表示
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || '絆プロジェクト'
  const options = {
    body: payload.notification?.body || payload.data?.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: payload.fcmOptions?.link || payload.data?.url || '/' },
  }
  self.registration.showNotification(title, options)
})

// 通知クリックで該当ページを開く
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) { c.navigate(url); return c.focus() }
      }
      if (clients.openWindow) return clients.openWindow(url)
    }),
  )
})

// インストール要件を満たすための最小 fetch ハンドラ（ネットワークそのまま）
self.addEventListener('fetch', () => {})
