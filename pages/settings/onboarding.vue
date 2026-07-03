<template>
  <div class="max-w-3xl mx-auto space-y-5">
    <div class="card bg-peach-50 border border-peach-200">
      <div class="flex items-start gap-3">
        <span class="text-2xl">💡</span>
        <div>
          <p class="font-semibold text-peach-800">オンボーディング設定について</p>
          <p class="text-sm text-peach-700 mt-1">
            LINE友達登録後にユーザーへ自動送信する質問を設定します。
            回答はFirestoreのユーザー属性として保存され、セグメント配信に活用されます。
          </p>
        </div>
      </div>
    </div>

    <!-- フロー設定 -->
    <div class="card">
      <div class="flex items-center justify-between mb-5">
        <h2 class="section-title mb-0">質問フロー</h2>
        <div class="flex items-center gap-3">
          <label class="flex items-center gap-2 cursor-pointer">
            <div
              class="relative w-10 h-6 rounded-full transition-colors duration-200"
              :class="flow.isActive ? 'bg-peach-500' : 'bg-gray-200'"
              @click="toggleActive"
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
            <span class="badge badge-gray">{{ stepTypeLabel(step.type) }}</span>
            <input
              v-model="step.attributeKey"
              type="text"
              placeholder="属性キー（例: region）"
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
              <option value="text">テキスト入力</option>
              <option value="number">数値入力</option>
            </select>
          </div>

          <!-- 選択肢設定 -->
          <div v-if="step.type === 'single' || step.type === 'multi'">
            <p class="text-xs font-medium text-gray-500 mb-2">選択肢</p>
            <div class="space-y-2">
              <div v-for="(opt, oi) in step.options ?? []" :key="oi" class="flex items-center gap-2">
                <input
                  :value="opt"
                  type="text"
                  class="input text-sm py-1.5"
                  placeholder="選択肢テキスト..."
                  @input="updateOption(step, oi, ($event.target as HTMLInputElement).value)"
                />
                <!-- タグマッピング -->
                <select
                  :value="step.tagMapping?.[opt] ?? ''"
                  class="input text-sm py-1.5 w-36"
                  @change="updateTagMapping(step, opt, ($event.target as HTMLSelectElement).value)"
                >
                  <option value="">→ タグなし</option>
                  <option v-for="t in masterTags" :key="t.id" :value="t.name">{{ t.name }}</option>
                </select>
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
          <button @click="addStep('single')" class="btn-secondary text-sm">
            ＋ 選択肢質問を追加
          </button>
          <button @click="addStep('text')" class="btn-secondary text-sm">
            ＋ テキスト質問を追加
          </button>
        </div>
      </div>
    </div>

    <!-- プレビュー -->
    <div class="card">
      <h2 class="section-title">LINEプレビュー（イメージ）</h2>
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
          <div v-if="step.type === 'single' || step.type === 'multi'" class="mt-2 flex flex-wrap gap-1">
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

const flow = ref<{
  isActive: boolean
  steps: Array<{
    id: string
    question: string
    type: 'single' | 'multi' | 'text' | 'number'
    options?: string[]
    attributeKey: string
    tagMapping?: Record<string, string>
  }>
}>({
  isActive: true,
  steps: [
    {
      id: crypto.randomUUID(),
      question: 'お子さんの年齢を教えてください',
      type: 'single',
      options: ['未就学児（0〜5歳）', '小学生（6〜12歳）', '中学生以上', '子どもはいない'],
      attributeKey: 'childAge',
      tagMapping: {
        '未就学児（0〜5歳）': '未就学児',
        '小学生（6〜12歳）': '小学生',
        '中学生以上': '中学生以上',
      },
    },
    {
      id: crypto.randomUUID(),
      question: 'お住まいの都道府県を教えてください',
      type: 'text',
      attributeKey: 'region',
    },
    {
      id: crypto.randomUUID(),
      question: '今一番知りたいことは何ですか？（複数選択可）',
      type: 'multi',
      options: ['子育て支援', '住居・引越し', '就労・仕事', '経済的支援', '法律・離婚', 'その他'],
      attributeKey: 'interests',
      tagMapping: {
        '子育て支援': '子育て支援希望',
        '住居・引越し': '住居支援希望',
        '就労・仕事': '就労支援希望',
        '経済的支援': '経済支援希望',
      },
    },
  ],
})

const stepTypeLabel = (type: string) => ({
  single: '単一選択',
  multi: '複数選択',
  text: 'テキスト',
  number: '数値',
}[type] ?? type)

const addStep = (type: 'single' | 'multi' | 'text' | 'number') => {
  flow.value.steps.push({
    id: crypto.randomUUID(),
    question: '',
    type,
    options: type === 'single' || type === 'multi' ? [] : undefined,
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

const toggleActive = async () => {
  flow.value.isActive = !flow.value.isActive
}

const saveFlow = async () => {
  saving.value = true
  try {
    const data = {
      isActive: flow.value.isActive,
      steps: flow.value.steps,
      updatedAt: serverTimestamp(),
    }
    if (flowId) {
      await updateDoc(doc(db, 'onboarding_flows', flowId), data)
    } else {
      const ref = await addDoc(collection(db, 'onboarding_flows'), {
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
    getDocs(query(collection(db, 'onboarding_flows'), where('isActive', '==', true))),
    getDocs(query(collection(db, 'tags'), orderBy('createdAt', 'asc'))),
  ])
  masterTags.value = tagsSnap.docs.map(d => ({ id: d.id, name: d.data().name }))

  if (!flowSnap.empty) {
    const d = flowSnap.docs[0]
    flowId = d.id
    const data = d.data()
    flow.value.isActive = data.isActive ?? true
    if (data.steps?.length) flow.value.steps = data.steps
  }
})
</script>
