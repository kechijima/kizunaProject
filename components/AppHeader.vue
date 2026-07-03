<template>
  <header class="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
    <div>
      <h1 class="text-lg font-semibold text-gray-800">{{ pageTitle }}</h1>
      <p class="text-xs text-gray-400">{{ currentDate }}</p>
    </div>
    <div class="flex items-center gap-3">
      <!-- 通知ベル -->
      <button class="relative p-2 text-gray-400 hover:text-peach-500 hover:bg-peach-50 rounded-xl transition-all">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span v-if="unreadCount > 0" class="absolute top-1 right-1 w-2 h-2 bg-peach-500 rounded-full"></span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import 'dayjs/locale/ja'
dayjs.locale('ja')

const route = useRoute()
const unreadCount = ref(0)

const pageTitles: Record<string, string> = {
  '/': 'ダッシュボード',
  '/users': 'ユーザー管理',
  '/chat': 'チャット管理',
  '/contents': 'コンテンツ管理',
  '/segments': 'セグメント管理',
  '/broadcasts': '配信管理',
  '/settings/onboarding': 'オンボーディング設定',
  '/settings/admins': '管理者設定',
}

const pageTitle = computed(() => {
  const path = route.path
  if (pageTitles[path]) return pageTitles[path]
  if (path.startsWith('/users/')) return 'ユーザー詳細'
  if (path.startsWith('/contents/')) return 'コンテンツ編集'
  return '絆プロジェクト管理画面'
})

const currentDate = computed(() => dayjs().format('YYYY年M月D日 (ddd)'))
</script>
