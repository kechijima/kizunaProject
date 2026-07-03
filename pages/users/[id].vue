<template>
  <div v-if="loading" class="flex items-center justify-center h-64">
    <div class="w-8 h-8 border-4 border-peach-300 border-t-peach-500 rounded-full animate-spin" />
  </div>

  <div v-else-if="!user" class="text-center py-16 text-gray-400">
    <p class="text-4xl mb-3">😕</p>
    <p>ユーザーが見つかりません</p>
    <NuxtLink to="/users" class="btn-secondary mt-4">ユーザー一覧に戻る</NuxtLink>
  </div>

  <div v-else class="space-y-5">
    <!-- 戻るボタン -->
    <div class="flex items-center gap-3">
      <NuxtLink to="/users" class="btn-ghost px-3 py-2">
        ← 戻る
      </NuxtLink>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <!-- プロフィール -->
      <div class="space-y-5">
        <div class="card text-center">
          <img
            v-if="user.pictureUrl"
            :src="user.pictureUrl"
            class="w-20 h-20 rounded-full object-cover mx-auto mb-4"
            alt=""
          />
          <div v-else class="w-20 h-20 bg-peach-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-peach-600 text-2xl font-bold">{{ user.displayName?.charAt(0) }}</span>
          </div>
          <h2 class="font-bold text-gray-800 text-lg">{{ user.displayName }}</h2>
          <p class="text-xs text-gray-400 mt-1 break-all">{{ user.id }}</p>
          <span :class="user.onboardingStatus === 'completed' ? 'badge-green' : 'badge-peach'" class="badge mt-3">
            {{ user.onboardingStatus === 'completed' ? 'オンボーディング完了' : '回答中' }}
          </span>
          <div class="divider" />
          <div class="text-left space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">登録日</span>
              <span class="text-gray-800">{{ formatDate(user.createdAt) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">地域</span>
              <span class="text-gray-800">{{ user.attributes?.region ?? '-' }}</span>
            </div>
          </div>
        </div>

        <!-- タグ管理 -->
        <div class="card">
          <h3 class="section-title">タグ</h3>
          <div class="flex flex-wrap gap-2 mb-3">
            <span
              v-for="tag in user.tags ?? []"
              :key="tag"
              class="badge badge-peach group cursor-pointer"
              @click="removeTag(tag)"
            >
              {{ tag }}
              <svg class="w-3 h-3 ml-1 opacity-60 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
            <span v-if="!(user.tags ?? []).length" class="text-sm text-gray-400">タグなし</span>
          </div>
          <!-- マスタータグのクイック選択 -->
          <div v-if="masterTags.length" class="flex flex-wrap gap-1 mb-2">
            <button
              v-for="t in masterTags.filter(t => !(user.tags ?? []).includes(t.name))"
              :key="t.id"
              @click="quickAddTag(t.name)"
              class="badge badge-gray text-xs cursor-pointer hover:badge-peach transition-colors"
            >
              + {{ t.name }}
            </button>
          </div>
          <div class="flex gap-2">
            <input
              v-model="newTag"
              type="text"
              placeholder="タグを追加..."
              class="input text-sm py-1.5 flex-1"
              @keydown.enter="addTag"
              list="master-tag-list"
            />
            <datalist id="master-tag-list">
              <option v-for="t in masterTags" :key="t.id" :value="t.name" />
            </datalist>
            <button @click="addTag" class="btn-primary px-3 py-1.5 text-sm">追加</button>
          </div>
        </div>

        <!-- 属性情報 -->
        <div class="card">
          <h3 class="section-title">属性情報</h3>
          <div class="space-y-2">
            <div
              v-for="(val, key) in user.attributes ?? {}"
              :key="key"
              class="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0"
            >
              <span class="text-gray-500">{{ key }}</span>
              <span class="text-gray-800 font-medium">
                {{ Array.isArray(val) ? val.join(', ') : val }}
              </span>
            </div>
            <p v-if="!Object.keys(user.attributes ?? {}).length" class="text-sm text-gray-400">属性なし</p>
          </div>
        </div>
      </div>

      <!-- チャット -->
      <div class="lg:col-span-2 card flex flex-col" style="height: 600px;">
        <h3 class="section-title flex-shrink-0">トーク履歴</h3>

        <!-- メッセージ一覧 -->
        <div ref="chatContainer" class="flex-1 overflow-y-auto space-y-3 mb-4">
          <div v-if="loadingMessages" class="space-y-3">
            <div v-for="i in 5" :key="i" :class="['h-10 rounded-xl w-3/4 animate-pulse', i % 2 === 0 ? 'bg-peach-100 ml-auto' : 'bg-gray-100']" />
          </div>
          <template v-else>
            <div
              v-for="msg in messages"
              :key="msg.id"
              :class="['flex', msg.type === 'user' ? 'justify-start' : 'justify-end']"
            >
              <div
                :class="[
                  'max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm',
                  msg.type === 'user'
                    ? 'bg-gray-100 text-gray-800 rounded-tl-none'
                    : msg.type === 'admin'
                      ? 'bg-peach-500 text-white rounded-tr-none'
                      : 'bg-peach-100 text-peach-800 rounded-tr-none'
                ]"
              >
                <p class="whitespace-pre-wrap">{{ msg.text }}</p>
                <p :class="['text-xs mt-1', msg.type === 'admin' ? 'text-peach-100' : 'text-gray-400']">
                  {{ formatTime(msg.timestamp) }}
                  <span v-if="msg.type === 'admin'" class="ml-1">管理者</span>
                  <span v-else-if="msg.type === 'bot'" class="ml-1">Bot</span>
                </p>
              </div>
            </div>
          </template>
        </div>

        <!-- 返信フォーム -->
        <div class="flex-shrink-0 border-t border-gray-100 pt-4">
          <div class="flex gap-2">
            <textarea
              v-model="replyText"
              placeholder="メッセージを入力..."
              class="input resize-none text-sm"
              rows="2"
              @keydown.ctrl.enter="sendReply"
            />
            <button
              @click="sendReply"
              class="btn-primary px-4 flex-shrink-0 self-end"
              :disabled="!replyText.trim() || sendingReply"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p class="text-xs text-gray-400 mt-1">Ctrl+Enter で送信</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  getDocs,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore'
import dayjs from 'dayjs'

const route = useRoute()
const { db, auth } = useFirebase()
const lineUserId = route.params.id as string

const loading = ref(true)
const loadingMessages = ref(true)
const sendingReply = ref(false)
const user = ref<any>(null)
const messages = ref<any[]>([])
const masterTags = ref<any[]>([])
const newTag = ref('')
const replyText = ref('')
const chatContainer = ref<HTMLElement>()

const formatDate = (ts: any) => {
  if (!ts) return '-'
  return dayjs(ts.toDate?.() ?? ts).format('YYYY/M/D')
}
const formatTime = (ts: any) => {
  if (!ts) return ''
  return dayjs(ts.toDate?.() ?? ts).format('M/D HH:mm')
}

const addTag = async () => {
  const tag = newTag.value.trim()
  if (!tag) return
  await updateDoc(doc(db, 'users', lineUserId), { tags: arrayUnion(tag) })
  user.value.tags = [...(user.value.tags ?? []), tag]
  newTag.value = ''
}

const quickAddTag = async (tag: string) => {
  await updateDoc(doc(db, 'users', lineUserId), { tags: arrayUnion(tag) })
  user.value.tags = [...(user.value.tags ?? []), tag]
}

const removeTag = async (tag: string) => {
  await updateDoc(doc(db, 'users', lineUserId), { tags: arrayRemove(tag) })
  user.value.tags = (user.value.tags ?? []).filter((t: string) => t !== tag)
}

const sendReply = async () => {
  const text = replyText.value.trim()
  if (!text || sendingReply.value) return
  sendingReply.value = true
  try {
    // Firestoreにメッセージ保存
    await addDoc(collection(db, 'conversations', lineUserId, 'messages'), {
      text,
      type: 'admin',
      adminId: auth.currentUser?.uid,
      timestamp: serverTimestamp(),
    })
    // TODO: LINE Push Message APIで実際に送信（サーバーサイドで処理）
    replyText.value = ''
  } finally {
    sendingReply.value = false
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

onMounted(async () => {
  // マスタータグ取得
  const tagsSnap = await getDocs(query(collection(db, 'tags'), orderBy('createdAt', 'asc')))
  masterTags.value = tagsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

  // ユーザー情報取得
  const userSnap = await getDoc(doc(db, 'users', lineUserId))
  if (userSnap.exists()) {
    user.value = { id: userSnap.id, ...userSnap.data() }
  }
  loading.value = false

  // メッセージリアルタイム取得
  const msgQ = query(
    collection(db, 'conversations', lineUserId, 'messages'),
    orderBy('timestamp', 'asc')
  )
  onSnapshot(msgQ, (snap) => {
    messages.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    loadingMessages.value = false
    scrollToBottom()
  })
})
</script>
