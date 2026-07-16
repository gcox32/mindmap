import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Backend serves /api on its own port in dev; in prod it's the same
    // origin as the built frontend, so relative fetch('/api/...') paths work
    // unchanged in both.
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
  build: {
    // three.js/r3f/drei/postprocessing are inherently large; split them into
    // their own vendor chunk so app code stays small and the vendor chunk
    // can be cached independently across deploys.
    chunkSizeWarningLimit: 1200,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (/node_modules\/(three|@react-three|postprocessing)\//.test(id)) {
            return 'three'
          }
        },
      },
    },
  },
})
