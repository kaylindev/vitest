import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      vitest: resolve(__dirname, './src/index.ts'),
    },
  },
})
