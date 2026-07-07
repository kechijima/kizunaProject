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
        <RichTextEditor v-model="form.body" placeholder="コンテンツの内容を入力..." />
      </div>

      <!-- 公開URL（自動生成） -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">公開URL</label>
        <div v-if="isNew" class="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
          <span class="text-xs text-gray-400">保存すると自動でURLが発行されます</span>
        </div>
        <div v-else class="flex items-center gap-2 p-3 bg-peach-50 rounded-xl border border-peach-100">
          <span class="text-sm text-peach-600 flex-1 truncate">🔗 {{ publicUrl }}</span>
          <a :href="publicUrl" target="_blank" class="btn-ghost text-xs px-2 py-1 text-gray-500 hover:text-peach-600">開く</a>
          <button type="button" @click="copyUrl" class="btn-secondary text-xs px-3 py-1 whitespace-nowrap">
            {{ copied ? '✓ コピー済' : '📋 コピー' }}
          </button>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">サムネイル画像</label>
        <div class="flex gap-2">
          <input v-model="form.imageUrl" type="url" class="input flex-1" placeholder="https://... または右のボタンからアップロード" />
          <button type="button" @click="thumbInput?.click()" class="btn-secondary whitespace-nowrap" :disabled="uploadingThumb">
            {{ uploadingThumb ? 'アップロード中...' : '📁 アップロード' }}
          </button>
          <input ref="thumbInput" type="file" accept="image/*" class="hidden" @change="uploadThumbnail" />
        </div>
        <div v-if="form.imageUrl" class="mt-2 rounded-xl overflow-hidden bg-gray-100 inline-block">
          <img :src="form.imageUrl" class="max-h-40 max-w-full object-contain rounded-xl" alt="" />
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
        <button @click="showPreview = true" class="btn-secondary">👀 プレビュー</button>
        <NuxtLink to="/contents" class="btn-secondary">キャンセル</NuxtLink>
      </div>
    </div>

    <!-- プレビューモーダル -->
    <div v-if="showPreview" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" @click.self="showPreview = false">
      <div class="bg-warm-50 rounded-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-xl">
        <div class="sticky top-0 flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100 rounded-t-2xl z-10">
          <div class="flex gap-1">
            <button
              @click="previewMode = 'page'"
              :class="['text-sm px-3 py-1.5 rounded-lg font-medium transition-colors', previewMode === 'page' ? 'bg-peach-500 text-white' : 'text-gray-500 hover:bg-peach-50']"
            >🌐 公開ページ</button>
            <button
              @click="previewMode = 'line'"
              :class="['text-sm px-3 py-1.5 rounded-lg font-medium transition-colors', previewMode === 'line' ? 'bg-peach-500 text-white' : 'text-gray-500 hover:bg-peach-50']"
            >💬 LINE表示</button>
          </div>
          <button @click="showPreview = false" class="btn-ghost px-3 py-1.5 text-sm">✕ 閉じる</button>
        </div>

        <!-- 公開ページプレビュー -->
        <div v-if="previewMode === 'page'" class="px-5 py-6 space-y-4">
          <p class="text-xs font-medium text-peach-500">📂 {{ form.category || 'カテゴリ未選択' }}</p>
          <h1 class="text-xl font-bold text-gray-800 leading-snug">{{ form.title || '（タイトル未入力）' }}</h1>
          <img
            v-if="form.imageUrl"
            :src="form.imageUrl"
            class="w-full rounded-xl object-cover max-h-64"
            alt=""
          />
          <!-- 公開ページと同じ判定: HTML本文はそのまま、プレーンテキストは改行保持 -->
          <div
            v-if="isHtmlBody"
            class="bg-white rounded-xl p-5 shadow-sm text-sm text-gray-700 leading-relaxed rich-body"
            v-html="form.body || '<span class=\'text-gray-400\'>（本文未入力）</span>'"
          />
          <div v-else class="bg-white rounded-xl p-5 shadow-sm text-sm text-gray-700 leading-relaxed whitespace-pre-line">{{ form.body || '（本文未入力）' }}</div>
          <div v-if="form.tags.length" class="flex flex-wrap gap-2 pt-2">
            <span
              v-for="tag in form.tags"
              :key="tag"
              class="text-xs bg-peach-50 text-peach-600 px-3 py-1 rounded-full border border-peach-100"
            >#{{ tag }}</span>
          </div>
        </div>

        <!-- LINEカードプレビュー（支援情報検索で送られるカード） -->
        <div v-else class="px-5 py-6">
          <p class="text-xs text-gray-500 mb-3">LINEで「支援情報を探す」からこのコンテンツが届いたときの見え方です</p>
          <div class="bg-[#8cabd9] rounded-xl p-4 flex justify-center">
            <div class="bg-white rounded-2xl overflow-hidden shadow-md w-60">
              <div class="px-4 pt-4 pb-3">
                <p class="text-xs text-peach-500">📂 {{ form.category || 'カテゴリ未選択' }}</p>
                <p class="text-sm font-bold text-gray-800 mt-1.5 leading-snug">{{ form.title || '（タイトル未入力）' }}</p>
                <p class="text-xs text-gray-500 mt-1.5 leading-relaxed">{{ lineBodyPreview }}</p>
              </div>
              <div class="px-3 pb-3">
                <div class="bg-peach-500 text-white text-sm font-medium text-center py-2.5 rounded-lg">
                  全文を読む 📖
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  doc, getDoc, addDoc, updateDoc, collection, getDocs,
  serverTimestamp, orderBy, query,
} from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

