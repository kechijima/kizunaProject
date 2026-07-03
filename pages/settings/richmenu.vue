<template>
  <div class="max-w-2xl mx-auto space-y-5">
    <h2 class="text-lg font-semibold text-gray-800">リッチメニュー管理</h2>

    <p class="text-sm text-gray-500">
      LINEのリッチメニュー（トーク画面下部のメニュー）の設定を管理します。
      設定を変更した後は「スクリプトを実行してメニューを更新」ボタンで表示されるコマンドを実行してください。
    </p>

    <!-- 現在の設定 -->
    <div class="card space-y-4">
      <h3 class="font-semibold text-gray-700 text-sm">メニュー設定</h3>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">公式Webサイト URL</label>
        <input v-model="config.websiteUrl" type="url" class="input" placeholder="https://www.coccopeer.com/" />
        <p class="text-xs text-gray-400 mt-1">リッチメニュー右上「Webサイト」ボタンのリンク先</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">プロフィール変更 LIFF ID</label>
        <input v-model="config.liffProfileId" type="text" class="input" placeholder="例: 2005378903-XXXXXXXX" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">オンボーディング LIFF ID</label>
        <input v-model="config.liffOnboardingId" type="text" class="input" placeholder="例: 2005378903-XXXXXXXX" />
      </div>

      <button @click="saveConfig" class="btn-primary" :disabled="saving">
        {{ saving ? '保存中...' : '設定を保存' }}
      </button>

      <div v-if="saved" class="text-sm text-green-600 flex items-center gap-1">
        ✅ 保存しました
      </div>
    </div>

    <!-- メニュー更新手順 -->
    <div class="card space-y-3">
      <h3 class="font-semibold text-gray-700 text-sm">メニューの更新手順</h3>
      <p class="text-sm text-gray-500">
        設定を反映するには、ローカル環境で以下のコマンドを実行してリッチメニューを再登録してください。
      </p>

      <div class="bg-gray-900 rounded-xl p-4">
        <p class="text-xs text-gray-400 mb-2">PowerShell / ターミナル:</p>
        <code class="text-xs text-green-400 block whitespace-pre-wrap">{{ scriptCommand }}</code>
      </div>

      <button @click="copyCommand" class="btn-secondary text-xs">
        {{ copied ? '✅ コピーしました' : '📋 コマンドをコピー' }}
      </button>
    </div>

    <!-- ボタン構成 -->
    <div class="card space-y-3">
      <h3 class="font-semibold text-gray-700 text-sm">ボタン構成（2500×1686px）</h3>
      <div class="grid grid-cols-1 gap-2 text-xs text-gray-600">
        <div class="flex gap-3">
          <div class="w-24 shrink-0 font-medium text-gray-500">左上（大）</div>
          <div>支援情報を探す → カテゴリ選択</div>
        </div>
        <div class="flex gap-3">
          <div class="w-24 shrink-0 font-medium text-gray-500">右上（小）</div>
          <div class="break-all">公式Webサイト → {{ config.websiteUrl || 'URL未設定' }}</div>
        </div>
        <div class="flex gap-3">
          <div class="w-24 shrink-0 font-medium text-gray-500">下左</div>
          <div>質問・相談 → 管理者チャット</div>
        </div>
        <div class="flex gap-3">
          <div class="w-24 shrink-0 font-medium text-gray-500">下中</div>
          <div>プロフィール変更 → LIFF</div>
        </div>
        <div class="flex gap-3">
          <div class="w-24 shrink-0 font-medium text-gray-500">下右</div>
          <div>よくある質問 → FAQ一覧</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

const { db } = useFirebase()
const saving = ref(false)
const saved = ref(false)
const copied = ref(false)

const config = ref({
  websiteUrl: 'https://www.coccopeer.com/',
  liffProfileId: '2005378903-LXWyy1H1',
  liffOnboardingId: '2005378903-vm7jt4ke',
})

const scriptCommand = computed(() =>
  `node scripts/uploadRichMenuImage.mjs <画像ファイルパス> ${config.value.liffProfileId}`
)

const saveConfig = async () => {
  saving.value = true
  saved.value = false
  try {
    await setDoc(doc(db, 'settings', 'richmenu'), {
      ...config.value,
      updatedAt: serverTimestamp(),
    })
    saved.value = true
    setTimeout(() => { saved.value = false }, 3000)
  } finally {
    saving.value = false
  }
}

const copyCommand = () => {
  navigator.clipboard.writeText(scriptCommand.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

onMounted(async () => {
  const snap = await getDoc(doc(db, 'settings', 'richmenu'))
  if (snap.exists()) {
    const data = snap.data()
    config.value = {
      websiteUrl: data.websiteUrl ?? config.value.websiteUrl,
      liffProfileId: data.liffProfileId ?? config.value.liffProfileId,
      liffOnboardingId: data.liffOnboardingId ?? config.value.liffOnboardingId,
    }
  }
})
</script>
