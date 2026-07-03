<template>
  <div class="min-h-screen bg-gradient-to-br from-peach-50 to-warm-100">
    <!-- ローディング -->
    <div v-if="status === 'loading'" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="w-12 h-12 border-4 border-peach-300 border-t-peach-500 rounded-full animate-spin mx-auto mb-4" />
        <p class="text-peach-600 font-medium">読み込み中...</p>
      </div>
    </div>

    <!-- エラー -->
    <div v-else-if="status === 'error'" class="flex items-center justify-center min-h-screen p-6">
      <div class="text-center">
        <p class="text-4xl mb-4">😕</p>
        <p class="text-gray-600">{{ errorMessage }}</p>
      </div>
    </div>

    <!-- 完了 -->
    <div v-else-if="status === 'done'" class="flex items-center justify-center min-h-screen p-6">
      <div class="text-center max-w-sm">
        <div class="w-24 h-24 bg-gradient-to-br from-peach-400 to-peach-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-peach">
          <span class="text-4xl">✅</span>
        </div>
        <h1 class="text-xl font-bold text-gray-800 mb-3">更新しました！</h1>
        <p class="text-gray-600 text-sm mb-6">プロフィールの変更を保存しました💕</p>
        <button @click="closeLiff" class="btn-primary w-full">LINEに戻る</button>
      </div>
    </div>

    <!-- 項目選択 -->
    <div v-else-if="status === 'select'" class="flex flex-col min-h-screen">
      <div class="bg-white border-b border-gray-100 px-5 py-4">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-gradient-to-br from-peach-400 to-peach-600 rounded-lg flex items-center justify-center">
            <span class="text-white text-sm font-bold">絆</span>
          </div>
          <div>
            <p class="font-bold text-gray-800 text-sm">絆プロジェクト</p>
            <p class="text-xs text-gray-400">プロフィール変更</p>
          </div>
        </div>
      </div>

      <div class="flex-1 px-5 py-6">
        <div class="max-w-sm mx-auto">
          <div class="flex items-start gap-3 mb-6">
            <div class="w-10 h-10 bg-peach-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span class="text-xl">🐣</span>
            </div>
            <div class="bg-white rounded-2xl rounded-tl-none p-4 shadow-soft flex-1">
              <p class="text-gray-800 text-sm">変更したい項目を選んでください</p>
            </div>
          </div>

          <div class="space-y-3">
            <button
              v-for="step in editableSteps"
              :key="step.id"
              @click="selectStep(step)"
              class="w-full bg-white rounded-xl border-2 border-gray-200 hover:border-peach-300 hover:bg-peach-50 px-4 py-4 text-left transition-all"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-800">{{ step.question }}</p>
                  <p class="text-xs text-gray-400 mt-1">
                    現在：{{ currentValueLabel(step) || '未設定' }}
                  </p>
                </div>
                <span class="text-gray-300 text-lg">›</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 項目編集 -->
    <div v-else-if="status === 'edit' && selectedStep" class="flex flex-col min-h-screen">
      <div class="bg-white border-b border-gray-100 px-5 py-4 flex-shrink-0">
        <div class="flex items-center gap-3">
          <button @click="status = 'select'" class="text-gray-400 hover:text-gray-600 mr-1">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <p class="font-bold text-gray-800 text-sm">絆プロジェクト</p>
        </div>
      </div>

      <div class="flex-1 px-5 py-6 overflow-y-auto">
        <div class="max-w-sm mx-auto">
          <div class="flex items-start gap-3 mb-6">
            <div class="w-10 h-10 bg-peach-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span class="text-xl">🐣</span>
            </div>
            <div class="bg-white rounded-2xl rounded-tl-none p-4 shadow-soft flex-1">
              <p class="text-gray-800 text-sm leading-relaxed">{{ selectedStep.question }}</p>
              <p v-if="selectedStep.type === 'multi'" class="text-xs text-peach-500 mt-2">✓ 複数選択できます</p>
            </div>
          </div>

          <!-- 選択肢 -->
          <div v-if="selectedStep.type === 'single' || selectedStep.type === 'multi'" class="space-y-2">
            <button
              v-for="opt in selectedStep.options ?? []"
              :key="opt"
              @click="toggleOption(opt)"
              :class="[
                'w-full px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all text-left',
                selectedOptions.includes(opt)
                  ? 'border-peach-400 bg-peach-50 text-peach-700'
                  : 'border-gray-200 bg-white text-gray-700'
              ]"
            >
              <div class="flex items-center gap-3">
                <div :class="[
                  'w-5 h-5 flex items-center justify-center flex-shrink-0 border-2 transition-colors',
                  selectedStep.type === 'multi' ? 'rounded' : 'rounded-full',
                  selectedOptions.includes(opt) ? 'border-peach-400 bg-peach-400' : 'border-gray-300'
                ]">
                  <svg v-if="selectedOptions.includes(opt)" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {{ opt }}
              </div>
            </button>
          </div>

          <!-- テキスト入力 -->
          <div v-else>
            <input
              v-model="textAnswer"
              :type="selectedStep.type === 'number' ? 'number' : 'text'"
              class="input text-base"
              :placeholder="selectedStep.placeholder ?? '入力してください'"
            />
          </div>
        </div>
      </div>

      <div class="bg-white border-t border-gray-100 px-5 py-4 flex-shrink-0">
        <div class="max-w-sm mx-auto">
          <button
            @click="saveChange"
            class="btn-primary w-full"
            :disabled="!canSave || saving"
          >
            {{ saving ? '保存中...' : '変更を保存する 🌸' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { doc, getDoc, updateDoc, collection, query, where, getDocs, serverTimestamp, arrayUnion } from 'firebase/firestore'

definePageMeta({ layout: false, middleware: [] })

const { db } = useFirebase()
const config = useRuntimeConfig()

const status = ref<'loading' | 'select' | 'edit' | 'done' | 'error'>('loading')
const errorMessage = ref('')
const lineUserId = ref('')
const userData = ref<any>(null)
const flow = ref<any>(null)
const selectedStep = ref<any>(null)
const selectedOptions = ref<string[]>([])
const textAnswer = ref('')
const saving = ref(false)

const editableSteps = computed(() =>
  (flow.value?.steps ?? []).filter((s: any) =>
    s.type === 'single' || s.type === 'multi' || s.type === 'text' || s.type === 'number'
  )
)

const currentValueLabel = (step: any) => {
  const val = userData.value?.attributes?.[step.attributeKey]
  if (!val) return ''
  if (Array.isArray(val)) return val.join('、')
  return String(val)
}

const canSave = computed(() => {
  if (!selectedStep.value) return false
  if (selectedStep.value.type === 'single') return selectedOptions.value.length === 1
  if (selectedStep.value.type === 'multi') return selectedOptions.value.length > 0
  return textAnswer.value.trim().length > 0
})

const selectStep = (step: any) => {
  selectedStep.value = step
  const current = userData.value?.attributes?.[step.attributeKey]
  if (step.type === 'single' || step.type === 'multi') {
    selectedOptions.value = Array.isArray(current) ? [...current] : current ? [current] : []
  } else {
    textAnswer.value = current ? String(current) : ''
  }
  status.value = 'edit'
}

const toggleOption = (opt: string) => {
  if (selectedStep.value?.type === 'single') {
    selectedOptions.value = [opt]
  } else {
    const idx = selectedOptions.value.indexOf(opt)
    if (idx >= 0) selectedOptions.value.splice(idx, 1)
    else selectedOptions.value.push(opt)
  }
}

const saveChange = async () => {
  if (!canSave.value || saving.value) return
  saving.value = true
  try {
    const step = selectedStep.value!
    const value = (step.type === 'single' || step.type === 'multi')
      ? (step.type === 'single' ? selectedOptions.value[0] : [...selectedOptions.value])
      : textAnswer.value.trim()

    const updates: any = {
      [`attributes.${step.attributeKey}`]: value,
      updatedAt: serverTimestamp(),
    }

    // タグマッピング更新（既存タグを置き換え）
    if (step.tagMapping) {
      const opts = Array.isArray(value) ? value : [value]
      const newTags: string[] = []
      for (const opt of opts) {
        if (step.tagMapping[opt]) newTags.push(step.tagMapping[opt])
      }
      if (newTags.length) updates.tags = arrayUnion(...newTags)
    }

    await updateDoc(doc(db, 'users', lineUserId.value), updates)
    status.value = 'done'
  } catch (e: any) {
    errorMessage.value = '保存に失敗しました: ' + e.message
    status.value = 'error'
  } finally {
    saving.value = false
  }
}

const closeLiff = () => {
  if (typeof window !== 'undefined' && (window as any).liff) {
    (window as any).liff.closeWindow()
  }
}

onMounted(async () => {
  try {
    // オンボーディングフロー取得
    const flowSnap = await getDocs(query(collection(db, 'onboarding_flows'), where('isActive', '==', true)))
    if (flowSnap.empty) {
      errorMessage.value = '設定が見つかりません'
      status.value = 'error'
      return
    }
    flow.value = flowSnap.docs[0].data()

    // LIFF SDK読み込み
    const liffId = config.public.liffProfileId as string || config.public.liffId as string
    if (!liffId) { errorMessage.value = 'LIFF IDが未設定です'; status.value = 'error'; return }

    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('LIFF SDK load failed'))
      document.head.appendChild(script)
    })

    const liff = (window as any).liff
    await liff.init({ liffId })
    if (!liff.isLoggedIn()) { liff.login(); return }

    const profile = await liff.getProfile()
    lineUserId.value = profile.userId

    const userSnap = await getDoc(doc(db, 'users', lineUserId.value))
    if (userSnap.exists()) {
      userData.value = userSnap.data()
    }

    status.value = 'select'
  } catch (e: any) {
    errorMessage.value = '初期化に失敗しました: ' + e.message
    status.value = 'error'
  }
})
</script>
