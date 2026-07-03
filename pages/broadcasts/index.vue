<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <div class="flex gap-2">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          @click="activeTab = tab.value"
          :class="[
            'px-4 py-2 rounded-xl text-sm font-medium transition-all',
            activeTab === tab.value
              ? 'bg-peach-500 text-white shadow-peach'
              : 'bg-white text-gray-600 hover:bg-peach-50 border border-gray-200'
          ]"
        >
          {{ tab.label }}
        </button>
      </div>
      <NuxtLink to="/broadcasts/new" class="btn-primary">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        配信を作成
      </NuxtLink>
    </div>

    <!-- 配信一覧 -->
    <div class="card p-0 overflow-hidden">
      <div v-if="filteredBroadcasts.length === 0" class="text-center py-16 text-gray-400">
        <p class="text-4xl mb-3">📢</p>
        <p class="text-sm">配信がありません</p>
      </div>
      <table v-else class="w-full">
        <thead class="bg-warm-50 border-b border-gray-100">
          <tr>
            <th class="table-header">配信名</th>
            <th class="table-header">ステータス</th>
            <th class="table-header hidden md:table-cell">対象</th>
            <th class="table-header hidden md:table-cell">送信数</th>
            <th class="table-header">日時</th>
            <th class="table-header"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="b in filteredBroadcasts" :key="b.id" class="hover:bg-peach-50 transition-colors">
            <td class="table-cell font-medium text-gray-800">{{ b.title ?? 'タイトルなし' }}</td>
            <td class="table-cell">
              <span :class="statusClass(b.status)" class="badge whitespace-nowrap">{{ statusLabel(b.status) }}</span>
            </td>
            <td class="table-cell hidden md:table-cell text-gray-500">{{ b.segmentName ?? 'すべて' }}</td>
            <td class="table-cell hidden md:table-cell">
              <span class="font-medium">{{ (b.stats?.sent ?? 0).toLocaleString() }}</span>
              <span class="text-gray-400 text-xs ml-1">人</span>
            </td>
            <td class="table-cell text-gray-500 text-xs whitespace-nowrap">
              {{ formatDate(b.sentAt ?? b.scheduledAt ?? b.createdAt) }}
            </td>
            <td class="table-cell">
              <div v-if="b.status === 'scheduled'" class="flex gap-1">
                <button
                  @click="openEdit(b)"
                  class="btn-ghost text-xs px-2 py-1 text-gray-500 hover:text-gray-700"
                >
                  編集
                </button>
                <button
                  @click="cancelBroadcast(b)"
                  class="btn-ghost text-xs px-2 py-1 text-red-400 hover:text-red-500"
                >
                  取消
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 編集モーダル -->
    <div v-if="editModal.show" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div class="card w-full max-w-md">
        <h3 class="section-title">配信を編集</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">配信名</label>
            <input v-model="editModal.form.title" type="text" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">カスタムメッセージ</label>
            <textarea v-model="editModal.form.message" class="input resize-none" rows="3" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">配信日時</label>
            <div class="flex gap-3 mb-2">
              <label class="flex items-center gap-2 cursor-pointer text-sm">
                <input v-model="editModal.scheduleType" type="radio" value="now" />
                <span>今すぐ配信</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer text-sm">
                <input v-model="editModal.scheduleType" type="radio" value="scheduled" />
                <span>日時を指定</span>
              </label>
            </div>
            <input
              v-if="editModal.scheduleType === 'scheduled'"
              v-model="editModal.form.scheduledAt"
              type="datetime-local"
              class="input"
            />
          </div>
        </div>
        <div class="flex gap-3 mt-5 pt-4 border-t border-gray-100">
          <button @click="saveEdit" class="btn-primary" :disabled="!editModal.form.title.trim() || editModal.saving">
            {{ editModal.saving ? '保存中...' : '更新する' }}
          </button>
          <button @click="editModal.show = false" class="btn-secondary">キャンセル</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { collection, query, orderBy, onSnapshot, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore'
import dayjs from 'dayjs'

const { db } = useFirebase()
const activeTab = ref('all')
const broadcasts = ref<any[]>([])

const editModal = ref({
  show: false,
  id: '',
  scheduleType: 'scheduled' as 'now' | 'scheduled',
  saving: false,
  form: { title: '', message: '', scheduledAt: '' },
})

const tabs = [
  { label: 'すべて', value: 'all' },
  { label: '予定', value: 'scheduled' },
  { label: '完了', value: 'done' },
]

const filteredBroadcasts = computed(() => {
  if (activeTab.value === 'all') return broadcasts.value
  return broadcasts.value.filter(b => b.status === activeTab.value)
})

const statusLabel = (s: string) => ({ scheduled: '予定', sending: '送信中', done: '完了', failed: 'エラー', cancelled: '取消' }[s] ?? s)
const statusClass = (s: string) => ({
  scheduled: 'badge-blue',
  sending: 'badge-peach',
  done: 'badge-green',
  failed: 'bg-red-100 text-red-600',
  cancelled: 'badge-gray',
}[s] ?? 'badge-gray')

const formatDate = (ts: any) => {
  if (!ts) return '-'
  return dayjs(ts.toDate?.() ?? ts).format('M/D HH:mm')
}

const openEdit = (b: any) => {
  const scheduled = b.scheduledAt?.toDate?.()
  editModal.value = {
    show: true,
    id: b.id,
    scheduleType: 'scheduled',
    saving: false,
    form: {
      title: b.title ?? '',
      message: b.message ?? '',
      scheduledAt: scheduled ? dayjs(scheduled).format('YYYY-MM-DDTHH:mm') : '',
    },
  }
}

const saveEdit = async () => {
  const m = editModal.value
  if (!m.form.title.trim()) return
  m.saving = true
  try {
    const scheduledAt = m.scheduleType === 'now'
      ? Timestamp.now()
      : m.form.scheduledAt ? Timestamp.fromDate(new Date(m.form.scheduledAt)) : Timestamp.now()

    await updateDoc(doc(db, 'broadcasts', m.id), {
      title: m.form.title,
      message: m.form.message,
      scheduledAt,
      updatedAt: serverTimestamp(),
    })
    m.show = false
  } finally {
    m.saving = false
  }
}

const cancelBroadcast = async (b: any) => {
  if (!confirm(`「${b.title}」の配信を取り消しますか？`)) return
  await updateDoc(doc(db, 'broadcasts', b.id), { status: 'cancelled', updatedAt: serverTimestamp() })
}

onMounted(() => {
  const q = query(collection(db, 'broadcasts'), orderBy('createdAt', 'desc'))
  onSnapshot(q, (snap) => {
    broadcasts.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  })
})
</script>
