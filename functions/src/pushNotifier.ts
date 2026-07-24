import * as functions from 'firebase-functions/v1'
import { admin, db } from './firebaseAdmin'

const APP_URL = 'https://kizuna-project-d7a79.web.app'

// 登録済み管理者トークンを取得
async function getAdminTokens(): Promise<string[]> {
  const snap = await db.collection('push_tokens').get()
  return snap.docs.map(d => d.id)
}

// 管理者全員へWeb Push通知を送信し、無効トークンは削除
async function sendToAdmins(title: string, body: string, url: string) {
  const tokens = await getAdminTokens()
  if (tokens.length === 0) return

  const res = await admin.messaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    webpush: {
      notification: { title, body, icon: '/icons/icon-192.png' },
      fcmOptions: { link: url },
    },
  })

  // 失敗した無効トークンを掃除
  const toDelete: string[] = []
  res.responses.forEach((r, i) => {
    if (!r.success) {
      const code = r.error?.code ?? ''
      if (code.includes('registration-token-not-registered') || code.includes('invalid-argument')) {
        toDelete.push(tokens[i])
      }
    }
  })
  await Promise.all(toDelete.map(t => db.collection('push_tokens').doc(t).delete().catch(() => {})))
}

// イベント参加申し込み → 管理者へ通知
export const onEventApplication = functions
  .region('asia-northeast1')
  .firestore.document('events/{eventId}/applications/{appId}')
  .onCreate(async (snap, context) => {
    const data = snap.data()
    const name = data.name || data.answers?.[0]?.value || '申込者'
    const eventTitle = data.eventTitle || 'イベント'
    await sendToAdmins(
      '📅 新しいイベント参加申し込み',
      `「${eventTitle}」に ${name} さんが申し込みました`,
      `${APP_URL}/events/${context.params.eventId}`,
    ).catch(err => console.error('push (application) failed:', err))
  })

// ユーザーからのチャット受信 → 管理者へ通知
export const onUserMessage = functions
  .region('asia-northeast1')
  .firestore.document('conversations/{userId}/messages/{msgId}')
  .onCreate(async (snap, context) => {
    const msg = snap.data()
    if (msg.type !== 'user') return
    const { userId } = context.params

    // 送信者の表示名を取得
    let displayName = 'ユーザー'
    try {
      const userSnap = await db.collection('users').doc(userId).get()
      if (userSnap.exists) displayName = userSnap.data()?.displayName || displayName
    } catch { /* noop */ }

    const text = String(msg.text ?? '').substring(0, 60)
    await sendToAdmins(
      '💬 新しいメッセージ',
      `${displayName}：${text}`,
      `${APP_URL}/chat`,
    ).catch(err => console.error('push (message) failed:', err))
  })
