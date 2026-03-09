import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/chat': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        bypass: (req) => {
          // Let frontend handle /chat page route - only proxy API endpoints
          if (req.url === '/chat' || req.url === '/chat/') {
            return req.url
          }
        },
      },
      '/auth': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        bypass: (req) => {
          // Don't proxy /auth/callback - let frontend handle OAuth callback
          if (req.url === '/auth/callback') {
            return req.url
          }
        },
      },
      '/clones': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/user': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})
