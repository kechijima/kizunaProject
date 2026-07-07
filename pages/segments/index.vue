<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <p class="text-sm text-gray-500">ユーザーをタグ・属性で絞り込んでセグメントを作成します</p>
      <button @click="showForm = true" class="btn-primary">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        セグメントを作成
      </button>
    </div>

    <!-- セグメント一覧 -->
    <div v-if="segments.length === 0" class="card text-center py-16 text-gray-400">
      <p class="text-4xl mb-3">🎯</p>
      <p class="text-sm">セグメントがありません</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="seg in segments" :key="seg.id" class="card">
        <div class="flex items-start justify-between mb-3 gap-2">
          <h3 class="font-semibold text-gray-800 flex-1 min-w-0">{{ seg.name }}</h3>
          <button
            @click="showMatchedUsers(seg)"
            :disabled="counting[seg.id] || !(matchedUsers[seg.id]?.length)"
            class="badge badge-blue whitespace-nowrap flex-shrink-0 transition-colors"
            :class="matchedUsers[seg.id]?.length ? 'cursor-pointer hover:bg-blue-200' : 'cursor-default'"
          >
            {{ counting[seg.id] ? '…' : (seg.userCount ?? 0) }}人 {{ matchedUsers[seg.id]?.length ? '▸' : '' }}
          </button>
        </div>
        <div class="space-y-2">
          <div v-if="seg.conditions?.tags?.length" class="text-sm">
            <span class="text-gray-500 text-xs">タグ条件（AND）</span>
            <div class="flex flex-wrap gap-1 mt-1">
              <span v-for="tag in seg.conditions.tags" :key="tag" class="badge badge-peach">{{ tag }}</span>
            </div>
          </div>
          <div v-if="seg.conditions?.anyTags?.length" class="text-sm">
            <span class="text-gray-500 text-xs">タグ条件（OR）</span>
            <div class="flex flex-wrap gap-1 mt-1">
              <span v-for="tag in seg.conditions.anyTags" :key="tag" class="badge badge-gray">{{ tag }}</span>
            </div>
          </div>
          <div class="text-xs mt-1">
            <span v-if="seg.conditions?.includeOnboarding" class="badge badge-blue">回答中も含む</span>
            <span v-else class="text-gray-400">完了済みのみ</span>
          </div>
        </div>
        <div class="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-50">
          <NuxtLink :to="`/broadcasts/new?segmentId=${seg.id}`" class="btn-primary text-xs px-3 py-1.5 flex-1 justify-center">
            配信する
          </NuxtLink>
          <button @click="openEdit(seg)" class="btn-ghost text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50">
            編集
          </button>
          <button @click="deleteSegment(seg.id)" class="btn-ghost text-xs px-3 py-1.5 text-red-400 hover:text-red-500 hover:bg-red-50">
            削除
          </button>
        </div>
      </div>
    </div>

    <!-- 該当ユーザー一覧モーダル -->
    <div v-if="viewingSeg" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" @click.self="viewingSeg = null">
      <div class="card w-full max-w-sm max-h-[70vh] flex flex-col">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-gray-800 flex-1 min-w-0 truncate">
            🎯 {{ viewingSeg.name }}
            <span class="text-sm text-gray-400 font-normal ml-1">{{ matchedUsers[viewingSeg.id]?.length ?? 0 }}人</span>
          </h3>
          <button @click="viewingSeg = null" class="btn-ghost px-3 py-1.5 text-sm flex-shrink-0">✕</button>
        </div>
        <div class="flex-1 overflow-y-auto divide-y divide-gray-50">
          <NuxtLink
            v-for="user in matchedUsers[viewingSeg.id] ?? []"
            :key="user.id"
            :to="`/users/${user.id}`"
            class="flex items-center gap-3 py-2.5 hover:bg-peach-50 rounded-lg px-2 transition-colors"
          >
            <img v-if="user.pictureUrl" :src="user.pictureUrl" class="w-8 h-8 rounded-full object-cover" alt="" />
            <div v-else class="w-8 h-8 bg-peach-100 rounded-full flex items-center justify-center">
              <span class="text-peach-600 text-xs font-medium">{{ user.displayName?.charAt(0) }}</span>
            </div>
            <span class="text-sm text-gray-800 flex-1 truncate">{{ user.displayName }}</span>
            <span class="text-xs text-gray-400">詳細 →</span>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- 作成・編集モーダル -->
    <div v-if="showForm" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div class="card w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 class="section-title">{{ editingId ? 'セグメントを編集' : 'セグメントを作成' }}</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">セグメント名</label>
            <input v-model="newSeg.name" type="text" class="input" placeholder="例: 就労支援タグのある方" />
          </div>

          <!-- AND条件 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              タグ条件 AND（すべてのタグを持つユーザー）
            </label>
            <div class="flex flex-wrap gap-1 mb-2">
              <span v-for="tag in newSeg.tags" :key="tag" class="badge badge-peach cursor-pointer" @click="newSeg.tags = newSeg.tags.filter(t => t !== tag)">
                {{ tag }} ×
              </span>
            </div>
            <div v-if="masterTags.length" class="flex flex-wrap gap-1">
              <button
                v-for="t in masterTags.filter(t => !newSeg.tags.includes(t.name))"
                :key="t.id"
                type="button"
                @click="newSeg.tags.push(t.name)"
                class="badge badge-gray text-xs cursor-pointer hover:bg-peach-100 hover:text-peach-700 transition-colors"
              >+ {{ t.name }}</button>
            </div>
          </div>

          <!-- OR条件 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              タグ条件 OR（いずれかのタグを持つユーザー）
            </label>
            <div class="flex flex-wrap gap-1 mb-2">
              <span v-for="tag in newSeg.anyTags" :key="tag" class="badge badge-gray cursor-pointer" @click="newSeg.anyTags = newSeg.anyTags.filter(t => t !== tag)">
                {{ tag }} ×
              </span>
            </div>
            <div v-if="masterTags.length" class="flex flex-wrap gap-1 mb-3">
              <button
                v-for="t in masterTags.filter(t => !newSeg.anyTags.includes(t.name))"
                :key="t.id"
                type="button"
                @click="newSeg.anyTags.push(t.name)"
                class="badge badge-gray text-xs cursor-pointer hover:bg-blue-100 hover:text-blue-700 transition-colors"
              >+ {{ t.name }}</button>
            </div>
          </div>

          <!-- 回答中を含む（条件に関係なく設定可） -->
          <div class="pt-1 border-t border-gray-100">
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="newSeg.includeOnboarding" type="checkbox" class="rounded text-peach-500" />
              <span class="text-sm text-gray-700">回答中の方も含む</span>
            </label>
            <p class="text-xs text-gray-400 mt-1 ml-6">チェックを入れると、オンボーディング回答中のユーザーも配信対象になります</p>
          </div>
        </div>

        <div class="flex gap-3 mt-5 pt-4 border-t border-gray-100">
          <button @click="saveSegment" class="btn-primary" :disabled="!newSeg.name.trim() || saving">
            {{ saving ? '保存中...' : editingId ? '更新する' : '作成する' }}
          </button>
          <button @click="closeForm" class="btn-secondary">キャンセル</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import {
  collection, query, orderBy, onSnapshot, getDocs,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore'

const { db } = useFirebase()

const showForm = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const segments = ref<any[]>([])
const masterTags = ref<any[]>([])
const counting = ref<Record<string, boolean>>({})
const matchedUsers = ref<Record<string, any[]>>({})
const viewingSeg = ref<any>(null)

const showMatchedUsers = (seg: any) => {
  if (matchedUsers.value[seg.id]?.length) viewingSeg.value = seg
}

const newSeg = ref({
  name: '',
  tags: [] as string[],
  anyTags: [] as string[],
  includeOnboarding: false,
})

function matchSegment(userData: any, conditions: any): boolean {
  // 回答中を含まない場合は完了済みのみ対象
  if (!conditions.includeOnboarding && userData.onboardingStatus !== 'completed') return false

  if (conditions.tags?.length) {
    const userTags = userData.tags ?? []
    if (!conditions.tags.every((t: string) => userTags.includes(t))) return false
  }

  if (conditions.anyTags?.length) {
    const userTags = userData.tags ?? []
    if (!conditions.anyTags.some((t: string) => userTags.includes(t))) return false
  }

  return true
}

async function refreshCounts(segs: any[]) {
  segs.forEach(seg => { counting.value[seg.id] = true })
  const usersSnap = await getDocs(collection(db, 'users'))
  const allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }))

  for (const seg of segs) {
    const matched = allUsers.filter(u => matchSegment(u, seg.conditions ?? {}))
    matchedUsers.value[seg.id] = matched
    seg.userCount = matched.length
    counting.value[seg.id] = false
    await updateDoc(doc(db, 'segments', seg.id), { userCount: matched.length })
  }
}

