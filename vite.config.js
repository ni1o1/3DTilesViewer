import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cesium from 'vite-plugin-cesium'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), cesium()],
  server: {
    port: 3000,
    host: true
  },
  define: {
    // 定义全局常量
    CESIUM_BASE_URL: JSON.stringify('./cesium/')
  }
})