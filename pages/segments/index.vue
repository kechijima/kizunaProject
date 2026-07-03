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
          <span class="badge badge-blue whitespace-nowrap flex-shrink-0">
            {{ counting[seg.id] ? '…' : (seg.userCount ?? 0) }}人
          </span>
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
          <div v-if="seg.conditions?.region" class="text-sm">
            <span class="text-gray-500 text-xs">地域</span>
            <span class="ml-2 badge badge-blue">{{ seg.conditions.region }}</span>
          </div>
        </div>
        <div class="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-50">
          <NuxtLink :to="`/broadcasts/new?segmentId=${seg.id}`" class="btn-primary text-xs px-3 py-1.5 flex-1 justify-center">
            配信する
          </NuxtLink>
          <button @click="openTagAssign(seg)" class="btn-secondary text-xs px-3 py-1.5">
            🏷️ タグ設定
          </button>
          <button @click="openEdit(seg)" class="btn-ghost text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50">
            編集
          </button>
          <button @click="deleteSegment(seg.id)" class="btn-ghost text-xs px-3 py-1.5 text-red-400 hover:text-red-500 hover:bg-red-50">
            削除
          </button>
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
            <input v-model="newSeg.name" type="text" class="input" placeholder="例: 東京在住・未就学児のいる方" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              タグ条件 AND（すべてのタグを持つユーザー）
            </label>
            <div class="flex flex-wrap gap-1 mb-2">
              <span v-for="tag in newSeg.tags" :key="tag" class="badge badge-peach cursor-pointer" @click="newSeg.tags = newSeg.tags.filter(t => t !== tag)">
                {{ tag }} ×
              </span>
            </div>
            <div v-if="masterTags.length" class="flex flex-wrap gap-1 mb-2">
              <button
                v-for="t in masterTags.filter(t => !newSeg.tags.includes(t.name))"
                :key="t.id"
                type="button"
                @click="newSeg.tags.push(t.name)"
                class="badge badge-gray text-xs cursor-pointer hover:bg-peach-100 hover:text-peach-700 transition-colors"
              >+ {{ t.name }}</button>
            </div>
            <div class="flex gap-2">
              <input v-model="tagInput" type="text" class="input text-sm" placeholder="その他のタグを直接入力..." @keydown.enter="addSegTag" />
              <button @click="addSegTag" class="btn-secondary text-sm px-3">追加</button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              タグ条件 OR（いずれかのタグを持つユーザー）
            </label>
            <div class="flex flex-wrap gap-1 mb-2">
              <span v-for="tag in newSeg.anyTags" :key="tag" class="badge badge-gray cursor-pointer" @click="newSeg.anyTags = newSeg.anyTags.filter(t => t !== tag)">
                {{ tag }} ×
              </span>
            </div>
            <div v-if="masterTags.length" class="flex flex-wrap gap-1 mb-2">
              <button
                v-for="t in masterTags.filter(t => !newSeg.anyTags.includes(t.name))"
                :key="t.id"
                type="button"
                @click="newSeg.anyTags.push(t.name)"
                class="badge badge-gray text-xs cursor-pointer hover:bg-blue-100 hover:text-blue-700 transition-colors"
              >+ {{ t.name }}</button>
            </div>
            <div class="flex gap-2">
              <input v-model="anyTagInput" type="text" class="input text-sm" placeholder="その他のタグを直接入力..." @keydown.enter="addAnySegTag" />
              <button @click="addAnySegTag" class="btn-secondary text-sm px-3">追加</button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">地域（任意）</label>
            <input v-model="newSeg.region" type="text" class="input" placeholder="例: 東京都" />
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

    <!-- 一括タグ設定モーダル -->
    <div v-if="tagAssignModal.show" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div class="card w-full max-w-md">
        <h3 class="section-title">🏷️ セグメントにタグを設定</h3>
        <p class="text-sm text-gray-600 mb-4">
          「<strong>{{ tagAssignModal.segment?.name }}</strong>」に該当するユーザー全員に、選択したタグを一括付与します。
        </p>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">付与するタグ <span class="text-red-400">*</span></label>
            <div v-if="masterTags.length > 0" class="flex flex-wrap gap-2 mb-2">
              <button
                v-for="t in masterTags"
                :key="t.id"
                @click="toggleAssignTag(t.name)"
                :class="[
                  'badge text-sm px-3 py-1 cursor-pointer transition-all',
                  tagAssignModal.selectedTags.includes(t.name) ? 'badge-peach' : 'badge-gray'
                ]"
              >
                {{ tagAssignModal.selectedTags.includes(t.name) ? '✓ ' : '' }}{{ t.name }}
              </button>
            </div>
            <div class="flex gap-2 mt-2">
              <input
                v-model="tagAssignModal.customTag"
                type="text"
                class="input text-sm"
                placeholder="タグ名を直接入力..."
                @keydown.enter="addCustomAssignTag"
              />
              <button @click="addCustomAssignTag" class="btn-secondary text-sm px-3">追加</button>
            </div>
            <div v-if="tagAssignModal.selectedTags.length" class="flex flex-wrap gap-1 mt-2">
              <span
                v-for="tag in tagAssignModal.selectedTags"
                :key="tag"
                class="badge badge-peach cursor-pointer"
                @click="tagAssignModal.selectedTags = tagAssignModal.selectedTags.filter(t => t !== tag)"
              >
                {{ tag }} ×
              </span>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">操作</label>
            <div class="flex gap-4">
              <label class="flex items-center gap-2 cursor-pointer text-sm">
                <input v-model="tagAssignModal.action" type="radio" value="add" />
                <span>タグを追加</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer text-sm">
                <input v-model="tagAssignModal.action" type="radio" value="remove" />
                <span class="text-red-500">タグを削除</span>
              </label>
            </div>
          </div>

          <div v-if="tagAssignModal.result" :class="['text-sm p-3 rounded-lg', tagAssignModal.result.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700']">
            {{ tagAssignModal.result.message }}
          </div>
        </div>

        <div class="flex gap-3 mt-5 pt-4 border-t border-gray-100">
          <button
            @click="executeTagAssign"
            class="btn-primary"
            :disabled="tagAssignModal.selectedTags.length === 0 || tagAssignModal.running"
          >
            {{ tagAssignModal.running ? '処理中...' : tagAssignModal.action === 'add' ? 'タグを付与する' : 'タグを削除する' }}
          </button>
          <button @click="closeTagAssign" class="btn-secondary">閉じる</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  collection, query, orderBy, onSnapshot, getDocs, where,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp, arrayUnion, arrayRemove,
} from 'firebase/firestore'

