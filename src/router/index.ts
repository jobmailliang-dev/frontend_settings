import { createRouter, createMemoryHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

// 路由配置（嵌入式版本，无需登录）
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'MainLayout',
    component: () => import('@next/components/MainLayout.vue'),
    redirect: '/home',
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@next/views/Home.vue')
      },
      {
        path: 'workbench',
        name: 'Workbench',
        component: () => import('@next/views/Workbench.vue')
      },
      {
        path: 'tools',
        name: 'ToolManagement',
        component: () => import('@next/views/ToolManagement.vue')
      },
      {
        path: 'tools/edit',
        name: 'ToolEditor',
        component: () => import('@next/views/ToolEditorPage.vue')
      },
      {
        path: 'tools/edit/:id',
        name: 'ToolEditorEdit',
        component: () => import('@next/views/ToolEditorPage.vue')
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@next/views/NotFound.vue')
  }
]

const router = createRouter({
  history: createMemoryHistory(),
  routes
})

router.afterEach(() => {
  NProgress.done()
})

export default router
