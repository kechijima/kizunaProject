import * as functions from 'firebase-functions/v1'
import { db } from './firebaseAdmin'
import { Client } from '@line/bot-sdk'

const getLineClient = () => new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN ?? '',
})

// 診断完了（lastDiagnosisAt の更新）を検知し、合計ポイントに応じた相談案内をLINEに送信
export const onDiagnosisComplete = functions
  .region('asia-northeast1')
  .firestore.document('users/{userId}')
  .onWrite(async (change, context) => {
    if (!change.after.exists) return
    const before = change.before.exists ? change.before.data()! : {}
    const after = change.after.data()!

    const beforeAt = before.lastDiagnosisAt?.toMillis?.() ?? 0
    const afterAt = after.lastDiagnosisAt?.toMillis?.() ?? 0
    if (afterAt === 0 || afterAt === beforeAt) return

    const flowSnap = await db.collection('diagnosis_flows')
      .where('isActive', '==', true).limit(1).get()
    if (flowSnap.empty) return
    const result = flowSnap.docs[0].data().result
    if (!result) return

    const score = Number(after.diagnosisScore ?? 0)
    const { userId } = context.params
    const client = getLineClient()

    try {
      if (result.onlineMessage && score >= Number(result.onlineThreshold ?? Infinity)) {
        // オンライン相談への案内（URL設定時はボタン付き）
        if (result.onlineUrl) {
          await client.pushMessage(userId, {
            type: 'flex',
            altText: result.onlineMessage,
            contents: {
              type: 'bubble',
              body: {
                type: 'box', layout: 'vertical',
                contents: [
                  { type: 'text', text: '📞 オンライン相談のご案内', weight: 'bold', size: 'md', color: '#DC2626' },
                  { type: 'text', text: result.onlineMessage, size: 'sm', color: '#666666', wrap: true, margin: 'md' },
                ],
              },
              footer: {
                type: 'box', layout: 'vertical',
                contents: [{
                  type: 'button', style: 'primary', color: '#DC2626',
                  action: { type: 'uri', label: 'オンライン相談を予約する', uri: result.onlineUrl },
                }],
              },
            },
          })
        } else {
          await client.pushMessage(userId, { type: 'text', text: result.onlineMessage })
        }
      } else if (result.chatMessage && score >= Number(result.chatThreshold ?? Infinity)) {
        await client.pushMessage(userId, { type: 'text', text: result.chatMessage })
      } else if (result.defaultMessage) {
        await client.pushMessage(userId, { type: 'text', text: result.defaultMessage })
      }
    } catch (err) {
      console.error(`Diagnosis notification failed for ${userId} (score: ${score}):`, err)
    }
  })
