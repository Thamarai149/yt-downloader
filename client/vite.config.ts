import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const plugins = [
  react(),
  VitePWA({
    registerType: 'autoUpdate',
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/i\.ytimg\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'youtube-thumbnails',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 7
            }
          }
        }
      ]
    },
    manifest: {
      name: 'YouTube Downloader',
      short_name: 'YT Downloader',
      description: 'Download YouTube videos and audio - Fast, Easy, and Free',
      theme_color: '#065fd4',
      background_color: '#f9f9f9',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable any'
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable any'
        }
      ],
      categories: ['utilities', 'productivity']
    },
    devOptions: {
      enabled: true
    }
  })
]

export default defineConfig({
  plugins,
  server: {
    host: true,
    port: 5173
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['framer-motion', 'lucide-react']
        }
      }
    }
  }
})