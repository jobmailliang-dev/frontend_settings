import { createRouter, createMemoryHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'MainLayout',
    component: () => import('@/components/MainLayout.vue'),
    meta: { requiresAuth: true },
    redirect: '/home',
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'workbench',
        name: 'Workbench',
        component: () => import('@/views/Workbench.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'tools',
        name: 'ToolManagement',
        component: () => import('@/views/ToolManagement.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'tools/edit',
        name: 'ToolEditor',
        component: () => import('@/views/ToolEditorPage.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'tools/edit/:id',
        name: 'ToolEditorEdit',
        component: () => import('@/views/ToolEditorPage.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
]

const router = createRouter({
  history: createMemoryHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  NProgress.start()
  const userStore = useUserStore()

  // 直接检查 localStorage，不依赖 computed 属性
  const hasToken = !!localStorage.getItem('access_token')

  // 如果有 token 但没有用户信息，尝试获取
  if (hasToken && !userStore.user) {
    try {
      await userStore.getCurrentUser()
    } catch {
      console.log('Failed to initialize user')
    }
  }

  // 如果目标页面需要认证但未登录，跳转到登录页
  if (to.meta.requiresAuth && !hasToken) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  // 如果已登录且访问的是登录页
  if (to.name === 'Login' && hasToken) {
    // 如果有 redirect 参数，跳转到目标页面；否则跳转到首页
    const redirect = to.query.redirect as string
    if (redirect && redirect !== '/login' && redirect !== '/') {
      next({ path: redirect })
    } else {
      next({ name: 'Home' })
    }
    return
  }

  next()
})

router.afterEach(() => {
  NProgress.done()
})

export default router
