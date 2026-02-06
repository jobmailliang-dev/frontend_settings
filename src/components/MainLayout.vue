<template>
  <div class="main-layout">
    <el-container>
      <el-header class="header">
        <div class="header-content">
          <h2>Frontend Scaffold</h2>
          <div class="user-info">
            <span>{{ user?.username }}</span>
            <el-avatar :size="32" :src="user?.avatar_url">
              {{ user?.username?.charAt(0)?.toUpperCase() }}
            </el-avatar>
          </div>
        </div>
      </el-header>

      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const user = computed(() => userStore.user)
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
}

.header {
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 0;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.main {
  background: #f5f7fa;
  max-width: 1400px;
  margin: 0 auto;
}
</style>
