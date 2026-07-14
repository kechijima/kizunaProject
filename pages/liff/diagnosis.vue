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

    <!-- 質問 -->
    <div v-else-if="status === 'quiz'" class="flex flex-col min-h-screen">
      <div class="bg-white border-b border-gray-100 px-5 py-4 flex-shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-gradient-to-br from-peach-400 to-peach-600 rounded-lg flex items-center justify-center">
            <span class="text-white text-sm font-bold">絆</span>
          </div>
          <div class="flex-1">
            <p class="font-bold text-gray-800 text-sm">{{ headerTitle }}</p>
            <p class="text-xs text-gray-400">質問 {{ currentStep + 1 }} / {{ steps.length }}</p>
          </div>
        </div>
        <!-- 進捗バー -->
        <div class="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-peach-500 rounded-full transition-all duration-300"
            :style="{ width: `${((currentStep) / steps.length) * 100}%` }"
          />
        </div>
      </div>

      <div class="flex-1 px-5 py-6 overflow-y-auto">
        <div class="max-w-sm mx-auto">
          <!-- 画面上部の説明文（管理画面で設定） -->
          <div v-if="headerText && currentStep === 0" class="bg-peach-50 border border-peach-100 rounded-xl p-4 mb-5">
            <p class="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{{ headerText }}</p>
          </div>

          <div class="flex items-start gap-3 mb-6">
            <div class="w-10 h-10 bg-peach-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span class="text-xl">📋</span>
            </div>
            <div class="bg-white rounded-2xl rounded-tl-none p-4 shadow-soft flex-1">
              <p class="text-gray-800 text-sm leading-relaxed">{{ steps[currentStep]?.question }}</p>
              <p v-if="steps[currentStep]?.type === 'multi'" class="text-xs text-peach-500 mt-2">✓ 複数選択できます</p>
            </div>
          </div>

          <div class="space-y-2">
            <button
              v-for="opt in steps[currentStep]?.options ?? []"
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
                  steps[currentStep]?.type === 'multi' ? 'rounded' : 'rounded-full',
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
        </div>
      </div>

      <div class="bg-white border-t border-gray-100 px-5 py-4 flex-shrink-0">
        <div class="max-w-sm mx-auto flex gap-3">
          <button
            v-if="currentStep > 0"
            @click="goBack"
            class="btn-secondary flex-shrink-0"
          >
            戻る
          </button>
          <button
            @click="goNext"
            class="btn-primary flex-1"
            :disabled="selectedOptions.length === 0 || saving"
          >
            {{ saving ? '診断中...' : currentStep === steps.length - 1 ? '診断結果を見る 🔍' : '次へ →' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 診断結果 -->
    <div v-else-if="status === 'result'" class="flex flex-col min-h-screen">
      <div class="bg-white border-b border-gray-100 px-5 py-4">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-gradient-to-br from-peach-400 to-peach-600 rounded-lg flex items-center justify-center">
            <span class="text-white text-sm font-bold">絆</span>
          </div>
          <div>
            <p class="font-bold text-gray-800 text-sm">診断結果</p>
            <p class="text-xs text-gray-400">あなたにおすすめの支援情報</p>
          </div>
        </div>
      </div>

      <div class="flex-1 px-5 py-6 overflow-y-auto">
        <div class="max-w-sm mx-auto">
          <!-- 相談への案内 -->
          <div v-if="resultMessage" class="bg-peach-50 border-2 border-peach-200 rounded-xl p-4 mb-5">
            <p class="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{{ resultMessage }}</p>
            <a
              v-if="resultUrl"
              :href="resultUrl"
              target="_blank"
              rel="noopener"
              class="btn-primary w-full mt-3"
            >
              オンライン相談を予約する →
            </a>
          </div>

          <div v-if="recommended.length" class="space-y-3">
            <p class="text-sm text-gray-600 mb-4">
              🎉 あなたに合いそうな支援情報が <span class="font-bold text-peach-600">{{ recommended.length }}件</span> 見つかりました！
            </p>
            <a
              v-for="item in recommended"
              :key="item.id"
              :href="item.linkUrl"
              target="_blank"
              rel="noopener"
              class="block bg-white rounded-xl border-2 border-gray-200 hover:border-peach-300 px-4 py-4 transition-all"
            >
              <p class="text-xs text-peach-600 font-medium mb-1">📂 {{ item.category }}</p>
              <p class="text-sm font-bold text-gray-800">{{ item.title }}</p>
              <p v-if="item.excerpt" class="text-xs text-gray-500 mt-1 leading-relaxed">{{ item.excerpt }}</p>
              <p class="text-xs text-peach-500 font-medium mt-2">詳しく見る →</p>
            </a>
          </div>

          <div v-else class="text-center py-10">
            <p class="text-4xl mb-4">🔍</p>
            <p class="text-gray-600 text-sm leading-relaxed">
              ぴったりの支援情報が見つかりませんでした🙇<br />
              情報は随時更新されますので、<br />また診断してみてください！
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white border-t border-gray-100 px-5 py-4">
        <div class="max-w-sm mx-auto">
          <button @click="closeLiff" class="btn-primary w-full">LINEに戻る</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { doc, setDoc, collection, query, where, getDocs, serverTimestamp, arrayUnion, limit } from 'firebase/firestore'

definePageMeta({ layout: false, middleware: [] })

const { db } = useFirebase()
const config = useRuntimeConfig()

type Step = {
  id: string
  question: string
  type: 'single' | 'multi'
  options?: string[]
  attributeKey?: string
  tagMapping?: Record<string, string>
  pointMapping?: Record<string, number>
}

const status = ref<'loading' | 'quiz' | 'result' | 'error'>('loading')
const errorMessage = ref('')
const lineUserId = ref('')
const steps = ref<Step[]>([])
const currentStep = ref(0)
const answers = ref<string[][]>([])
const selectedOptions = ref<string[]>([])
const saving = ref(false)
const recommended = ref<Array<{ id: string; title: string; category: string; excerpt: string; linkUrl: string }>>([])
const resultConfig = ref<any>(null)
const resultMessage = ref('')
const resultUrl = ref('')
const headerTitle = ref('コンテンツ診断')
const headerText = ref('')

const toggleOption = (opt: string) => {
  if (steps.value[currentStep.value]?.type === 'multi') {
    const idx = selectedOptions.value.indexOf(opt)
    if (idx >= 0) selectedOptions.value.splice(idx, 1)
    else selectedOptions.value.push(opt)
  } else {
    selectedOptions.value = [opt]
  }
}

const goBack = () => {
  if (currentStep.value === 0) return
  answers.value[currentStep.value] = [...selectedOptions.value]
  currentStep.value--
  selectedOptions.value = [...(answers.value[currentStep.value] ?? [])]
}

const goNext = async () => {
  answers.value[currentStep.value] = [...selectedOptions.value]
  if (currentStep.value < steps.value.length - 1) {
    currentStep.value++
    selectedOptions.value = [...(answers.value[currentStep.value] ?? [])]
    return
  }
  await finishDiagnosis()
}

const finishDiagnosis = async () => {
  saving.value = true
  try {
    // 回答からタグ・ポイントを判定
    const diagnosedTags: string[] = []
    const attributes: Record<string, any> = {}
    let score = 0
    steps.value.forEach((step, i) => {
      const ans = answers.value[i] ?? []
      for (const opt of ans) {
        const tag = step.tagMapping?.[opt]
        if (tag && !diagnosedTags.includes(tag)) diagnosedTags.push(tag)
        score += Number(step.pointMapping?.[opt] ?? 0)
      }
      if (step.attributeKey) {
        attributes[`attributes.${step.attributeKey}`] = step.type === 'single' ? ans[0] ?? '' : ans
      }
    })

    // 合計ポイントによる相談案内の判定（結果画面に表示。LINEへの送信はFunctions側が担当）
    const rc = resultConfig.value
    if (rc) {
      if (rc.onlineMessage && score >= Number(rc.onlineThreshold ?? Infinity)) {
        resultMessage.value = rc.onlineMessage
        resultUrl.value = rc.onlineUrl ?? ''
      } else if (rc.chatMessage && score >= Number(rc.chatThreshold ?? Infinity)) {
        resultMessage.value = rc.chatMessage
      } else if (rc.defaultMessage) {
        resultMessage.value = rc.defaultMessage
      }
    }

    // ユーザーへ診断結果を保存（LINEログイン済みの場合のみ）
    if (lineUserId.value) {
      const updates: Record<string, any> = {
        ...attributes,
        diagnosisScore: score,
        lastDiagnosisAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
      if (diagnosedTags.length) updates.tags = arrayUnion(...diagnosedTags)
      await setDoc(doc(db, 'users', lineUserId.value), updates, { merge: true })
    }

    // 公開中コンテンツから、診断タグに合致するものを抽出
    const snap = await getDocs(query(
      collection(db, 'contents'),
      where('status', '==', 'published'),
      limit(50),
    ))
    const base = (config.public.firebaseAuthDomain as string || '').replace('.firebaseapp.com', '.web.app')
    const all = snap.docs.map(d => {
      const c = d.data() as any
      return {
        id: d.id,
        title: c.title ?? '',
        category: c.category ?? '',
        excerpt: (() => { const t = String(c.body ?? '').replace(/<[^>]*>/g, '').trim(); return t.substring(0, 50) + (t.length > 50 ? '…' : '') })(),
        linkUrl: (c.linkUrl && c.linkUrl !== '__pending__') ? c.linkUrl : `https://${base}/p/${d.id}`,
        tags: (c.tags ?? []) as string[],
      }
    })
    const matched = all.filter(c => c.tags.some(t => diagnosedTags.includes(t)))
    recommended.value = (matched.length ? matched : []).slice(0, 10)

    status.value = 'result'
  } catch (e: any) {
    errorMessage.value = '診断結果の取得に失敗しました: ' + e.message
    status.value = 'error'
  } finally {
    saving.value = false
  }
}

const closeLiff = () => {
  if (typeof window !== 'undefined' && (window as any).liff?.isInClient?.()) {
    (window as any).liff.closeWindow()
  }
}

onMounted(async () => {
  try {
    // 診断フロー取得
    const flowSnap = await getDocs(query(collection(db, 'diagnosis_flows'), where('isActive', '==', true)))
    if (flowSnap.empty || !(flowSnap.docs[0].data().steps?.length > 0)) {
      errorMessage.value = '診断は現在準備中です。もうしばらくお待ちください🙏'
      status.value = 'error'
      return
    }
    const flowData = flowSnap.docs[0].data()
    steps.value = flowData.steps
    resultConfig.value = flowData.result ?? null
    headerTitle.value = flowData.headerTitle || 'コンテンツ診断'
    headerText.value = flowData.headerText || ''

    // LIFF SDK読み込み（LIFF外ブラウザでも診断自体は動作させる）
    const liffId = config.public.liffDiagnosisId as string
    if (liffId) {
      try {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js'
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('LIFF SDK load failed'))
          document.head.appendChild(script)
        })
        const liff = (window as any).liff
        await liff.init({ liffId })
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile()
          lineUserId.value = profile.userId
        } else if (liff.isInClient()) {
          liff.login()
          return
        }
      } catch (e) {
        console.warn('LIFF init skipped:', e)
      }
    }

    status.value = 'quiz'
  } catch (e: any) {
    errorMessage.value = '初期化に失敗しました: ' + e.message
    status.value = 'error'
  }
})
</script>
