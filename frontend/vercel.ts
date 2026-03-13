import type { VercelConfig } from '@vercel/config/v1'

/**
 * Backend URL for API rewrites.
 * - Local (vercel dev): not set → http://127.0.0.1:3001
 * - Production: set BACKEND_URL in Vercel project settings → your backend URL
 */
const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:3001'

export const config: VercelConfig = {
  framework: 'vite',
  buildCommand: 'npm run build',
  outputDirectory: 'dist',
  devCommand: 'vite',
  cleanUrls: false,
  trailingSlash: false,
  rewrites: [
    { source: '/api/:path*', destination: `${backendUrl}/api/:path*` },
    { source: '/test', destination: `${backendUrl}/test` },
    { source: '/chat/init', destination: `${backendUrl}/chat/init` },
    { source: '/chat/message', destination: `${backendUrl}/chat/message` },
    { source: '/chat/history', destination: `${backendUrl}/chat/history` },
    { source: '/studyrooms/:path*', destination: `${backendUrl}/studyrooms/:path*` },
    { source: '/clones/:path*', destination: `${backendUrl}/clones/:path*` },
    { source: '/user/:path*', destination: `${backendUrl}/user/:path*` },
    { source: '/waitlist/join', destination: `${backendUrl}/waitlist/join` },
    {
      source: '/((?!@vite|@react-refresh|@id|src/|node_modules/|assets/|vite\\.svg|.*\\.).*)',
      destination: '/index.html',
    },
  ],
}
