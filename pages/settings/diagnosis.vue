<template>
  <div class="max-w-3xl mx-auto space-y-5">
    <div class="card bg-peach-50 border border-peach-200">
      <div class="flex items-start gap-3">
        <span class="text-2xl">📋</span>
        <div>
          <p class="font-semibold text-peach-800">コンテンツ診断について</p>
          <p class="text-sm text-peach-700 mt-1">
            リッチメニューの「診断」から利用できる質問を設定します。
            選択肢に紐づけたタグと、コンテンツに設定したタグが一致したものが診断結果としておすすめ表示されます。
            さらに選択肢ごとにポイントを設定でき、合計ポイントに応じてチャット相談・オンライン相談への案内メッセージをLINEに自動送信できます。
          </p>
        </div>
      </div>
    </div>

    <!-- 画面上部の文言 -->
    <div class="card">
      <h2 class="section-title">診断画面の文言</h2>
      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">タイトル（ヘッダーに表示）</label>
          <input v-model="flow.headerTitle" type="text" class="input" placeholder="コンテンツ診断" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">説明文（画面上部に表示）</label>
          <textarea
            v-model="flow.headerText"
            rows="2"
            class="input"
            placeholder="例: いくつかの質問に答えると、あなたに合った支援情報をご案内します（1分で完了）"
          />
          <p class="text-xs text-gray-400 mt-1">空欄の場合は説明文なしで質問から始まります</p>
        </div>
      </div>
    </div>

    <!-- フロー設定 -->
    <div class="card">
      <div class="flex items-center justify-between mb-5">
        <h2 class="section-title mb-0">診断の質問</h2>
        <div class="flex items-center gap-3">
          <label class="flex items-center gap-2 cursor-pointer">
            <div
              class="relative w-10 h-6 rounded-full transition-colors duration-200"
              :class="flow.isActive ? 'bg-peach-500' : 'bg-gray-200'"
              @click="flow.isActive = !flow.isActive"
            >
              <div
                class="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200"
                :class="flow.isActive ? 'left-5' : 'left-1'"
              />
            </div>
            <span class="text-sm text-gray-600">{{ flow.isActive ? '有効' : '無効' }}</span>
          </label>
          <button @click="saveFlow" class="btn-primary" :disabled="saving">
            {{ saving ? '保存中...' : '保存する' }}
          </button>
        </div>
      </div>

      <!-- 質問リスト -->
      <div class="space-y-4">
        <div
          v-for="(step, index) in flow.steps"
          :key="step.id"
          class="border border-gray-200 rounded-xl p-4 bg-warm-50"
        >
          <div class="flex items-center gap-2 mb-3">
            <span class="w-6 h-6 bg-peach-100 text-peach-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
              {{ index + 1 }}
            </span>
            <span class="badge badge-gray">{{ step.type === 'multi' ? '複数選択' : '単一選択' }}</span>
            <input
              v-model="step.attributeKey"
              type="text"
              placeholder="属性キー（例: needs）"
              class="input text-xs py-1 ml-auto w-36"
            />
            <button @click="removeStep(index)" class="text-gray-400 hover:text-red-400 transition-colors ml-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <input
            v-model="step.question"
            type="text"
            class="input mb-3"
            placeholder="質問文を入力..."
          />

          <div class="flex gap-2 mb-3">
            <select v-model="step.type" class="input text-sm w-36">
              <option value="single">単一選択</option>
              <option value="multi">複数選択</option>
            </select>
          </div>

          <!-- 選択肢設定 -->
          <div>
            <p class="text-xs font-medium text-gray-500 mb-2">選択肢（タグ: 一致するコンテンツをおすすめ表示 / pt: 相談案内の判定に加算）</p>
            <div class="space-y-2">
              <div v-for="(opt, oi) in step.options ?? []" :key="oi" class="flex items-center gap-2">
                <input
                  :value="opt"
                  type="text"
                  class="input text-sm py-1.5"
                  placeholder="選択肢テキスト..."
                  @input="updateOption(step, oi, ($event.target as HTMLInputElement).value)"
                />
                <select
                  :value="step.tagMapping?.[opt] ?? ''"
                  class="input text-sm py-1.5 w-36"
                  @change="updateTagMapping(step, opt, ($event.target as HTMLSelectElement).value)"
                >
                  <option value="">→ タグなし</option>
                  <option v-for="t in masterTags" :key="t.id" :value="t.name">{{ t.name }}</option>
                </select>
                <div class="flex items-center gap-1 flex-shrink-0">
                  <input
                    :value="step.pointMapping?.[opt] ?? 0"
                    type="number"
                    min="0"
                    class="input text-sm py-1.5 w-16 text-right"
                    @input="updatePointMapping(step, opt, ($event.target as HTMLInputElement).value)"
                  />
                  <span class="text-xs text-gray-400">pt</span>
                </div>
                <button @click="removeOption(step, oi)" class="text-gray-400 hover:text-red-400 flex-shrink-0">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <button @click="addOption(step)" class="btn-ghost text-xs px-3 py-1.5">
                + 選択肢を追加
              </button>
            </div>
          </div>
        </div>

        <!-- 新しい質問を追加 -->
        <div class="flex gap-2 pt-2">
          <button @click="addStep" class="btn-secondary text-sm">
            ＋ 質問を追加
          </button>
        </div>
      </div>
    </div>

    <!-- 判定・案内設定 -->
    <div class="card">
      <h2 class="section-title">判定・案内設定（合計ポイントによる相談案内）</h2>
      <p class="text-xs text-gray-500 mb-4">
        診断完了時に、選択された選択肢のポイント合計で判定し、案内メッセージをLINEのトークに自動送信します。
        オンライン相談のしきい値はチャット相談より大きい値にしてください（高い方が優先されます）。
      </p>

      <div class="space-y-4">
        <!-- オンライン相談 -->
        <div class="border border-gray-200 rounded-xl p-4 bg-warm-50">
          <div class="flex items-center gap-2 mb-3">
            <span class="badge badge-peach">オンライン相談</span>
            <div class="flex items-center gap-1 ml-auto">
              <input v-model.number="flow.result.onlineThreshold" type="number" min="0" class="input text-sm py-1 w-20 text-right" />
              <span class="text-xs text-gray-500">pt 以上</span>
            </div>
          </div>
          <textarea
            v-model="flow.result.onlineMessage"
            rows="3"
            class="input text-sm mb-2"
            placeholder="案内メッセージ（例: 状況を詳しくお伺いしたいので、オンライン相談をご利用ください）"
          />
          <input
            v-model="flow.result.onlineUrl"
            type="text"
            class="input text-sm"
            placeholder="オンライン相談の予約URL（設定すると「予約する」ボタン付きで送信されます）"
          />
        </div>

        <!-- チャット相談 -->
        <div class="border border-gray-200 rounded-xl p-4 bg-warm-50">
          <div class="flex items-center gap-2 mb-3">
            <span class="badge badge-blue">チャット相談</span>
            <div class="flex items-center gap-1 ml-auto">
              <input v-model.number="flow.result.chatThreshold" type="number" min="0" class="input text-sm py-1 w-20 text-right" />
              <span class="text-xs text-gray-500">pt 以上</span>
            </div>
          </div>
          <textarea
            v-model="flow.result.chatMessage"
            rows="3"
            class="input text-sm"
            placeholder="案内メッセージ（例: よろしければこのトークにそのままお悩みをお送りください。担当者がお答えします）"
          />
        </div>

        <!-- しきい値未満 -->
        <div class="border border-gray-200 rounded-xl p-4 bg-warm-50">
          <div class="flex items-center gap-2 mb-3">
            <span class="badge badge-gray">しきい値未満</span>
            <span class="text-xs text-gray-400 ml-auto">空欄の場合は送信されません</span>
          </div>
          <textarea
            v-model="flow.result.defaultMessage"
            rows="2"
            class="input text-sm"
            placeholder="案内メッセージ（例: 診断ありがとうございました！お届けした情報をぜひご覧ください）"
          />
        </div>
      </div>
    </div>

    <!-- プレビュー -->
    <div class="card">
      <h2 class="section-title">診断プレビュー（イメージ）</h2>
      <div class="bg-gray-100 rounded-xl p-4 max-w-xs">
        <div
          v-for="(step, i) in flow.steps"
          :key="i"
          class="mb-3"
        >
          <div class="bg-white rounded-2xl rounded-tl-none px-4 py-2.5 shadow-soft text-sm inline-block max-w-full">
            <p class="text-gray-800 text-xs font-medium mb-1">Q{{ i + 1 }}</p>
            <p class="text-gray-700">{{ step.question || '（質問文）' }}</p>
          </div>
          <div class="mt-2 flex flex-wrap gap-1">
            <span
              v-for="opt in (step.options ?? []).slice(0, 4)"
              :key="opt"
              class="bg-peach-100 text-peach-700 text-xs px-2 py-1 rounded-full"
            >
              {{ opt }}
            </span>
          </div>
        </div>
        <div v-if="flow.steps.length === 0" class="text-gray-400 text-sm text-center py-4">
          質問を追加してください
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore'

