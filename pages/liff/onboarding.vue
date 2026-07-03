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

    <!-- 完了画面 -->
    <div v-else-if="status === 'done'" class="flex items-center justify-center min-h-screen p-6">
      <div class="text-center max-w-sm">
        <div class="w-24 h-24 bg-gradient-to-br from-peach-400 to-peach-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-peach">
          <span class="text-4xl">🌸</span>
        </div>
        <h1 class="text-xl font-bold text-gray-800 mb-3">ありがとうございます！</h1>
        <p class="text-gray-600 text-sm leading-relaxed mb-6">
          回答を受け取りました。<br>
          あなたに合った情報をお届けします💕
        </p>
        <button @click="closeLiff" class="btn-primary w-full">
          LINEに戻る
        </button>
      </div>
    </div>

    <!-- 質問フォーム -->
    <div v-else-if="status === 'active' && currentStep" class="flex flex-col min-h-screen">
      <!-- ヘッダー -->
      <div class="bg-white border-b border-gray-100 px-5 py-4 flex-shrink-0">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-8 h-8 bg-gradient-to-br from-peach-400 to-peach-600 rounded-lg flex items-center justify-center">
            <span class="text-white text-sm font-bold">絆</span>
          </div>
          <div>
            <p class="font-bold text-gray-800 text-sm">絆プロジェクト</p>
            <p class="text-xs text-gray-400">プロフィール設定</p>
          </div>
        </div>
        <!-- 進捗バー -->
        <div class="flex items-center gap-2">
          <div class="flex-1 bg-gray-100 rounded-full h-1.5">
            <div
              class="bg-peach-500 h-1.5 rounded-full transition-all duration-500"
              :style="{ width: `${progressPercent}%` }"
            />
          </div>
          <span class="text-xs text-gray-500 flex-shrink-0">{{ currentStepIndex + 1 }}/{{ flow.steps.length }}</span>
        </div>
      </div>

      <!-- 質問エリア -->
      <div class="flex-1 px-5 py-6 overflow-y-auto">
        <div class="max-w-sm mx-auto">
          <!-- キャラクターと吹き出し -->
          <div class="flex items-start gap-3 mb-6">
            <div class="w-10 h-10 bg-peach-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span class="text-xl">🐣</span>
            </div>
            <div class="bg-white rounded-2xl rounded-tl-none p-4 shadow-soft flex-1">
              <p class="text-gray-800 text-sm leading-relaxed">{{ currentStep.question }}</p>
              <p v-if="currentStep.type === 'multi'" class="text-xs text-peach-500 mt-2">
                ✓ 複数選択できます
              </p>
            </div>
          </div>

          <!-- 選択肢（single / multi） -->
          <div v-if="currentStep.type === 'single' || currentStep.type === 'multi'" class="space-y-2">
            <button
              v-for="opt in currentStep.options ?? []"
              :key="opt"
              @click="toggleOption(opt)"
              :class="[
                'w-full px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all duration-150 text-left',
                selectedOptions.includes(opt)
                  ? 'border-peach-400 bg-peach-50 text-peach-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-peach-200 hover:bg-peach-50'
              ]"
            >
              <div class="flex items-center gap-3">
                <div :class="[
                  'w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors',
                  currentStep.type === 'multi' ? 'rounded' : 'rounded-full',
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
          <div v-else-if="currentStep.type === 'text'">
            <input
              v-model="textAnswer"
              type="text"
              class="input text-base"
              :placeholder="currentStep.placeholder ?? '入力してください'"
              @keydown.enter="handleNext"
            />
          </div>

          <!-- 数値入力 -->
          <div v-else-if="currentStep.type === 'number'">
            <input
              v-model="textAnswer"
              type="number"
              class="input text-base"
              :placeholder="currentStep.placeholder ?? '数値を入力'"
              @keydown.enter="handleNext"
            />
          </div>
        </div>
      </div>

      <!-- フッターボタン -->
      <div class="bg-white border-t border-gray-100 px-5 py-4 flex-shrink-0">
        <div class="max-w-sm mx-auto flex gap-3">
          <button
            v-if="currentStepIndex > 0"
            @click="handleBack"
            class="btn-secondary px-4"
          >
            ← 戻る
          </button>
          <button
            @click="handleNext"
            class="btn-primary flex-1"
            :disabled="!canProceed || submitting"
          >
            {{ submitting ? '送信中...' : isLastStep ? '完了する 🌸' : '次へ →' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore'

definePageMeta({ layout: false, middleware: [] })

const { db } = useFirebase()
const config = useRuntimeConfig()

type StepType = 'single' | 'multi' | 'text' | 'number'
interface Step {
  id: string
  question: string
  type: StepType
  options?: string[]
  attributeKey: string
  tagMapping?: Record<string, string>
  placeholder?: string
}

const status = ref<'loading' | 'active' | 'done' | 'error'>('loading')
const errorMessage = ref('')
const lineUserId = ref('')
const displayName = ref('')
const pictureUrl = ref('')
const submitting = ref(false)

const flow = ref<{ steps: Step[] }>({ steps: [] })
const currentStepIndex = ref(0)
const answers = ref<Record<string, any>>({})
const selectedOptions = ref<string[]>([])
const textAnswer = ref('')

const currentStep = computed<Step | null>(() => flow.value.steps[currentStepIndex.value] ?? null)
const isLastStep = computed(() => currentStepIndex.value === flow.value.steps.length - 1)
const progressPercent = computed(() =>
  flow.value.steps.length > 0
    ? ((currentStepIndex.value) / flow.value.steps.length) * 100
    : 0
)
const canProceed = computed(() => {
  if (!currentStep.value) return false
  if (currentStep.value.type === 'single') return selectedOptions.value.length === 1
  if (currentStep.value.type === 'multi') return selectedOptions.value.length > 0
  return textAnswer.value.trim().length > 0
})

const toggleOption = (opt: string) => {
  if (currentStep.value?.type === 'single') {
    selectedOptions.value = [opt]
  } else {
    const idx = selectedOptions.value.indexOf(opt)
    if (idx >= 0) {
      selectedOptions.value.splice(idx, 1)
    } else {
      selectedOptions.value.push(opt)
    }
  }
}

const collectAnswer = () => {
  if (!currentStep.value) return
  const step = currentStep.value
  if (step.type === 'single' || step.type === 'multi') {
    answers.value[step.attributeKey] = step.type === 'single'
      ? selectedOptions.value[0]
      : [...selectedOptions.value]
  } else {
    answers.value[step.attributeKey] = textAnswer.value.trim()
  }
}

const handleBack = () => {
  if (currentStepIndex.value === 0) return
  currentStepIndex.value--
  const step = flow.value.steps[currentStepIndex.value]
  const saved = answers.value[step.attributeKey]
  selectedOptions.value = Array.isArray(saved) ? saved : saved ? [saved] : []
  textAnswer.value = typeof saved === 'string' ? saved : ''
}

const handleNext = async () => {
  if (!canProceed.value || submitting.value) return
  collectAnswer()

  if (isLastStep.value) {
    await submitAll()
  } else {
    currentStepIndex.value++
    selectedOptions.value = []
    textAnswer.value = ''
  }
}

const submitAll = async () => {
  submitting.value = true
  try {
    const step = currentStep.value!
    const tags: string[] = []

    // タグマッピング処理
    for (const s of flow.value.steps) {
      const ans = answers.value[s.attributeKey]
      if (s.tagMapping && ans) {
        const opts = Array.isArray(ans) ? ans : [ans]
        for (const o of opts) {
          if (s.tagMapping[o]) tags.push(s.tagMapping[o])
        }
      }
    }

    // Firestoreに保存
    const userRef = doc(db, 'users', lineUserId.value)
    const existing = await getDoc(userRef)

    if (existing.exists()) {
      await updateDoc(userRef, {
        attributes: answers.value,
        tags: arrayUnion(...tags),
        onboardingStatus: 'completed',
        onboardingStep: flow.value.steps.length,
        updatedAt: serverTimestamp(),
      })
    } else {
      await setDoc(userRef, {
        displayName: displayName.value,
        pictureUrl: pictureUrl.value,
        attributes: answers.value,
        tags,
        onboardingStatus: 'completed',
        onboardingStep: flow.value.steps.length,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }

    status.value = 'done'
  } catch (e) {
    console.error(e)
    errorMessage.value = '送信に失敗しました。もう一度お試しください。'
    status.value = 'error'
  } finally {
    submitting.value = false
  }
}

const closeLiff = () => {
  if (typeof window !== 'undefined' && (window as any).liff) {
    (window as any).liff.closeWindow()
  }
}

// LIFF初期化
onMounted(async () => {
  try {
    // オンボーディングフロー取得
    const flowSnap = await getDocs(
      query(collection(db, 'onboarding_flows'), where('isActive', '==', true))
    )
    if (flowSnap.empty) {
      errorMessage.value = 'オンボーディング設定が見つかりません'
      status.value = 'error'
      return
    }
    flow.value = flowSnap.docs[0].data() as { steps: Step[] }

    // LIFF SDK読み込み
    const liffId = config.public.liffId as string
    if (!liffId) {
      errorMessage.value = 'LIFF IDが設定されていません'
      status.value = 'error'
      return
    }

    // LIFF SDKを動的に読み込み
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('LIFF SDK load failed'))
      document.head.appendChild(script)
    })

    const liff = (window as any).liff
    await liff.init({ liffId })

    if (!liff.isLoggedIn()) {
      liff.login()
      return
    }

    const profile = await liff.getProfile()
    lineUserId.value = profile.userId
    displayName.value = profile.displayName
    pictureUrl.value = profile.pictureImageUrl ?? ''

    // すでに完了済みか確認
    const userSnap = await getDoc(doc(db, 'users', lineUserId.value))
    if (userSnap.exists() && userSnap.data().onboardingStatus === 'completed') {
      status.value = 'done'
      return
    }

    status.value = 'active'
  } catch (e: any) {
    console.error(e)
    errorMessage.value = '初期化に失敗しました: ' + e.message
    status.value = 'error'
  }
})
</script>
