<template>
  <div class="flex h-screen bg-warm-50 overflow-hidden">
    <!-- サイドバー -->
    <AppSidebar />

    <!-- メインコンテンツ -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <AppHeader />
      <main class="flex-1 overflow-y-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>