const route = useRoute()
const router = useRouter()
const { db, storage } = useFirebase()

const id = route.params.id as string
const isNew = id === 'new'
const saving = ref(false)
const masterTags = ref<{ id: string; name: string }[]>([])
const categories = ref<string[]>([])
const showPreview = ref(false)
const previewMode = ref<'page' | 'line'>('page')

// リッチエディタで作成されたHTML本文かどうか（旧プレーンテキスト記事との互換）
const isHtmlBody = computed(() => /<[a-z][\s\S]*>/i.test(form.value.body))

// LINEカードに表示される本文プレビュー（HTMLタグ除去・60文字）
const lineBodyPreview = computed(() => {
  const text = form.value.body.replace(/<[^>]*>/g, '').trim()
  if (!text) return '（本文未入力）'
  return text.substring(0, 60) + '…'
})
const uploadingThumb = ref(false)
const thumbInput = ref<HTMLInputElement>()

const uploadThumbnail = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploadingThumb.value = true
  try {
    const sRef = storageRef(storage, `contents/thumbnails/${Date.now()}_${file.name}`)
    await uploadBytes(sRef, file)
    form.value.imageUrl = await getDownloadURL(sRef)
  } catch (err: any) {
    alert('画像のアップロードに失敗しました: ' + (err?.message ?? String(err)))
  } finally {
    uploadingThumb.value = false
    if (thumbInput.value) thumbInput.value.value = ''
  }
}

const form = ref({
  title: '',
  body: '',
  category: '',
  status: 'draft',
  linkUrl: '',
  imageUrl: '',
  tags: [] as string[],
})

const BASE_URL = 'https://kizuna-project-d7a79.web.app'

// 公開URL（編集時に自動生成URLを表示）
const publicUrl = computed(() =>
  isNew ? '' : `${(typeof window !== 'undefined' && window.location?.origin) || BASE_URL}/p/${id}`,
)
const copied = ref(false)
const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(publicUrl.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    alert('コピーに失敗しました: ' + publicUrl.value)
  }
}

const toggleTag = (name: string) => {
  const idx = form.value.tags.indexOf(name)
  if (idx >= 0) form.value.tags.splice(idx, 1)
  else form.value.tags.push(name)
}

const removeTag = (tag: string) => {
  form.value.tags = form.value.tags.filter(t => t !== tag)
}

const save = async () => {
  const bodyText = form.value.body.replace(/<[^>]*>/g, '').trim()
  if (!form.value.title.trim() || !bodyText) {
    alert('タイトルと本文は必須です')
    return
  }
  saving.value = true
  try {
    if (isNew) {
      const docRef = await addDoc(collection(db, 'contents'), {
        ...form.value,
        linkUrl: '__pending__',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      // 生成されたIDで公開URLを自動設定
      await updateDoc(docRef, { linkUrl: `${BASE_URL}/p/${docRef.id}` })
    } else {
      await updateDoc(doc(db, 'contents', id), {
        ...form.value,
        // 公開URLは常に自動生成URLに統一
        linkUrl: `${BASE_URL}/p/${id}`,
        updatedAt: serverTimestamp(),
      })
    }
    router.push('/contents')
  } catch (err: any) {
    alert('保存に失敗しました: ' + (err?.message ?? String(err)))
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

<style scoped>
.rich-body :deep(h3) {
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0.75em 0 0.35em;
  color: #333;
}
.rich-body :deep(ul) {
  list-style: disc;
  padding-left: 1.5em;
  margin: 0.5em 0;
}
.rich-body :deep(ol) {
  list-style: decimal;
  padding-left: 1.5em;
  margin: 0.5em 0;
}
.rich-body :deep(a) {
  color: #DC2626;
  text-decoration: underline;
  word-break: break-all;
}
.rich-body :deep(img) {
  max-width: 100%;
  max-height: 360px;
  border-radius: 0.75rem;
  margin: 0.75em auto;
  display: block;
}
</style>
