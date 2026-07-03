export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', '@vueuse/nuxt'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: '絆プロジェクト 管理画面',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      link: [
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap',
        },
      ],
    },
  },
  runtimeConfig: {
    public: {
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
      liffId: process.env.LIFF_ID,
      liffProfileId: process.env.LIFF_PROFILE_ID,
    },
  },
  // Windows環境でVite IPC ソケットエラーが発生するため WebSocket HMR を使用
  vite: {
    server: {
      hmr: {
        protocol: 'ws',
        host: '127.0.0.1',
      },
    },
  },
  // Nuxt 3.16.x の #app-manifest バグを回避
  experimental: {
    appManifest: false,
  },
  compatibilityDate: '2024-11-01',
})