const { db } = useFirebase()
const saving = ref(false)
const masterTags = ref<{ id: string; name: string }[]>([])
let flowId = ''

type ResultConfig = {
  onlineThreshold: number
  onlineMessage: string
  onlineUrl: string
  chatThreshold: number
  chatMessage: string
  defaultMessage: string
}

const defaultResult = (): ResultConfig => ({
  onlineThreshold: 6,
  onlineMessage: '',
  onlineUrl: '',
  chatThreshold: 3,
  chatMessage: '',
  defaultMessage: '',
})

const flow = ref<{
  isActive: boolean
  headerTitle: string
  headerText: string
  steps: Array<{
    id: string
    question: string
    type: 'single' | 'multi'
    options?: string[]
    attributeKey?: string
    tagMapping?: Record<string, string>
    pointMapping?: Record<string, number>
  }>
  result: ResultConfig
}>({
  isActive: true,
  headerTitle: 'コンテンツ診断',
  headerText: '',
  steps: [
    {
      id: crypto.randomUUID(),
      question: '今一番困っていることは何ですか？（複数選択可）',
      type: 'multi',
      options: ['子育てのこと', '住まいのこと', '仕事のこと', 'お金のこと', '法律・離婚のこと'],
      attributeKey: 'needs',
      tagMapping: {
        '子育てのこと': '子育て支援希望',
        '住まいのこと': '住居支援希望',
        '仕事のこと': '就労支援希望',
        'お金のこと': '経済支援希望',
      },
      pointMapping: {},
    },
  ],
  result: defaultResult(),
})

