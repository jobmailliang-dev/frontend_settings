<template>
  <div class="admin-layout">
    <el-container>
      <!-- 左侧菜单（可收起） -->
      <el-aside
        class="sidebar"
        :width="isCollapsed ? '64px' : '200px'"
        :collapse="isCollapsed"
      >
        <div class="sidebar-header">
          <div class="logo" @click="toggleCollapse">
            <span v-if="!isCollapsed" class="logo-text">WMAI</span>
            <el-icon><Menu /></el-icon>
          </div>
        </div>

        <el-menu
          :default-active="activeMenu"
          :collapse="isCollapsed"
          router
          class="sidebar-menu"
        >
          <el-menu-item index="/admin/home">
            <el-icon><House /></el-icon>
            <template #title>首页</template>
          </el-menu-item>
          <el-menu-item index="/admin/workbench">
            <el-icon><Grid /></el-icon>
            <template #title>工作台</template>
          </el-menu-item>
          <el-menu-item index="/admin/tools">
            <el-icon><Tools /></el-icon>
            <template #title>工具管理</template>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 右侧内容 -->
      <el-container>
        <el-header class="header">
          <div class="header-content">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item>WMAI</el-breadcrumb-item>
              <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
            </el-breadcrumb>
            <div class="header-actions">
              <el-button circle size="small" @click="emit('close')">
                <el-icon><Close /></el-icon>
              </el-button>
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
import { ref, computed, onMounted } from 'vue';
import { useRouter, createRouter, createWebHashHistory } from 'vue-router';
import { Menu, House, Grid, Tools, Close } from '@element-plus/icons-vue';

// 路由配置（内嵌路由，无需登录）
const routes = [
  {
    path: '/admin',
    redirect: '/admin/home'
  },
  {
    path: '/admin/home',
    name: 'AdminHome',
    component: () => import('./views/AdminHome.vue')
  },
  {
    path: '/admin/workbench',
    name: 'AdminWorkbench',
    component: () => import('./views/AdminWorkbench.vue')
  },
  {
    path: '/admin/tools',
    name: 'AdminTools',
    component: () => import('./views/AdminTools.vue')
  }
]

// 创建内嵌路由
const router = createRouter({
  history: createWebHashHistory(),
  routes
})

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const isCollapsed = ref(false);
const currentRoute = ref(router.currentRoute.value);

router.afterEach((to) => {
  currentRoute.value = to;
});

const activeMenu = computed(() => currentRoute.value.path);

const titles: Record<string, string> = {
  '/admin/home': '首页',
  '/admin/workbench': '工作台',
  '/admin/tools': '工具管理',
};

const currentTitle = computed(() => {
  return titles[currentRoute.value.path] || '首页';
});

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

// 跳转到指定路径
const navigateTo = (path: string) => {
  router.push(path);
};

onMounted(() => {
  // 初始化路由
});

// 暴露方法给父组件
defineExpose({
  router,
  navigateTo
});
</script>

<style scoped>
.admin-layout {
  height: 100%;
  width: 100%;
}

.sidebar {
  background: #f8f8f7;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
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
  border-radius: 8px;
}

.logo:hover {
  background: rgba(55, 53, 47, 0.08);
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.sidebar-menu {
  border: none;
  background: transparent;
  padding: 12px 8px;
}

.sidebar-menu .el-menu-item {
  height: 40px;
  margin-bottom: 4px;
  border-radius: 8px;
}

.sidebar-menu .el-menu-item:hover {
  background: rgba(55, 53, 47, 0.08);
}

.header {
  background: #fff;
  height: 48px;
  padding: 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.header-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.main {
  padding: 16px;
  background: #fff;
  height: calc(100% - 48px);
}
</style>
