export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  // LIFF ページは認証不要（LINEユーザーがアクセスするため）
  if (to.path.startsWith('/liff')) return

  const { user, loading } = useAuth()

  if (loading.value) return

  if (!user.value && to.path !== '/login') {
    return navigateTo('/login')
  }

  if (user.value && to.path === '/login') {
    return navigateTo('/')
  }
})
