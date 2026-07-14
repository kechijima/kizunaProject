<template>
  <div class="max-w-2xl mx-auto space-y-5">
    <div class="flex items-center gap-3">
      <NuxtLink to="/events" class="btn-ghost px-3 py-2">← 戻る</NuxtLink>
      <h2 class="text-lg font-semibold text-gray-800">イベントを編集</h2>
    </div>

    <div v-if="loading" class="py-10 text-center text-gray-400 text-sm">読み込み中...</div>

    <div v-else class="card space-y-5">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">タイトル <span class="text-red-400">*</span></label>
        <input v-model="form.title" type="text" class="input" placeholder="イベントタイトルを入力..." />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">開始日時</label>
          <input v-model="form.startAtStr" type="datetime-local" class="input" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">終了日時</label>
          <input v-model="form.endAtStr" type="datetime-local" class="input" />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">開催場所</label>
        <input v-model="form.location" type="text" class="input" placeholder="例: オンライン / 渋谷区○○センター" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">説明 <span class="text-red-400">*</span></label>
        <textarea v-model="form.description" class="input resize-none" rows="6" placeholder="イベントの詳細を入力..." />
      </div>

      <!-- 公開URL（自動生成） -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">公開URL</label>
        <div class="flex items-center gap-2 p-3 bg-peach-50 rounded-xl border border-peach-100">
          <span class="text-sm text-peach-600 flex-1 truncate">🔗 {{ publicUrl }}</span>
          <a :href="publicUrl" target="_blank" class="btn-ghost text-xs px-2 py-1 text-gray-500 hover:text-peach-600">開く</a>
          <button type="button" @click="copyUrl" class="btn-secondary text-xs px-3 py-1 whitespace-nowrap">
            {{ copied ? '✓ コピー済' : '📋 コピー' }}
          </button>
        </div>
        <p class="text-xs text-gray-400 mt-1">LINEの「詳しく見る」ボタンのリンク先です。参加申し込みもこのページから受け付けます</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">画像URL</label>
        <input v-model="form.imageUrl" type="url" class="input" placeholder="https://..." />
        <div v-if="form.imageUrl" class="mt-2 h-32 rounded-xl overflow-hidden bg-gray-100">
          <img :src="form.imageUrl" class="w-full h-full object-cover" alt="" />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">ステータス</label>
        <select v-model="form.status" class="input">
          <option value="draft">下書き</option>
          <option value="published">公開</option>
          <option value="closed">終了</option>
        </select>
      </div>

      <div class="flex gap-3 pt-2 border-t border-gray-100">
        <button @click="save" class="btn-primary" :disabled="saving">
          {{ saving ? '保存中...' : '保存する' }}
        </button>
        <NuxtLink to="/events" class="btn-secondary">キャンセル</NuxtLink>
      </div>
    </div>

    <!-- 参加申し込み一覧 -->
    <div v-if="!loading" class="card">
      <h2 class="section-title">参加申し込み <span class="text-sm text-gray-400 font-normal">{{ applications.length }}件</span></h2>
      <div v-if="applications.length === 0" class="text-sm text-gray-400 py-4 text-center">
        まだ申し込みはありません
      </div>
      <div v-else class="divide-y divide-gray-50">
        <div v-for="app in applications" :key="app.id" class="py-3 first:pt-0 last:pb-0">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-gray-800">{{ app.name }}</p>
            <p class="text-xs text-gray-400">{{ formatAppDate(app.createdAt) }}</p>
          </div>
          <p v-if="app.contact" class="text-xs text-gray-500 mt-0.5">📞 {{ app.contact }}</p>
          <p v-if="app.message" class="text-sm text-gray-600 mt-1 whitespace-pre-line">{{ app.message }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp, collection, query, orderBy, onSnapshot } from 'firebase/firestore'

const route = useRoute()
const router = useRouter()
const { db } = useFirebase()

const id = route.params.id as string
const loading = ref(true)
const saving = ref(false)
const applications = ref<any[]>([])

const BASE_URL = 'https://kizuna-project-d7a79.web.app'
const publicUrl = computed(() =>
  `${(typeof window !== 'undefined' && window.location?.origin) || BASE_URL}/e/${id}`,
)
const copied = ref(false)
const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(publicUrl.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    alert('コピーに失敗しました: ' + publicUrl.value)
  }
}

const formatAppDate = (ts: any) => {
  if (!ts) return ''
  const d = ts.toDate?.() ?? new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const toLocalStr = (ts: any): string => {
  if (!ts) return ''
  const d = ts.toDate?.() ?? new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const form = ref({
  title: '',
  startAtStr: '',
  endAtStr: '',
  location: '',
  description: '',
  imageUrl: '',
  status: 'draft',
})

const save = async () => {
  if (!form.value.title.trim() || !form.value.description.trim()) {
    alert('タイトルと説明は必須です')
    return
  }
  saving.value = true
  try {
    await updateDoc(doc(db, 'events', id), {
      title: form.value.title.trim(),
      startAt: form.value.startAtStr ? Timestamp.fromDate(new Date(form.value.startAtStr)) : null,
      endAt: form.value.endAtStr ? Timestamp.fromDate(new Date(form.value.endAtStr)) : null,
      location: form.value.location.trim(),
      description: form.value.description.trim(),
      // 公開URLは常に自動生成URLに統一
      linkUrl: `${BASE_URL}/e/${id}`,
      imageUrl: form.value.imageUrl.trim(),
      status: form.value.status,
      updatedAt: serverTimestamp(),
    })
    router.push('/events')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  const snap = await getDoc(doc(db, 'events', id))
  if (snap.exists()) {
    const data = snap.data()
    form.value = {
      title: data.title ?? '',
      startAtStr: toLocalStr(data.startAt),
      endAtStr: toLocalStr(data.endAt),
      location: data.location ?? '',
      description: data.description ?? '',
      imageUrl: data.imageUrl ?? '',
      status: data.status ?? 'draft',
    }
  }
  loading.value = false

  // 参加申し込み一覧（リアルタイム）
  onSnapshot(
    query(collection(db, 'events', id, 'applications'), orderBy('createdAt', 'desc')),
    snap => { applications.value = snap.docs.map(d => ({ id: d.id, ...d.data() })) },
  )
})
</script>
