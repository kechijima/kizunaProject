<template>
  <div class="max-w-2xl mx-auto space-y-5">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-800">よくある質問（FAQ）管理</h2>
        <p class="text-sm text-gray-500 mt-0.5">LINEで「よくある質問」ボタンを押したときに表示されます</p>
      </div>
      <button @click="openNew" class="btn-primary">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        FAQを追加
      </button>
    </div>

    <div class="card p-0 overflow-hidden">
      <div v-if="faqs.length === 0" class="text-center py-14 text-gray-400">
        <p class="text-3xl mb-2">❓</p>
        <p class="text-sm">FAQがまだ登録されていません</p>
      </div>

      <div v-else class="divide-y divide-gray-50">
        <div
          v-for="faq in faqs"
          :key="faq.id"
          class="flex items-start gap-4 px-5 py-4 hover:bg-warm-50 transition-colors"
        >
          <!-- 並び順 -->
          <div class="flex flex-col gap-1 pt-0.5 flex-shrink-0">
            <button @click="moveUp(faq)" class="text-gray-300 hover:text-gray-500 disabled:opacity-30" :disabled="faq.order === 1">▲</button>
            <span class="text-xs text-gray-400 text-center">{{ faq.order }}</span>
            <button @click="moveDown(faq)" class="text-gray-300 hover:text-gray-500">▼</button>
          </div>

          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-800 text-sm">❓ {{ faq.question }}</p>
            <p class="text-sm text-gray-500 mt-1 leading-relaxed">{{ faq.answer }}</p>
          </div>

          <div class="flex items-center gap-2 flex-shrink-0">
            <button
              @click="toggleActive(faq)"
              :class="['relative w-9 h-5 rounded-full transition-colors', faq.isActive ? 'bg-peach-500' : 'bg-gray-200']"
            >
              <div :class="['absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', faq.isActive ? 'left-4' : 'left-0.5']" />
            </button>
            <button @click="openEdit(faq)" class="btn-ghost text-xs px-2 py-1 text-gray-500 hover:text-gray-700">編集</button>
            <button @click="deleteFaq(faq)" class="btn-ghost text-xs px-2 py-1 text-red-400 hover:text-red-500">削除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 追加・編集モーダル -->
    <div v-if="showForm" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div class="card w-full max-w-lg">
        <h3 class="section-title">{{ editingId ? 'FAQを編集' : 'FAQを追加' }}</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">質問文 <span class="text-red-400">*</span></label>
            <input v-model="form.question" type="text" class="input" placeholder="例: 児童扶養手当はいつ振り込まれますか？" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">回答 <span class="text-red-400">*</span></label>
            <textarea v-model="form.answer" class="input resize-none" rows="4" placeholder="回答を入力..." />
          </div>
          <label class="flex items-center gap-2 cursor-pointer">
            <div
              :class="['relative w-10 h-6 rounded-full transition-colors', form.isActive ? 'bg-peach-500' : 'bg-gray-200']"
              @click="form.isActive = !form.isActive"
            >
              <div :class="['absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform', form.isActive ? 'left-5' : 'left-1']" />
            </div>
            <span class="text-sm text-gray-600">{{ form.isActive ? '有効（LINEに表示）' : '無効（非表示）' }}</span>
          </label>
        </div>
        <div class="flex gap-3 mt-5 pt-4 border-t border-gray-100">
          <button @click="saveFaq" class="btn-primary" :disabled="!form.question.trim() || !form.answer.trim() || saving">
            {{ saving ? '保存中...' : editingId ? '更新する' : '追加する' }}
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
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs,
} from 'firebase/firestore'

const { db } = useFirebase()
const faqs = ref<any[]>([])
const showForm = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const form = ref({ question: '', answer: '', isActive: true })

const openNew = () => {
  editingId.value = null
  form.value = { question: '', answer: '', isActive: true }
  showForm.value = true
}

const openEdit = (faq: any) => {
  editingId.value = faq.id
  form.value = { question: faq.question, answer: faq.answer, isActive: faq.isActive }
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  editingId.value = null
}

const saveFaq = async () => {
  if (!form.value.question.trim() || !form.value.answer.trim()) return
  saving.value = true
  try {
    if (editingId.value) {
      await updateDoc(doc(db, 'faqs', editingId.value), {
        question: form.value.question.trim(),
        answer: form.value.answer.trim(),
        isActive: form.value.isActive,
        updatedAt: serverTimestamp(),
      })
    } else {
      const maxOrder = faqs.value.length > 0 ? Math.max(...faqs.value.map(f => f.order ?? 0)) : 0
      await addDoc(collection(db, 'faqs'), {
        question: form.value.question.trim(),
        answer: form.value.answer.trim(),
        isActive: form.value.isActive,
        order: maxOrder + 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }
    closeForm()
  } finally {
    saving.value = false
  }
}

const toggleActive = async (faq: any) => {
  await updateDoc(doc(db, 'faqs', faq.id), { isActive: !faq.isActive, updatedAt: serverTimestamp() })
}

const deleteFaq = async (faq: any) => {
  if (!confirm(`「${faq.question}」を削除しますか？`)) return
  await deleteDoc(doc(db, 'faqs', faq.id))
}

const moveUp = async (faq: any) => {
  const idx = faqs.value.findIndex(f => f.id === faq.id)
  if (idx <= 0) return
  const prev = faqs.value[idx - 1]
  await Promise.all([
    updateDoc(doc(db, 'faqs', faq.id), { order: prev.order }),
    updateDoc(doc(db, 'faqs', prev.id), { order: faq.order }),
  ])
}

const moveDown = async (faq: any) => {
  const idx = faqs.value.findIndex(f => f.id === faq.id)
  if (idx >= faqs.value.length - 1) return
  const next = faqs.value[idx + 1]
  await Promise.all([
    updateDoc(doc(db, 'faqs', faq.id), { order: next.order }),
    updateDoc(doc(db, 'faqs', next.id), { order: faq.order }),
  ])
}

onMounted(() => {
  onSnapshot(query(collection(db, 'faqs'), orderBy('order', 'asc')), snap => {
    faqs.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  })
})
</script>
