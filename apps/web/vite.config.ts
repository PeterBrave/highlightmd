import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/highlightmd/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@highlightmd/core': '../../packages/core/src',
    },
  },
})
