import * as functions from 'firebase-functions/v1'
import { admin, db } from './firebaseAdmin'
import {
  Client,
  WebhookEvent,
  TextMessage,
  FollowEvent,
  MessageEvent,
  PostbackEvent,
} from '@line/bot-sdk'
import type { Request, Response } from 'firebase-functions/v1'

const getLineClient = () => new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN ?? '',
})

// ─── オンボーディング ────────────────────────────

async function getActiveOnboardingFlow() {
  const snap = await db.collection('onboarding_flows')
    .where('isActive', '==', true).limit(1).get()
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as any
}

async function sendNextOnboardingQuestion(client: Client, lineUserId: string, flow: any, stepIndex: number) {
  if (stepIndex >= flow.steps.length) {
    await db.collection('users').doc(lineUserId).update({
      onboardingStatus: 'completed',
      onboardingStep: stepIndex,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    await client.pushMessage(lineUserId, {
      type: 'text',
      text: '✅ ご回答ありがとうございます！\nあなたに合った情報をお届けします🌸\n\nこれからもよろしくお願いします！',
    })
    return
  }

  const step = flow.steps[stepIndex]
  if (step.type === 'single' || step.type === 'multi') {
    const quickReplyItems = (step.options ?? []).map((opt: string) => ({
      type: 'action' as const,
      action: { type: 'message' as const, label: opt.length > 20 ? opt.substring(0, 20) : opt, text: opt },
    }))
    await client.pushMessage(lineUserId, {
      type: 'text',
      text: step.question + (step.type === 'multi' ? '\n（複数選んで送信できます）' : ''),
      quickReply: { items: quickReplyItems.slice(0, 13) },
    } as TextMessage)
  } else {
    await client.pushMessage(lineUserId, { type: 'text', text: step.question })
  }
}

// ─── 支援情報カテゴリ検索 ────────────────────────

async function handleCategorySearch(event: PostbackEvent, client: Client, category?: string) {
  let contentsQuery: FirebaseFirestore.Query = db.collection('contents')
    .where('status', '==', 'published')
  if (category) {
    contentsQuery = contentsQuery.where('category', '==', category)
  }
  const snap = await contentsQuery.limit(10).get()

  if (snap.empty) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: category
        ? `「${category}」の情報はまだ準備中です🙇\nほかのカテゴリもぜひご覧ください！`
        : '支援情報はまだ準備中です🙇\n公開までもうしばらくお待ちください！',
    })
    return
  }

  const BASE_URL = 'https://kizuna-project-d7a79.web.app'

  const bubbles: any[] = snap.docs.map(d => {
    const c = d.data()
    // linkUrl未設定または暫定値の場合は公開ページURLを自動生成
    const linkUrl = (c.linkUrl && c.linkUrl !== '__pending__')
      ? c.linkUrl
      : `${BASE_URL}/p/${d.id}`

    return {
      type: 'bubble',
      size: 'kilo',
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: 'xl',
        contents: [
          { type: 'text', text: `📂 ${c.category}`, size: 'xs', color: '#DC2626' },
          { type: 'text', text: c.title, weight: 'bold', size: 'sm', wrap: true, color: '#333333', margin: 'sm' },
          { type: 'text', text: (c.body ?? '').substring(0, 60) + '…', size: 'xs', wrap: true, color: '#666666', margin: 'sm' },
        ],
      },
      footer: {
        type: 'box', layout: 'vertical', paddingAll: 'lg',
        contents: [{
          type: 'button', height: 'sm', style: 'primary', color: '#DC2626',
          action: { type: 'uri', label: '全文を読む 📖', uri: linkUrl },
        }],
      },
    }
  })

  await client.replyMessage(event.replyToken, {
    type: 'flex',
    altText: category ? `${category}の支援情報` : '支援情報',
    contents: { type: 'carousel', contents: bubbles },
  })
}

// ─── イベント検索 ────────────────────────────────

