import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/tb-cloud': {
        target: 'https://thingsboard.cloud',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tb-cloud/, ''),
        secure: false,
      },
      '/tb-demo': {
        target: 'https://demo.thingsboard.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tb-demo/, ''),
        secure: false,
      }
    }
  }
})
