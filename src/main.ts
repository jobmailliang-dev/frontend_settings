import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'nprogress/nprogress.css'
import VueVirtualScroller from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

import App from './App.vue'
import router from './router'
import { initMock } from './mocks/server'
import '@next/styles/index.scss'

// 等待 MSW 启动完成后再挂载应用
async function startApp() {
  // 初始化 MSW mock
  await initMock()

  const app = createApp(App)

  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
  }

  app.use(createPinia())
  app.use(router)
  app.use(ElementPlus)
  app.use(VueVirtualScroller)

  app.mount('#app')
}

startApp().catch(console.error)