function formatDate(ts: any): string {
  if (!ts) return '日時未定'
  const d = ts.toDate?.() ?? new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function buildEventBubble(d: FirebaseFirestore.QueryDocumentSnapshot): any {
  const ev = d.data()
  const linkUrl = ev.linkUrl || 'https://kizuna-project-inc.com/'
  const bodyContents: any[] = [
    { type: 'text', text: '📅 イベント', size: 'xs', color: '#DC2626' },
    { type: 'text', text: ev.title, weight: 'bold', size: 'sm', wrap: true, color: '#333333', margin: 'sm' },
    { type: 'text', text: `🗓 ${formatDate(ev.startAt)}`, size: 'xs', color: '#666666', margin: 'sm' },
  ]
  if (ev.location) bodyContents.push({ type: 'text', text: `📍 ${ev.location}`, size: 'xs', color: '#666666', margin: 'xs' })
  if (ev.targetChildren?.length) bodyContents.push({ type: 'text', text: `👶 対象: お子様${(ev.targetChildren as string[]).join('・')}`, size: 'xs', color: '#888888', margin: 'xs' })
  if (ev.description) bodyContents.push({ type: 'text', text: (ev.description as string).substring(0, 60) + '…', size: 'xs', wrap: true, color: '#888888', margin: 'sm' })
  return {
    type: 'bubble', size: 'kilo',
    body: { type: 'box', layout: 'vertical', paddingAll: 'xl', contents: bodyContents },
    footer: {
      type: 'box', layout: 'vertical', paddingAll: 'lg',
      contents: [{ type: 'button', height: 'sm', style: 'primary', color: '#DC2626', action: { type: 'uri', label: '詳しく見る 📖', uri: linkUrl } }],
    },
  }
}

async function handleEventSearch(
  event: PostbackEvent | MessageEvent,
  client: Client,
  filters: { location?: string; kids?: string } = {},
) {
  const now = new Date()

  // フィルター説明テキスト
  const filterDesc = [
    filters.location ? `📍 ${filters.location}` : '',
    filters.kids ? `👶 お子様${filters.kids}` : '',
  ].filter(Boolean).join(' / ')

  let upcoming: FirebaseFirestore.QueryDocumentSnapshot[] = []
  let allPublishedDocs: FirebaseFirestore.QueryDocumentSnapshot[] = []

  try {
    // ベースクエリ（フィルターなし）
    const baseSnap = await db.collection('events')
      .where('status', '==', 'published')
      .orderBy('startAt', 'asc')
      .limit(50)
      .get()
    allPublishedDocs = baseSnap.docs

    // メモリ内でフィルタリング（複合インデックス不要・確実に動作）
    upcoming = allPublishedDocs.filter(d => {
      const ev = d.data()
      const s = ev.startAt?.toDate?.()
      if (s && s < now) return false                                          // 過去イベント除外
      if (filters.location && ev.location !== filters.location) return false  // 場所フィルター
      if (filters.kids && !(ev.targetChildren ?? []).includes(filters.kids)) return false // 人数フィルター
      return true
    }).slice(0, 5)
  } catch (err) {
    console.error('event search error:', err)
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'イベント情報の取得に失敗しました🙇\nしばらく時間をおいて再度お試しください。',
    })
    return
  }

  // 0件の場合
  if (upcoming.length === 0) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: filterDesc
        ? `${filterDesc} に該当するイベントは現在ありません🙇\n「🔄 絞込をリセット」で全件を確認できます！`
        : '現在公開中のイベントはありません🙇\nまた後日ご確認ください！',
      quickReply: filterDesc ? {
        items: [{
          type: 'action',
          action: { type: 'postback', label: '🔄 絞込をリセット', data: 'action=event_filter', displayText: 'すべてのイベントを見る' },
        }],
      } : undefined,
    } as any)
    return
  }

  const bubbles = upcoming.map(buildEventBubble)

  // 絞り込みクイックリプライ（最大13件）
  const filterItems: any[] = []

  // 場所で絞る — 公開イベントの場所一覧
  const locations = [...new Set(allPublishedDocs.map(d => d.data().location as string).filter(Boolean))].slice(0, 4)
  if (!filters.location && locations.length > 1) {
    locations.forEach(loc => filterItems.push({
      type: 'action',
      action: { type: 'postback', label: `📍 ${loc}`.substring(0, 20), data: `action=event_filter&loc=${encodeURIComponent(loc)}`, displayText: `📍 ${loc}` },
    }))
  }

  // 子供の人数で絞る
  if (!filters.kids) {
    ['1人', '2人', '3人以上'].forEach(kids => filterItems.push({
      type: 'action',
      action: { type: 'postback', label: `👶 ${kids}`, data: `action=event_filter&kids=${encodeURIComponent(kids)}`, displayText: `お子様${kids}で絞込` },
    }))
  }

  // フィルターリセット
  if (filters.location || filters.kids) {
    filterItems.push({
      type: 'action',
      action: { type: 'postback', label: '🔄 絞込をリセット', data: 'action=event_filter', displayText: 'すべてのイベントを見る' },
    })
  }

  const message: any = {
    type: 'flex',
    altText: '開催予定のイベント',
    contents: { type: 'carousel', contents: bubbles },
  }
  if (filterItems.length > 0) {
    message.quickReply = { items: filterItems.slice(0, 13) }
  }

  await client.replyMessage(event.replyToken, message)
}

