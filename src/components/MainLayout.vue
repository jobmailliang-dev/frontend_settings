<template>
  <div class="main-layout">
    <el-container>
      <el-aside
        class="sidebar"
        :class="{ 'is-expanded': !isCollapsed }"
        :width="isCollapsed ? '64px' : '200px'"
        :collapse="isCollapsed"
        :collapse-trigger="null"
      >
        <div class="sidebar-header">
          <div class="logo" @click="toggleCollapse" :class="{ 'is-collapsed': isCollapsed }">
            <template v-if="!isCollapsed">
              <span class="logo-text">WMAI</span>
            </template>
            <el-icon class="menu-icon"><Menu /></el-icon>
          </div>
        </div>

        <el-menu
          :default-active="activeMenu"
          :collapse="isCollapsed"
          router
          class="sidebar-menu"
        >
          <el-menu-item index="/home">
            <div class="menu-icon-wrapper">
              <el-icon><House /></el-icon>
            </div>
            <template #title>首页</template>
          </el-menu-item>
          <el-menu-item index="/workbench">
            <div class="menu-icon-wrapper">
              <el-icon><Grid /></el-icon>
            </div>
            <template #title>工作台</template>
          </el-menu-item>
          <el-menu-item index="/tools">
            <div class="menu-icon-wrapper">
              <el-icon><Tools /></el-icon>
            </div>
            <template #title>工具管理</template>
          </el-menu-item>
        </el-menu>

        <div class="sidebar-footer">
          <div class="version-info">v1.0.0</div>
        </div>
      </el-aside>

      <el-container class="main-container">
        <el-header class="header">
          <div class="header-content">
            <div class="breadcrumb-wrapper">
              <el-breadcrumb separator="/">
                <el-breadcrumb-item v-if="parentTitle">
                  <router-link :to="parentRoute" class="breadcrumb-link">{{ parentTitle }}</router-link>
                </el-breadcrumb-item>
                <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
              </el-breadcrumb>
            </div>
            <div class="header-actions">
              <el-dropdown trigger="click" @command="handleCommand">
                <div class="user-icon-btn">
                  <el-icon :size="20"><User /></el-icon>
                </div>
                <template #dropdown>
                  <el-dropdown-menu class="user-dropdown">
                    <el-dropdown-item command="profile">
                      <el-icon><User /></el-icon>
                      个人资料
                    </el-dropdown-item>
                    <el-dropdown-item command="settings">
                      <el-icon><Setting /></el-icon>
                      设置
                    </el-dropdown-item>
                    <el-dropdown-item divided command="logout">
                      <el-icon><SwitchButton /></el-icon>
                      退出登录
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </el-header>

        <el-main class="main">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@next/stores/user'
import { House, Grid, Setting, User, SwitchButton, Menu, Tools } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapsed = ref(false)

const user = computed(() => userStore.user)
const activeMenu = computed(() => route.path)

// 路由配置：定义父子路由关系
const routeConfig: Record<string, { parent: string; parentTitle: string; title: string }> = {
  '/tools': {
    parent: '/tools',
    parentTitle: '',
    title: '工具管理'
  },
  '/tools/edit': {
    parent: '/tools',
    parentTitle: '工具管理',
    title: '新建工具'
  }
}

// 父级标题
const parentTitle = computed(() => {
  const config = routeConfig[route.path]
  if (config) {
    return config.parentTitle
  }
  // 处理 /tools/edit/:id 路由
  if (route.path.startsWith('/tools/edit/')) {
    return '工具管理'
  }
  return ''
})

// 父级路由
const parentRoute = computed(() => {
  const config = routeConfig[route.path]
  if (config) {
    return config.parent
  }
  // 处理 /tools/edit/:id 路由
  if (route.path.startsWith('/tools/edit/')) {
    return '/tools'
  }
  return '/'
})

// 当前页面标题
const currentPageTitle = computed(() => {
  const config = routeConfig[route.path]
  if (config) {
    return config.title
  }
  // 处理 /tools/edit/:id 路由
  if (route.path.startsWith('/tools/edit/')) {
    return '编辑工具'
  }

  const titles: Record<string, string> = {
    '/home': '首页',
    '/workbench': '工作台'
  }
  return titles[route.path] || '首页'
})

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const handleCommand = async (command: string) => {
  switch (command) {
    case 'logout':
      await userStore.logout()
      router.push('/login')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'profile':
      // TODO: 跳转到个人资料页
      break
  }
}
</script>

