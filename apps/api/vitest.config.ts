import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Scoped to src so compiled output in dist/ is never collected.
    include: ['src/**/*.spec.ts'],
  },
});
