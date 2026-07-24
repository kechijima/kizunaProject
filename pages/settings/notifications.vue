<template>
  <div class="max-w-2xl mx-auto space-y-5">
    <div>
      <h2 class="text-lg font-semibold text-gray-800">通知設定</h2>
      <p class="text-sm text-gray-500 mt-0.5">新しい参加申し込みやチャットが届いたときに、この端末へプッシュ通知を送ります</p>
    </div>

    <div class="card space-y-4">
      <!-- 非対応 -->
      <div v-if="!supported" class="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
        <span class="text-2xl">😕</span>
        <div>
          <p class="font-medium text-gray-700">この端末・ブラウザは通知に対応していません</p>
          <p class="text-sm text-gray-500 mt-1">
            スマホの場合は、ホーム画面に追加（PWAインストール）した上でSafari/Chromeからお試しください。
          </p>
        </div>
      </div>

      <!-- 対応 -->
      <template v-else>
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-gray-800">この端末で通知を受け取る</p>
            <p class="text-sm text-gray-500 mt-0.5">
              状態：
              <span v-if="enabled" class="text-green-600 font-medium">有効</span>
              <span v-else-if="permission === 'denied'" class="text-red-500 font-medium">ブロック中</span>
              <span v-else class="text-gray-500">未設定</span>
            </p>
          </div>
          <button
            v-if="!enabled"
            @click="onEnable"
            class="btn-primary"
            :disabled="enabling || permission === 'denied'"
          >
            {{ enabling ? '設定中...' : '通知を有効にする' }}
          </button>
          <button v-else @click="onDisable" class="btn-secondary">通知を無効にする</button>
        </div>

        <p v-if="permission === 'denied'" class="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
          ブラウザの設定で通知がブロックされています。アドレスバーの🔒（サイト設定）から通知を「許可」に変更してください。
        </p>

        <p v-if="message" class="text-sm" :class="messageOk ? 'text-green-600' : 'text-red-500'">
          {{ message }}
        </p>

        <div class="bg-warm-50 rounded-xl p-4 text-sm text-gray-600 space-y-1">
          <p class="font-medium text-gray-700">📱 スマホで使うには</p>
          <p>1. このサイトをブラウザで開く</p>
          <p>2. 「ホーム画面に追加」でアプリとして追加</p>
          <p>3. 追加したアプリを開き、この画面で「通知を有効にする」</p>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
const { supported, permission, enabling, init, enable, disable } = usePush()

const enabled = ref(false)
const message = ref('')
const messageOk = ref(false)

const onEnable = async () => {
  const r = await enable()
  message.value = r.message
  messageOk.value = r.ok
  if (r.ok) enabled.value = true
}

const onDisable = async () => {
  const r = await disable()
  message.value = r.message
  messageOk.value = r.ok
  if (r.ok) enabled.value = false
}

onMounted(async () => {
  await init()
  // 既に許可済みなら「有効」とみなす（トークンは有効化時に再登録される）
  enabled.value = permission.value === 'granted'
})
</script>