// ─── FAQ ────────────────────────────────────────

async function handleFaq(event: PostbackEvent | MessageEvent, client: Client) {
  const snap = await db.collection('faqs')
    .where('isActive', '==', true)
    .orderBy('order', 'asc')
    .limit(8).get()

  if (snap.empty) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'よくある質問は準備中です。\nお気軽にメッセージでご相談ください😊',
    })
    return
  }

  const contents: any[] = snap.docs.map(d => {
    const f = d.data()
    return {
      type: 'box', layout: 'vertical', paddingAll: 'lg',
      borderWidth: '1px', borderColor: '#FECACA', cornerRadius: 'xl', margin: 'md',
      contents: [
        { type: 'text', text: `❓ ${f.question}`, weight: 'bold', size: 'sm', wrap: true, color: '#333333' },
        { type: 'text', text: f.answer, size: 'xs', wrap: true, color: '#555555', margin: 'sm' },
      ],
    }
  })

  await client.replyMessage(event.replyToken, {
    type: 'flex',
    altText: 'よくある質問',
    contents: {
      type: 'bubble',
      header: {
        type: 'box', layout: 'vertical', paddingAll: 'xl', backgroundColor: '#FEF2F2',
        contents: [{ type: 'text', text: '❓ よくある質問', weight: 'bold', size: 'md', color: '#DC2626' }],
      },
      body: { type: 'box', layout: 'vertical', paddingAll: 'lg', contents },
    },
  })
}

// ─── Postback（リッチメニューボタン） ───────────

