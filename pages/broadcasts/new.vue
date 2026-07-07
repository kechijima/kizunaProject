<template>
  <div class="max-w-2xl mx-auto space-y-5">
    <div class="flex items-center gap-3">
      <NuxtLink to="/broadcasts" class="btn-ghost px-3 py-2">← 戻る</NuxtLink>
      <h2 class="text-lg font-semibold text-gray-800">配信を作成</h2>
    </div>

    <div class="card space-y-5">
      <!-- 配信名 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">配信名（管理用）<span class="text-red-400">*</span></label>
        <input v-model="form.title" type="text" class="input" placeholder="例: 6月の住居支援情報" />
      </div>

      <!-- 配信対象 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">配信対象 <span class="text-red-400">*</span></label>
        <div class="flex gap-4 mb-3">
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="targetType" type="radio" value="all" class="text-peach-500" />
            <span class="text-sm">全員に配信</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="targetType" type="radio" value="segment" class="text-peach-500" />
            <span class="text-sm">セグメント配信</span>
          </label>
        </div>
        <select v-if="targetType === 'segment'" v-model="form.segmentId" class="input">
          <option value="">セグメントを選択</option>
          <option v-for="seg in segments" :key="seg.id" :value="seg.id">
            {{ seg.name }} ({{ seg.userCount ?? 0 }}人)
          </option>
        </select>
        <p v-if="targetType === 'all'" class="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
          ⚠️ 全ユーザー（{{ totalUsers }}人）に送信されます
        </p>
      </div>

      <!-- 配信内容 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">配信内容 <span class="text-red-400">*</span></label>
        <div class="flex gap-4 mb-3">
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="messageType" type="radio" value="content" class="text-peach-500" />
            <span class="text-sm">コンテンツを配信</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="messageType" type="radio" value="custom" class="text-peach-500" />
            <span class="text-sm">カスタムメッセージを配信</span>
          </label>
        </div>

        <!-- コンテンツ選択 -->
        <div v-if="messageType === 'content'" class="space-y-3">
          <select v-model="form.contentId" class="input">
            <option value="">コンテンツを選択</option>
            <option v-for="c in contents" :key="c.id" :value="c.id">
              {{ c.title }} [{{ c.category }}]
            </option>
          </select>
          <div v-if="selectedContent" class="p-3 bg-warm-50 rounded-xl">
            <p class="text-xs text-gray-500 mb-1">{{ selectedContent.category }}</p>
            <p class="text-sm font-semibold text-gray-800">{{ selectedContent.title }}</p>
            <p class="text-xs text-gray-500 mt-1 line-clamp-2">{{ stripHtml(selectedContent.body) }}</p>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">コンテンツ前の一言メッセージ（任意）</label>
            <textarea v-model="form.message" class="input resize-none" rows="2" placeholder="例: 今週のおすすめ情報です！" />
          </div>
        </div>

        <!-- カスタムメッセージ -->
        <div v-if="messageType === 'custom'">
          <textarea
            v-model="form.message"
            class="input resize-none"
            rows="5"
            placeholder="送信するメッセージを入力..."
          />
        </div>
      </div>

      <!-- 配信日時 -->
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

      <!-- メッセージプレビュー -->
      <div>
        <button
          type="button"
          @click="showPreview = !showPreview"
          class="text-sm text-peach-500 hover:text-peach-600 font-medium"
        >
          {{ showPreview ? '▲ プレビューを閉じる' : '👀 メッセージプレビューを見る' }}
        </button>
        <div v-if="showPreview" class="mt-3 bg-[#8cabd9] rounded-xl p-4">
          <p class="text-xs text-white/70 mb-3 text-center">LINEのトーク画面イメージ</p>
          <div class="space-y-2 flex flex-col items-start">
            <!-- 一言メッセージ -->
            <div v-if="form.message.trim()" class="bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%] shadow-sm">
              <p class="text-sm text-gray-800 whitespace-pre-line">{{ form.message }}</p>
            </div>
            <!-- コンテンツカード -->
            <div v-if="messageType === 'content' && selectedContent" class="bg-white rounded-2xl overflow-hidden shadow-md w-56">
              <img v-if="selectedContent.imageUrl" :src="selectedContent.imageUrl" class="w-full h-28 object-cover" alt="" />
              <div class="px-4 pt-3 pb-2">
                <p class="text-xs text-peach-500">📂 {{ selectedContent.category }}</p>
                <p class="text-sm font-bold text-gray-800 mt-1 leading-snug">{{ selectedContent.title }}</p>
                <p class="text-xs text-gray-500 mt-1">{{ stripHtml(selectedContent.body).substring(0, 50) }}…</p>
              </div>
              <div class="px-3 pb-3">
                <div class="bg-peach-500 text-white text-sm font-medium text-center py-2 rounded-lg">全文を読む 📖</div>
              </div>
            </div>
            <!-- カスタムメッセージのみの場合はバブルのみ -->
            <div v-if="messageType === 'custom' && !form.message.trim()" class="text-xs text-white/60">メッセージを入力するとプレビューされます</div>
          </div>
        </div>
      </div>

      <!-- 配信確認 -->
      <div class="bg-green-50 rounded-xl p-4">
        <p class="text-sm font-medium text-green-800 mb-1">📋 配信確認</p>
        <p class="text-xs text-green-700">
          対象:
          <span v-if="targetType === 'all'">全ユーザー ({{ totalUsers }}人)</span>
          <span v-else>{{ selectedSegment?.name ?? '未選択' }} ({{ selectedSegment?.userCount ?? 0 }}人)</span>
        </p>
        <p class="text-xs text-green-700">
          内容: {{ messageType === 'content' ? (selectedContent?.title ?? 'コンテンツ未選択') : 'カスタムメッセージ' }}
        </p>
        <p class="text-xs text-green-700">配信日時: {{ scheduleType === 'now' ? '今すぐ' : form.scheduledAt || '未設定' }}</p>
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
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, Timestamp, getCountFromServer } from 'firebase/firestore'

