import { createRequire } from 'node:module'
import { defineConfig } from 'vitest/config'
const require = createRequire(import.meta.url)
const nitroRequire = createRequire(require.resolve('nitropack/package.json'))
export default defineConfig({
  // Server handlers run against Nitro's H3, which can differ from the root CLI dependency.
  resolve: { alias: { h3: nitroRequire.resolve('h3') } },
  test: { include: ['tests/*.test.ts'] },
})
