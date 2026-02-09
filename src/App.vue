<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

onMounted(() => {
  userStore.initializeUser()
})
</script>

<style lang="scss">
@use '@/styles/variables.scss' as *;
@use '@/styles/index.scss' as *;

#app {
  width: 100%;
  height: 100vh;
  background: $bg-page;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: $bg-page;
  color: $text-primary;
}
</style>