const route = useRoute()
const router = useRouter()
const { db } = useFirebase()

const saving = ref(false)
const showPreview = ref(false)
const segments = ref<any[]>([])
const contents = ref<any[]>([])
const totalUsers = ref(0)
const scheduleType = ref<'now' | 'scheduled'>('now')
const targetType = ref<'all' | 'segment'>(route.query.segmentId ? 'segment' : 'all')
const messageType = ref<'content' | 'custom'>('content')

const form = ref({
  title: '',
  segmentId: route.query.segmentId as string ?? '',
  contentId: '',
  message: '',
  scheduledAt: '',
})

const selectedSegment = computed(() => segments.value.find(s => s.id === form.value.segmentId))
const selectedContent = computed(() => contents.value.find(c => c.id === form.value.contentId))

const stripHtml = (html: string) => String(html ?? '').replace(/<[^>]*>/g, '')

const isValid = computed(() => {
  if (!form.value.title.trim()) return false
  if (targetType.value === 'segment' && !form.value.segmentId) return false
  if (messageType.value === 'content' && !form.value.contentId) return false
  if (messageType.value === 'custom' && !form.value.message.trim()) return false
  if (scheduleType.value === 'scheduled' && !form.value.scheduledAt) return false
  return true
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
      segmentId: targetType.value === 'segment' ? form.value.segmentId : null,
      segmentName: targetType.value === 'segment' ? (selectedSegment.value?.name ?? '') : '全員',
      targetAll: targetType.value === 'all',
      contentId: messageType.value === 'content' ? form.value.contentId : null,
      messageType: messageType.value,
      message: form.value.message,
      status: 'scheduled',
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
  const [segsSnap, contentsSnap, countSnap] = await Promise.all([
    getDocs(query(collection(db, 'segments'), orderBy('createdAt', 'desc'))),
    getDocs(query(collection(db, 'contents'), orderBy('updatedAt', 'desc'))),
    getCountFromServer(collection(db, 'users')),
  ])
  segments.value = segsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
  contents.value = contentsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
  totalUsers.value = countSnap.data().count
})
</script>