const openEdit = (seg: any) => {
  editingId.value = seg.id
  newSeg.value = {
    name: seg.name,
    tags: [...(seg.conditions?.tags ?? [])],
    anyTags: [...(seg.conditions?.anyTags ?? [])],
    includeOnboarding: seg.conditions?.includeOnboarding ?? false,
  }
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  editingId.value = null
  newSeg.value = { name: '', tags: [], anyTags: [], includeOnboarding: false }
}

const saveSegment = async () => {
  if (!newSeg.value.name.trim()) return
  saving.value = true
  try {
    const conditions: any = {
      includeOnboarding: newSeg.value.includeOnboarding,
    }
    if (newSeg.value.tags.length) conditions.tags = newSeg.value.tags
    if (newSeg.value.anyTags.length) conditions.anyTags = newSeg.value.anyTags

    if (editingId.value) {
      await updateDoc(doc(db, 'segments', editingId.value), {
        name: newSeg.value.name,
        conditions,
        updatedAt: serverTimestamp(),
      })
    } else {
      await addDoc(collection(db, 'segments'), {
        name: newSeg.value.name,
        conditions,
        userCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }
    closeForm()
  } finally {
    saving.value = false
  }
}

const deleteSegment = async (id: string) => {
  if (!confirm('このセグメントを削除しますか？')) return
  await deleteDoc(doc(db, 'segments', id))
}

onMounted(() => {
  onSnapshot(query(collection(db, 'tags'), orderBy('createdAt', 'asc')), snap => {
    masterTags.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  })

  onSnapshot(query(collection(db, 'segments'), orderBy('createdAt', 'desc')), snap => {
    segments.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    refreshCounts(segments.value)
  })
})
</script>
