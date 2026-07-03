// カテゴリマスタ登録スクリプト
// 実行方法: node scripts/seedCategories.mjs

import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'

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

const categories = [
  '子育て支援',
  '住居支援',
  '就労支援',
  '経済支援',
  '法律・権利',
  'イベント',
  'その他',
]

async function main() {
  // 既存カテゴリを削除
  console.log('🗑  既存カテゴリを削除中...')
  const existing = await getDocs(collection(db, 'categories'))
  for (const d of existing.docs) {
    await deleteDoc(doc(db, 'categories', d.id))
    console.log(`   削除: ${d.data().name}`)
  }

  // 新規登録
  console.log('📂 カテゴリを登録中...')
  for (let i = 0; i < categories.length; i++) {
    await addDoc(collection(db, 'categories'), {
      name: categories[i],
      order: i,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    console.log(`   [${i}] ${categories[i]}`)
  }

  console.log('✅ カテゴリ登録完了！')
  process.exit(0)
}

main().catch(err => {
  console.error('❌ エラー:', err)
  process.exit(1)
})
