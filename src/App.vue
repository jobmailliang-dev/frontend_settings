<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@next/stores/user'

const userStore = useUserStore()

onMounted(() => {
  userStore.initializeUser()
})
</script>

<style lang="scss">
// SCSS 变量已通过 vite.config.ts 全局注入，无需再次导入

#app {
  width: 100%;
  height: 100vh;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style>