async function handlePostback(event: PostbackEvent, client: Client) {
  const params = new URLSearchParams(event.postback.data)
  const action = params.get('action')

  switch (action) {
    // 支援情報を探す → カテゴリ（種別管理）で絞り込み
    case 'search': {
      const catSnap = await db.collection('categories').orderBy('order', 'asc').get()
      const catNames: string[] = catSnap.empty
        ? ['子育て支援', '住居支援', '就労支援', '経済支援', '法律・権利', 'その他']
        : catSnap.docs.map(d => d.data().name as string)
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: '🔍 どのカテゴリの情報をお探しですか？\n以下から選んでください👇',
        quickReply: {
          items: catNames.slice(0, 13).map(cat => ({
            type: 'action' as const,
            action: { type: 'postback' as const, label: cat.length > 20 ? cat.substring(0, 20) : cat, data: `action=search_cat&cat=${cat}`, displayText: cat },
          })),
        },
      } as TextMessage)
      break
    }

    // カテゴリ確定 → 記事一覧（イベントは専用コレクション）
    case 'search_cat': {
      const cat = params.get('cat') ?? ''
      if (cat === 'イベント') {
        await handleEventSearch(event, client)
      } else {
        await handleCategorySearch(event, client, cat)
      }
      break
    }

    // イベント絞り込み
    case 'event_filter':
      await handleEventSearch(event, client, {
        location: params.get('loc') ? decodeURIComponent(params.get('loc')!) : undefined,
        kids: params.get('kids') ? decodeURIComponent(params.get('kids')!) : undefined,
      })
      break

    // 公式Webサイト（旧postbackとの互換対応）
    case 'website':
      await client.replyMessage(event.replyToken, {
        type: 'template',
        altText: '公式Webサイトはこちら',
        template: {
          type: 'buttons',
          text: '🌐 絆プロジェクトの公式Webサイトはこちらからどうぞ！',
          actions: [
            { type: 'uri', label: 'Webサイトを開く', uri: 'https://kizuna-project-inc.com/' },
          ],
        },
      })
      break

    // 質問・相談（準備中）
    case 'consult':
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: '💬 質問・相談機能は現在準備中です。\n公開までもうしばらくお待ちください🙏',
      })
      break

    // 診断 → LIFF（コンテンツ診断画面）を案内
    case 'diagnosis': {
      const liffDiagnosisId = process.env.LIFF_DIAGNOSIS_ID ?? ''
      if (!liffDiagnosisId) {
        await client.replyMessage(event.replyToken, {
          type: 'text',
          text: '📋 診断は現在準備中です。\nもうしばらくお待ちください🙏',
        })
        break
      }
      await client.replyMessage(event.replyToken, {
        type: 'flex',
        altText: 'あなたに必要な支援情報を診断します',
        contents: {
          type: 'bubble',
          body: {
            type: 'box', layout: 'vertical',
            contents: [
              { type: 'text', text: '📋 コンテンツ診断', weight: 'bold', size: 'md', color: '#DC2626' },
              { type: 'text', text: 'いくつかの質問に答えると、あなたに必要な支援情報をご案内します（1分で完了）', size: 'sm', color: '#666666', wrap: true, margin: 'md' },
            ],
          },
          footer: {
            type: 'box', layout: 'vertical',
            contents: [{
              type: 'button', style: 'primary', color: '#DC2626',
              action: { type: 'uri', label: '診断をはじめる →', uri: `https://liff.line.me/${liffDiagnosisId}` },
            }],
          },
        },
      })
      break
    }

    // よくある質問
    case 'faq':
      await handleFaq(event, client)
      break

    // イベント
    case 'events':
      await handleEventSearch(event, client, {})
      break
  }
}

// ─── フォロー ────────────────────────────────────

async function handleFollow(event: FollowEvent, client: Client) {
  const lineUserId = event.source.userId!
  const profile = await client.getProfile(lineUserId)

  await db.collection('users').doc(lineUserId).set({
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl ?? '',
    tags: [],
    attributes: {},
    onboardingStatus: 'in_progress',
    onboardingStep: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true })

  const liffId = process.env.LIFF_ID ?? ''
  const liffUrl = liffId ? `https://liff.line.me/${liffId}` : ''

  if (liffUrl) {
    await client.replyMessage(event.replyToken, [
      {
        type: 'text',
        text: `こんにちは、${profile.displayName}さん！🌸\n絆プロジェクトへようこそ！\n\nひとりで頑張らなくていいよ。\nあなたに寄り添う情報をお届けします💕`,
      },
      {
        type: 'flex',
        altText: 'プロフィールを設定してください',
        contents: {
          type: 'bubble',
          body: {
            type: 'box', layout: 'vertical',
            contents: [
              { type: 'text', text: '🐣 プロフィール設定', weight: 'bold', size: 'md', color: '#DC2626' },
              { type: 'text', text: 'あなたに合った情報をお届けするために、いくつか教えてください（1分で完了）', size: 'sm', color: '#666666', wrap: true, margin: 'md' },
            ],
          },
          footer: {
            type: 'box', layout: 'vertical',
            contents: [{
              type: 'button',
              action: { type: 'uri', label: 'プロフィールを設定する →', uri: liffUrl },
              style: 'primary', color: '#DC2626',
            }],
          },
        },
      },
    ])
  } else {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: `こんにちは、${profile.displayName}さん！🌸\n絆プロジェクトへようこそ！`,
    })
  }
}