<style scoped lang="scss">
.main-layout {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 100%;
  background: $bg-page;
}

/* Sidebar */
.sidebar {
  background: $bg-sidebar;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  height: 100%;
  width: 64px;
  transition: width 0.2s ease;
  overflow: hidden;
  border-right: 1px solid rgba(0, 0, 0, 0.08);

  &.is-expanded {
    width: 200px;
  }
}

.sidebar-header {
  padding: 16px 12px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: $border-radius-md;
  transition: background-color 0.15s ease;

  &:hover {
    background: $bg-hover;
  }

  &.is-collapsed {
    justify-content: center;
    padding: 0;
  }
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: $text-primary;
  letter-spacing: 1px;
}

.menu-icon {
  color: $text-primary;
  font-size: 20px;
}

.menu-icon {
  color: $text-primary;
  font-size: 20px;
  flex-shrink: 0;
}

.logo-icon {
  width: 36px;
  height: 36px;

  svg {
    width: 100%;
    height: 100%;
  }
}

.sidebar-menu {
  flex: 1;
  border: none;
  background: transparent;
  padding: 12px 8px;
}

.sidebar-menu .el-menu-item {
  height: 40px;
  margin-bottom: 4px;
  border-radius: $border-radius-md;
  color: $text-primary;
}

.menu-icon-wrapper {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar.is-expanded .menu-icon-wrapper {
  justify-content: flex-start;
  width: auto;
  margin-right: 8px;
}



.sidebar.is-expanded .el-menu-item {
  padding: 0 12px !important;
  justify-content: flex-start;
}

.sidebar-menu .el-menu-item:hover {
  background: $bg-hover;
  color: $text-primary;
}

.sidebar-menu .el-menu-item.is-active {
  background: $bg-selected;
  color: $text-primary;
}

.sidebar-footer {
  padding: 12px;
  display: flex;
  justify-content: center;
}

.version-info {
  font-size: 12px;
  color: $text-secondary;
}

/* User Icon Button */
.user-icon-btn {
  width: 36px;
  height: 36px;
  border-radius: $border-radius-md;
  background: transparent;
  border: 1px solid $border-base;
  color: $text-secondary;
  transition: all 0.15s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: $bg-hover;
    color: $text-primary;
  }
}

/* User Dropdown */
.user-dropdown {
  background: $bg-card;
  border: 1px solid $border-base;
  border-radius: $border-radius-lg;
  padding: 8px;
  box-shadow: $shadow-card;
}

.user-dropdown .el-dropdown-menu__item {
  border-radius: $border-radius-sm;
  color: $text-primary;
  gap: 8px;
}

.user-dropdown .el-dropdown-menu__item:hover {
  background: $bg-hover;
}

.user-dropdown .el-dropdown-menu__item.is-disabled {
  color: $text-placeholder;
}

/* Main Container */
.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: calc(100% - 64px);
  min-width: 0;
  height: 100%;
  background: $bg-page;
}

.sidebar.is-expanded ~ .main-container {
  width: calc(100% - 200px);
}

/* Header */
.header {
  background: $bg-card;
  height: 48px;
  padding: 0;
  flex-shrink: 0;
  z-index: 50;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
}

.breadcrumb-wrapper {
  display: flex;
  align-items: center;
}

.breadcrumb-wrapper :deep(.el-breadcrumb) {
  font-size: 20px;
  font-weight: 600;
}

.breadcrumb-wrapper :deep(.el-breadcrumb__inner) {
  color: $text-secondary;
  font-weight: 400;
}

.breadcrumb-wrapper :deep(.el-breadcrumb__inner.is-link) {
  color: $text-primary;
  font-weight: 600;
}

.breadcrumb-wrapper :deep(.el-breadcrumb__inner.is-link:hover) {
  color: $primary-blue;
}

.breadcrumb-link {
  text-decoration: none;
  color: $text-primary;
  font-weight: 600;
}

.breadcrumb-link:hover {
  color: $primary-blue;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Main */
.main {
  flex: 1;
  padding: 0;
  background: transparent;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
}
</style>
