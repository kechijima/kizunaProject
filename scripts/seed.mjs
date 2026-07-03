// サンプルデータ投入スクリプト（Firebase クライアント SDK 使用）
// 実行方法: node scripts/seed.mjs

import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
import {
  getAuth,
  signInWithEmailAndPassword,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyDVHRA44so5akMJ7yvRPwmKoySPr085Ff4',
  authDomain: 'kizuna-project-d7a79.firebaseapp.com',
  projectId: 'kizuna-project-d7a79',
  storageBucket: 'kizuna-project-d7a79.firebasestorage.app',
  messagingSenderId: '810254592313',
  appId: '1:810254592313:web:b8da5c034b553d751120e8',
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

// ─── コンテンツ ─────────────────────────────────
const contents = [
  {
    title: '児童扶養手当の受給条件と申請方法',
    category: '経済支援',
    status: 'published',
    body: '児童扶養手当は、ひとり親家庭の生活の安定と自立を支援するための手当です。\n\n【受給条件】\n・18歳未満の子どもを養育しているひとり親\n・所得が一定の基準以下であること\n\n【支給額（2024年度）】\n・子ども1人：月額最大45,500円\n・子ども2人目：最大10,750円加算\n\n【申請窓口】\nお住まいの市区町村の福祉担当窓口（子育て支援課など）',
    linkUrl: 'https://www.mhlw.go.jp/bunya/kodomo/osirase/100526-1.html',
    imageUrl: '',
    tags: ['経済支援', '手当', '公的給付'],
  },
  {
    title: 'ひとり親家庭医療費助成制度（マル親）',
    category: '子育て支援',
    status: 'published',
    body: 'ひとり親家庭を対象に、医療費の自己負担分を助成する制度です。自治体によって名称や内容が異なります。\n\n【対象者】\n・18歳未満の子どもを持つひとり親家庭\n・所得制限あり（自治体により異なる）\n\n【助成内容】\n健康保険適用後の自己負担分（1〜3割）を助成。歯科・調剤薬局も対象。\n\n【申請方法】\n市区町村の窓口に児童扶養手当証書などを持参して申請。認定されると医療証が発行されます。',
    linkUrl: '',
    imageUrl: '',
    tags: ['医療費', '子育て支援', '助成金'],
  },
  {
    title: '公営住宅への優先入居制度',
    category: '住居支援',
    status: 'published',
    body: 'ひとり親家庭は公営住宅（都道府県営・市区町村営）への申し込みにあたって、抽選倍率の優遇や優先枠が設けられています。\n\n【優遇措置の例】\n・抽選倍率が一般の2〜5倍に設定\n・「ひとり親世帯向け」の専用募集枠あり\n\n【申込条件】\n・収入が定められた基準以下\n・現在の住居が狭小・老朽化・家賃が高いなど\n\nまずはお住まいの市区町村の住宅担当窓口に相談しましょう。',
    linkUrl: '',
    imageUrl: '',
    tags: ['住居', '公営住宅', '優先入居'],
  },
  {
    title: 'ハローワーク「ひとり親家族優先窓口」の活用法',
    category: '就労支援',
    status: 'published',
    body: '全国のハローワークでは、ひとり親家庭を対象にした専門の窓口・支援員が配置されています。\n\n【利用できるサービス】\n・求人情報の提供・マッチング支援\n・履歴書・職務経歴書の書き方指導\n・面接対策（模擬面接）\n・就職後の定着支援フォロー\n\n【利用方法】\n近くのハローワークに「ひとり親家族優先窓口に相談したい」と伝えてご来所ください。',
    linkUrl: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/koyou/hitorioyanadode/index.html',
    imageUrl: '',
    tags: ['就労支援', 'ハローワーク', '求職'],
  },
  {
    title: '養育費の取り決めと未払い対応',
    category: '法律・権利',
    status: 'published',
    body: '養育費は子どもの権利です。適切な養育費を受け取れるよう、取り決め方と未払い時の対処法を知っておきましょう。\n\n【取り決めの方法】\n1. 協議離婚の場合：公正証書を作成して強制執行力を持たせる\n2. 調停・審判：家庭裁判所で調停を申し立てる\n\n【未払い時の対処法】\n・内容証明郵便で督促\n・強制執行（給与・預金の差し押さえ）\n\n【無料相談窓口】\n法テラス（0570-078374）',
    linkUrl: 'https://www.courts.go.jp/saiban/syurui/syurui_kazi/kazi_07_15/index.html',
    imageUrl: '',
    tags: ['養育費', '法律', '権利'],
  },
  {
    title: '保育所の利用申し込みと優先制度',
    category: '子育て支援',
    status: 'published',
    body: '認可保育所の利用には「保育の必要性の認定」が必要で、ひとり親家庭は優先度が高く設定されています。\n\n【優先度が高くなる主な理由】\n・ひとり親家庭であること\n・求職活動中であること\n・勤務時間が長いこと\n\n【申し込みの流れ】\n1. 住んでいる市区町村に「支給認定申請」と「入所申請」を提出\n2. 選考（指数による）\n3. 内定・入所\n\n申し込み期間は自治体によって異なるため、早めの確認を！',
    linkUrl: '',
    imageUrl: '',
    tags: ['保育', '子育て支援', '認可保育所'],
  },
  {
    title: '自立支援教育訓練給付金（スキルアップ支援）',
    category: '就労支援',
    status: 'published',
    body: 'ひとり親家庭の親が就職に役立つ技能・資格取得のための教育訓練を受けた場合、受講料の一部を支給する制度です。\n\n【対象講座の例】\n・医療事務・調剤薬局事務\n・介護職員初任者研修\n・宅地建物取引士（宅建）\n・Webデザイン・ITパスポート\n\n【支給額】\n・厚生労働大臣指定講座：受講費用の60%（上限20万円）\n\n【申請窓口】\nお住まいの福祉事務所または子育て支援担当窓口へ、講座開始前に申請が必要。',
    linkUrl: '',
    imageUrl: '',
    tags: ['就労支援', 'スキルアップ', '資格取得', '給付金'],
  },
  {
    title: '就学援助制度（小中学生の教育費支援）',
    category: '経済支援',
    status: 'published',
    body: '経済的な理由で就学が困難な家庭の小中学生に対して、給食費・学用品費・修学旅行費などを援助する制度です。\n\n【支援の対象費用】\n・学用品費・体育実技用具費・新入学学用品費\n・修学旅行費・校外活動費・給食費\n\n【認定基準（例）】\n・生活保護受給者（準要保護）\n・市区町村民税が非課税または減額\n・児童扶養手当を受給している\n\n【申請方法】\n在籍している学校または市区町村の教育委員会へ申請。',
    linkUrl: '',
    imageUrl: '',
    tags: ['経済支援', '教育費', '小中学生'],
  },
  {
    title: 'ひとり親家庭日常生活支援事業（家事・育児ヘルプ）',
    category: 'その他',
    status: 'published',
    body: '修学・就業等により一時的に生活援助や保育が必要なとき、家庭生活支援員が派遣されます。\n\n【利用できるサービス】\n・乳幼児・子どもの保育や世話\n・食事の支度・衣類の洗濯・住居の掃除\n・病気の子どもの看護・通院付き添い\n\n【利用できる方】\n・児童扶養手当を受給しているひとり親家庭など\n\n【利用料金】\n所得に応じた利用者負担額あり（無料〜1時間あたり数百円程度）\n\n【申請窓口】\nお住まいの市区町村の母子・父子福祉担当窓口',
    linkUrl: '',
    imageUrl: '',
    tags: ['家事支援', '育児支援', '生活支援'],
  },
  {
    title: '母子生活支援施設への入居相談',
    category: '住居支援',
    status: 'draft',
    body: '母子生活支援施設は、配偶者のいない女性とその子どもが入所して生活し、自立を促進するための支援を行う施設です。\n\n【こんな方が対象】\n・DVや虐待から逃げている\n・住む場所がない・家賃が払えない\n・就労・生活の自立を目指したい\n\n【施設での支援内容】\n・個別の部屋での生活\n・保育士・母子支援員によるサポート\n・就労・学習支援\n\n【入居相談窓口】\n市区町村の福祉事務所または女性相談センター。緊急の場合は配偶者暴力相談支援センターへ。',
    linkUrl: '',
    imageUrl: '',
    tags: ['住居支援', '母子施設', 'DV'],
  },
]

// ─── セグメント ─────────────────────────────────
const segments = [
  {
    name: '未就学児のいる方',
    conditions: { tags: ['未就学児あり'] },
    userCount: 0,
  },
  {
    name: '小中学生のいる方',
    conditions: { tags: ['就学児あり'] },
    userCount: 0,
  },
  {
    name: '求職中・転職検討中の方',
    conditions: { tags: ['求職中'] },
    userCount: 0,
  },
  {
    name: '住居サポートが必要な方',
    conditions: { anyTags: ['住居支援希望', '転居検討中'] },
    userCount: 0,
  },
  {
    name: '経済的支援が必要な方',
    conditions: { anyTags: ['経済支援希望', '児童扶養手当受給中'] },
    userCount: 0,
  },
  {
    name: '子育て支援が必要な方（全年齢）',
    conditions: { anyTags: ['未就学児あり', '就学児あり', '高校生以上あり'] },
    userCount: 0,
  },
]

async function seed() {
  // 管理者としてログイン
  const email = process.argv[2] || 'alljapanekiden@gmail.com'
  const password = process.argv[3]
  if (!password) {
    console.error('使い方: node scripts/seed.mjs <email> <password>')
    console.error('例:     node scripts/seed.mjs alljapanekiden@gmail.com s0011324')
    process.exit(1)
  }

  console.log(`🔐 ${email} でログイン中...`)
  await signInWithEmailAndPassword(auth, email, password)
  console.log('✅ ログイン完了\n')

  console.log('📦 サンプルデータを投入します...\n')

  // コンテンツ
  console.log('📄 コンテンツ（10件）:')
  for (const item of contents) {
    const ref = await addDoc(collection(db, 'contents'), {
      ...item,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    console.log(`  ✓ [${item.category}] ${item.title} (${item.status})`)
  }

  // セグメント
  console.log('\n🎯 セグメント（6件）:')
  for (const seg of segments) {
    const cond = Object.entries(seg.conditions)
      .map(([k, v]) => `${k}: [${v.join(', ')}]`)
      .join(' / ')
    await addDoc(collection(db, 'segments'), {
      ...seg,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    console.log(`  ✓ ${seg.name}（${cond}）`)
  }

  console.log('\n✅ 完了！管理画面で確認してください。')
  console.log('   https://kizuna-project-d7a79.web.app/contents')
  console.log('   https://kizuna-project-d7a79.web.app/segments')
}

seed().then(() => process.exit(0)).catch(err => {
  console.error('❌ エラー:', err.message)
  process.exit(1)
})
