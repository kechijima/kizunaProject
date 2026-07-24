<template>
  <div class="max-w-2xl mx-auto space-y-5">
    <div class="flex items-center gap-3">
      <NuxtLink to="/events" class="btn-ghost px-3 py-2">← 戻る</NuxtLink>
      <h2 class="text-lg font-semibold text-gray-800">{{ isNew ? 'イベントを追加' : 'イベントを編集' }}</h2>
    </div>

    <div v-if="loading" class="py-10 text-center text-gray-400 text-sm">読み込み中...</div>

    <div v-else class="card space-y-5">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">タイトル <span class="text-red-400">*</span></label>
        <input v-model="form.title" type="text" class="input" placeholder="イベントタイトルを入力..." />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">開始日時</label>
          <input v-model="form.startAtStr" type="datetime-local" class="input" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">終了日時</label>
          <input v-model="form.endAtStr" type="datetime-local" class="input" />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">開催場所</label>
        <input v-model="form.location" type="text" class="input" placeholder="例: オンライン / 渋谷区○○センター" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">説明 <span class="text-red-400">*</span></label>
        <RichTextEditor v-model="form.description" placeholder="イベントの詳細を入力..." />
      </div>

      <!-- 公開URL（自動生成） -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">公開URL</label>
        <div v-if="isNew" class="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
          <span class="text-xs text-gray-400">保存すると自動でURLが発行されます（LINEの「詳しく見る」ボタンのリンク先になります）</span>
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
        <label class="block text-sm font-medium text-gray-700 mb-1.5">画像URL</label>
        <input v-model="form.imageUrl" type="url" class="input" placeholder="https://..." />
        <div v-if="form.imageUrl" class="mt-2 h-32 rounded-xl overflow-hidden bg-gray-100">
          <img :src="form.imageUrl" class="w-full h-full object-cover" alt="" />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">ステータス</label>
        <select v-model="form.status" class="input">
          <option value="draft">下書き</option>
          <option value="published">公開</option>
          <option value="closed">終了</option>
        </select>
      </div>

      <!-- 参加申し込み設定 -->
      <div class="pt-2 border-t border-gray-100">
        <label class="flex items-center gap-2 cursor-pointer mb-1">
          <div
            class="relative w-10 h-6 rounded-full transition-colors duration-200"
            :class="form.applicationEnabled ? 'bg-peach-500' : 'bg-gray-200'"
            @click="form.applicationEnabled = !form.applicationEnabled"
          >
            <div
              class="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200"
              :class="form.applicationEnabled ? 'left-5' : 'left-1'"
            />
          </div>
          <span class="text-sm font-medium text-gray-700">このシステムで参加申し込みを受け付ける</span>
        </label>
        <p class="text-xs text-gray-400 ml-12">
          オフの場合、公開ページには申し込みフォームを表示しません（案内や外部リンクのみのイベントに）
        </p>

        <!-- フォーム項目設定 -->
        <div v-if="form.applicationEnabled" class="mt-4 border border-gray-200 rounded-xl p-4 bg-warm-50 space-y-3">
          <p class="text-sm font-medium text-gray-700">申し込みフォームの項目</p>

          <div
            v-for="(field, index) in form.applicationFields"
            :key="field.id"
            class="bg-white border border-gray-200 rounded-lg p-3 space-y-2"
          >
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 bg-peach-100 text-peach-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{{ index + 1 }}</span>
              <input
                v-model="field.label"
                type="text"
                class="input text-sm py-1.5 flex-1"
                placeholder="項目名（例: お名前）"
              />
              <div class="flex flex-col flex-shrink-0">
                <button @click="moveField(index, -1)" :disabled="index === 0" class="text-gray-300 hover:text-peach-500 disabled:opacity-30 leading-none text-xs">▲</button>
                <button @click="moveField(index, 1)" :disabled="index === form.applicationFields.length - 1" class="text-gray-300 hover:text-peach-500 disabled:opacity-30 leading-none text-xs">▼</button>
              </div>
              <button @click="removeField(index)" class="text-gray-400 hover:text-red-400 flex-shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="flex items-center gap-3 flex-wrap pl-7">
              <select v-model="field.type" class="input text-xs py-1.5 w-32">
                <option value="text">1行テキスト</option>
                <option value="textarea">複数行テキスト</option>
                <option value="tel">電話番号</option>
                <option value="email">メール</option>
                <option value="select">選択式</option>
              </select>
              <label class="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                <input type="checkbox" v-model="field.required" class="rounded" />
                必須
              </label>
              <input
                v-if="field.type === 'select'"
                v-model="field.optionsStr"
                type="text"
                class="input text-xs py-1.5 flex-1 min-w-[140px]"
                placeholder="選択肢（カンマ区切り: 午前,午後）"
              />
            </div>
          </div>

          <button @click="addField" class="btn-ghost text-xs px-3 py-1.5">＋ 項目を追加</button>
        </div>
      </div>

      <div class="flex gap-3 pt-2 border-t border-gray-100">
        <button @click="save" class="btn-primary" :disabled="saving">
          {{ saving ? '保存中...' : (isNew ? '追加する' : '保存する') }}
        </button>
        <NuxtLink to="/events" class="btn-secondary">キャンセル</NuxtLink>
      </div>
    </div>

    <!-- 参加申し込み一覧 -->
    <div v-if="!loading && !isNew && form.applicationEnabled" class="card">
      <h2 class="section-title">参加申し込み <span class="text-sm text-gray-400 font-normal">{{ applications.length }}件</span></h2>
      <div v-if="applications.length === 0" class="text-sm text-gray-400 py-4 text-center">
        まだ申し込みはありません
      </div>
      <div v-else class="divide-y divide-gray-50">
        <div v-for="app in applications" :key="app.id" class="py-3 first:pt-0 last:pb-0">
          <div class="flex items-center justify-between mb-1">
            <p class="text-sm font-medium text-gray-800">{{ appName(app) }}</p>
            <p class="text-xs text-gray-400">{{ formatAppDate(app.createdAt) }}</p>
          </div>
          <!-- 新形式（answers配列） -->
          <div v-if="app.answers?.length" class="space-y-0.5">
            <p v-for="(a, i) in app.answers" :key="i" class="text-xs text-gray-600">
              <span class="text-gray-400">{{ a.label }}：</span>{{ a.value || '（未記入）' }}
            </p>
          </div>
          <!-- 旧形式（name/contact/message） -->
          <template v-else>
            <p v-if="app.contact" class="text-xs text-gray-500">📞 {{ app.contact }}</p>
            <p v-if="app.message" class="text-sm text-gray-600 mt-1 whitespace-pre-line">{{ app.message }}</p>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { doc, getDoc, addDoc, updateDoc, serverTimestamp, Timestamp, collection, query, orderBy, onSnapshot } from 'firebase/firestore'

