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
    <div v-else-if="!content" class="flex items-center justify-center min-h-screen p-6">
      <div class="text-center">
        <p class="text-5xl mb-4">🔍</p>
        <p class="text-gray-500 text-sm">コンテンツが見つかりません</p>
      </div>
    </div>

    <!-- コンテンツ表示 -->
    <div v-else>
      <!-- ヘッダー -->
      <div class="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-10">
        <div class="flex items-center gap-3 max-w-xl mx-auto">
          <div class="w-8 h-8 bg-gradient-to-br from-peach-400 to-peach-600 rounded-lg flex items-center justify-center">
            <span class="text-white text-sm font-bold">絆</span>
          </div>
          <div>
            <p class="font-bold text-gray-800 text-sm">絆プロジェクト</p>
            <p class="text-xs text-gray-400">支援情報</p>
          </div>
        </div>
      </div>

      <!-- 本文 -->
      <div class="max-w-xl mx-auto px-5 py-6 space-y-4">
        <p class="text-xs font-medium text-peach-500">📂 {{ content.category }}</p>
        <h1 class="text-xl font-bold text-gray-800 leading-snug">{{ content.title }}</h1>

        <img
          v-if="content.imageUrl"
          :src="content.imageUrl"
          class="w-full rounded-xl object-cover max-h-52"
          alt=""
        />

        <div class="bg-white rounded-xl p-5 shadow-sm text-sm text-gray-700 leading-relaxed whitespace-pre-line">
          {{ content.body }}
        </div>

        <div v-if="content.tags?.length" class="flex flex-wrap gap-2 pt-2">
          <span
            v-for="tag in content.tags"
            :key="tag"
            class="text-xs bg-peach-50 text-peach-600 px-3 py-1 rounded-full border border-peach-100"
          >#{{ tag }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { doc, getDoc } from 'firebase/firestore'

definePageMeta({ layout: false, middleware: [] })

const route = useRoute()
const { db } = useFirebase()
const id = route.params.id as string

const loading = ref(true)
const content = ref<any>(null)

onMounted(async () => {
  try {
    const snap = await getDoc(doc(db, 'contents', id))
    if (snap.exists() && snap.data().status === 'published') {
      content.value = snap.data()
    }
  } catch {
    // not found
  } finally {
    loading.value = false
  }
})
</script>