const addStep = () => {
  flow.value.steps.push({
    id: crypto.randomUUID(),
    question: '',
    type: 'single',
    options: [],
    attributeKey: '',
    tagMapping: {},
  })
}

const removeStep = (index: number) => {
  flow.value.steps.splice(index, 1)
}

const addOption = (step: any) => {
  if (!step.options) step.options = []
  step.options.push('')
}

const removeOption = (step: any, index: number) => {
  step.options?.splice(index, 1)
}

const updateOption = (step: any, index: number, value: string) => {
  if (step.options) step.options[index] = value
}

const updateTagMapping = (step: any, opt: string, tag: string) => {
  if (!step.tagMapping) step.tagMapping = {}
  if (tag) {
    step.tagMapping[opt] = tag
  } else {
    delete step.tagMapping[opt]
  }
}

const updatePointMapping = (step: any, opt: string, value: string) => {
  if (!step.pointMapping) step.pointMapping = {}
  const num = Number(value)
  if (value !== '' && !Number.isNaN(num) && num !== 0) {
    step.pointMapping[opt] = num
  } else {
    delete step.pointMapping[opt]
  }
}

const saveFlow = async () => {
  saving.value = true
  try {
    const data = {
      isActive: flow.value.isActive,
      headerTitle: flow.value.headerTitle.trim() || 'コンテンツ診断',
      headerText: flow.value.headerText.trim(),
      steps: flow.value.steps,
      result: {
        ...flow.value.result,
        onlineThreshold: Number(flow.value.result.onlineThreshold) || 0,
        chatThreshold: Number(flow.value.result.chatThreshold) || 0,
      },
      updatedAt: serverTimestamp(),
    }
    if (flowId) {
      await updateDoc(doc(db, 'diagnosis_flows', flowId), data)
    } else {
      const ref = await addDoc(collection(db, 'diagnosis_flows'), {
        ...data,
        createdAt: serverTimestamp(),
      })
      flowId = ref.id
    }
    alert('保存しました！')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  const [flowSnap, tagsSnap] = await Promise.all([
    getDocs(query(collection(db, 'diagnosis_flows'), where('isActive', '==', true))),
    getDocs(query(collection(db, 'tags'), orderBy('createdAt', 'asc'))),
  ])
  masterTags.value = tagsSnap.docs.map(d => ({ id: d.id, name: d.data().name }))

  if (!flowSnap.empty) {
    const d = flowSnap.docs[0]
    flowId = d.id
    const data = d.data()
    flow.value.isActive = data.isActive ?? true
    flow.value.headerTitle = data.headerTitle ?? 'コンテンツ診断'
    flow.value.headerText = data.headerText ?? ''
    if (data.steps?.length) flow.value.steps = data.steps
    if (data.result) flow.value.result = { ...defaultResult(), ...data.result }
  }
})
</script>