const route = useRoute()
const router = useRouter()
const { db } = useFirebase()

const id = route.params.id as string
const isNew = id === 'new'
const loading = ref(!isNew)
const saving = ref(false)
const applications = ref<any[]>([])

const BASE_URL = 'https://kizuna-project-d7a79.web.app'
const publicUrl = computed(() =>
  `${(typeof window !== 'undefined' && window.location?.origin) || BASE_URL}/e/${id}`,
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

const formatAppDate = (ts: any) => {
  if (!ts) return ''
  const d = ts.toDate?.() ?? new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// 申し込みの表示名（新形式は最初の項目、旧形式はname）
const appName = (app: any) => {
  if (app.answers?.length) return app.answers[0]?.value || '（無記名）'
  return app.name || '（無記名）'
}

const toLocalStr = (ts: any): string => {
  if (!ts) return ''
  const d = ts.toDate?.() ?? new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

type AppField = {
  id: string
  label: string
  type: 'text' | 'textarea' | 'tel' | 'email' | 'select'
  required: boolean
  optionsStr?: string
}

const defaultFields = (): AppField[] => [
  { id: crypto.randomUUID(), label: 'お名前', type: 'text', required: true, optionsStr: '' },
  { id: crypto.randomUUID(), label: '連絡先（電話・メールなど）', type: 'text', required: false, optionsStr: '' },
  { id: crypto.randomUUID(), label: 'メッセージ', type: 'textarea', required: false, optionsStr: '' },
]

const form = ref({
  title: '',
  startAtStr: '',
  endAtStr: '',
  location: '',
  description: '',
  imageUrl: '',
  status: 'draft',
  applicationEnabled: false,
  applicationFields: defaultFields(),
})

const addField = () => {
  form.value.applicationFields.push({ id: crypto.randomUUID(), label: '', type: 'text', required: false, optionsStr: '' })
}
const removeField = (index: number) => {
  form.value.applicationFields.splice(index, 1)
}
const moveField = (index: number, dir: number) => {
  const target = index + dir
  if (target < 0 || target >= form.value.applicationFields.length) return
  const list = form.value.applicationFields
  ;[list[index], list[target]] = [list[target], list[index]]
}

const save = async () => {
  const descText = form.value.description.replace(/<[^>]*>/g, '').trim()
  if (!form.value.title.trim() || !descText) {
    alert('タイトルと説明は必須です')
    return
  }
  if (form.value.applicationEnabled) {
    if (form.value.applicationFields.length === 0) {
      alert('申し込みフォームの項目を1つ以上設定してください')
      return
    }
    if (form.value.applicationFields.some(f => !f.label.trim())) {
      alert('申し込みフォームの項目名をすべて入力してください')
      return
    }
  }
  saving.value = true
  try {
    // フォーム項目を保存用に整形（optionsStr → options配列）
    const applicationFields = form.value.applicationFields.map(f => ({
      id: f.id,
      label: f.label.trim(),
      type: f.type,
      required: f.required,
      options: f.type === 'select'
        ? (f.optionsStr ?? '').split(',').map(s => s.trim()).filter(Boolean)
        : [],
    }))

    const payload: any = {
      title: form.value.title.trim(),
      startAt: form.value.startAtStr ? Timestamp.fromDate(new Date(form.value.startAtStr)) : null,
      endAt: form.value.endAtStr ? Timestamp.fromDate(new Date(form.value.endAtStr)) : null,
      location: form.value.location.trim(),
      description: form.value.description,
      imageUrl: form.value.imageUrl.trim(),
      status: form.value.status,
      applicationEnabled: form.value.applicationEnabled,
      applicationFields,
      updatedAt: serverTimestamp(),
    }

    if (isNew) {
      const docRef = await addDoc(collection(db, 'events'), {
        ...payload,
        linkUrl: '__pending__',
        createdAt: serverTimestamp(),
      })
      await updateDoc(docRef, { linkUrl: `${BASE_URL}/e/${docRef.id}` })
    } else {
      await updateDoc(doc(db, 'events', id), {
        ...payload,
        linkUrl: `${BASE_URL}/e/${id}`,
      })
    }
    router.push('/events')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  if (!isNew) {
    const snap = await getDoc(doc(db, 'events', id))
    if (snap.exists()) {
      const data = snap.data()
      const fields: AppField[] = (data.applicationFields ?? []).map((f: any) => ({
        id: f.id ?? crypto.randomUUID(),
        label: f.label ?? '',
        type: f.type ?? 'text',
        required: !!f.required,
        optionsStr: (f.options ?? []).join(','),
      }))
      form.value = {
        title: data.title ?? '',
        startAtStr: toLocalStr(data.startAt),
        endAtStr: toLocalStr(data.endAt),
        location: data.location ?? '',
        description: data.description ?? '',
        imageUrl: data.imageUrl ?? '',
        status: data.status ?? 'draft',
        applicationEnabled: data.applicationEnabled ?? false,
        applicationFields: fields.length ? fields : defaultFields(),
      }
    }
    loading.value = false

    // 参加申し込み一覧（リアルタイム）
    onSnapshot(
      query(collection(db, 'events', id, 'applications'), orderBy('createdAt', 'desc')),
      snap => { applications.value = snap.docs.map(d => ({ id: d.id, ...d.data() })) },
    )
  }
})
</script>
