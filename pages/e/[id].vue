<template>
  <div class="min-h-screen bg-gradient-to-br from-peach-50 to-warm-100">
    <!-- ローディング -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="w-12 h-12 border-4 border-peach-300 border-t-peach-500 rounded-full animate-spin mx-auto mb-4" />
        <p class="text-peach-600 font-medium">読み込み中...</p>
      </div>
    </div>

    <!-- 見つからない -->
    <div v-else-if="!event" class="flex items-center justify-center min-h-screen p-6">
      <div class="text-center">
        <p class="text-5xl mb-4">🔍</p>
        <p class="text-gray-500 text-sm">イベントが見つかりません</p>
      </div>
    </div>

    <!-- イベント表示 -->
    <div v-else>
      <!-- ヘッダー -->
      <div class="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-10">
        <div class="flex items-center gap-3 max-w-xl mx-auto">
          <div class="w-8 h-8 bg-gradient-to-br from-peach-400 to-peach-600 rounded-lg flex items-center justify-center">
            <span class="text-white text-sm font-bold">絆</span>
          </div>
          <div>
            <p class="font-bold text-gray-800 text-sm">絆プロジェクト</p>
            <p class="text-xs text-gray-400">イベント情報</p>
          </div>
        </div>
      </div>

      <!-- 本文 -->
      <div class="max-w-xl mx-auto px-5 py-6 space-y-4">
        <p class="text-xs font-medium text-peach-500">📅 イベント</p>
        <h1 class="text-xl font-bold text-gray-800 leading-snug">{{ event.title }}</h1>

        <img
          v-if="event.imageUrl"
          :src="event.imageUrl"
          class="w-full rounded-xl object-cover max-h-64"
          alt=""
        />

        <!-- 開催情報 -->
        <div class="bg-white rounded-xl p-5 shadow-sm space-y-2">
          <div class="flex items-start gap-2 text-sm text-gray-700">
            <span>🗓</span>
            <div>
              <p>{{ formatDate(event.startAt) }}</p>
              <p v-if="event.endAt" class="text-xs text-gray-400">〜 {{ formatDate(event.endAt) }}</p>
            </div>
          </div>
          <div v-if="event.location" class="flex items-center gap-2 text-sm text-gray-700">
            <span>📍</span>
            <p>{{ event.location }}</p>
          </div>
        </div>

        <div class="bg-white rounded-xl p-5 shadow-sm text-sm text-gray-700 leading-relaxed whitespace-pre-line">
          {{ event.description }}
        </div>

        <!-- 参加申し込み -->
        <div class="bg-white rounded-xl p-5 shadow-sm">
          <h2 class="font-bold text-gray-800 mb-1">✉️ 参加申し込み</h2>

          <div v-if="applied" class="text-center py-6">
            <p class="text-3xl mb-2">✅</p>
            <p class="text-sm text-gray-700 font-medium">お申し込みを受け付けました！</p>
            <p class="text-xs text-gray-400 mt-1">ご参加お待ちしています🌸</p>
          </div>

          <div v-else-if="isClosed" class="text-center py-4">
            <p class="text-sm text-gray-500">このイベントの受付は終了しました🙇</p>
          </div>

          <div v-else class="space-y-3 mt-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">お名前 <span class="text-red-400">*</span></label>
              <input v-model="appForm.name" type="text" class="input" placeholder="例: 山田 花子" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">連絡先（電話・メールなど / 任意）</label>
              <input v-model="appForm.contact" type="text" class="input" placeholder="例: 090-xxxx-xxxx" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">メッセージ（任意）</label>
              <textarea v-model="appForm.message" rows="3" class="input resize-none" placeholder="質問やご要望があればご記入ください" />
            </div>
            <button
              @click="submitApplication"
              class="btn-primary w-full"
              :disabled="!appForm.name.trim() || submitting"
            >
              {{ submitting ? '送信中...' : '申し込む 🌸' }}
            </button>
            <p v-if="submitError" class="text-xs text-red-500">{{ submitError }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore'

definePageMeta({ layout: false, middleware: [] })

const route = useRoute()
const { db } = useFirebase()
const id = route.params.id as string

const loading = ref(true)
const event = ref<any>(null)
const applied = ref(false)
const submitting = ref(false)
const submitError = ref('')

const appForm = ref({ name: '', contact: '', message: '' })

// 終了済みイベントは受付終了扱い
const isClosed = computed(() => {
  if (!event.value) return false
  if (event.value.status === 'closed') return true
  const start = event.value.startAt?.toDate?.()
  return !!(start && start < new Date())
})

const formatDate = (ts: any): string => {
  if (!ts) return '日時未定'
  const d = ts.toDate?.() ?? new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  const days = ['日', '月', '火', '水', '木', '金', '土']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日(${days[d.getDay()]}) ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const submitApplication = async () => {
  if (!appForm.value.name.trim() || submitting.value) return
  submitting.value = true
  submitError.value = ''
  try {
    await addDoc(collection(db, 'events', id, 'applications'), {
      name: appForm.value.name.trim(),
      contact: appForm.value.contact.trim(),
      message: appForm.value.message.trim(),
      createdAt: serverTimestamp(),
    })
    applied.value = true
  } catch (e: any) {
    submitError.value = '送信に失敗しました。時間をおいて再度お試しください。'
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const snap = await getDoc(doc(db, 'events', id))
    if (snap.exists() && ['published', 'closed'].includes(snap.data().status)) {
      event.value = snap.data()
    }
  } catch {
    // not found
  } finally {
    loading.value = false
  }
})
</script>
