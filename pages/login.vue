<template>
  <div class="w-full max-w-sm">
    <div class="card">
      <!-- ロゴ -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-gradient-to-br from-peach-400 to-peach-600 rounded-2xl flex items-center justify-center shadow-peach mx-auto mb-4">
          <span class="text-white text-3xl font-bold">絆</span>
        </div>
        <h1 class="text-xl font-bold text-gray-800">絆プロジェクト</h1>
        <p class="text-sm text-gray-500 mt-1">管理画面ログイン</p>
      </div>

      <!-- フォーム -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">メールアドレス</label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="admin@example.com"
            class="input"
            autocomplete="email"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">パスワード</label>
          <div class="relative">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              placeholder="••••••••"
              class="input pr-10"
              autocomplete="current-password"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg v-if="showPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
        </div>

        <p v-if="errorMsg" class="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">
          {{ errorMsg }}
        </p>

        <button
          type="submit"
          class="btn-primary w-full"
          :disabled="loading"
        >
          <span v-if="loading">ログイン中...</span>
          <span v-else>ログイン</span>
        </button>
      </form>
    </div>

    <p class="text-center text-xs text-gray-400 mt-6">
      絆プロジェクト 管理システム © 2025
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: [] })

const { login } = useAuth()
const router = useRouter()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMsg = ref('')

const errorMessages: Record<string, string> = {
  'auth/user-not-found': 'メールアドレスが見つかりません',
  'auth/wrong-password': 'パスワードが正しくありません',
  'auth/invalid-email': 'メールアドレスの形式が正しくありません',
  'auth/too-many-requests': 'ログイン試行が多すぎます。しばらく経ってからお試しください',
  'auth/invalid-credential': 'メールアドレスまたはパスワードが正しくありません',
}

const handleLogin = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    await login(email.value, password.value)
    router.push('/')
  } catch (err: any) {
    errorMsg.value = errorMessages[err.code] ?? 'ログインに失敗しました'
  } finally {
    loading.value = false
  }
}
</script>
