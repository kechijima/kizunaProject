<template>
  <div class="max-w-2xl mx-auto space-y-5">
    <div class="flex items-center gap-3">
      <NuxtLink to="/broadcasts" class="btn-ghost px-3 py-2">← 戻る</NuxtLink>
      <h2 class="text-lg font-semibold text-gray-800">配信を作成</h2>
    </div>

    <div class="card space-y-5">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">配信名（管理用）<span class="text-red-400">*</span></label>
        <input v-model="form.title" type="text" class="input" placeholder="例: 6月の住居支援情報" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">対象セグメント <span class="text-red-400">*</span></label>
        <select v-model="form.segmentId" class="input">
          <option value="">セグメントを選択</option>
          <option v-for="seg in segments" :key="seg.id" :value="seg.id">
            {{ seg.name }} ({{ seg.userCount ?? 0 }}人)
          </option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">配信するコンテンツ <span class="text-red-400">*</span></label>
        <select v-model="form.contentId" class="input">
          <option value="">コンテンツを選択</option>
          <option v-for="c in contents" :key="c.id" :value="c.id">
            {{ c.title }} [{{ c.category }}]
          </option>
        </select>
        <!-- コンテンツプレビュー -->
        <div v-if="selectedContent" class="mt-3 p-4 bg-warm-50 rounded-xl">
          <p class="text-sm font-semibold text-gray-800">{{ selectedContent.title }}</p>
          <p class="text-xs text-gray-500 mt-1 line-clamp-2">{{ selectedContent.body }}</p>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">カスタムメッセージ（任意）</label>
        <textarea
          v-model="form.message"
          class="input resize-none"
          rows="3"
          placeholder="コンテンツの前に送信するメッセージ（省略可）"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">配信日時</label>
        <div class="flex gap-3">
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="scheduleType" type="radio" value="now" class="text-peach-500" />
            <span class="text-sm">今すぐ配信</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="scheduleType" type="radio" value="scheduled" class="text-peach-500" />
            <span class="text-sm">日時を指定</span>
          </label>
        </div>
        <input
          v-if="scheduleType === 'scheduled'"
          v-model="form.scheduledAt"
          type="datetime-local"
          class="input mt-3"
        />
      </div>

      <!-- 配信プレビュー -->
      <div class="bg-green-50 rounded-xl p-4">
        <p class="text-sm font-medium text-green-800 mb-1">📋 配信確認</p>
        <p class="text-xs text-green-700">
          対象: {{ selectedSegment?.name ?? '未選択' }} ({{ selectedSegment?.userCount ?? 0 }}人)
        </p>
        <p class="text-xs text-green-700">コンテンツ: {{ selectedContent?.title ?? '未選択' }}</p>
        <p class="text-xs text-green-700">
          配信日時: {{ scheduleType === 'now' ? '今すぐ' : form.scheduledAt || '未設定' }}
        </p>
      </div>

      <div class="flex gap-3 pt-2 border-t border-gray-100">
        <button @click="createBroadcast" class="btn-primary" :disabled="!isValid || saving">
          {{ saving ? '作成中...' : '配信を作成' }}
        </button>
        <NuxtLink to="/broadcasts" class="btn-secondary">キャンセル</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const { db } = useFirebase()

const saving = ref(false)
const segments = ref<any[]>([])
const contents = ref<any[]>([])
const scheduleType = ref<'now' | 'scheduled'>('now')

const form = ref({
  title: '',
  segmentId: route.query.segmentId as string ?? '',
  contentId: '',
  message: '',
  scheduledAt: '',
})

const selectedSegment = computed(() => segments.value.find(s => s.id === form.value.segmentId))
const selectedContent = computed(() => contents.value.find(c => c.id === form.value.contentId))

const isValid = computed(() => {
  return form.value.title.trim() && form.value.segmentId && form.value.contentId &&
    (scheduleType.value === 'now' || form.value.scheduledAt)
})

const createBroadcast = async () => {
  if (!isValid.value) return
  saving.value = true
  try {
    let scheduledAt = null
    if (scheduleType.value === 'scheduled' && form.value.scheduledAt) {
      scheduledAt = Timestamp.fromDate(new Date(form.value.scheduledAt))
    }

    await addDoc(collection(db, 'broadcasts'), {
      title: form.value.title,
      segmentId: form.value.segmentId,
      segmentName: selectedSegment.value?.name ?? '',
      contentId: form.value.contentId,
      message: form.value.message,
      status: scheduleType.value === 'now' ? 'scheduled' : 'scheduled',
      scheduledAt: scheduledAt ?? serverTimestamp(),
      stats: { sent: 0 },
      createdAt: serverTimestamp(),
    })
    router.push('/broadcasts')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  const [segsSnap, contentsSnap] = await Promise.all([
    getDocs(query(collection(db, 'segments'), orderBy('createdAt', 'desc'))),
    getDocs(query(collection(db, 'contents'), orderBy('updatedAt', 'desc'))),
  ])
  segments.value = segsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
  contents.value = contentsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
})
</script>
