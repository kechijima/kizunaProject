<template>
  <div class="max-w-2xl mx-auto space-y-5">
    <div class="flex items-center gap-3">
      <NuxtLink to="/contents" class="btn-ghost px-3 py-2">← 戻る</NuxtLink>
      <h2 class="text-lg font-semibold text-gray-800">
        {{ isNew ? 'コンテンツを追加' : 'コンテンツを編集' }}
      </h2>
    </div>

    <div class="card space-y-5">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">タイトル <span class="text-red-400">*</span></label>
        <input v-model="form.title" type="text" class="input" placeholder="タイトルを入力..." />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">カテゴリ</label>
          <select v-model="form.category" class="input">
            <option value="">カテゴリを選択</option>
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">ステータス</label>
          <select v-model="form.status" class="input">
            <option value="draft">下書き</option>
            <option value="published">公開</option>
          </select>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">本文 <span class="text-red-400">*</span></label>
        <textarea v-model="form.body" class="input resize-none" rows="8" placeholder="コンテンツの内容を入力..." />
      </div>

      <!-- リンクURL -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">リンクURL</label>
        <div v-if="publicUrl && !form.linkUrl" class="flex items-center gap-2 p-3 bg-peach-50 rounded-xl border border-peach-100 mb-2">
          <span class="text-xs text-peach-600 flex-1 truncate">🔗 {{ publicUrl }}</span>
          <span class="text-xs text-peach-400">保存後に自動設定</span>
        </div>
        <input v-model="form.linkUrl" type="url" class="input" placeholder="https://... （空欄の場合は自動生成）" />
        <p v-if="form.linkUrl" class="text-xs text-gray-400 mt-1">
          <a :href="form.linkUrl" target="_blank" class="text-peach-500 underline">{{ form.linkUrl }}</a>
        </p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">画像URL</label>
        <input v-model="form.imageUrl" type="url" class="input" placeholder="https://..." />
        <div v-if="form.imageUrl" class="mt-2 h-32 rounded-xl overflow-hidden bg-gray-100">
          <img :src="form.imageUrl" class="w-full h-full object-cover" alt="" />
        </div>
      </div>

      <!-- タグ（マスタータグから選択） -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">タグ</label>

        <!-- 選択済みタグ -->
        <div v-if="form.tags.length" class="flex flex-wrap gap-2 mb-3">
          <button
            v-for="tag in form.tags"
            :key="tag"
            @click="removeTag(tag)"
            class="badge badge-peach cursor-pointer hover:bg-peach-200 transition-colors"
          >
            {{ tag }} ×
          </button>
        </div>

        <!-- マスタータグ選択 -->
        <div v-if="masterTags.length" class="flex flex-wrap gap-2">
          <button
            v-for="mt in masterTags"
            :key="mt.id"
            @click="toggleTag(mt.name)"
            :class="[
              'text-xs px-3 py-1.5 rounded-full border transition-colors',
              form.tags.includes(mt.name)
                ? 'border-peach-400 bg-peach-400 text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:border-peach-300 hover:text-peach-600'
            ]"
          >
            {{ mt.name }}
          </button>
        </div>
        <p v-else class="text-xs text-gray-400">タグ管理でタグを追加するとここに表示されます</p>
      </div>

      <div class="flex gap-3 pt-2 border-t border-gray-100">
        <button @click="save" class="btn-primary" :disabled="saving">
          {{ saving ? '保存中...' : (isNew ? '追加する' : '保存する') }}
        </button>
        <NuxtLink to="/contents" class="btn-secondary">キャンセル</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  doc, getDoc, addDoc, updateDoc, collection, getDocs,
  serverTimestamp, orderBy, query,
} from 'firebase/firestore'

const route = useRoute()
const router = useRouter()
const { db } = useFirebase()
const config = useRuntimeConfig()

const id = route.params.id as string
const isNew = id === 'new'
const saving = ref(false)
const masterTags = ref<{ id: string; name: string }[]>([])
const categories = ref<string[]>([])

const form = ref({
  title: '',
  body: '',
  category: '',
  status: 'draft',
  linkUrl: '',
  imageUrl: '',
  tags: [] as string[],
})

// 既存コンテンツの公開URL（編集時）
const publicUrl = computed(() =>
  isNew ? '' : `${window?.location?.origin ?? 'https://kizuna-project-d7a79.web.app'}/p/${id}`,
)

const toggleTag = (name: string) => {
  const idx = form.value.tags.indexOf(name)
  if (idx >= 0) form.value.tags.splice(idx, 1)
  else form.value.tags.push(name)
}

const removeTag = (tag: string) => {
  form.value.tags = form.value.tags.filter(t => t !== tag)
}

const save = async () => {
  if (!form.value.title.trim() || !form.value.body.trim()) {
    alert('タイトルと本文は必須です')
    return
  }
  saving.value = true
  try {
    const base = window?.location?.origin ?? 'https://kizuna-project-d7a79.web.app'
    if (isNew) {
      const docRef = await addDoc(collection(db, 'contents'), {
        ...form.value,
        // リンクURLが空なら公開ページURLを自動設定
        linkUrl: form.value.linkUrl || '__pending__',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      // 生成されたIDで公開URLを上書き
      if (!form.value.linkUrl) {
        await updateDoc(docRef, { linkUrl: `${base}/p/${docRef.id}` })
      }
    } else {
      await updateDoc(doc(db, 'contents', id), {
        ...form.value,
        updatedAt: serverTimestamp(),
      })
    }
    router.push('/contents')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  // マスタータグ・カテゴリ読み込み
  const [tagSnap, catSnap] = await Promise.all([
    getDocs(collection(db, 'tags')),
    getDocs(query(collection(db, 'categories'), orderBy('order', 'asc'))),
  ])
  masterTags.value = tagSnap.docs.map(d => ({ id: d.id, name: (d.data() as any).name }))
  categories.value = catSnap.empty
    ? ['子育て支援', '住居支援', '就労支援', '経済支援', '法律・権利', 'その他']
    : catSnap.docs.map(d => (d.data() as any).name as string)

  if (!isNew) {
    const snap = await getDoc(doc(db, 'contents', id))
    if (snap.exists()) {
      const data = snap.data()
      form.value = {
        title: data.title ?? '',
        body: data.body ?? '',
        category: data.category ?? '',
        status: data.status ?? 'draft',
        linkUrl: data.linkUrl ?? '',
        imageUrl: data.imageUrl ?? '',
        tags: data.tags ?? [],
      }
    }
  }
})
</script>
