import { initializeApp } from 'firebase/app'
import { getFirestore, collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'

const app = initializeApp({
  apiKey: 'AIzaSyDVHRA44so5akMJ7yvRPwmKoySPr085Ff4',
  authDomain: 'kizuna-project-d7a79.firebaseapp.com',
  projectId: 'kizuna-project-d7a79',
})
const db = getFirestore(app)
const auth = getAuth(app)

await signInWithEmailAndPassword(auth, 'alljapanekiden@gmail.com', 's0011324')

console.log('=== 配信テスト 診断レポート ===\n')

// 1. 対象配信を取得
const bSnap = await getDocs(query(collection(db, 'broadcasts'), where('title', '==', '配信テスト')))
if (bSnap.empty) {
  console.log('❌ 「配信テスト」という配信が見つかりません')
  process.exit(1)
}

for (const bDoc of bSnap.docs) {
  const b = bDoc.data()
  console.log('【配信ドキュメント】')
  console.log(`  ID        : ${bDoc.id}`)
  console.log(`  title     : ${b.title}`)
  console.log(`  status    : ${b.status}`)
  console.log(`  segmentId : ${b.segmentId}`)
  console.log(`  contentId : ${b.contentId}`)
  console.log(`  scheduledAt: ${b.scheduledAt?.toDate?.()?.toISOString() ?? b.scheduledAt}`)
  console.log(`  sentAt    : ${b.sentAt?.toDate?.()?.toISOString() ?? '-'}`)
  console.log(`  stats     : ${JSON.stringify(b.stats ?? {})}`)
  console.log()

  // 2. ステータス確認
  const now = new Date()
  const scheduledAt = b.scheduledAt?.toDate?.()
  if (b.status !== 'scheduled') {
    console.log(`⚠️  status が "${b.status}" のため broadcastScheduler の対象外です`)
    if (b.status === 'cancelled') console.log('   → 取消済みの配信です')
    if (b.status === 'done') console.log('   → 配信完了済みです')
    if (b.status === 'failed') console.log('   → 配信に失敗しています')
  } else if (scheduledAt && scheduledAt > now) {
    console.log(`⏳ scheduledAt が未来 (${scheduledAt.toISOString()}) のためまだ配信されません`)
  } else {
    console.log(`✅ status=scheduled, scheduledAt は過去 → broadcastScheduler の実行を待っています`)
    console.log('   ※ broadcastScheduler は5分ごとに動作します')
  }
  console.log()

  // 3. セグメント確認
  if (b.segmentId) {
    const segDoc = await getDoc(doc(db, 'segments', b.segmentId))
    if (!segDoc.exists()) {
      console.log(`❌ セグメント (${b.segmentId}) が存在しません → 配信不可`)
    } else {
      const seg = segDoc.data()
      console.log('【セグメント】')
      console.log(`  name      : ${seg.name}`)
      console.log(`  conditions: ${JSON.stringify(seg.conditions)}`)
      console.log(`  userCount : ${seg.userCount}`)

      // 4. 対象ユーザー確認
      const conditions = seg.conditions ?? {}
      const userIds = new Set()

      if (conditions.tags?.length) {
        const uSnap = await getDocs(collection(db, 'users'))
        uSnap.docs.forEach(d => {
          const tags = d.data().tags ?? []
          if (conditions.tags.every(t => tags.includes(t))) userIds.add(d.id)
        })
      }
      if (conditions.anyTags?.length) {
        const uSnap = await getDocs(query(collection(db, 'users'), where('tags', 'array-contains-any', conditions.anyTags)))
        uSnap.docs.forEach(d => userIds.add(d.id))
      }
      if (!conditions.tags?.length && !conditions.anyTags?.length) {
        const uSnap = await getDocs(collection(db, 'users'))
        uSnap.docs.forEach(d => userIds.add(d.id))
      }

      console.log(`  実際の対象ユーザー数: ${userIds.size} 人`)
      if (userIds.size === 0) {
        console.log('  ❌ 対象ユーザーが0人 → LINE送信が発生しません')
        // 全ユーザーのタグを表示
        const allUsers = await getDocs(collection(db, 'users'))
        console.log(`\n  全ユーザー (${allUsers.size}人) のタグ一覧:`)
        allUsers.docs.forEach(d => {
          const u = d.data()
          console.log(`    - ${u.displayName ?? d.id}: ${JSON.stringify(u.tags ?? [])}`)
        })
      } else {
        console.log(`  対象ユーザーID:`)
        userIds.forEach(id => console.log(`    - ${id}`))
      }
    }
  } else {
    console.log('⚠️  segmentId が未設定です（全ユーザーへの配信になりますが実装上は対象なし）')
  }
  console.log()

  // 5. コンテンツ確認
  if (b.contentId) {
    const cDoc = await getDoc(doc(db, 'contents', b.contentId))
    if (!cDoc.exists()) {
      console.log(`❌ コンテンツ (${b.contentId}) が存在しません → 配信不可`)
    } else {
      const c = cDoc.data()
      console.log('【コンテンツ】')
      console.log(`  title  : ${c.title}`)
      console.log(`  status : ${c.status}`)
      console.log(`  body   : ${c.body?.substring(0, 50)}...`)
      if (c.status !== 'published') {
        console.log(`  ⚠️  status が "${c.status}" です（published 以外でも送信は可能）`)
      } else {
        console.log('  ✅ コンテンツ正常')
      }
    }
  } else {
    console.log('❌ contentId が未設定です → 配信不可')
  }
}

process.exit(0)
