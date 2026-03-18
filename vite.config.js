/* global process */
import { createRequire } from 'node:module'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const require = createRequire(import.meta.url)
const { createFoodScanHandler } = require('./functions/features/foodScanner/foodScanner.controller.js')

function foodScannerApiPlugin() {
  return {
    name: 'food-scanner-api',
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), '')
      const handler = createFoodScanHandler({
        getApiKey: () =>
          env.GEMINI_API_KEY ||
          env.VITE_GEMINI_API_KEY ||
          process.env.GEMINI_API_KEY ||
          process.env.VITE_GEMINI_API_KEY,
      })

      server.middlewares.use('/api/food/scan', (req, res) => handler(req, res))
    },
  }
}

export default defineConfig({
  plugins: [react(), foodScannerApiPlugin()],
})
