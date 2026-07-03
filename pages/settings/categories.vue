<template>
  <div class="max-w-2xl mx-auto space-y-5">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-800">コンテンツ種別管理</h2>
      <button @click="openAdd" class="btn-primary text-sm">＋ 追加</button>
    </div>

    <p class="text-sm text-gray-500">
      コンテンツ管理・LINE配信のカテゴリ選択肢として使われます。順序を変更するには「順序」を編集してください。
    </p>

    <!-- カテゴリ一覧 -->
    <div class="card divide-y divide-gray-100">
      <div v-if="!categories.length" class="py-10 text-center text-gray-400 text-sm">
        カテゴリがありません。「＋ 追加」から作成してください。
      </div>
      <div
        v-for="cat in categories"
        :key="cat.id"
        class="flex items-center gap-3 py-3 px-1"
      >
        <span class="w-8 text-center text-xs text-gray-400 font-mono">{{ cat.order }}</span>
        <span class="flex-1 text-sm font-medium text-gray-800">{{ cat.name }}</span>
        <div class="flex gap-2">
          <button @click="openEdit(cat)" class="text-xs text-peach-500 hover:text-peach-700 px-2 py-1 rounded hover:bg-peach-50">編集</button>
          <button @click="deleteCategory(cat.id)" class="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50">削除</button>
        </div>
      </div>
    </div>

    <!-- 追加・編集モーダル -->
    <div v-if="showModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h3 class="font-semibold text-gray-800">{{ editingId ? 'カテゴリを編集' : 'カテゴリを追加' }}</h3>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">カテゴリ名 <span class="text-red-400">*</span></label>
          <input v-model="form.name" type="text" class="input" placeholder="例: 子育て支援" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">順序</label>
          <input v-model.number="form.order" type="number" class="input" placeholder="0" min="0" />
          <p class="text-xs text-gray-400 mt-1">数字が小さいほど先に表示されます</p>
        </div>

        <div class="flex gap-3 pt-2">
          <button @click="save" class="btn-primary flex-1" :disabled="saving">
            {{ saving ? '保存中...' : '保存する' }}
          </button>
          <button @click="closeModal" class="btn-secondary flex-1">キャンセル</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, query, serverTimestamp,
} from 'firebase/firestore'

interface Category {
  id: string
  name: string
  order: number
}

const { db } = useFirebase()

const categories = ref<Category[]>([])
const showModal = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)

const form = ref({ name: '', order: 0 })

const loadCategories = async () => {
  const snap = await getDocs(query(collection(db, 'categories'), orderBy('order', 'asc')))
  categories.value = snap.docs.map(d => ({
    id: d.id,
    name: d.data().name as string,
    order: d.data().order as number ?? 0,
  }))
}

const openAdd = () => {
  editingId.value = null
  form.value = { name: '', order: categories.value.length }
  showModal.value = true
}

const openEdit = (cat: Category) => {
  editingId.value = cat.id
  form.value = { name: cat.name, order: cat.order }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const save = async () => {
  if (!form.value.name.trim()) {
    alert('カテゴリ名を入力してください')
    return
  }
  saving.value = true
  try {
    if (editingId.value) {
      await updateDoc(doc(db, 'categories', editingId.value), {
        name: form.value.name.trim(),
        order: form.value.order,
        updatedAt: serverTimestamp(),
      })
    } else {
      await addDoc(collection(db, 'categories'), {
        name: form.value.name.trim(),
        order: form.value.order,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }
    await loadCategories()
    closeModal()
  } finally {
    saving.value = false
  }
}

const deleteCategory = async (id: string) => {
  if (!confirm('このカテゴリを削除しますか？\n（すでに設定済みのコンテンツには影響しません）')) return
  await deleteDoc(doc(db, 'categories', id))
  await loadCategories()
}

onMounted(loadCategories)
</script>
