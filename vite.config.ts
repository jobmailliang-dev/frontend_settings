import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isMock = env.VITE_USE_MOCK === 'true'

  // 使用 fileURLToPath 确保路径格式正确
  const __dirname = fileURLToPath(new URL('.', import.meta.url))
  const sharedStylesPath = resolve(__dirname, '../packages/shared-types/styles/variables.scss')

  return {
    base: '/',
    plugins: [
      vue(),
      AutoImport({
        resolvers: [ElementPlusResolver()],
        imports: ['vue', 'vue-router', 'pinia', { axios: [['default', 'axios']] }],
        dts: true
      }),
      Components({
        resolvers: [ElementPlusResolver()]
      })
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@next': resolve(__dirname, 'src')
      }
    },
    server: {
      port: 3001,
      host: '0.0.0.0',
      // Mock 模式下禁用代理，让 MSW 拦截请求
      proxy: isMock ? undefined : {
        '/api': {
          target: env.VITE_API_TARGET || 'http://localhost:8000',
          changeOrigin: true,
          secure: false
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "${sharedStylesPath.replace(/\\/g, '/')}" as *;\n`
        }
      }
    }
  }
})