const { db } = useFirebase()

const showForm = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const segments = ref<any[]>([])
const masterTags = ref<any[]>([])
const counting = ref<Record<string, boolean>>({})
const tagInput = ref('')
const anyTagInput = ref('')
const newSeg = ref({ name: '', tags: [] as string[], anyTags: [] as string[], region: '' })

const tagAssignModal = ref({
  show: false,
  segment: null as any,
  selectedTags: [] as string[],
  customTag: '',
  action: 'add' as 'add' | 'remove',
  running: false,
  result: null as { ok: boolean; message: string } | null,
})

// ─── ユーザー数カウント ──────────────────────────

async function calcUserCount(seg: any): Promise<number> {
  const conditions = seg.conditions ?? {}
  const userIds = new Set<string>()

  if (conditions.tags?.length) {
    const snap = await getDocs(collection(db, 'users'))
    snap.docs.forEach(d => {
      const userTags: string[] = d.data().tags ?? []
      if (conditions.tags.every((t: string) => userTags.includes(t))) userIds.add(d.id)
    })
  }

  if (conditions.anyTags?.length) {
    const snap = await getDocs(
      query(collection(db, 'users'), where('tags', 'array-contains-any', conditions.anyTags))
    )
    snap.docs.forEach(d => userIds.add(d.id))
  }

  if (!conditions.tags?.length && !conditions.anyTags?.length) {
    const snap = await getDocs(collection(db, 'users'))
    snap.docs.forEach(d => userIds.add(d.id))
  }

  return userIds.size
}

