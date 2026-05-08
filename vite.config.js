import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),

    // Element Plus 自动导入
    // 这样你在组件中使用 Element Plus 组件时，不需要每个都手动 import
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),

    // Element Plus 组件自动注册
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],

  resolve: {
    alias: {
      // 配置 @ 指向 src 目录
      // 以后可以使用 '@/xxx' 来代替 './src/xxx'
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },

  server: {
    proxy: {
      // 当前端请求 /api 开头的接口时，Vite 会自动代理到 Node 后端
      // 例如：fetch('/api/health')
      // 实际会转发到：http://localhost:3000/api/health
      '/api': {
        // Node 后端服务地址
        target: 'http://localhost:3000',

        // 修改请求源，避免部分跨域或 origin 校验问题
        changeOrigin: true,

        // 不重写路径
        // 前端请求 /api/health
        // 后端收到的仍然是 /api/health
      },
    },
  },
})
