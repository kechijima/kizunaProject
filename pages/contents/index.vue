<template>
  <div class="space-y-5">
    <!-- ヘッダーアクション -->
    <div class="flex items-center justify-between">
      <div class="flex gap-2">
        <button
          v-for="cat in ['すべて', ...categories]"
          :key="cat"
          @click="categoryFilter = cat === 'すべて' ? '' : cat"
          :class="[
            'px-4 py-2 rounded-xl text-sm font-medium transition-all',
            (cat === 'すべて' && !categoryFilter) || categoryFilter === cat
              ? 'bg-peach-500 text-white shadow-peach'
              : 'bg-white text-gray-600 hover:bg-peach-50 border border-gray-200'
          ]"
        >
          {{ cat }}
        </button>
      </div>
      <NuxtLink to="/contents/new" class="btn-primary">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        コンテンツを追加
      </NuxtLink>
    </div>

    <!-- コンテンツグリッド -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="i in 6" :key="i" class="h-48 bg-gray-100 rounded-2xl animate-pulse" />
    </div>

    <div v-else-if="filteredContents.length === 0" class="card text-center py-16 text-gray-400">
      <p class="text-4xl mb-3">📝</p>
      <p class="text-sm">コンテンツがありません</p>
      <NuxtLink to="/contents/new" class="btn-primary mt-4 inline-flex">追加する</NuxtLink>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="content in filteredContents"
        :key="content.id"
        class="card-hover group"
        @click="$router.push(`/contents/${content.id}`)"
      >
        <!-- サムネイル -->
        <div class="h-32 bg-gradient-to-br from-peach-100 to-warm-100 rounded-xl mb-4 overflow-hidden">
          <img v-if="content.imageUrl" :src="content.imageUrl" class="w-full h-full object-cover" alt="" />
          <div v-else class="w-full h-full flex items-center justify-center text-4xl">
            {{ categoryIcon(content.category) }}
          </div>
        </div>

        <div class="flex items-center gap-2 mb-2">
          <span class="badge badge-peach">{{ content.category }}</span>
          <span :class="content.status === 'published' ? 'badge-green' : 'badge-gray'" class="badge">
            {{ content.status === 'published' ? '公開中' : '下書き' }}
          </span>
        </div>

        <h3 class="font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-peach-600 transition-colors">
          {{ content.title }}
        </h3>
        <p class="text-sm text-gray-500 line-clamp-2">{{ stripHtml(content.body) }}</p>

        <div class="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
          <p class="text-xs text-gray-400">{{ formatDate(content.updatedAt) }}</p>
          <div class="flex gap-1" @click.stop>
            <NuxtLink :to="`/contents/${content.id}`" class="btn-ghost text-xs px-2 py-1">編集</NuxtLink>
            <button @click="deleteContent(content.id)" class="btn-ghost text-xs px-2 py-1 text-red-400 hover:text-red-500 hover:bg-red-50">
              削除
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import dayjs from 'dayjs'

const { db } = useFirebase()

const loading = ref(true)
const contents = ref<any[]>([])
const categoryFilter = ref('')
const categories = ref<string[]>([])

const filteredContents = computed(() => {
  if (!categoryFilter.value) return contents.value
  return contents.value.filter(c => c.category === categoryFilter.value)
})

const categoryIcon = (cat: string) => ({
  '子育て支援': '👶',
  '住居支援': '🏠',
  '就労支援': '💼',
  '経済支援': '💰',
  '法律・権利': '⚖️',
  'その他': '📋',
}[cat] ?? '📝')

const stripHtml = (html: string) => String(html ?? '').replace(/<[^>]*>/g, '')

const formatDate = (ts: any) => {
  if (!ts) return '-'
  return dayjs(ts.toDate?.() ?? ts).format('YYYY/M/D')
}

const deleteContent = async (id: string) => {
  if (!confirm('このコンテンツを削除しますか？')) return
  await deleteDoc(doc(db, 'contents', id))
}

onMounted(() => {
  const q = query(collection(db, 'contents'), orderBy('updatedAt', 'desc'))
  onSnapshot(q, (snap) => {
    contents.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    loading.value = false
  })

  // 種別管理（categories）の内容をタブに反映（リアルタイム同期・イベントは除く）
  const catQ = query(collection(db, 'categories'), orderBy('order', 'asc'))
  onSnapshot(catQ, (snap) => {
    const names = snap.empty
      ? ['子育て支援', '住居支援', '就労支援', '経済支援', '法律・権利', 'その他']
      : snap.docs.map(d => (d.data() as any).name as string)
    categories.value = names.filter(name => name !== 'イベント')
  })
})
</script>
