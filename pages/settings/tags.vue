<template>
  <div class="max-w-2xl mx-auto space-y-5">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-800">タグ管理</h2>
        <p class="text-sm text-gray-500 mt-0.5">ユーザーに付与できるタグをグループ分けして管理します</p>
      </div>
      <div class="flex gap-2">
        <button @click="showGroupForm = true" class="btn-secondary">
          ＋ グループを追加
        </button>
        <button @click="showForm = true" class="btn-primary">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          タグを追加
        </button>
      </div>
    </div>

    <!-- グループごとのタグ一覧 -->
    <div v-if="tags.length === 0 && groups.length === 0" class="card text-center py-12 text-gray-400">
      <p class="text-3xl mb-2">🏷️</p>
      <p class="text-sm">タグがまだ登録されていません</p>
    </div>

    <div v-for="group in groupedList" :key="group.id ?? 'ungrouped'" class="card">
      <!-- グループヘッダー -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full" :class="colorDot(group.color)" />
          <h3 class="font-semibold text-gray-800 text-sm">{{ group.name }}</h3>
          <span class="text-xs text-gray-400">{{ group.tags.length }}件</span>
        </div>
        <div v-if="group.id" class="flex items-center gap-1">
          <button @click="startEditGroup(group)" class="btn-ghost text-xs px-2 py-1 text-gray-500 hover:text-gray-700">編集</button>
          <button @click="deleteGroup(group)" class="btn-ghost text-xs px-2 py-1 text-red-400 hover:text-red-500">削除</button>
        </div>
      </div>

      <div v-if="group.tags.length === 0" class="text-xs text-gray-400 py-2">このグループのタグはありません</div>

      <div v-else class="divide-y divide-gray-50">
        <div
          v-for="(tag, ti) in group.tags"
          :key="tag.id"
          class="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
        >
          <div class="flex items-center gap-3 min-w-0">
            <!-- 並び替え -->
            <div class="flex flex-col flex-shrink-0">
              <button
                @click="moveTag(group, ti, -1)"
                :disabled="ti === 0"
                class="text-gray-300 hover:text-peach-500 disabled:opacity-30 disabled:hover:text-gray-300 leading-none"
                title="上へ"
              >▲</button>
              <button
                @click="moveTag(group, ti, 1)"
                :disabled="ti === group.tags.length - 1"
                class="text-gray-300 hover:text-peach-500 disabled:opacity-30 disabled:hover:text-gray-300 leading-none"
                title="下へ"
              >▼</button>
            </div>
            <span class="badge text-sm px-3 py-1" :class="colorBadge(group.color)">{{ tag.name }}</span>
            <span v-if="tag.description" class="text-sm text-gray-500 truncate">{{ tag.description }}</span>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <span class="text-xs text-gray-400">{{ tag.userCount ?? 0 }}人に付与</span>
            <button @click="startEdit(tag)" class="btn-ghost text-xs px-2 py-1 text-gray-500 hover:text-gray-700">編集</button>
            <button @click="deleteTag(tag)" class="btn-ghost text-xs px-2 py-1 text-red-400 hover:text-red-500">削除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- タグ追加・編集モーダル -->
    <div v-if="showForm" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div class="card w-full max-w-sm">
        <h3 class="section-title">{{ editingTag ? 'タグを編集' : 'タグを追加' }}</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">タグ名 <span class="text-red-400">*</span></label>
            <input
              v-model="form.name"
              type="text"
              class="input"
              placeholder="例: 未就学児あり"
              @keydown.enter="saveTag"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">グループ</label>
            <select v-model="form.groupId" class="input">
              <option value="">未分類</option>
              <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">説明（任意）</label>
            <input
              v-model="form.description"
              type="text"
              class="input"
              placeholder="タグの用途など"
            />
          </div>
        </div>
        <div class="flex gap-3 mt-5 pt-4 border-t border-gray-100">
          <button @click="saveTag" class="btn-primary" :disabled="!form.name.trim() || saving">
            {{ saving ? '保存中...' : editingTag ? '更新する' : '追加する' }}
          </button>
          <button @click="closeForm" class="btn-secondary">キャンセル</button>
        </div>
      </div>
    </div>

    <!-- グループ追加・編集モーダル -->
    <div v-if="showGroupForm" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div class="card w-full max-w-sm">
        <h3 class="section-title">{{ editingGroup ? 'グループを編集' : 'グループを追加' }}</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">グループ名 <span class="text-red-400">*</span></label>
            <input
              v-model="groupForm.name"
              type="text"
              class="input"
              placeholder="例: 支援ニーズ"
              @keydown.enter="saveGroup"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">カラー</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="c in colorOptions"
                :key="c"
                type="button"
                @click="groupForm.color = c"
                class="w-8 h-8 rounded-full transition-transform"
                :class="[colorDot(c), groupForm.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : '']"
                :title="c"
              />
            </div>
          </div>
        </div>
        <div class="flex gap-3 mt-5 pt-4 border-t border-gray-100">
          <button @click="saveGroup" class="btn-primary" :disabled="!groupForm.name.trim() || saving">
            {{ saving ? '保存中...' : editingGroup ? '更新する' : '追加する' }}
          </button>
          <button @click="closeGroupForm" class="btn-secondary">キャンセル</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch,
} from 'firebase/firestore'

const { db } = useFirebase()

