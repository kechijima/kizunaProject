<template>
  <div class="max-w-2xl mx-auto space-y-5">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-800">タグ管理</h2>
        <p class="text-sm text-gray-500 mt-0.5">ユーザーに付与できるタグを定義します</p>
      </div>
      <button @click="showForm = true" class="btn-primary">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        タグを追加
      </button>
    </div>

    <!-- タグ一覧 -->
    <div class="card">
      <div v-if="tags.length === 0" class="text-center py-12 text-gray-400">
        <p class="text-3xl mb-2">🏷️</p>
        <p class="text-sm">タグがまだ登録されていません</p>
      </div>

      <div v-else class="divide-y divide-gray-50">
        <div
          v-for="tag in tags"
          :key="tag.id"
          class="flex items-center justify-between py-3 first:pt-0 last:pb-0"
        >
          <div class="flex items-center gap-3">
            <span class="badge badge-peach text-sm px-3 py-1">{{ tag.name }}</span>
            <span v-if="tag.description" class="text-sm text-gray-500">{{ tag.description }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-400">{{ tag.userCount ?? 0 }}人に付与</span>
            <button
              @click="startEdit(tag)"
              class="btn-ghost text-xs px-2 py-1 text-gray-500 hover:text-gray-700"
            >
              編集
            </button>
            <button
              @click="deleteTag(tag)"
              class="btn-ghost text-xs px-2 py-1 text-red-400 hover:text-red-500"
            >
              削除
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 追加・編集モーダル -->
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
  </div>
</template>

<script setup lang="ts">
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore'

const { db } = useFirebase()

const tags = ref<any[]>([])
const showForm = ref(false)
const saving = ref(false)
const editingTag = ref<any>(null)
const form = ref({ name: '', description: '' })

const startEdit = (tag: any) => {
  editingTag.value = tag
  form.value = { name: tag.name, description: tag.description ?? '' }
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  editingTag.value = null
  form.value = { name: '', description: '' }
}

const saveTag = async () => {
  if (!form.value.name.trim()) return
  saving.value = true
  try {
    if (editingTag.value) {
      await updateDoc(doc(db, 'tags', editingTag.value.id), {
        name: form.value.name.trim(),
        description: form.value.description.trim(),
        updatedAt: serverTimestamp(),
      })
    } else {
      await addDoc(collection(db, 'tags'), {
        name: form.value.name.trim(),
        description: form.value.description.trim(),
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

onMounted(() => {
  onSnapshot(query(collection(db, 'tags'), orderBy('createdAt', 'asc')), snap => {
    tags.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  })
})
</script>
