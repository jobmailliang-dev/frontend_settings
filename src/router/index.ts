import { createRouter, createMemoryHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

// 路由配置（嵌入式版本，无需登录）
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'MainLayout',
    component: () => import('@settings/components/MainLayout.vue'),
    redirect: '/tools',
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@settings/views/Home.vue')
      },
      // TODO: 工作台路由 - 暂时隐藏
      // {
      //   path: 'workbench',
      //   name: 'Workbench',
      //   component: () => import('@settings/views/Workbench.vue')
      // },
      {
        path: 'tools',
        name: 'ToolManagement',
        component: () => import('@settings/views/ToolManagement.vue')
      },
      {
        path: 'tools/edit',
        name: 'ToolEditor',
        component: () => import('@settings/views/ToolEditorPage.vue')
      },
      {
        path: 'tools/edit/:id',
        name: 'ToolEditorEdit',
        component: () => import('@settings/views/ToolEditorPage.vue')
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@settings/views/NotFound.vue')
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
