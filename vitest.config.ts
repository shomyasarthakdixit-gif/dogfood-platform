import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { loadEnv } from 'vite'

process.env = { ...process.env, ...loadEnv('', process.cwd(), '') };

if (!process.env.DATABASE_URL) {
  console.warn('\x1b[33m%s\x1b[0m', 'WARNING: DATABASE_URL is not set. Tests require a disposable test database.');
}

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    testTimeout: 60000,
    fileParallelism: false, // Run tests sequentially to avoid Neon DB conflicts
    globalSetup: ['./tests/globalSetup.ts'],
    setupFiles: ['./tests/unit/setup.ts'],
    alias: {
      '@': resolve(__dirname, './'),
    },
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/integration/**/*.test.{ts,tsx}'],
  },
})
