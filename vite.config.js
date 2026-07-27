import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  resolve: {
    // Matches the "@/*" -> "src/*" mapping in jsconfig.json
    alias: {
      '@': path.resolve(projectRoot, 'src'),
    },
  },
  server: {
    proxy: {
      // All app data flows through the local Express backend.
      '/api': {
        target: `http://localhost:${process.env.PORT || 3001}`,
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
});
