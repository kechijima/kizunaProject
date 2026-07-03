<template>
  <div class="max-w-2xl mx-auto space-y-5">
    <div class="flex items-center gap-3">
      <NuxtLink to="/events" class="btn-ghost px-3 py-2">← 戻る</NuxtLink>
      <h2 class="text-lg font-semibold text-gray-800">イベントを編集</h2>
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
        <textarea v-model="form.description" class="input resize-none" rows="6" placeholder="イベントの詳細を入力..." />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">詳細URL</label>
        <input v-model="form.linkUrl" type="url" class="input" placeholder="https://..." />
        <p class="text-xs text-gray-400 mt-1">LINEで配信する際の「詳しく見る」ボタンのリンク先です</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">画像URL</label>
        <input v-model="form.imageUrl" type="url" class="input" placeholder="https://..." />
        <div v-if="form.imageUrl" class="mt-2 h-32 rounded-xl overflow-hidden bg-gray-100">
          <img :src="form.imageUrl" class="w-full h-full object-cover" alt="" />
        </div>
      </div>

      <!-- 対象：お子様の人数 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">対象：お子様の人数</label>
        <div class="flex gap-3 flex-wrap">
          <label v-for="opt in childrenOptions" :key="opt" class="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" :value="opt" v-model="form.targetChildren" class="rounded" />
            {{ opt }}
          </label>
        </div>
        <p class="text-xs text-gray-400 mt-1">LINEでお子様の人数で絞り込む際に使用されます（未選択=全対象）</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">ステータス</label>
        <select v-model="form.status" class="input">
          <option value="draft">下書き</option>
          <option value="published">公開</option>
          <option value="closed">終了</option>
        </select>
      </div>

      <div class="flex gap-3 pt-2 border-t border-gray-100">
        <button @click="save" class="btn-primary" :disabled="saving">
          {{ saving ? '保存中...' : '保存する' }}
        </button>
        <NuxtLink to="/events" class="btn-secondary">キャンセル</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore'

const route = useRoute()
const router = useRouter()
const { db } = useFirebase()

const id = route.params.id as string
const childrenOptions = ['1人', '2人', '3人以上']
const loading = ref(true)
const saving = ref(false)

const toLocalStr = (ts: any): string => {
  if (!ts) return ''
  const d = ts.toDate?.() ?? new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const form = ref({
  title: '',
  startAtStr: '',
  endAtStr: '',
  location: '',
  description: '',
  linkUrl: '',
  imageUrl: '',
  targetChildren: [] as string[],
  status: 'draft',
})

const save = async () => {
  if (!form.value.title.trim() || !form.value.description.trim()) {
    alert('タイトルと説明は必須です')
    return
  }
  saving.value = true
  try {
    await updateDoc(doc(db, 'events', id), {
      title: form.value.title.trim(),
      startAt: form.value.startAtStr ? Timestamp.fromDate(new Date(form.value.startAtStr)) : null,
      endAt: form.value.endAtStr ? Timestamp.fromDate(new Date(form.value.endAtStr)) : null,
      location: form.value.location.trim(),
      description: form.value.description.trim(),
      linkUrl: form.value.linkUrl.trim(),
      imageUrl: form.value.imageUrl.trim(),
      targetChildren: form.value.targetChildren,
      status: form.value.status,
      updatedAt: serverTimestamp(),
    })
    router.push('/events')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  const snap = await getDoc(doc(db, 'events', id))
  if (snap.exists()) {
    const data = snap.data()
    form.value = {
      title: data.title ?? '',
      startAtStr: toLocalStr(data.startAt),
      endAtStr: toLocalStr(data.endAt),
      location: data.location ?? '',
      description: data.description ?? '',
      linkUrl: data.linkUrl ?? '',
      imageUrl: data.imageUrl ?? '',
      targetChildren: data.targetChildren ?? [],
      status: data.status ?? 'draft',
    }
  }
  loading.value = false
})
</script>
