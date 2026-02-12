/**
 * 子应用入口 - 导出为 Vue 组件
 *
 * 使用方式：
 * import { SubApp } from '@frontend-next-scaffold'
 * <SubApp />
 */
import { defineComponent, h, createApp, onMounted, ref } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import 'nprogress/nprogress.css';
import VueVirtualScroller from 'vue-virtual-scroller';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';

import App from './App.vue';
import router from './router';

// 导出为 Vue 组件
export const SubApp = defineComponent({
  name: 'SubApp',
  setup() {
    const root = ref<HTMLElement | null>(null);

    onMounted(() => {
      if (root.value) {
        // 在组件内部创建一个独立的 Vue 实例
        // 这样可以确保子项目的插件（Router, Pinia）不会污染主项目
        const app = createApp(App);

        // 注册所有 Element Plus 图标
        for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
          app.component(key, component);
        }

        app.use(router);
        app.use(createPinia());
        app.use(ElementPlus);
        app.use(VueVirtualScroller);

        app.mount(root.value);
      }
    });

    return () => h('div', {
      ref: root,
      style: { width: '100%', height: '100%' }
    });
  }
});
