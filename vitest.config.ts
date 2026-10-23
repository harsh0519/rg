import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: [
        'lib/pricing.ts',
        'lib/validation.ts',
        'lib/format.ts',
        'lib/import-parse.ts',
        'lib/sanity/mappers.ts',
      ],
    },
  },
})
