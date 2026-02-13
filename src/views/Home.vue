<template>
  <div class="home-container">
    <el-card class="welcome-card">
      <template #header>
        <div class="card-header">
          <span>欢迎回来，{{ user?.username || '用户' }}</span>
          <el-button type="primary" @click="handleLogout">退出登录</el-button>
        </div>
      </template>

      <div class="content">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-card shadow="hover">
              <h3>用户信息</h3>
              <el-descriptions :column="1" border>
                <el-descriptions-item label="用户名">{{ user?.username }}</el-descriptions-item>
                <el-descriptions-item label="邮箱">{{ user?.email }}</el-descriptions-item>
                <el-descriptions-item label="角色">
                  <el-tag v-if="user?.is_admin" type="danger">管理员</el-tag>
                  <el-tag v-else type="success">普通用户</el-tag>
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>

          <el-col :span="8">
            <el-card shadow="hover">
              <h3>系统状态</h3>
              <el-descriptions :column="1" border>
                <el-descriptions-item label="Mock 模式">
                  <el-tag :type="isMockEnabled ? 'success' : 'info'">
                    {{ isMockEnabled ? '已启用' : '未启用' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="认证状态">
                  <el-tag type="success">已登录</el-tag>
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>

          <el-col :span="8">
            <el-card shadow="hover">
              <h3>快速操作</h3>
              <div class="actions">
                <el-button type="primary" plain @click="refreshUser">刷新用户信息</el-button>
                <el-button plain @click="clearToken">清除 Token</el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@settings/stores/user'
import { isMockActive } from '@settings/mocks/server'

const router = useRouter()
const userStore = useUserStore()
const user = computed(() => userStore.user)
const isMockEnabled = isMockActive()

const handleLogout = async () => {
  await userStore.logout()
  router.push('/login')
}

const refreshUser = async () => {
  try {
    await userStore.getCurrentUser()
    ElMessage.success('用户信息已刷新')
  } catch {
    ElMessage.error('刷新失败')
  }
}

const clearToken = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  ElMessage.info('Token 已清除，请重新登录')
  window.location.reload()
}
</script>

<style scoped>
.home-container {
  padding: 20px;
}

.welcome-card {
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.content {
  padding-top: 10px;
}

h3 {
  margin-bottom: 15px;
  color: #303133;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
