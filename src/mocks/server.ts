import { setupWorker } from 'msw/browser'
import { handlers, authHandlers, toolHandlers } from './handlers'

const isMockEnabled = import.meta.env.VITE_USE_MOCK === 'true'

// 导出各个模块的 handlers，便于单独使用或调试
export { handlers, authHandlers, toolHandlers }

export const worker = isMockEnabled
  ? setupWorker(...handlers)
  : null

export function isMockActive() {
  return worker !== null
}

export async function initMock() {
  if (worker) {
    await worker.start({
      onUnhandledRequest: 'bypass'
    })
    console.log('[MSW] Mock service worker started')
  }
}
