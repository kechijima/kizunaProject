<template>
  <div class="space-y-5">
    <!-- フィルター・検索 -->
    <div class="card">
      <div class="flex flex-wrap gap-3 items-center">
        <div class="relative flex-1 min-w-48">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="名前で検索..."
            class="input pl-9"
          />
        </div>
        <select v-model="statusFilter" class="input w-40">
          <option value="">すべて</option>
          <option value="completed">登録完了</option>
          <option value="in_progress">回答中</option>
        </select>
        <select v-model="tagFilter" class="input w-48">
          <option value="">タグで絞り込み</option>
          <option v-for="tag in allTags" :key="tag" :value="tag">{{ tag }}</option>
        </select>
        <span class="text-sm text-gray-500">{{ filteredUsers.length }}件</span>
      </div>
    </div>

    <!-- ユーザーテーブル -->
    <div class="card p-0 overflow-hidden">
      <div v-if="loading" class="p-6">
        <div v-for="i in 8" :key="i" class="h-14 bg-gray-100 rounded-xl mb-2 animate-pulse" />
      </div>
      <div v-else-if="filteredUsers.length === 0" class="text-center py-16 text-gray-400">
        <p class="text-4xl mb-3">👥</p>
        <p class="text-sm">該当するユーザーがいません</p>
      </div>
      <table v-else class="w-full">
        <thead class="bg-warm-50 border-b border-gray-100">
          <tr>
            <th class="table-header">ユーザー</th>
            <th class="table-header">ステータス</th>
            <th class="table-header hidden md:table-cell">タグ</th>
            <th class="table-header hidden lg:table-cell">地域</th>
            <th class="table-header hidden lg:table-cell">登録日</th>
            <th class="table-header w-20">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr
            v-for="user in filteredUsers"
            :key="user.id"
            class="hover:bg-peach-50 transition-colors cursor-pointer"
            @click="$router.push(`/users/${user.id}`)"
          >
            <td class="table-cell">
              <div class="flex items-center gap-3">
                <img
                  v-if="user.pictureUrl"
                  :src="user.pictureUrl"
                  class="w-9 h-9 rounded-full object-cover flex-shrink-0"
                  alt=""
                />
                <div v-else class="w-9 h-9 bg-peach-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span class="text-peach-600 text-sm font-medium">{{ user.displayName?.charAt(0) }}</span>
                </div>
                <div class="min-w-0">
                  <p class="font-medium text-gray-800 truncate">{{ user.displayName }}</p>
                  <p class="text-xs text-gray-400 truncate">{{ user.id }}</p>
                </div>
              </div>
            </td>
            <td class="table-cell">
              <span :class="user.onboardingStatus === 'completed' ? 'badge-green' : 'badge-peach'" class="badge">
                {{ user.onboardingStatus === 'completed' ? '完了' : '回答中' }}
              </span>
            </td>
            <td class="table-cell hidden md:table-cell">
              <div class="flex flex-wrap gap-1">
                <span v-for="tag in (user.tags ?? []).slice(0, 3)" :key="tag" class="badge badge-gray">
                  {{ tag }}
                </span>
                <span v-if="(user.tags ?? []).length > 3" class="badge badge-gray">
                  +{{ user.tags.length - 3 }}
                </span>
              </div>
            </td>
            <td class="table-cell hidden lg:table-cell text-gray-500">{{ user.attributes?.region ?? '-' }}</td>
            <td class="table-cell hidden lg:table-cell text-gray-500">{{ formatDate(user.createdAt) }}</td>
            <td class="table-cell" @click.stop>
              <NuxtLink
                :to="`/users/${user.id}`"
                class="btn-ghost text-xs px-3 py-1.5"
              >
                詳細
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import dayjs from 'dayjs'

const { db } = useFirebase()

const loading = ref(true)
const users = ref<any[]>([])
const searchQuery = ref('')
const statusFilter = ref('')
const tagFilter = ref('')

const allTags = computed(() => {
  const tags = new Set<string>()
  users.value.forEach(u => (u.tags ?? []).forEach((t: string) => tags.add(t)))
  return [...tags].sort()
})

const filteredUsers = computed(() => {
  return users.value.filter(u => {
    if (searchQuery.value && !u.displayName?.toLowerCase().includes(searchQuery.value.toLowerCase())) return false
    if (statusFilter.value && u.onboardingStatus !== statusFilter.value) return false
    if (tagFilter.value && !(u.tags ?? []).includes(tagFilter.value)) return false
    return true
  })
})

const formatDate = (ts: any) => {
  if (!ts) return '-'
  return dayjs(ts.toDate?.() ?? ts).format('YYYY/M/D')
}

onMounted(() => {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
  onSnapshot(q, (snap) => {
    users.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    loading.value = false
  })
})
</script>
