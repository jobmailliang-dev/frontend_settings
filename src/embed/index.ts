/**
 * 嵌入式入口 - 导出所有可嵌入组件
 *
 * 使用方式：
 * import { AdminLayout } from 'frontend_next/embed'
 */
export { default as AdminLayout } from './AdminLayout.vue';

// 导出页面组件
export { default as AdminHome } from './views/AdminHome.vue';
export { default as AdminWorkbench } from './views/AdminWorkbench.vue';
export { default as AdminTools } from './views/AdminTools.vue';