const tags = ref<any[]>([])
const groups = ref<any[]>([])
const showForm = ref(false)
const showGroupForm = ref(false)
const saving = ref(false)
const editingTag = ref<any>(null)
const editingGroup = ref<any>(null)
const form = ref({ name: '', description: '', groupId: '' })
const groupForm = ref({ name: '', color: 'red' })

// グループカラー（バッジ・ドットの色分け）
const colorOptions = ['red', 'orange', 'amber', 'green', 'blue', 'purple', 'pink', 'gray']
const colorDot = (c: string) => ({
  red: 'bg-red-400',
  orange: 'bg-orange-400',
  amber: 'bg-amber-400',
  green: 'bg-green-400',
  blue: 'bg-blue-400',
  purple: 'bg-purple-400',
  pink: 'bg-pink-400',
  gray: 'bg-gray-400',
}[c] ?? 'bg-gray-400')
const colorBadge = (c: string) => ({
  red: 'bg-red-100 text-red-700',
  orange: 'bg-orange-100 text-orange-700',
  amber: 'bg-amber-100 text-amber-700',
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  pink: 'bg-pink-100 text-pink-700',
  gray: 'bg-gray-100 text-gray-600',
}[c] ?? 'bg-gray-100 text-gray-600')

// タグの表示順（order優先、未設定は作成順の末尾）
const sortTags = (list: any[]) =>
  [...list].sort((a, b) => (a.order ?? 99999) - (b.order ?? 99999))

// グループ + 未分類 の表示リスト
const groupedList = computed(() => {
  const list = groups.value.map(g => ({
    id: g.id,
    name: g.name,
    color: g.color ?? 'gray',
    tags: sortTags(tags.value.filter(t => t.groupId === g.id)),
  }))
  const ungrouped = sortTags(tags.value.filter(t => !t.groupId || !groups.value.some(g => g.id === t.groupId)))
  if (ungrouped.length) {
    list.push({ id: null as any, name: '未分類', color: 'gray', tags: ungrouped })
  }
  return list
})

// タグの並び替え（グループ内で上下入替 → order一括更新）
const moveTag = async (group: any, index: number, dir: number) => {
  const list = [...group.tags]
  const target = index + dir
  if (target < 0 || target >= list.length) return
  ;[list[index], list[target]] = [list[target], list[index]]
  const batch = writeBatch(db)
  list.forEach((t, i) => batch.update(doc(db, 'tags', t.id), { order: i }))
  await batch.commit()
}

// ─── タグ ───────────────────────────────
const startEdit = (tag: any) => {
  editingTag.value = tag
  form.value = { name: tag.name, description: tag.description ?? '', groupId: tag.groupId ?? '' }
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  editingTag.value = null
  form.value = { name: '', description: '', groupId: '' }
}

const saveTag = async () => {
  if (!form.value.name.trim()) return
  saving.value = true
  try {
    if (editingTag.value) {
      await updateDoc(doc(db, 'tags', editingTag.value.id), {
        name: form.value.name.trim(),
        description: form.value.description.trim(),
        groupId: form.value.groupId,
        updatedAt: serverTimestamp(),
      })
    } else {
      await addDoc(collection(db, 'tags'), {
        name: form.value.name.trim(),
        description: form.value.description.trim(),
        groupId: form.value.groupId,
        order: tags.value.filter(t => (t.groupId ?? '') === form.value.groupId).length,
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

const deleteTag = async (tag: any) => {
  if (!confirm(`タグ「${tag.name}」を削除しますか？\nユーザーに付与済みのタグは影響を受けません。`)) return
  await deleteDoc(doc(db, 'tags', tag.id))
}

// ─── グループ ───────────────────────────
const startEditGroup = (group: any) => {
  editingGroup.value = group
  groupForm.value = { name: group.name, color: group.color ?? 'red' }
  showGroupForm.value = true
}

const closeGroupForm = () => {
  showGroupForm.value = false
  editingGroup.value = null
  groupForm.value = { name: '', color: 'red' }
}

const saveGroup = async () => {
  if (!groupForm.value.name.trim()) return
  saving.value = true
  try {
    if (editingGroup.value) {
      await updateDoc(doc(db, 'tag_groups', editingGroup.value.id), {
        name: groupForm.value.name.trim(),
        color: groupForm.value.color,
        updatedAt: serverTimestamp(),
      })
    } else {
      await addDoc(collection(db, 'tag_groups'), {
        name: groupForm.value.name.trim(),
        color: groupForm.value.color,
        order: groups.value.length,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }
    closeGroupForm()
  } finally {
    saving.value = false
  }
}

const deleteGroup = async (group: any) => {
  if (!confirm(`グループ「${group.name}」を削除しますか？\n所属タグは「未分類」に移動します。`)) return
  const batch = writeBatch(db)
  tags.value.filter(t => t.groupId === group.id).forEach(t => {
    batch.update(doc(db, 'tags', t.id), { groupId: '' })
  })
  batch.delete(doc(db, 'tag_groups', group.id))
  await batch.commit()
}

onMounted(() => {
  onSnapshot(query(collection(db, 'tags'), orderBy('createdAt', 'asc')), snap => {
    tags.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  })
  onSnapshot(query(collection(db, 'tag_groups'), orderBy('createdAt', 'asc')), snap => {
    groups.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  })
})
</script>
