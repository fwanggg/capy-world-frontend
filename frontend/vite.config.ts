import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  envDir: '..',
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/test': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/waitlist': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        bypass: (req) => {
          if (req.url === '/waitlist' || req.url === '/waitlist/') return req.url
        },
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
      '/studyrooms': {
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
