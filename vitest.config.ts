import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5433/dogfood?schema=public';
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/unit/setup.ts'],
    alias: {
      '@': resolve(__dirname, './'),
    },
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/integration/**/*.test.{ts,tsx}'],
  },
})