// ─── メッセージ ──────────────────────────────────

async function handleMessage(event: MessageEvent, client: Client) {
  if (event.message.type !== 'text') return
  const lineUserId = event.source.userId!
  const text = event.message.text

  await db.collection('conversations').doc(lineUserId)
    .collection('messages').add({
      text,
      type: 'user',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    })

  await db.collection('users').doc(lineUserId).update({
    lastMessage: text,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })

  const userSnap = await db.collection('users').doc(lineUserId).get()
  if (!userSnap.exists) return
  const userData = userSnap.data()!

  // オンボーディング中
  if (userData.onboardingStatus === 'in_progress') {
    const flow = await getActiveOnboardingFlow()
    if (!flow) return
    const stepIndex = userData.onboardingStep ?? 0
    if (stepIndex >= flow.steps.length) return

    const step = flow.steps[stepIndex]
    const updates: Record<string, any> = { updatedAt: admin.firestore.FieldValue.serverTimestamp() }

    if (step.attributeKey) {
      if (step.type === 'multi') {
        const current = userData.attributes?.[step.attributeKey] ?? []
        updates[`attributes.${step.attributeKey}`] = [...new Set([...current, text])]
      } else {
        updates[`attributes.${step.attributeKey}`] = text
      }
    }
    if (step.tagMapping?.[text]) {
      updates.tags = admin.firestore.FieldValue.arrayUnion(step.tagMapping[text])
    }
    updates.onboardingStep = stepIndex + 1

    await db.collection('users').doc(lineUserId).update(updates)
    await sendNextOnboardingQuestion(client, lineUserId, flow, stepIndex + 1)
    return
  }

  // キーワード対応
  const keywords: Record<string, () => Promise<void>> = {
    'よくある質問': () => handleFaq(event, client),
    'イベント': () => handleEventSearch(event, client, {}),
    '公式Webサイト': async () => {
      await client.replyMessage(event.replyToken, {
        type: 'template',
        altText: '公式Webサイトはこちら',
        template: {
          type: 'buttons',
          text: '🌐 絆プロジェクトの公式Webサイトはこちらからどうぞ！',
          actions: [
            { type: 'uri', label: 'Webサイトを開く', uri: 'https://kizuna-project-inc.com/' },
          ],
        },
      })
    },
  }
  for (const [kw, handler] of Object.entries(keywords)) {
    if (text.includes(kw)) { await handler(); return }
  }

  // その他は管理者への転送として無視（管理画面から返信）
}

// ─── Webhook エントリーポイント ──────────────────

export const lineWebhook = functions
  .region('asia-northeast1')
  .https.onRequest(async (req: Request, res: Response) => {
    if (req.method !== 'POST') { res.status(405).send('Method Not Allowed'); return }

    const client = getLineClient()
    const events: WebhookEvent[] = req.body.events ?? []

    try {
      await Promise.all(events.map(async (event) => {
        switch (event.type) {
          case 'follow':
            await handleFollow(event, client); break
          case 'message':
            await handleMessage(event as MessageEvent, client); break
          case 'postback':
            await handlePostback(event as PostbackEvent, client); break
          case 'unfollow':
            await db.collection('users').doc(event.source.userId!).update({
              blocked: true,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }); break
        }
      }))
      res.status(200).send('OK')
    } catch (err) {
      console.error('Webhook error:', err)
      res.status(500).send('Internal Server Error')
    }
  })
