import * as functions from 'firebase-functions/v1'
import { admin, db } from './firebaseAdmin'
import { Client } from '@line/bot-sdk'

const getLineClient = () => {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN ?? ''
  return new Client({ channelAccessToken })
}

async function getUsersBySegment(segmentId: string): Promise<string[]> {
  const segSnap = await db.collection('segments').doc(segmentId).get()
  if (!segSnap.exists) return []

  const segment = segSnap.data()!
  let query: admin.firestore.Query = db.collection('users')
    .where('onboardingStatus', '==', 'completed')

  if (segment.conditions?.tags?.length > 0) {
    query = query.where('tags', 'array-contains-any', segment.conditions.tags)
  }

  const snap = await query.get()
  return snap.docs.map(d => d.id)
}

export const broadcastScheduler = functions
  .region('asia-northeast1')
  .pubsub.schedule('every 5 minutes')
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now()
    const client = getLineClient()

    const snap = await db.collection('broadcasts')
      .where('status', '==', 'scheduled')
      .where('scheduledAt', '<=', now)
      .get()

    for (const docSnap of snap.docs) {
      const broadcast = docSnap.data()
      await docSnap.ref.update({ status: 'sending' })

      try {
        const contentSnap = await db.collection('contents').doc(broadcast.contentId).get()
        if (!contentSnap.exists) continue
        const content = contentSnap.data()!

        const userIds = await getUsersBySegment(broadcast.segmentId)

        const messages: any[] = []
        if (broadcast.message) {
          messages.push({ type: 'text', text: broadcast.message })
        }

        const flexBody: any = {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: content.title,
              weight: 'bold',
              size: 'md',
              wrap: true,
            },
            {
              type: 'text',
              text: content.body.substring(0, 120) + (content.body.length > 120 ? '...' : ''),
              size: 'sm',
              color: '#666666',
              wrap: true,
              margin: 'md',
            },
          ],
        }

        const flexBubble: any = {
          type: 'bubble',
          body: flexBody,
        }

        if (content.imageUrl) {
          flexBubble.hero = {
            type: 'image',
            url: content.imageUrl,
            size: 'full',
            aspectRatio: '20:13',
            aspectMode: 'cover',
          }
        }

        if (content.linkUrl) {
          flexBubble.footer = {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'button',
                action: {
                  type: 'uri',
                  label: '詳しく見る',
                  uri: content.linkUrl,
                },
                style: 'primary',
                color: '#DC2626',
              },
            ],
          }
        }

        messages.push({
          type: 'flex',
          altText: content.title,
          contents: flexBubble,
        })

        const batchSize = 500
        for (let i = 0; i < userIds.length; i += batchSize) {
          const batch = userIds.slice(i, i + batchSize)
          await client.multicast(batch, messages)
        }

        await docSnap.ref.update({
          status: 'done',
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          'stats.sent': userIds.length,
        })
      } catch (err) {
        console.error(`Broadcast ${docSnap.id} failed:`, err)
        await docSnap.ref.update({ status: 'failed' })
      }
    }
  })