async function refreshCounts(segs: any[]) {
  for (const seg of segs) {
    counting.value[seg.id] = true
    const count = await calcUserCount(seg)
    seg.userCount = count
    counting.value[seg.id] = false
    await updateDoc(doc(db, 'segments', seg.id), { userCount: count })
  }
}

// ─── セグメント作成・編集 ────────────────────────

const addSegTag = () => {
  const t = tagInput.value.trim()
  if (t && !newSeg.value.tags.includes(t)) newSeg.value.tags.push(t)
  tagInput.value = ''
}
const addAnySegTag = () => {
  const t = anyTagInput.value.trim()
  if (t && !newSeg.value.anyTags.includes(t)) newSeg.value.anyTags.push(t)
  anyTagInput.value = ''
}

const openEdit = (seg: any) => {
  editingId.value = seg.id
  newSeg.value = {
    name: seg.name,
    tags: [...(seg.conditions?.tags ?? [])],
    anyTags: [...(seg.conditions?.anyTags ?? [])],
    region: seg.conditions?.region ?? '',
  }
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  editingId.value = null
  newSeg.value = { name: '', tags: [], anyTags: [], region: '' }
  tagInput.value = ''
  anyTagInput.value = ''
}

const saveSegment = async () => {
  if (!newSeg.value.name.trim()) return
  saving.value = true
  try {
    const conditions: any = {}
    if (newSeg.value.tags.length) conditions.tags = newSeg.value.tags
    if (newSeg.value.anyTags.length) conditions.anyTags = newSeg.value.anyTags
    if (newSeg.value.region.trim()) conditions.region = newSeg.value.region.trim()

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

// ─── 一括タグ設定 ────────────────────────────────

const openTagAssign = (seg: any) => {
  tagAssignModal.value = {
    show: true, segment: seg, selectedTags: [], customTag: '',
    action: 'add', running: false, result: null,
  }
}
const closeTagAssign = () => { tagAssignModal.value.show = false }

const toggleAssignTag = (name: string) => {
  const idx = tagAssignModal.value.selectedTags.indexOf(name)
  if (idx >= 0) tagAssignModal.value.selectedTags.splice(idx, 1)
  else tagAssignModal.value.selectedTags.push(name)
}

const addCustomAssignTag = () => {
  const t = tagAssignModal.value.customTag.trim()
  if (t && !tagAssignModal.value.selectedTags.includes(t)) tagAssignModal.value.selectedTags.push(t)
  tagAssignModal.value.customTag = ''
}

const executeTagAssign = async () => {
  const modal = tagAssignModal.value
  if (!modal.selectedTags.length || modal.running) return
  modal.running = true
  modal.result = null
  try {
    const snap = await getDocs(collection(db, 'users'))
    const conditions = modal.segment.conditions ?? {}
    const userIds: string[] = []

    snap.docs.forEach(d => {
      const userTags: string[] = d.data().tags ?? []
      if (conditions.tags?.length && conditions.tags.every((t: string) => userTags.includes(t))) {
        userIds.push(d.id)
      } else if (conditions.anyTags?.length && conditions.anyTags.some((t: string) => userTags.includes(t))) {
        userIds.push(d.id)
      } else if (!conditions.tags?.length && !conditions.anyTags?.length) {
        userIds.push(d.id)
      }
    })

    if (!userIds.length) {
      modal.result = { ok: false, message: '対象ユーザーが見つかりませんでした' }
      return
    }

    const op = modal.action === 'add' ? arrayUnion(...modal.selectedTags) : arrayRemove(...modal.selectedTags)
    await Promise.all(userIds.map(uid => updateDoc(doc(db, 'users', uid), { tags: op })))

    // カウント更新
    const count = await calcUserCount(modal.segment)
    modal.segment.userCount = count
    await updateDoc(doc(db, 'segments', modal.segment.id), { userCount: count })

    const verb = modal.action === 'add' ? '付与' : '削除'
    modal.result = { ok: true, message: `${userIds.length}人のユーザーにタグを${verb}しました：${modal.selectedTags.join('、')}` }
  } catch (e: any) {
    modal.result = { ok: false, message: 'エラー: ' + e.message }
  } finally {
    modal.running = false
  }
}

// ─── 初期データ取得 ──────────────────────────────

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
