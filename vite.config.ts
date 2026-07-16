import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
