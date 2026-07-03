<template>
  <div class="flex gap-5 h-[calc(100vh-120px)]">
    <!-- ユーザーリスト -->
    <div class="w-72 flex-shrink-0 card p-0 overflow-hidden flex flex-col">
      <div class="p-4 border-b border-gray-100">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="ユーザーを検索..."
          class="input text-sm"
        />
      </div>
      <div class="flex-1 overflow-y-auto">
        <div
          v-for="user in filteredUsers"
          :key="user.id"
          class="flex items-center gap-3 p-4 border-b border-gray-50 cursor-pointer hover:bg-peach-50 transition-colors"
          :class="{ 'bg-peach-100': selectedUserId === user.id }"
          @click="selectUser(user)"
        >
          <div class="relative">
            <img
              v-if="user.pictureUrl"
              :src="user.pictureUrl"
              class="w-10 h-10 rounded-full object-cover"
              alt=""
            />
            <div v-else class="w-10 h-10 bg-peach-100 rounded-full flex items-center justify-center">
              <span class="text-peach-600 font-medium">{{ user.displayName?.charAt(0) }}</span>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-800 text-sm truncate">{{ user.displayName }}</p>
            <p class="text-xs text-gray-400 truncate">{{ user.lastMessage ?? 'メッセージなし' }}</p>
          </div>
        </div>
        <div v-if="filteredUsers.length === 0" class="text-center py-8 text-gray-400 text-sm">
          ユーザーが見つかりません
        </div>
      </div>
    </div>

    <!-- チャット画面 -->
    <div class="flex-1 card flex flex-col overflow-hidden p-0">
      <div v-if="!selectedUser" class="flex-1 flex items-center justify-center text-gray-400">
        <div class="text-center">
          <p class="text-5xl mb-4">💬</p>
          <p class="text-sm">ユーザーを選択してください</p>
        </div>
      </div>
      <template v-else>
        <!-- チャットヘッダー -->
        <div class="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <img
            v-if="selectedUser.pictureUrl"
            :src="selectedUser.pictureUrl"
            class="w-9 h-9 rounded-full object-cover"
            alt=""
          />
          <div v-else class="w-9 h-9 bg-peach-100 rounded-full flex items-center justify-center">
            <span class="text-peach-600 font-medium text-sm">{{ selectedUser.displayName?.charAt(0) }}</span>
          </div>
          <div>
            <p class="font-semibold text-gray-800">{{ selectedUser.displayName }}</p>
            <div class="flex gap-1 flex-wrap">
              <span v-for="tag in (selectedUser.tags ?? []).slice(0, 3)" :key="tag" class="badge badge-gray text-xs">{{ tag }}</span>
            </div>
          </div>
          <NuxtLink :to="`/users/${selectedUser.id}`" class="ml-auto btn-ghost text-sm">
            詳細を見る →
          </NuxtLink>
        </div>

        <!-- メッセージ -->
        <div ref="chatContainer" class="flex-1 overflow-y-auto p-5 space-y-3">
          <div
            v-for="msg in messages"
            :key="msg.id"
            :class="['flex', msg.type === 'user' ? 'justify-start' : 'justify-end']"
          >
            <div
              :class="[
                'max-w-sm px-4 py-2.5 rounded-2xl text-sm',
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
              </p>
            </div>
          </div>
        </div>

        <!-- 返信フォーム -->
        <div class="px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <div class="flex gap-2">
            <textarea
              v-model="replyText"
              placeholder="メッセージを入力... (Ctrl+Enter で送信)"
              class="input resize-none text-sm"
              rows="2"
              @keydown.ctrl.enter="sendReply"
            />
            <button
              @click="sendReply"
              class="btn-primary px-4 self-end"
              :disabled="!replyText.trim()"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore'
import dayjs from 'dayjs'

const { db, auth } = useFirebase()

const searchQuery = ref('')
const selectedUserId = ref('')
const selectedUser = ref<any>(null)
const users = ref<any[]>([])
const messages = ref<any[]>([])
const replyText = ref('')
const chatContainer = ref<HTMLElement>()
let unsubMessages: (() => void) | null = null

const filteredUsers = computed(() => {
  return users.value.filter(u =>
    !searchQuery.value || u.displayName?.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const selectUser = (user: any) => {
  selectedUserId.value = user.id
  selectedUser.value = user
  messages.value = []

  if (unsubMessages) unsubMessages()

  const q = query(
    collection(db, 'conversations', user.id, 'messages'),
    orderBy('timestamp', 'asc')
  )
  unsubMessages = onSnapshot(q, (snap) => {
    messages.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    nextTick(() => {
      if (chatContainer.value) chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    })
  })
}

const sendReply = async () => {
  const text = replyText.value.trim()
  if (!text || !selectedUserId.value) return
  await addDoc(collection(db, 'conversations', selectedUserId.value, 'messages'), {
    text,
    type: 'admin',
    adminId: auth.currentUser?.uid,
    timestamp: serverTimestamp(),
  })
  
  await updateDoc(doc(db, 'users', selectedUserId.value), {
    lastMessage: text,
    updatedAt: serverTimestamp(),
  })
  replyText.value = ''
}

const formatTime = (ts: any) => {
  if (!ts) return ''
  return dayjs(ts.toDate?.() ?? ts).format('M/D HH:mm')
}

onMounted(() => {
  const q = query(collection(db, 'users'), orderBy('updatedAt', 'desc'))
  onSnapshot(q, (snap) => {
    users.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  })
})
</script>
