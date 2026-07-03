import * as functions from 'firebase-functions/v1'

import { Client } from '@line/bot-sdk'

const getLineClient = () => new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN ?? '',
})

import { admin, db } from './firebaseAdmin'

// メッセージが作成されたら、ユーザー情報の「最後のメッセージ」を更新し、管理者の場合は LINE Push API で送信
export const onNewMessage = functions
  .region('asia-northeast1')
  .firestore.document('conversations/{userId}/messages/{msgId}')
  .onCreate(async (snap, context) => {
    const msg = snap.data()
    const { userId } = context.params

    try {
      // ユーザー情報の「最後のメッセージ」を更新
      await db.collection('users').doc(userId).update({
        lastMessage: msg.text,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      // 管理者からのメッセージであれば LINE に送信
      if (msg.type === 'admin') {
        const client = getLineClient()
        await client.pushMessage(userId, { type: 'text', text: msg.text })
        await snap.ref.update({ sent: true, sentAt: new Date() })
      }
    } catch (err: any) {
      console.error(`Error processing new message for ${userId}:`, err)
      if (msg.type === 'admin') {
        await snap.ref.update({ sent: false, error: err.message ?? String(err) })
      }
    }
  })
