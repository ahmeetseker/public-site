import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'src/**/*.test.ts',
      'src/**/__tests__/**/*.test.ts',
      // Wave F22.B — sitemap drift gate lives under `tests/` (not `tests/e2e/`)
      // so it's picked up here but not by playwright.
      'tests/*.test.ts',
    ],
  },
})
