import { defineConfig, loadEnv } from 'vite'
import { mkdir, writeFile, rename, readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { resolve } from 'node:path'
import { corsHeaders, handleStorageRequest } from './server/cloud-storage.js'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    {
      name: 'cloud-storage',
      configureServer(server) {
        const env = { ...loadEnv(server.config.mode, server.config.root, ['UPSTASH_', 'KV_']), ...process.env }
        server.middlewares.use(async (req, res, next) => {
          if (req.url?.split('?')[0] !== '/api/storage') return next()
          for (const [key, value] of Object.entries(corsHeaders)) res.setHeader(key, value)
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Allow', 'GET, POST, OPTIONS')
          let body: unknown
          if (req.method === 'POST') {
            try {
              let raw = ''
              for await (const chunk of req) {
                raw += chunk.toString()
                if (Buffer.byteLength(raw) > 4_000_000) {
                  res.statusCode = 413
                  res.end(JSON.stringify({ error: 'Payload too large' }))
                  return
                }
              }
              body = JSON.parse(raw)
            } catch {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Invalid JSON' }))
              return
            }
          }
          const result = await handleStorageRequest(
            req.method,
            body,
            env,
            async (data) => {
              const directory = resolve(server.config.root, 'data')
              await mkdir(directory, { recursive: true })
              const temporary = resolve(directory, `submeter-${randomUUID()}.json`)
              await writeFile(temporary, JSON.stringify(data, null, 2))
              await rename(temporary, resolve(directory, 'submeter-data.json'))
            },
            async () => {
              try {
                const file = resolve(server.config.root, 'data', 'submeter-data.json')
                const content = await readFile(file, 'utf-8')
                return JSON.parse(content)
              } catch {
                return null
              }
            },
          )
          res.statusCode = result.status
          res.end(result.body === null ? undefined : JSON.stringify(result.body))
        })
      },
    },
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icons.svg'],
      manifest: {
        name: 'Meralco Sub-Meter Calculator & Billing Allocation',
        short_name: 'Sub-Meter Pro',
        description: 'Sub-meter electricity billing calculator for apartment buildings with proportional allocation of generation charges, taxes, common areas, and line losses.',
        theme_color: '#0B192C',
        background_color: '#F8FAFC',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
})
