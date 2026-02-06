import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

const isMockEnabled = import.meta.env.VITE_USE_MOCK === 'true'

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
