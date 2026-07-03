<template>
  <div class="max-w-2xl mx-auto space-y-5">
    <div class="card">
      <div class="flex items-center justify-between mb-5">
        <h2 class="section-title mb-0">管理者一覧</h2>
        <button @click="openNew" class="btn-primary text-sm">
          ＋ 管理者を追加
        </button>
      </div>

      <div class="divide-y divide-gray-50">
        <div v-for="admin in admins" :key="admin.id" class="flex items-center gap-4 py-3">
          <div class="w-10 h-10 bg-peach-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span class="text-peach-600 font-semibold">{{ admin.name?.charAt(0) ?? '管' }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-800">{{ admin.name }}</p>
            <p class="text-sm text-gray-400 truncate">{{ admin.email }}</p>
          </div>
          <span :class="admin.role === 'owner' ? 'badge-peach' : 'badge-gray'" class="badge">
            {{ admin.role === 'owner' ? 'オーナー' : 'スタッフ' }}
          </span>
          <button @click="openEdit(admin)" class="btn-ghost text-xs px-2 py-1 text-gray-500 hover:text-gray-700">
            編集
          </button>
        </div>
        <div v-if="admins.length === 0" class="py-8 text-center text-gray-400 text-sm">
          管理者がいません
        </div>
      </div>
    </div>

    <div class="card bg-warm-50 border border-gray-200">
      <h3 class="font-semibold text-gray-700 mb-3">管理者追加の手順</h3>
      <ol class="text-sm text-gray-600 space-y-2 list-decimal list-inside">
        <li>Firebaseコンソール → Authentication でメール/パスワードユーザーを作成</li>
        <li>作成したユーザーのUIDをコピー</li>
        <li>下の「＋ 管理者を追加」ボタンからUIDと情報を入力</li>
      </ol>
    </div>

    <!-- 追加・編集モーダル -->
    <div v-if="showForm" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div class="card w-full max-w-sm">
        <h3 class="section-title">{{ editingId ? '管理者を編集' : '管理者を追加' }}</h3>
        <p v-if="!editingId" class="text-sm text-gray-500 mb-4">
          ※ FirebaseコンソールでAuthユーザーを先に作成してから、そのUIDを入力してください
        </p>

        <div class="space-y-4">
          <div v-if="!editingId">
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Firebase UID <span class="text-red-400">*</span></label>
            <input v-model="form.uid" type="text" class="input" placeholder="UID..." />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">名前 <span class="text-red-400">*</span></label>
            <input v-model="form.name" type="text" class="input" placeholder="山田 花子" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">メールアドレス</label>
            <input v-model="form.email" type="email" class="input" placeholder="admin@example.com" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">ロール</label>
            <div class="flex gap-3">
              <label
                v-for="opt in roleOptions"
                :key="opt.value"
                class="flex-1 flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors"
                :class="form.role === opt.value ? 'border-peach-400 bg-peach-50' : 'border-gray-200 bg-white'"
              >
                <input v-model="form.role" type="radio" :value="opt.value" class="sr-only" />
                <span class="text-xl">{{ opt.icon }}</span>
                <div>
                  <p class="text-sm font-medium text-gray-800">{{ opt.label }}</p>
                  <p class="text-xs text-gray-400">{{ opt.desc }}</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div class="flex gap-3 mt-5 pt-4 border-t border-gray-100">
          <button
            @click="saveAdmin"
            class="btn-primary"
            :disabled="(!editingId && !form.uid) || !form.name || saving"
          >
            {{ saving ? '保存中...' : (editingId ? '更新する' : '追加する') }}
          </button>
          <button @click="closeForm" class="btn-secondary">キャンセル</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { collection, getDocs, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'

const { db } = useFirebase()

const showForm = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const admins = ref<any[]>([])
const form = ref({ uid: '', name: '', email: '', role: 'staff' })

const roleOptions = [
  { value: 'staff', label: 'スタッフ', icon: '👤', desc: '通常の管理者' },
  { value: 'owner', label: 'オーナー', icon: '👑', desc: '全権限' },
]

const openNew = () => {
  editingId.value = null
  form.value = { uid: '', name: '', email: '', role: 'staff' }
  showForm.value = true
}

const openEdit = (admin: any) => {
  editingId.value = admin.id
  form.value = { uid: admin.id, name: admin.name ?? '', email: admin.email ?? '', role: admin.role ?? 'staff' }
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  editingId.value = null
}

const saveAdmin = async () => {
  if ((!editingId.value && !form.value.uid) || !form.value.name) return
  saving.value = true
  try {
    if (editingId.value) {
      // 既存管理者の更新（ロール・名前・メール）
      await updateDoc(doc(db, 'admins', editingId.value), {
        name: form.value.name,
        email: form.value.email,
        role: form.value.role,
        updatedAt: serverTimestamp(),
      })
    } else {
      // 新規追加
      await setDoc(doc(db, 'admins', form.value.uid), {
        name: form.value.name,
        email: form.value.email,
        role: form.value.role,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }
    closeForm()
    await loadAdmins()
  } finally {
    saving.value = false
  }
}

const loadAdmins = async () => {
  const snap = await getDocs(collection(db, 'admins'))
  admins.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

onMounted(loadAdmins)
</script>
