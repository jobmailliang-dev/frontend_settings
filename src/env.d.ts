/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_TARGET: string
  readonly VITE_USE_MOCK: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 缺少类型声明的模块
declare module 'nprogress' {
  const nprogress: {
    start: () => void;
    done: () => void;
    configure: (options: { showSpinner?: boolean }) => void;
  };
  export default nprogress;
}

declare module 'vue-virtual-scroller' {
  import { Component, App } from 'vue';
  const VueVirtualScroller: Component & {
    install(app: App): void;
  };
  export default VueVirtualScroller;
}
