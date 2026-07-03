<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-800">イベント管理</h2>
      <NuxtLink to="/events/new" class="btn-primary text-sm">＋ 追加</NuxtLink>
    </div>

    <!-- フィルター -->
    <div class="flex gap-2 flex-wrap">
      <button
        v-for="s in statuses"
        :key="s.value"
        @click="filterStatus = s.value"
        :class="[
          'text-xs px-3 py-1.5 rounded-full border transition-colors',
          filterStatus === s.value
            ? 'border-peach-400 bg-peach-400 text-white'
            : 'border-gray-200 bg-white text-gray-600 hover:border-peach-300'
        ]"
      >
        {{ s.label }}
      </button>
    </div>

    <div class="card divide-y divide-gray-100">
      <div v-if="loading" class="py-10 text-center text-gray-400 text-sm">読み込み中...</div>
      <div v-else-if="!filtered.length" class="py-10 text-center text-gray-400 text-sm">
        イベントがありません
      </div>
      <div v-for="ev in filtered" :key="ev.id" class="py-4 flex items-start gap-4">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span :class="statusBadge(ev.status)">{{ statusLabel(ev.status) }}</span>
            <span class="text-xs text-gray-400">{{ formatDate(ev.startAt) }}</span>
          </div>
          <p class="text-sm font-medium text-gray-800 truncate">{{ ev.title }}</p>
          <p v-if="ev.location" class="text-xs text-gray-400 mt-0.5">📍 {{ ev.location }}</p>
        </div>
        <NuxtLink :to="`/events/${ev.id}`" class="text-xs text-peach-500 hover:text-peach-700 px-3 py-1.5 rounded-lg hover:bg-peach-50 transition-colors whitespace-nowrap">
          編集
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { collection, getDocs, query, orderBy } from 'firebase/firestore'

interface Event {
  id: string
  title: string
  status: string
  startAt: any
  location?: string
}

const { db } = useFirebase()
const loading = ref(true)
const events = ref<Event[]>([])
const filterStatus = ref('all')

const statuses = [
  { value: 'all', label: 'すべて' },
  { value: 'published', label: '公開中' },
  { value: 'draft', label: '下書き' },
  { value: 'closed', label: '終了' },
]

const filtered = computed(() => {
  if (filterStatus.value === 'all') return events.value
  return events.value.filter(e => e.status === filterStatus.value)
})

const statusLabel = (s: string) => {
  const m: Record<string, string> = { published: '公開', draft: '下書き', closed: '終了' }
  return m[s] ?? s
}

const statusBadge = (s: string) => {
  const base = 'text-xs px-2 py-0.5 rounded-full font-medium'
  if (s === 'published') return `${base} bg-green-100 text-green-700`
  if (s === 'closed') return `${base} bg-gray-100 text-gray-500`
  return `${base} bg-yellow-100 text-yellow-700`
}

const formatDate = (ts: any) => {
  if (!ts) return '日時未定'
  const d = ts.toDate?.() ?? new Date(ts)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(async () => {
  const snap = await getDocs(query(collection(db, 'events'), orderBy('startAt', 'desc')))
  events.value = snap.docs.map(d => ({ id: d.id, ...d.data() } as Event))
  loading.value = false
})
</script>
